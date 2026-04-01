import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { pagarmeRequest } from "@/lib/pagarme/api"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// ID do plano trimestral com trial de 30 dias
const TRIMESTRAL_PLAN_ID = process.env.PETLOO_PLAN_TRIMESTRAL_ID || "plan_trimestral"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer, card, pedidoId } = body

    console.log("[Upsell Tag] Starting subscription creation with R$0 transaction")

    // Step 1: Create customer
    console.log("[Upsell Tag] Step 1: Creating customer")
    const customerResponse = await fetch(`${request.nextUrl.origin}/api/pagarme/create-customer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    })

    if (!customerResponse.ok) {
      const errorText = await customerResponse.text()
      console.error("[Upsell Tag] Failed to create customer:", errorText)
      throw new Error("Failed to create customer")
    }

    const customerResult = await customerResponse.json()
    const customer_id = customerResult.customer_id

    if (!customer_id) {
      console.error("[Upsell Tag] customer_id não retornado")
      throw new Error("Customer ID not returned from customer creation")
    }

    console.log("[Upsell Tag] Customer created with ID:", customer_id)

    // Step 2: Create card
    console.log("[Upsell Tag] Step 2: Creating card")
    const cardResponse = await fetch(`${request.nextUrl.origin}/api/pagarme/create-card`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...card,
        customer_id,
      }),
    })

    if (!cardResponse.ok) {
      const errorText = await cardResponse.text()
      console.error("[Upsell Tag] Failed to create card:", errorText)
      throw new Error("Failed to create card")
    }

    const cardResult = await cardResponse.json()
    const card_id = cardResult.card_id

    if (!card_id) {
      console.error("[Upsell Tag] card_id não retornado")
      throw new Error("Card ID not returned from card creation")
    }

    console.log("[Upsell Tag] Card created with ID:", card_id)

    // Step 3: Create subscription with trial (no immediate charge)
    // O plano trimestral já tem trial_period_days configurado, então não haverá cobrança imediata
    console.log("[Upsell Tag] Step 3: Creating subscription with trial")
    
    const subscriptionData = {
      customer_id,
      plan_id: TRIMESTRAL_PLAN_ID,
      card_id,
      billing_type: "prepaid",
      statement_descriptor: "PETLOO",
      metadata: {
        customer_name: customer.name,
        customer_email: customer.email,
        pedido_id: pedidoId,
        created_at: new Date().toISOString(),
        created_by: "upsell_tag_page",
        source: "pix_upsell",
      },
    }

    const subscriptionResponse = await pagarmeRequest("/subscriptions", {
      method: "POST",
      body: subscriptionData,
    })

    if (!subscriptionResponse.success) {
      console.error("[Upsell Tag] Failed to create subscription:", subscriptionResponse.error)
      throw new Error(subscriptionResponse.error || "Failed to create subscription")
    }

    const subscription = subscriptionResponse.data
    console.log("[Upsell Tag] Subscription created:", {
      subscription_id: subscription.id,
      status: subscription.status,
      start_at: subscription.start_at,
      next_billing_at: subscription.next_billing_at,
    })

    // Step 4: Store in Supabase
    console.log("[Upsell Tag] Step 4: Storing data in Supabase")
    const { error: dbError } = await supabase.from("pagarme_transactions").insert({
      customer_id,
      card_id,
      subscription_id: subscription.id,
      plan_id: TRIMESTRAL_PLAN_ID,
      amount: 0, // Transação de R$0
      installments: 1,
      status: subscription.status,
      customer_data: customer,
      created_at: new Date().toISOString(),
      created_by: "upsell_tag_page",
      metadata: {
        source: "pix_upsell",
        pedido_id: pedidoId,
      },
    })

    if (dbError) {
      console.error("[Upsell Tag] Error storing in Supabase:", dbError)
      // Don't fail the request, just log the error
    }

    // Step 5: Atualizar pedido com informação da assinatura (se pedidoId fornecido)
    if (pedidoId) {
      const { error: updateError } = await supabase
        .from("pedidos")
        .update({
          subscription_id: subscription.id,
          tem_tag_petloo: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id_pagamento", pedidoId)

      if (updateError) {
        console.error("[Upsell Tag] Error updating pedido:", updateError)
      } else {
        console.log("[Upsell Tag] Pedido atualizado com subscription_id")
      }
    }

    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      customer_id,
      status: subscription.status,
      message: "Assinatura criada com sucesso! Você receberá a tag Petloo junto com seu pedido.",
    })
  } catch (error) {
    console.error("[Upsell Tag] Error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Subscription creation failed" 
      },
      { status: 500 },
    )
  }
}
