import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customer, card, plan_id } = body

    if (!customer || !card || !plan_id) {
      return new NextResponse("Missing fields", { status: 400 })
    }

    // Step 1: Create customer
    console.log("Step 1: Creating customer...")
    const customerResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pagarme/create-customer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    })

    if (!customerResponse.ok) {
      throw new Error("Failed to create customer")
    }

    const customerData = await customerResponse.json()
    const customerId = customerData.customer_id

    if (!customerId) {
      console.error("Erro: customer_id não retornado na criação do cliente")
      throw new Error("Customer ID not returned from customer creation")
    }

    console.log("Customer created successfully with ID:", customerId)

    // Step 2: Create card
    console.log("Step 2: Creating card for customer_id:", customerId)
    const cardResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pagarme/create-card`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...card, customer_id: customerId }),
    })

    if (!cardResponse.ok) {
      throw new Error("Failed to create card")
    }

    const cardData = await cardResponse.json()
    const cardId = cardData.card_id

    if (!cardId) {
      console.error("Erro: card_id não retornado na criação do cartão")
      throw new Error("Card ID not returned from card creation")
    }

    console.log("Card created successfully with ID:", cardId)

    // Step 3: Create subscription
    console.log("Step 3: Creating subscription with plan_id:", plan_id, "customer_id:", customerId, "card_id:", cardId)
    const subscriptionResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/pagarme/create-subscription-with-card`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: plan_id, customer_id: customerId, card_id: cardId }),
      },
    )

    if (!subscriptionResponse.ok) {
      throw new Error("Failed to create subscription")
    }

    const subscriptionData = await subscriptionResponse.json()
    console.log("Subscription created successfully:", subscriptionData)

    return NextResponse.json(subscriptionData)
  } catch (error: any) {
    console.error("Error creating subscription:", error)
    return new NextResponse(error.message || "Internal Server Error", { status: 500 })
  }
}
