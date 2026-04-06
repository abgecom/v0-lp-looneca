import { type NextRequest, NextResponse } from "next/server"
import { pagarmeRequest } from "@/lib/pagarme/api"

export async function POST(request: NextRequest) {
  try {
    // Dados do plano trimestral + 4 Tags com trial de 30 dias
    const planData = {
      name: "Petloo Trimestral + 4 Tags - 30 Dias Grátis",
      description: "Assinatura trimestral com 4 tags e 30 dias grátis de teste",
      billing_type: "prepaid",
      interval: "month",
      interval_count: 3, // A cada 3 meses
      trial_period_days: 30,
      payment_methods: ["credit_card"],
      currency: "BRL",
      items: [
        {
          name: "Petloo Trimestral + 4 Tags",
          quantity: 1,
          pricing_scheme: {
            scheme_type: "unit",
            price: 12000, // R$ 120,00 em centavos
          },
        },
      ],
    }

    console.log("Creating plan with data:", planData)

    const response = await pagarmeRequest("/plans", {
      method: "POST",
      body: planData,
    })

    if (!response.success) {
      console.error("Failed to create plan:", response.error)
      return NextResponse.json(
        { error: response.error || "Failed to create plan" },
        { status: 500 }
      )
    }

    console.log("Plan created successfully:", response.data)

    return NextResponse.json({
      success: true,
      plan_id: response.data.id,
      plan: response.data,
    })
  } catch (error) {
    console.error("Error creating plan:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Plan creation failed" },
      { status: 500 }
    )
  }
}
