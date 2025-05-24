import { type NextRequest, NextResponse } from "next/server"
import {
  getPagarmeConfig,
  pagarmeRequest,
  validateCustomerData,
  formatPhoneForPagarme,
  formatDocumentForPagarme,
  formatAddressForPagarme,
} from "@/lib/payment-utils"
import { PAGARME_CONFIG, PAYMENT_ERRORS } from "@/lib/payment-constants"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = getPagarmeConfig()
    const body = await request.json()

    // Validate required fields
    if (!validateCustomerData(body)) {
      return NextResponse.json({ error: PAYMENT_ERRORS.INVALID_CUSTOMER_DATA }, { status: 400 })
    }

    // Format customer data for Pagar.me
    const customerData = {
      name: body.name,
      email: body.email,
      document: formatDocumentForPagarme(body.document),
      phones: {
        mobile_phone: formatPhoneForPagarme(body.phones.mobile_phone),
      },
      address: formatAddressForPagarme(body.address),
    }

    console.log("Creating customer with data:", {
      name: customerData.name,
      email: customerData.email,
      document: { type: customerData.document.type, number: "***" + customerData.document.number.slice(-3) },
    })

    // Create customer in Pagar.me
    const customer = await pagarmeRequest(PAGARME_CONFIG.ENDPOINTS.CUSTOMERS, {
      method: "POST",
      body: customerData,
      apiKey,
    })

    console.log("Customer created successfully:", { customer_id: customer.id })

    return NextResponse.json({
      success: true,
      customer_id: customer.id,
      customer,
    })
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: PAYMENT_ERRORS.CUSTOMER_CREATION_FAILED }, { status: 500 })
  }
}
