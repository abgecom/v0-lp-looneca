import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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
