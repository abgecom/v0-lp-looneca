import { type NextRequest, NextResponse } from "next/server"
import { getPagarmeConfig, pagarmeRequest } from "@/lib/payment-utils"
import { PAGARME_CONFIG } from "@/lib/payment-constants"

export async function GET(request: NextRequest) {
  try {
    const { apiKey } = getPagarmeConfig()

    console.log("Fetching existing plans from Pagar.me")

    // Get plans from Pagar.me
    const response = await pagarmeRequest(PAGARME_CONFIG.ENDPOINTS.PLANS, {
      method: "GET",
      apiKey,
    })

    console.log("Plans fetched successfully:", {
      total_plans: response.data?.length || 0,
    })

    return NextResponse.json({
      success: true,
      plans: response.data || [],
      pagination: response.paging || null,
    })
  } catch (error) {
    console.error("Error fetching plans:", error)
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 })
  }
}
