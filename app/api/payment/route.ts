import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Taxas de juros para cartão de crédito
const INTEREST_RATES = {
  1: 0.0, // 0% para pagamento à vista
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

const PIX_RATE = 0.0 // 0% para PIX

// Initialize Supabase client
// Verificar se as variáveis de ambiente estão definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

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
  // Para pagamento à vista (1x) ou PIX, não aplicar juros
  if (installments === 1 || paymentMethod === "pix") {
    return originalAmount
  }

  if (paymentMethod === "credit_card") {
    const rate = INTEREST_RATES[installments as keyof typeof INTEREST_RATES] || 0
    return Math.round(originalAmount * (1 + rate) * 100) / 100
  }

  return originalAmount
}

function formatCpf(cpf: string): string {
  return cpf.replace(/\D/g, "")
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")

  // Extract area code and number
  let areaCode = "00"
  let number = cleaned

  if (cleaned.length >= 10) {
    areaCode = cleaned.slice(0, 2)
    number = cleaned.slice(2)
  }

  return {
    country_code: "55",
    area_code: areaCode,
    number: number,
  }
}

// Calcular data de início da assinatura (30 dias após o pagamento)
function calculateSubscriptionStartDate(): string {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + 30)
  return startDate.toISOString()
}

// Criar assinatura após pagamento aprovado
async function createSubscription(customerId: string, cardId: string, orderId: string, customer: any): Promise<any> {
  try {
    console.log("Creating subscription for customer:", customerId, "with card:", cardId)

    const subscriptionData = {
      customer_id: customerId,
      plan_id: process.env.PETLOO_PLAN_ID,
      card_id: cardId,
      start_at: calculateSubscriptionStartDate(),
      billing_type: "prepaid",
      statement_descriptor: "PETLOO",
      metadata: {
        customer_name: customer.name,
        customer_email: customer.email,
        order_id: orderId,
        created_at: new Date().toISOString(),
      },
    }

    const subscriptionResponse = await fetch("https://api.pagar.me/core/v5/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.PAGARME_API_KEY}:`).toString("base64")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(subscriptionData),
    })

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.json()
      console.error("Failed to create subscription:", errorData)
      return { success: false, error: errorData }
    }

    const subscription = await subscriptionResponse.json()
    console.log("Subscription created successfully:", {
      subscription_id: subscription.id,
      status: subscription.status,
      start_at: subscription.start_at,
    })

    // Store subscription in database
    const { error: dbError } = await supabase.from("pagarme_transactions").insert({
      customer_id: customerId,
      card_id: cardId,
      order_id: orderId,
      subscription_id: subscription.id,
      plan_id: process.env.PETLOO_PLAN_ID,
      amount: subscription.amount,
      installments: 1,
      status: subscription.status,
      customer_data: customer,
      created_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error("Error storing subscription in Supabase:", dbError)
    }

    return { success: true, subscription }
  } catch (error) {
    console.error("Error creating subscription:", error)
    return { success: false, error }
  }
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

    // Verificar se há produtos recorrentes
    const hasRecurringProducts = recurringProducts.appPetloo || recurringProducts.loobook
    console.log("Has recurring products:", hasRecurringProducts)

    // Calcular valor final com juros
    const finalAmount = calculateFinalAmount(originalAmount, paymentMethod, installments)

    // Preparar dados do cliente
    const customerData = {
      name: customer.name,
      email: customer.email,
      document: formatCpf(customer.cpf),
      type: "individual",
      phones: {
        mobile_phone: formatPhone(customer.phone),
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
      const [expMonth, expYear] = card.expirationDate.split("/")

      // Log dos dados do cartão para debug
      console.log("Dados do cartão para debug:", {
        number: `****${card.number.slice(-4)}`,
        holder_name: card.holderName,
        exp_month: Number.parseInt(expMonth),
        exp_year: Number.parseInt(`20${expYear}`),
      })

      // Usar o cartão diretamente no pagamento (sem criar card_id separadamente)
      payments.push({
        payment_method: "credit_card",
        amount: finalAmount * 100, // Converter para centavos
        installments: installments,
        credit_card: {
          card: {
            number: card.number.replace(/\s/g, ""),
            holder_name: card.holderName,
            exp_month: Number.parseInt(expMonth),
            exp_year: Number.parseInt(`20${expYear}`),
            cvv: card.cvv,
            billing_address: billingAddress,
          },
          operation_type: "auth_and_capture",
          recurrence: false,
          save: hasRecurringProducts, // Salvar o cartão se houver produtos recorrentes
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
        installments === 1 || paymentMethod === "pix"
          ? "0%"
          : (INTEREST_RATES[installments as keyof typeof INTEREST_RATES] * 100).toFixed(2) + "%",
      recurringAppPetloo: recurringProducts.appPetloo.toString(),
      recurringLoobook: recurringProducts.loobook.toString(),
      isRecurring: hasRecurringProducts.toString(),
      requiresSubscription: hasRecurringProducts.toString(),
      customerEmail: customer.email,
      customerName: customer.name,
      customerDocument: formatCpf(customer.cpf),
      shippingAddress: JSON.stringify(shippingAddress),
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
    const pagarmeResponse = await fetch("https://api.pagar.me/core/v5/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.PAGARME_API_KEY}:`).toString("base64")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(orderPayload),
    })

    // Verificar Content-Type antes de fazer parse JSON
    const contentType = pagarmeResponse.headers.get("content-type")

    if (contentType && contentType.includes("application/json")) {
      const responseData = await pagarmeResponse.json()
      console.log("Pagar.me response:", JSON.stringify(responseData, null, 2))

      if (!pagarmeResponse.ok) {
        console.error("Pagar.me API error:", responseData)
        return NextResponse.json(
          {
            success: false,
            error:
              responseData.message ||
              responseData.errors?.[0]?.message ||
              "Erro ao processar pagamento. Tente novamente.",
            details: responseData,
          },
          { status: 400 },
        )
      }

      // Verificar se o pagamento foi aprovado
      const paymentStatus = responseData.status
      const isPaymentApproved = paymentStatus === "paid" || paymentStatus === "authorized"

      console.log("Payment status:", paymentStatus, "Approved:", isPaymentApproved)

      // Extrair customer_id e card_id para assinatura
      const customerId = responseData.customer?.id
      let cardId = null

      // Extrair card_id do pagamento
      if (paymentMethod === "credit_card" && responseData.charges && responseData.charges.length > 0) {
        const lastTransaction = responseData.charges[0].last_transaction
        if (lastTransaction && lastTransaction.card) {
          cardId = lastTransaction.card.id
          console.log("Card ID extracted from payment:", cardId)
        }
      }

      // Criar assinatura se o pagamento for aprovado e houver produtos recorrentes
      let subscriptionResult = null
      if (isPaymentApproved && hasRecurringProducts && customerId && cardId && paymentMethod === "credit_card") {
        console.log("Creating subscription after successful payment")
        subscriptionResult = await createSubscription(customerId, cardId, responseData.id, customerData)
        console.log("Subscription creation result:", subscriptionResult.success)
      } else if (hasRecurringProducts) {
        console.log("Skipping subscription creation:", {
          isPaymentApproved,
          hasRecurringProducts,
          hasCustomerId: !!customerId,
          hasCardId: !!cardId,
          paymentMethod,
        })
      }

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

      // Adicionar informações da assinatura se foi criada
      if (subscriptionResult && subscriptionResult.success) {
        response.subscription = {
          id: subscriptionResult.subscription.id,
          status: subscriptionResult.subscription.status,
          start_at: subscriptionResult.subscription.start_at,
        }
      }

      return NextResponse.json(response)
    } else {
      const responseText = await pagarmeResponse.text()
      console.error("Resposta da Pagar.me não é JSON:", responseText.substring(0, 500))
      console.error("Status:", pagarmeResponse.status, pagarmeResponse.statusText)
      console.error("Headers:", Object.fromEntries(pagarmeResponse.headers.entries()))

      return NextResponse.json(
        {
          success: false,
          error: "Resposta inesperada da Pagar.me",
          raw: responseText.substring(0, 500), // Limitar o tamanho da resposta no log
        },
        { status: 500 },
      )
    }
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
