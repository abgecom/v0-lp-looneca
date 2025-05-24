import { type NextRequest, NextResponse } from "next/server"
import { pagarmeRequest, formatCardForLog, formatDocumentForPagarme, formatPhoneForPagarme } from "@/lib/pagarme/api"
import { PAGARME_CONFIG } from "@/lib/pagarme/config"

// Taxas de juros para cartão de crédito
const INTEREST_RATES = {
  1: 0.0559, // 5.59%
  2: 0.0859, // 8.59%
  3: 0.0984, // 9.84%
  4: 0.1109, // 11.09%
  5: 0.1234, // 12.34%
  6: 0.1359, // 13.59%
  7: 0.1534, // 15.34%
  8: 0.1659, // 16.59%
  9: 0.1784, // 17.84%
  10: 0.1909, // 19.09%
  11: 0.2034, // 20.34%
  12: 0.2159, // 21.59%
}

const PIX_RATE = 0.0119 // 1.19% para PIX

interface PaymentCard {
  number: string
  holderName: string
  expirationDate: string
  cvv: string
}

interface PaymentRequest {
  amount: number
  paymentMethod: "credit_card" | "pix"
  installments?: number
  customer: {
    name: string
    email: string
    cpf: string
    phone: string
  }
  shipping: {
    cep: string
    address: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    method: string
    price: number
  }
  items: Array<{
    id: string
    name: string
    color: string
    petCount: number
    quantity: number
    price: number
    imageSrc?: string
  }>
  card?: PaymentCard
  recurringProducts: {
    appPetloo: boolean
    loobook: boolean
  }
}

function calculateFinalAmount(originalAmount: number, paymentMethod: "credit_card" | "pix", installments = 1): number {
  if (paymentMethod === "pix") {
    return Math.round(originalAmount * (1 + PIX_RATE))
  }

  if (paymentMethod === "credit_card") {
    const rate = INTEREST_RATES[installments as keyof typeof INTEREST_RATES] || INTEREST_RATES[1]
    return Math.round(originalAmount * (1 + rate))
  }

  return originalAmount
}

async function createCardId(card: PaymentCard, billingAddress: any): Promise<string> {
  const [expMonth, expYear] = card.expirationDate.split("/")

  // Log dos dados do cartão para debug (apenas últimos 4 dígitos)
  console.log("Dados do cartão para debug:", {
    number: formatCardForLog(card.number),
    holder_name: card.holderName,
    exp_month: Number.parseInt(expMonth),
    exp_year: Number.parseInt(`20${expYear}`),
  })

  const cardPayload = {
    number: card.number.replace(/\s/g, ""),
    holder_name: card.holderName,
    exp_month: Number.parseInt(expMonth),
    exp_year: Number.parseInt(`20${expYear}`),
    cvv: card.cvv,
    billing_address: {
      line_1: billingAddress.line_1,
      line_2: billingAddress.line_2,
      zip_code: billingAddress.zip_code,
      city: billingAddress.city,
      state: billingAddress.state,
      country: "BR",
    },
  }

  // IMPORTANT: Cards are created directly at /cards endpoint, not nested under customers
  const cardResponse = await pagarmeRequest(PAGARME_CONFIG.ENDPOINTS.CARDS, {
    method: "POST",
    body: cardPayload,
  })

  if (!cardResponse.success) {
    throw new Error(cardResponse.error || "Erro ao criar cartão. Verifique os dados e tente novamente.")
  }

  return cardResponse.data.id
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json()

    const {
      amount: originalAmount,
      paymentMethod,
      installments = 1,
      customer,
      shipping,
      items,
      card,
      recurringProducts,
    } = body

    // Calcular valor final com juros
    const finalAmount = calculateFinalAmount(originalAmount, paymentMethod, installments)

    // Preparar dados do cliente
    const customerData = {
      name: customer.name,
      email: customer.email,
      document: formatDocumentForPagarme(customer.cpf),
      type: "individual",
      phones: {
        mobile_phone: formatPhoneForPagarme(customer.phone),
      },
    }

    // Preparar endereço de cobrança
    const billingAddress = {
      line_1: `${shipping.address}, ${shipping.number}`,
      line_2: shipping.complement || "",
      zip_code: shipping.cep.replace(/\D/g, ""),
      city: shipping.city,
      state: shipping.state,
      country: "BR",
    }

    // Preparar endereço de entrega
    const shippingAddress = {
      line_1: `${shipping.address}, ${shipping.number}`,
      line_2: shipping.complement || "",
      zip_code: shipping.cep.replace(/\D/g, ""),
      city: shipping.city,
      state: shipping.state,
      country: "BR",
    }

    // Preparar itens
    const orderItems = items.map((item) => ({
      code: item.id,
      description: `${item.name} - ${item.color} (${item.petCount} pet${item.petCount > 1 ? "s" : ""})`,
      amount: Math.round(item.price * 100), // Converter para centavos
      quantity: item.quantity,
    }))

    // Adicionar taxa de frete como item se houver
    if (shipping.price > 0) {
      orderItems.push({
        code: "shipping",
        description: shipping.method,
        amount: Math.round(shipping.price * 100),
        quantity: 1,
      })
    }

    // Preparar pagamento
    const payments = []

    if (paymentMethod === "credit_card" && card) {
      // Criar card_id na Pagar.me
      const cardId = await createCardId(card, billingAddress)

      // Usar apenas o card_id no pagamento
      payments.push({
        payment_method: "credit_card",
        amount: finalAmount * 100, // Converter para centavos
        installments: installments,
        credit_card: {
          card_id: cardId,
        },
      })
    } else if (paymentMethod === "pix") {
      payments.push({
        payment_method: "pix",
        amount: finalAmount * 100, // Converter para centavos
        pix: {
          expires_in: 3600, // 1 hora para expirar
        },
      })
    }

    // Preparar metadata
    const metadata = {
      originalAmount: originalAmount.toString(),
      finalAmount: finalAmount.toString(),
      interestRate:
        paymentMethod === "credit_card"
          ? (INTEREST_RATES[installments as keyof typeof INTEREST_RATES] * 100).toFixed(2) + "%"
          : paymentMethod === "pix"
            ? (PIX_RATE * 100).toFixed(2) + "%"
            : "0%",
      recurringAppPetloo: recurringProducts.appPetloo.toString(),
      recurringLoobook: recurringProducts.loobook.toString(),
      isRecurring: (recurringProducts.appPetloo || recurringProducts.loobook).toString(),
    }

    // Payload para a Pagar.me
    const orderPayload = {
      items: orderItems,
      customer: customerData,
      billing: {
        address: billingAddress,
      },
      shipping: {
        address: shippingAddress,
        description: "Entrega padrão",
      },
      payments: payments,
      metadata: metadata,
    }

    console.log("Creating order with payload:", JSON.stringify(orderPayload, null, 2))

    // Fazer requisição para a API da Pagar.me
    const pagarmeResponse = await pagarmeRequest(PAGARME_CONFIG.ENDPOINTS.ORDERS, {
      method: "POST",
      body: orderPayload,
    })

    if (!pagarmeResponse.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao processar pagamento. Tente novamente.",
          details: pagarmeResponse.error,
        },
        { status: 400 },
      )
    }

    const responseData = pagarmeResponse.data

    // Preparar resposta de sucesso
    const response: any = {
      success: true,
      orderId: responseData.id,
      status: responseData.status,
      finalAmount: finalAmount,
      originalAmount: originalAmount,
      interestAmount: finalAmount - originalAmount,
      paymentMethod: paymentMethod,
    }

    // Adicionar informações específicas do método de pagamento
    if (paymentMethod === "pix" && responseData.charges?.[0]?.last_transaction?.qr_code) {
      response.pixCode = responseData.charges[0].last_transaction.qr_code
      response.pixQrCodeUrl = responseData.charges[0].last_transaction.qr_code_url
    }

    if (paymentMethod === "credit_card") {
      response.installments = installments
      response.installmentAmount = Math.round((finalAmount / installments) * 100) / 100
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor. Tente novamente.",
      },
      { status: 500 },
    )
  }
}
