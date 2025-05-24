import { type NextRequest, NextResponse } from "next/server"
import { getPagarmeConfig, pagarmeRequest } from "@/lib/payment-utils"
import { PAGARME_CONFIG, PAYMENT_CONSTANTS, PAYMENT_ERRORS } from "@/lib/payment-constants"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = getPagarmeConfig()

    // Plan data
    const planData = {
      name: PAYMENT_CONSTANTS.PLAN.NAME,
      description: PAYMENT_CONSTANTS.PLAN.DESCRIPTION,
      amount: PAYMENT_CONSTANTS.PLAN.AMOUNT,
      interval: PAYMENT_CONSTANTS.PLAN.INTERVAL,
      interval_count: 1,
      billing_type: PAYMENT_CONSTANTS.PLAN.BILLING_TYPE,
      payment_methods: ["credit_card"],
      installments: [1],
      currency: "BRL",
    }

    console.log("Creating plan with data:", {
      name: planData.name,
      amount: planData.amount,
      interval: planData.interval,
      billing_type: planData.billing_type,
    })

    // Create plan in Pagar.me
    const plan = await pagarmeRequest(PAGARME_CONFIG.ENDPOINTS.PLANS, {
      method: "POST",
      body: planData,
      apiKey,
    })

    console.log("Plan created successfully:", {
      plan_id: plan.id,
      name: plan.name,
      amount: plan.amount,
    })

    return NextResponse.json({
      success: true,
      plan_id: plan.id,
      plan,
    })
  } catch (error) {
    console.error("Error creating plan:", error)
    return NextResponse.json({ error: PAYMENT_ERRORS.PLAN_CREATION_FAILED }, { status: 500 })
  }
}
