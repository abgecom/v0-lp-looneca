import { type NextRequest, NextResponse } from "next/server"
import {
  getPagarmeConfig,
  pagarmeRequest,
  validateCardData,
  formatCardForLogging,
  formatAddressForPagarme,
} from "@/lib/payment-utils"
import { PAGARME_CONFIG, PAYMENT_ERRORS } from "@/lib/payment-constants"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = getPagarmeConfig()
    const body = await request.json()

    // Validate required fields
    if (!validateCardData(body) || !body.customer_id) {
      return NextResponse.json({ error: PAYMENT_ERRORS.INVALID_CARD_DATA }, { status: 400 })
    }

    // Format card data for Pagar.me
    const cardData = {
      number: body.number.replace(/\s/g, ""),
      holder_name: body.holder_name,
      exp_month: Number.parseInt(body.exp_month),
      exp_year: Number.parseInt(body.exp_year),
      cvv: body.cvv,
      billing_address: formatAddressForPagarme(body.billing_address),
    }

    console.log("Creating card for customer:", {
      customer_id: body.customer_id,
      card_number: formatCardForLogging(cardData.number),
      holder_name: cardData.holder_name,
    })

    // Create card in Pagar.me
    const endpoint = `${PAGARME_CONFIG.ENDPOINTS.CUSTOMERS}/${body.customer_id}/cards`
    const card = await pagarmeRequest(endpoint, {
      method: "POST",
      body: cardData,
      apiKey,
    })

    console.log("Card created successfully:", {
      card_id: card.id,
      last_four_digits: card.last_four_digits,
    })

    return NextResponse.json({
      success: true,
      card_id: card.id,
      card,
    })
  } catch (error) {
    console.error("Error creating card:", error)
    return NextResponse.json({ error: PAYMENT_ERRORS.CARD_CREATION_FAILED }, { status: 500 })
  }
}
