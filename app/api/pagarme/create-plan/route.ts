import { type NextRequest, NextResponse } from "next/server"
import { pagarmeRequest } from "@/lib/pagarme/api"

export async function POST(req: NextRequest) {
  const planData = {
    name: "Petloo Mensal + Tag - 30 Dias Grátis",
    description: "Assinatura mensal com 30 dias grátis de teste",
    interval: "month",
    interval_count: 1,
    billing_type: "prepaid",
    installments: [1],
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
    const result = await pagarmeRequest("/plans", {
      method: "POST",
      body: planData,
    })

    if (!result.success) {
      console.error("Pagar.me API error creating plan:", result.error, result.data)
      return NextResponse.json(
        { error: result.error, details: result.data },
        { status: result.status || 500 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error("Error creating Pagar.me plan:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 })
  }
}
