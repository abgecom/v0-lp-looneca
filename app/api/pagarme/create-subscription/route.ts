import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getPagarmeConfig, pagarmeRequest, calculateSubscriptionStartDate } from "@/lib/payment-utils"
import { PAGARME_CONFIG, PAYMENT_ERRORS } from "@/lib/payment-constants"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { apiKey, planId } = getPagarmeConfig()
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

    const { customer_id } = await customerResponse.json()

    // Step 2: Create card
    console.log("Step 2: Creating card")
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

    const { card_id } = await cardResponse.json()

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

    const order = await pagarmeRequest(PAGARME_CONFIG.ENDPOINTS.ORDERS, {
      method: "POST",
      body: orderData,
      apiKey,
    })

    console.log("Order created successfully:", {
      order_id: order.id,
      status: order.status,
      amount: order.amount,
    })

    // Step 4: Check if plan exists, create if not
    console.log("Step 4: Checking/creating plan")
    let currentPlanId = planId

    if (!currentPlanId) {
      const planResponse = await fetch(`${request.nextUrl.origin}/api/pagarme/create-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!planResponse.ok) {
        throw new Error("Failed to create plan")
      }

      const { plan_id } = await planResponse.json()
      currentPlanId = plan_id
    }

    // Step 5: Create subscription
    console.log("Step 5: Creating subscription")
    const subscriptionData = {
      customer_id,
      plan_id: currentPlanId,
      card_id,
      start_at: calculateSubscriptionStartDate(),
      billing_type: "prepaid",
      statement_descriptor: "PETLOO",
      metadata: {
        customer_name: customer.name,
        customer_email: customer.email,
        order_id: order.id,
        created_at: new Date().toISOString(),
      },
    }

    const subscription = await pagarmeRequest(PAGARME_CONFIG.ENDPOINTS.SUBSCRIPTIONS, {
      method: "POST",
      body: subscriptionData,
      apiKey,
    })

    console.log("Subscription created successfully:", {
      subscription_id: subscription.id,
      status: subscription.status,
      start_at: subscription.start_at,
    })

    // Step 6: Store in Supabase
    console.log("Step 6: Storing data in Supabase")
    const { error: dbError } = await supabase.from("pagarme_transactions").insert({
      customer_id,
      card_id,
      order_id: order.id,
      subscription_id: subscription.id,
      plan_id: currentPlanId,
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
    return NextResponse.json({ error: PAYMENT_ERRORS.SUBSCRIPTION_CREATION_FAILED }, { status: 500 })
  }
}
