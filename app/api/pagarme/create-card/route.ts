import { type NextRequest, NextResponse } from "next/server"
import { pagarmeRequest, formatCardForLog } from "@/lib/pagarme/api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_id } = body

    // Validate customer_id
    if (!customer_id) {
      console.error("Erro: customer_id inválido. Não será possível criar o cartão.")
      return NextResponse.json({ error: "Falha ao criar o cartão: customer_id inválido" }, { status: 400 })
    }

    console.log("Creating card for customer_id:", customer_id)

    // Format card data for Pagar.me
    const cardData = {
      number: body.number.replace(/\s/g, ""),
      holder_name: body.holder_name,
      exp_month: Number.parseInt(body.exp_month),
      exp_year: Number.parseInt(body.exp_year),
      cvv: body.cvv,
      billing_address: body.billing_address
        ? {
            line_1: body.billing_address.line_1,
            line_2: body.billing_address.line_2 || "",
            zip_code: body.billing_address.zip_code.replace(/\D/g, ""),
            city: body.billing_address.city,
            state: body.billing_address.state,
            country: body.billing_address.country || "BR",
          }
        : undefined,
    }

    console.log("Card creation for:", {
      customer_id,
      card_number: formatCardForLog(cardData.number),
      holder_name: cardData.holder_name,
    })

    // Na Pagar.me v5, cartões devem ser criados diretamente no endpoint do customer
    // Endpoint: POST /customers/{customer_id}/cards
    // O endpoint /cards avulso retorna 404
    const response = await pagarmeRequest(`/customers/${customer_id}/cards`, {
      method: "POST",
      body: cardData,
    })

    if (!response.success) {
      console.error("Failed to create card:", response.error, response.data)
      throw new Error(response.error || "Failed to create card")
    }

    console.log("Card created successfully:", {
      card_id: response.data.id,
      last_four_digits: response.data.last_four_digits,
    })

    return NextResponse.json({
      success: true,
      card_id: response.data.id,
      card: response.data,
    })
  } catch (error) {
    console.error("Error creating card:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Card creation failed" },
      { status: 500 },
    )
  }
}
