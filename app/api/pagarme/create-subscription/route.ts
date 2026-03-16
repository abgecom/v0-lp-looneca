import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { pagarmeRequest, calculateSubscriptionStartDate } from "@/lib/pagarme/api"
import { PAGARME_CONFIG } from "@/lib/pagarme/config"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer, card, installments, amount } = body

    console.log("Starting subscription creation process")

    // Step 1: Create customer
    console.log("Step 1: Creating customer")
    const customerResponse = await fetch(`${request.nextUrl.origin}/api/pagarme/create-customer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    })

    if (!customerResponse.ok) {
      throw new Error("Failed to create customer")
    }

    const customerResult = await customerResponse.json()
    const customer_id = customerResult.customer_id

    if (!customer_id) {
      console.error("Erro: customer_id não retornado na criação do cliente")
      throw new Error("Customer ID not returned from customer creation")
    }

    console.log("Customer created successfully with ID:", customer_id)

    // Step 2: Create card
    console.log("Step 2: Creating card for customer_id:", customer_id)
    const cardResponse = await fetch(`${request.nextUrl.origin}/api/pagarme/create-card`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...card,
        customer_id,
      }),
    })

    if (!cardResponse.ok) {
      throw new Error("Failed to create card")
    }

    const cardResult = await cardResponse.json()
    const card_id = cardResult.card_id

    if (!card_id) {
      console.error("Erro: card_id não retornado na criação do cartão")
      throw new Error("Card ID not returned from card creation")
    }

    console.log("Card created successfully with ID:", card_id)

    // Step 3: Create order for membership fee
    console.log("Step 3: Creating order for membership fee")
    const orderData = {
      customer_id,
      items: [
        {
          amount,
          description: "Taxa de Adesão - Plano Petloo",
          quantity: 1,
        },
      ],
      payments: [
        {
          payment_method: "credit_card",
          amount,
          installments,
          credit_card: {
            card_id,
            statement_descriptor: "PETLOO",
          },
        },
      ],
    }

    const orderResponse = await pagarmeRequest("/orders", {
      method: "POST",
      body: orderData,
    })

    if (!orderResponse.success) {
      throw new Error(orderResponse.error || "Failed to create order")
    }

    const order = orderResponse.data
    console.log("Order created successfully:", {
      order_id: order.id,
      status: order.status,
      amount: order.amount,
    })

    // Step 4: Create subscription
    console.log("Step 4: Creating subscription")
    // IMPORTANTE: NÃO enviar start_at aqui.
    // O trial_period_days do plano já cuida de postergar a primeira cobrança em 30 dias.
    // Enviar start_at com +30 dias causaria "dupla postergação" (30 trial + 30 start_at = 60 dias).
    const subscriptionData = {
      customer_id,
      plan_id: PAGARME_CONFIG.planId,
      card_id,
      billing_type: "prepaid",
      statement_descriptor: "PETLOO",
      metadata: {
        customer_name: customer.name,
        customer_email: customer.email,
        order_id: order.id,
        created_at: new Date().toISOString(),
      },
    }

    const subscriptionResponse = await pagarmeRequest("/subscriptions", {
      method: "POST",
      body: subscriptionData,
    })

    if (!subscriptionResponse.success) {
      throw new Error(subscriptionResponse.error || "Failed to create subscription")
    }

    const subscription = subscriptionResponse.data
    console.log("Subscription created successfully:", {
      subscription_id: subscription.id,
      status: subscription.status,
      start_at: subscription.start_at,
    })

    // Step 5: Store in Supabase
    console.log("Step 5: Storing data in Supabase")
    const { error: dbError } = await supabase.from("pagarme_transactions").insert({
      customer_id,
      card_id,
      order_id: order.id,
      subscription_id: subscription.id,
      plan_id: PAGARME_CONFIG.planId,
      amount,
      installments,
      status: order.status,
      customer_data: customer,
      created_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error("Error storing in Supabase:", dbError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      subscription_id: subscription.id,
      customer_id,
      status: order.status,
      order,
      subscription,
    })
  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Subscription creation failed" },
      { status: 500 },
    )
  }
}
