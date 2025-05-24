import { type NextRequest, NextResponse } from "next/server"
import { getPagarmeConfig, pagarmeRequest } from "@/lib/payment-utils"
import { PAGARME_CONFIG, PAYMENT_ERRORS } from "@/lib/payment-constants"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = getPagarmeConfig()
    const body = await request.json()

    console.log("Creating order with data:", {
      customer_id: body.customer_id,
      items_count: body.items?.length || 0,
      payments_count: body.payments?.length || 0,
      total_amount: body.payments?.[0]?.amount || 0,
    })

    // Create order in Pagar.me
    const order = await pagarmeRequest(PAGARME_CONFIG.ENDPOINTS.ORDERS, {
      method: "POST",
      body,
      apiKey,
    })

    console.log("Order created successfully:", {
      order_id: order.id,
      status: order.status,
      amount: order.amount,
      payment_status: order.charges?.[0]?.status,
    })

    return NextResponse.json({
      success: true,
      order_id: order.id,
      status: order.status,
      ...order,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: PAYMENT_ERRORS.ORDER_CREATION_FAILED }, { status: 500 })
  }
}
