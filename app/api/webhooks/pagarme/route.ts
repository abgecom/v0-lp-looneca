import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createPetlooSubscription } from "@/actions/subscription-actions"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    // Get the webhook payload
    const payload = await request.json()

    // Log the received event for monitoring
    console.log("Received Pagar.me webhook event:", JSON.stringify(payload, null, 2))

    // Store the webhook event in Supabase for audit purposes
    try {
      await supabase.from("pagarme_webhooks").insert({
        event_type: payload.type,
        event_data: payload,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      // Log error but continue processing
      console.error("Error storing webhook event in database:", error)
    }

    // Check if the event is charge.paid
    if (payload.type === "charge.paid") {
      console.log("Processing charge.paid event")

      // Extract customer ID and card ID from the payload
      const customerId = payload.data?.customer?.id
      const cardId = payload.data?.last_transaction?.card?.id

      // Validate that we have the required IDs
      if (customerId && cardId) {
        console.log(`Creating subscription for customer: ${customerId} with card: ${cardId}`)

        // Call the function to create a subscription
        const result = await createPetlooSubscription(customerId, cardId, supabase)

        if (result.success) {
          console.log(`Subscription created successfully: ${result.subscriptionId}`)
        } else {
          console.error(`Failed to create subscription: ${result.error}`)
        }
      } else {
        console.warn("Missing required IDs for subscription creation", {
          customerId,
          cardId,
          payload,
        })
      }
    } else {
      console.log(`Ignoring event type: ${payload.type} - no action required`)
    }

    // Return success response
    return NextResponse.json({ received: true })
  } catch (error) {
    // Log the error but still return 200 to acknowledge receipt
    // This prevents Pagar.me from retrying the webhook unnecessarily
    console.error("Error processing Pagar.me webhook:", error)
    return NextResponse.json({ received: true, error: "Error processing webhook" })
  }
}

// Handle other HTTP methods
export async function GET(request: Request) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function PUT(request: Request) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function DELETE(request: Request) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function PATCH(request: Request) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
