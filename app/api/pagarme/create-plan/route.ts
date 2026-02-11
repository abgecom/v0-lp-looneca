import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 })
  }

  const planData = {
    name: "Petloo Mensal + Tag - 30 Dias Grátis",
    description: "Assinatura mensal com 30 dias grátis de teste",
    interval: "month",
    interval_count: 1,
    billing_type: "prepaid",
    installments: 1,
    trial_period_days: 30,
    payment_methods: ["credit_card"],
    items: [
      {
        name: "Petloo Mensal + Tag",
        quantity: 1,
        pricing_scheme: {
          price: 3090,
        },
      },
    ],
  }

  try {
    const pagarmeResponse = await fetch("https://api.pagar.me/core/v5/plans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAGARME_API_KEY}`,
      },
      body: JSON.stringify(planData),
    })

    const responseData = await pagarmeResponse.json()

    if (!pagarmeResponse.ok) {
      console.error("Pagar.me API error:", responseData)
      return NextResponse.json(responseData, { status: pagarmeResponse.status })
    }

    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error("Error creating Pagar.me plan:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 })
  }
}
