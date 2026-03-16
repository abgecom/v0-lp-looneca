import { type NextRequest, NextResponse } from "next/server"
import { pagarmeRequest, formatCardForLog } from "@/lib/pagarme/api"
import { PAGARME_CONFIG } from "@/lib/pagarme/config"

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscription_id, card_id, card_token } = body

    // Validate subscription_id
    if (!subscription_id) {
      console.error("Erro: subscription_id não fornecido")
      return NextResponse.json(
        { error: "subscription_id é obrigatório" },
        { status: 400 }
      )
    }

    // Validate that we have either card_id or card_token
    if (!card_id && !card_token) {
      console.error("Erro: card_id ou card_token não fornecido")
      return NextResponse.json(
        { error: "card_id ou card_token é obrigatório" },
        { status: 400 }
      )
    }

    console.log("Atualizando método de pagamento da assinatura:", {
      subscription_id,
      has_card_id: !!card_id,
      has_card_token: !!card_token,
    })

    // Prepare the request body for Pagar.me
    const updateData: {
      payment_method: string
      card_id?: string
      card_token?: string
      card?: {
        billing_address?: {
          line_1: string
          line_2?: string
          zip_code: string
          city: string
          state: string
          country: string
        }
      }
    } = {
      payment_method: "credit_card",
    }

    if (card_id) {
      updateData.card_id = card_id
    } else if (card_token) {
      updateData.card_token = card_token
    }

    // Add billing address if provided
    if (body.billing_address) {
      updateData.card = {
        billing_address: {
          line_1: body.billing_address.line_1,
          line_2: body.billing_address.line_2 || "",
          zip_code: body.billing_address.zip_code.replace(/\D/g, ""),
          city: body.billing_address.city,
          state: body.billing_address.state,
          country: body.billing_address.country || "BR",
        },
      }
    }

    // Make the PATCH request to update the subscription payment method
    const response = await pagarmeRequest(
      `${PAGARME_CONFIG.ENDPOINTS.SUBSCRIPTIONS}/${subscription_id}/payment-method`,
      {
        method: "PUT", // Pagar.me uses PUT for this endpoint
        body: updateData,
      }
    )

    if (!response.success) {
      console.error("Erro ao atualizar método de pagamento:", response.error)
      return NextResponse.json(
        { 
          error: response.error || "Falha ao atualizar método de pagamento",
          details: response.data 
        },
        { status: response.status || 500 }
      )
    }

    console.log("Método de pagamento atualizado com sucesso:", {
      subscription_id,
      new_payment_method: response.data?.payment_method,
    })

    return NextResponse.json({
      success: true,
      message: "Método de pagamento atualizado com sucesso",
      subscription: response.data,
    })
  } catch (error) {
    console.error("Erro ao atualizar método de pagamento:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// Also support POST for creating a new card and updating the subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscription_id, card_data, billing_address } = body

    // Validate required fields
    if (!subscription_id) {
      return NextResponse.json(
        { error: "subscription_id é obrigatório" },
        { status: 400 }
      )
    }

    if (!card_data) {
      return NextResponse.json(
        { error: "card_data é obrigatório" },
        { status: 400 }
      )
    }

    // Validate card data
    const requiredCardFields = ["number", "holder_name", "exp_month", "exp_year", "cvv"]
    for (const field of requiredCardFields) {
      if (!card_data[field]) {
        return NextResponse.json(
          { error: `Campo ${field} é obrigatório` },
          { status: 400 }
        )
      }
    }

    console.log("Criando novo cartão e atualizando assinatura:", {
      subscription_id,
      card_number: formatCardForLog(card_data.number),
      holder_name: card_data.holder_name,
    })

    // Step 1: Create the card
    const cardRequestBody: any = {
      number: card_data.number.replace(/\s/g, ""),
      holder_name: card_data.holder_name,
      exp_month: Number.parseInt(card_data.exp_month),
      exp_year: Number.parseInt(card_data.exp_year),
      cvv: card_data.cvv,
    }

    // Add billing address to card if provided
    if (billing_address) {
      cardRequestBody.billing_address = {
        line_1: billing_address.line_1,
        line_2: billing_address.line_2 || "",
        zip_code: billing_address.zip_code.replace(/\D/g, ""),
        city: billing_address.city,
        state: billing_address.state,
        country: billing_address.country || "BR",
      }
    }

    const cardResponse = await pagarmeRequest(PAGARME_CONFIG.ENDPOINTS.CARDS, {
      method: "POST",
      body: cardRequestBody,
    })

    if (!cardResponse.success) {
      console.error("Erro ao criar cartão:", cardResponse.error)
      return NextResponse.json(
        { 
          error: cardResponse.error || "Falha ao criar cartão",
          details: cardResponse.data 
        },
        { status: cardResponse.status || 500 }
      )
    }

    const card_id = cardResponse.data.id
    console.log("Cartão criado com sucesso:", {
      card_id,
      last_four_digits: cardResponse.data.last_four_digits,
    })

    // Step 2: Update the subscription payment method
    const updateData: any = {
      payment_method: "credit_card",
      card_id,
    }

    if (billing_address) {
      updateData.card = {
        billing_address: {
          line_1: billing_address.line_1,
          line_2: billing_address.line_2 || "",
          zip_code: billing_address.zip_code.replace(/\D/g, ""),
          city: billing_address.city,
          state: billing_address.state,
          country: billing_address.country || "BR",
        },
      }
    }

    const subscriptionResponse = await pagarmeRequest(
      `${PAGARME_CONFIG.ENDPOINTS.SUBSCRIPTIONS}/${subscription_id}/payment-method`,
      {
        method: "PUT",
        body: updateData,
      }
    )

    if (!subscriptionResponse.success) {
      console.error("Erro ao atualizar assinatura:", subscriptionResponse.error)
      return NextResponse.json(
        { 
          error: subscriptionResponse.error || "Falha ao atualizar assinatura",
          details: subscriptionResponse.data,
          card_created: true,
          card_id,
        },
        { status: subscriptionResponse.status || 500 }
      )
    }

    console.log("Assinatura atualizada com sucesso:", {
      subscription_id,
      card_id,
      new_payment_method: subscriptionResponse.data?.payment_method,
    })

    return NextResponse.json({
      success: true,
      message: "Cartão criado e método de pagamento atualizado com sucesso",
      card: {
        id: card_id,
        last_four_digits: cardResponse.data.last_four_digits,
        brand: cardResponse.data.brand,
      },
      subscription: subscriptionResponse.data,
    })
  } catch (error) {
    console.error("Erro ao processar atualização:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
