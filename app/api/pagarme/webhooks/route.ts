import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Validate webhook signature (if available)
function validateSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex")

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  } catch (error) {
    console.error("Error validating signature:", error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("X-Hub-Signature")

    // Parse the webhook payload
    let webhookData
    try {
      webhookData = JSON.parse(body)
    } catch (error) {
      console.error("Invalid JSON in webhook payload")
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    console.log("Received Pagar.me webhook:", {
      event: webhookData.event,
      object_id: webhookData.data?.id,
      timestamp: new Date().toISOString(),
    })

    // Validate signature if secret is available
    const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      const isValid = validateSignature(body, signature, webhookSecret)
      if (!isValid) {
        console.error("Invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    // Store webhook event in Supabase
    const { error: dbError } = await supabase.from("pagarme_webhooks").insert({
      event_type: webhookData.event,
      object_id: webhookData.data?.id,
      payload: webhookData,
      signature,
      processed: false,
      received_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error("Error storing webhook in Supabase:", dbError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Process specific webhook events
    switch (webhookData.event) {
      case "order.paid":
        console.log("Order paid:", webhookData.data.id)
        // Update order status in database
        await supabase
          .from("pagarme_transactions")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("order_id", webhookData.data.id)
        break

      case "order.payment_failed":
        console.log("Order payment failed:", webhookData.data.id)
        // Update order status in database
        await supabase
          .from("pagarme_transactions")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("order_id", webhookData.data.id)
        break

      case "subscription.created":
        console.log("Subscription created:", webhookData.data.id)
        break

      case "subscription.canceled":
        console.log("Subscription canceled:", webhookData.data.id)
        // Update subscription status in database
        await supabase
          .from("pagarme_transactions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("subscription_id", webhookData.data.id)
        break

      default:
        console.log("Unhandled webhook event:", webhookData.event)
    }

    // Mark webhook as processed
    await supabase
      .from("pagarme_webhooks")
      .update({ processed: true })
      .eq("object_id", webhookData.data?.id)
      .eq("event_type", webhookData.event)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
