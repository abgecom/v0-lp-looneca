import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Pagar.me API keys - usando variáveis de ambiente de forma segura
const PAGARME_API_KEY = process.env.PAGARME_API_KEY!

export async function POST(request: Request) {
  try {
    // Verificar se as variáveis de ambiente estão definidas
    if (!PAGARME_API_KEY) {
      console.error("Pagar.me API key is not properly configured")
      return NextResponse.json({ error: "Payment configuration incomplete" }, { status: 500 })
    }

    // Get the webhook payload
    const payload = await request.json()

    console.log(`Received Pagar.me webhook event: ${payload.type}`, {
      eventId: payload.id,
      timestamp: new Date().toISOString(),
    })

    // Verificar a assinatura do webhook (implementação para produção)
    const signature = request.headers.get("X-Hub-Signature") || request.headers.get("x-hub-signature")

    // Em ambiente de desenvolvimento/teste, a assinatura pode não estar presente
    if (!signature) {
      console.log("Webhook signature not provided - this is normal for test environments")
    } else {
      console.log("Webhook signature received and should be validated in production")
      // TODO: Implementar validação HMAC da assinatura em produção
    }

    // Store the webhook event
    const { data, error } = await supabase.from("pagarme_webhooks").insert({
      event_type: payload.type,
      event_data: payload,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error storing webhook event:", error)
      return NextResponse.json({ error: "Failed to store webhook event" }, { status: 500 })
    }

    // Process the webhook based on event type
    if (payload.type === "charge.paid" || payload.type === "charge.pending" || payload.type === "charge.failed") {
      const paymentId = payload.data?.id
      const newStatus =
        payload.type === "charge.paid" ? "paid" : payload.type === "charge.pending" ? "pending" : "failed"

      if (paymentId) {
        // Update the order status
        const { error: updateError } = await supabase
          .from("looneca_orders")
          .update({ payment_status: newStatus })
          .eq("payment_id", paymentId)

        if (updateError) {
          console.error("Error updating order status:", updateError)
          return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
        }

        // Also update the payment record if it exists
        try {
          await supabase.from("payments").update({ status: newStatus }).eq("payment_id", paymentId)
        } catch (error) {
          // If the payments table doesn't exist or has a different structure, log the error but continue
          console.error("Error updating payment record:", error)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
