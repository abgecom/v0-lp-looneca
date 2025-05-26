import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"
import { calculateSubscriptionStartDate } from "@/lib/pagarme/api"

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

// Webhook secret for signature verification
const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET

// Verify webhook signature
function verifySignature(signature: string, payload: string): boolean {
  if (!webhookSecret) {
    console.warn("Webhook secret not configured, skipping signature verification")
    return true
  }

  try {
    const hmac = crypto.createHmac("sha256", webhookSecret)
    const expectedSignature = hmac.update(payload).digest("hex")
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  } catch (error) {
    console.error("Error verifying webhook signature:", error)
    return false
  }
}

// Função para criar assinatura após pagamento aprovado
async function createSubscriptionAfterPayment(order: any): Promise<any> {
  try {
    console.log("Checking if subscription is needed for order:", order.id)

    // Log detalhado dos metadados do pedido
    console.log("=== ORDER DETAILS FOR SUBSCRIPTION ===")
    console.log("Order ID:", order.id)
    console.log("Order Status:", order.status)
    console.log("Order Metadata:", JSON.stringify(order.metadata, null, 2))
    console.log("Customer ID:", order.customer?.id)
    console.log("Has Charges:", !!order.charges && order.charges.length > 0)
    if (order.charges && order.charges.length > 0) {
      console.log("Last Transaction:", JSON.stringify(order.charges[0].last_transaction, null, 2))
    }
    console.log("=====================================")

    // Verificar se o pedido requer assinatura com base nos metadados
    const requiresSubscription =
      order.metadata?.requiresSubscription === "true" || order.metadata?.isRecurring === "true"

    if (!requiresSubscription) {
      console.log("Order does not require subscription, skipping")
      console.log("SUBSCRIPTION SKIP REASON: No subscription required in metadata")
      console.log("requiresSubscription:", order.metadata?.requiresSubscription)
      console.log("isRecurring:", order.metadata?.isRecurring)
      return { success: false, reason: "no_subscription_required" }
    }

    // Verificar se já existe uma assinatura para este pedido
    const { data: existingSubscription } = await supabase
      .from("pagarme_transactions")
      .select("subscription_id")
      .eq("order_id", order.id)
      .not("subscription_id", "is", null)
      .maybeSingle()

    if (existingSubscription?.subscription_id) {
      console.log("Subscription already exists for this order:", existingSubscription.subscription_id)
      return { success: false, reason: "subscription_exists" }
    }

    // Extrair customer_id e card_id do pedido
    const customerId = order.customer?.id
    let cardId = null

    // Tentar extrair card_id das transações
    if (order.charges && order.charges.length > 0) {
      const lastTransaction = order.charges[0].last_transaction
      if (lastTransaction && lastTransaction.card) {
        cardId = lastTransaction.card.id
      }
    }

    if (!customerId || !cardId) {
      console.error("Missing customer_id or card_id for subscription creation", { customerId, cardId })
      console.log("SUBSCRIPTION SKIP REASON: Missing required data")
      console.log("Customer ID:", customerId || "MISSING")
      console.log("Card ID:", cardId || "MISSING")
      return { success: false, reason: "missing_data" }
    }

    console.log("Creating subscription for customer:", customerId, "with card:", cardId)

    // Preparar dados do cliente a partir dos metadados
    const customerData = {
      name: order.metadata?.customerName || order.customer?.name,
      email: order.metadata?.customerEmail || order.customer?.email,
      document: order.metadata?.customerDocument || order.customer?.document,
    }

    // Criar assinatura
    const subscriptionData = {
      customer_id: customerId,
      plan_id: process.env.PETLOO_PLAN_ID,
      card_id: cardId,
      start_at: calculateSubscriptionStartDate(),
      billing_type: "prepaid",
      statement_descriptor: "PETLOO",
      metadata: {
        customer_name: customerData.name,
        customer_email: customerData.email,
        order_id: order.id,
        created_at: new Date().toISOString(),
        created_by: "webhook_reprocessing",
      },
    }

    const subscriptionResponse = await fetch("https://api.pagar.me/core/v5/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.PAGARME_API_KEY}:`).toString("base64")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(subscriptionData),
    })

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.json()
      console.error("Failed to create subscription:", errorData)
      return { success: false, error: errorData }
    }

    const subscription = await subscriptionResponse.json()
    console.log("Subscription created successfully via webhook:", {
      subscription_id: subscription.id,
      status: subscription.status,
      start_at: subscription.start_at,
    })

    // Armazenar assinatura no banco de dados
    const { error: dbError } = await supabase.from("pagarme_transactions").insert({
      customer_id: customerId,
      card_id: cardId,
      order_id: order.id,
      subscription_id: subscription.id,
      plan_id: process.env.PETLOO_PLAN_ID,
      amount: subscription.amount,
      installments: 1,
      status: subscription.status,
      customer_data: customerData,
      created_at: new Date().toISOString(),
      created_by: "webhook_reprocessing",
    })

    if (dbError) {
      console.error("Error storing subscription in Supabase:", dbError)
    }

    // Atualizar registro existente se houver
    const { error: updateError } = await supabase
      .from("pagarme_transactions")
      .update({
        subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
        updated_by: "webhook_reprocessing",
      })
      .eq("order_id", order.id)
      .is("subscription_id", null)

    if (updateError) {
      console.error("Error updating existing transaction record:", updateError)
    }

    return { success: true, subscription }
  } catch (error) {
    console.error("Error creating subscription after payment:", error)
    return { success: false, error }
  }
}

// Função para obter detalhes completos do pedido
async function getOrderDetails(orderId: string): Promise<any> {
  try {
    const response = await fetch(`https://api.pagar.me/core/v5/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.PAGARME_API_KEY}:`).toString("base64")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get order details: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching order details:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw request body for signature verification
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    // Get the signature from headers
    const signature = request.headers.get("X-Hub-Signature")

    // Verify signature if present
    if (signature && !verifySignature(signature, rawBody)) {
      console.error("Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    console.log("Received webhook:", {
      event: body.type,
      id: body.data?.id,
      status: body.data?.status,
    })

    // Log detalhado do webhook recebido
    console.log("=== WEBHOOK RECEIVED ===")
    console.log("Event Type:", body.type)
    console.log("Order ID:", body.data?.id)
    console.log("Order Status:", body.data?.status)
    console.log("Has Metadata:", !!body.data?.metadata)
    console.log("Metadata:", JSON.stringify(body.data?.metadata, null, 2))
    console.log("======================")

    // Store webhook in database
    const { error: dbError } = await supabase.from("pagarme_webhooks").insert({
      event_type: body.type,
      object_id: body.data?.id,
      payload: body,
      signature: signature || null,
      processed: false,
      received_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error("Error storing webhook in database:", dbError)
    }

    // Process payment status updates
    if (body.type === "order.paid" || body.type === "order.payment_failed") {
      const orderId = body.data?.id
      const status = body.data?.status

      if (orderId) {
        // Update order status in database
        const { error: updateError } = await supabase
          .from("pagarme_transactions")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("order_id", orderId)

        if (updateError) {
          console.error("Error updating order status:", updateError)
        } else {
          console.log(`Updated order ${orderId} status to ${status}`)
        }

        // Se o pagamento foi aprovado, verificar se precisa criar assinatura
        if (status === "paid" || status === "authorized") {
          try {
            // Obter detalhes completos do pedido
            const orderDetails = await getOrderDetails(orderId)

            // Tentar criar assinatura
            const subscriptionResult = await createSubscriptionAfterPayment(orderDetails)
            console.log("Subscription creation result:", subscriptionResult)
          } catch (error) {
            console.error("Error handling subscription creation after payment:", error)
          }
        }
      }
    }

    // Process subscription status updates
    if (
      body.type === "subscription.created" ||
      body.type === "subscription.canceled" ||
      body.type === "subscription.suspended"
    ) {
      const subscriptionId = body.data?.id
      const status = body.data?.status

      if (subscriptionId) {
        // Update subscription status in database
        const { error: updateError } = await supabase
          .from("pagarme_transactions")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("subscription_id", subscriptionId)

        if (updateError) {
          console.error("Error updating subscription status:", updateError)
        } else {
          console.log(`Updated subscription ${subscriptionId} status to ${status}`)
        }
      }
    }

    // Mark webhook as processed
    if (body.id) {
      const { error: processedError } = await supabase
        .from("pagarme_webhooks")
        .update({ processed: true })
        .eq("object_id", body.data?.id)

      if (processedError) {
        console.error("Error marking webhook as processed:", processedError)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
