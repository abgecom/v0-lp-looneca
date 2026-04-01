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

    console.log("[Create Customer] Dados recebidos:", JSON.stringify({
      name: body.name,
      email: body.email,
      hasDocument: !!body.document,
      hasPhones: !!body.phones,
      phoneType: typeof body.phones?.mobile_phone,
      hasAddress: !!body.address,
    }))

    // Validate required fields
    const validationErrors = validateCustomerData(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: `Invalid customer data: ${validationErrors.join(", ")}` }, { status: 400 })
    }

    // Extrair e formatar telefone de forma segura
    // O telefone pode vir como string OU como objeto {country_code, area_code, number}
    const rawPhone = body.phones?.mobile_phone || body.phone || ""
    const formattedPhone = formatPhoneForPagarme(rawPhone)

    // Extrair e formatar documento de forma segura
    const rawDocument = body.document || ""
    const formattedDocument = formatDocumentForPagarme(rawDocument)

    // Extrair e formatar CEP de forma segura
    const rawZipCode = body.address?.zip_code || ""
    const cleanZipCode = typeof rawZipCode === "string" ? rawZipCode.replace(/\D/g, "") : String(rawZipCode).replace(/\D/g, "")

    // Format customer data for Pagar.me
    const customerData = {
      name: body.name || "",
      email: body.email || "",
      document: formattedDocument,
      phones: {
        mobile_phone: formattedPhone,
      },
      address: {
        line_1: body.address?.line_1 || "",
        line_2: body.address?.line_2 || "",
        zip_code: cleanZipCode,
        city: body.address?.city || "",
        state: body.address?.state || "",
        country: body.address?.country || "BR",
      },
    }

    console.log("[Create Customer] Dados formatados para Pagar.me:", {
      name: customerData.name,
      email: customerData.email,
      document: "***" + customerData.document.slice(-3),
      phone: `+${formattedPhone.country_code} (${formattedPhone.area_code}) ${formattedPhone.number.slice(0, 3)}...`,
      address_city: customerData.address.city,
      address_state: customerData.address.state,
      zip_code: customerData.address.zip_code,
    })

    // Create customer in Pagar.me
    const response = await pagarmeRequest("/customers", {
      method: "POST",
      body: customerData,
    })

    if (!response.success) {
      console.error("[Create Customer] Pagar.me error:", response.error, response.data)
      throw new Error(response.error || "Failed to create customer")
    }

    console.log("[Create Customer] Customer created successfully:", { customer_id: response.data.id })

    return NextResponse.json({
      success: true,
      customer_id: response.data.id,
      customer: response.data,
    })
  } catch (error) {
    console.error("[Create Customer] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Customer creation failed" },
      { status: 500 },
    )
  }
}
