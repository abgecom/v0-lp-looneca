import { type NextRequest, NextResponse } from "next/server"
import {
  pagarmeRequest,
  validateCustomerData,
  formatPhoneForPagarme,
  formatDocumentForPagarme,
} from "@/lib/pagarme/api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const validationErrors = validateCustomerData(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: `Invalid customer data: ${validationErrors.join(", ")}` }, { status: 400 })
    }

    // Format customer data for Pagar.me
    const customerData = {
      name: body.name,
      email: body.email,
      document: formatDocumentForPagarme(body.document), // Clean string with numbers only
      phones: {
        mobile_phone: formatPhoneForPagarme(body.phones.mobile_phone),
      },
      address: {
        line_1: body.address.line_1,
        line_2: body.address.line_2 || "",
        zip_code: body.address.zip_code.replace(/\D/g, ""),
        city: body.address.city,
        state: body.address.state,
        country: body.address.country || "BR",
      },
    }

    console.log("Creating customer with data:", {
      name: customerData.name,
      email: customerData.email,
      document: "***" + customerData.document.slice(-3),
    })

    // Create customer in Pagar.me
    const response = await pagarmeRequest("/customers", {
      method: "POST",
      body: customerData,
    })

    if (!response.success) {
      throw new Error(response.error || "Failed to create customer")
    }

    console.log("Customer created successfully:", { customer_id: response.data.id })

    return NextResponse.json({
      success: true,
      customer_id: response.data.id,
      customer: response.data,
    })
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Customer creation failed" },
      { status: 500 },
    )
  }
}
