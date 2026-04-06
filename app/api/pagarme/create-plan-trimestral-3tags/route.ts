import { NextResponse } from "next/server"
import { pagarmeRequest } from "@/lib/pagarme/api"

export async function POST() {
  try {
    // Criar plano trimestral + 3 Tags com 30 dias de trial
    // Valor: R$ 111,00 = 11100 centavos
    const planData = {
      name: "Petloo Trimestral + 3 Tags - 30 Dias Grátis",
      description: "Assinatura trimestral com 3 tags e 30 dias grátis de teste",
      billing_type: "prepaid",
      interval: "month",
      interval_count: 3,
      currency: "BRL",
      payment_methods: ["credit_card"],
      trial_period_days: 30,
      items: [
        {
          name: "Petloo Trimestral + 3 Tags",
          quantity: 1,
          pricing_scheme: {
            scheme_type: "unit",
            price: 11100, // R$ 111,00 em centavos
          },
        },
      ],
    }

    console.log("Creating plan Trimestral + 3 Tags:", planData)

    const response = await pagarmeRequest("/plans", {
      method: "POST",
      body: planData,
    })

    if (!response.success) {
      throw new Error(response.error || "Failed to create plan")
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
      { status: 500 },
    )
  }
}
