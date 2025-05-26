import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

export async function GET(request: NextRequest) {
  try {
    // Buscar os últimos webhooks recebidos
    const { data: webhooks, error } = await supabase
      .from("pagarme_webhooks")
      .select("*")
      .order("received_at", { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    // Buscar as últimas transações
    const { data: transactions, error: transError } = await supabase
      .from("pagarme_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (transError) {
      throw transError
    }

    return NextResponse.json({
      success: true,
      webhooks: webhooks || [],
      transactions: transactions || [],
      message: "Verifique os logs do servidor para mais detalhes sobre o processamento dos webhooks",
    })
  } catch (error) {
    console.error("Error fetching webhook data:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch webhook data",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    console.log("=== MANUAL ORDER CHECK ===")
    console.log("Checking order:", orderId)

    // Buscar detalhes do pedido na API da Pagar.me
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

    const order = await response.json()

    console.log("Order Status:", order.status)
    console.log("Order Metadata:", JSON.stringify(order.metadata, null, 2))
    console.log("Customer ID:", order.customer?.id)
    console.log("Has Charges:", !!order.charges && order.charges.length > 0)

    // Verificar se tem card_id
    let cardId = null
    if (order.charges && order.charges.length > 0) {
      const lastTransaction = order.charges[0].last_transaction
      if (lastTransaction && lastTransaction.card) {
        cardId = lastTransaction.card.id
        console.log("Card ID found:", cardId)
      }
    }

    // Verificar se já existe assinatura
    const { data: existingSubscription } = await supabase
      .from("pagarme_transactions")
      .select("subscription_id")
      .eq("order_id", orderId)
      .not("subscription_id", "is", null)
      .maybeSingle()

    console.log("Existing subscription:", existingSubscription)
    console.log("=========================")

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        customer_id: order.customer?.id,
        card_id: cardId,
        metadata: order.metadata,
        has_subscription: !!existingSubscription?.subscription_id,
        subscription_id: existingSubscription?.subscription_id,
      },
    })
  } catch (error) {
    console.error("Error checking order:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check order",
      },
      { status: 500 },
    )
  }
}
