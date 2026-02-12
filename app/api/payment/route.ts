import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { criarPedido } from "@/actions/pedidos-actions"
import { buscarDadosFormularioInicial } from "@/actions/cart-data-actions"
import { pagarmeRequest, formatPhoneForPagarme, formatDocumentForPagarme } from "@/lib/pagarme/api"
import { PAGARME_CONFIG } from "@/lib/pagarme/config"
import { sendAppDownloadEmail } from "@/lib/resend"

// Taxas de juros para cartao de credito
const INTEREST_RATES: Record<number, number> = {
  1: 0.0,
  2: 0.0859,
  3: 0.0984,
  4: 0.1109,
  5: 0.1234,
  6: 0.1359,
  7: 0.1534,
  8: 0.1659,
  9: 0.1784,
  10: 0.1909,
  11: 0.2034,
  12: 0.2159,
}

// Initialize Supabase client
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
    accessories?: string[]
  }>
  card?: PaymentCard
  recurringProducts: {
    appPetloo: boolean
    loobook: boolean
  }
}

function calculateFinalAmount(originalAmount: number, paymentMethod: "credit_card" | "pix", installments = 1): number {
  if (installments === 1 || paymentMethod === "pix") {
    return originalAmount
  }

  if (paymentMethod === "credit_card") {
    const rate = INTEREST_RATES[installments] || 0
    return Math.round(originalAmount * (1 + rate) * 100) / 100
  }

  return originalAmount
}

// --- Pagar.me helper functions ---

function buildPagarmeItems(items: PaymentRequest["items"], shipping: PaymentRequest["shipping"]) {
  const pagarmeItems: any[] = []

  items.forEach((item) => {
    pagarmeItems.push({
      amount: Math.round(item.price * 100), // Pagar.me uses cents
      description: `${item.name} - ${item.color} (${item.petCount} pet${item.petCount > 1 ? "s" : ""})`,
      quantity: item.quantity,
      code: item.id,
    })

    if (item.accessories && item.accessories.length > 0) {
      item.accessories.forEach((accessory: string) => {
        pagarmeItems.push({
          amount: Math.round(15.0 * 100), // ACCESSORY_PRICE in cents
          description: `Acessorio: ${accessory}`,
          quantity: item.quantity,
          code: `ACC-${accessory.toUpperCase()}`,
        })
      })
    }
  })

  if (shipping.price > 0) {
    pagarmeItems.push({
      amount: Math.round(shipping.price * 100),
      description: `Frete - ${shipping.method}`,
      quantity: 1,
      code: "SHIPPING",
    })
  }

  return pagarmeItems
}

function buildPagarmeCustomer(customer: PaymentRequest["customer"], shipping: PaymentRequest["shipping"]) {
  const phone = formatPhoneForPagarme(customer.phone)
  const document = formatDocumentForPagarme(customer.cpf)

  return {
    name: customer.name,
    email: customer.email,
    document,
    document_type: "CPF",
    type: "individual",
    phones: {
      mobile_phone: phone,
    },
    address: {
      country: "BR",
      state: shipping.state,
      city: shipping.city,
      neighborhood: shipping.neighborhood,
      street: shipping.address,
      street_number: shipping.number,
      complement: shipping.complement || "",
      zip_code: shipping.cep.replace(/\D/g, ""),
    },
  }
}

function buildPagarmeShipping(shipping: PaymentRequest["shipping"]) {
  return {
    amount: Math.round(shipping.price * 100),
    description: shipping.method,
    address: {
      country: "BR",
      state: shipping.state,
      city: shipping.city,
      neighborhood: shipping.neighborhood,
      street: shipping.address,
      street_number: shipping.number,
      complement: shipping.complement || "",
      zip_code: shipping.cep.replace(/\D/g, ""),
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!PAGARME_CONFIG.apiKey) {
      console.error("[v0] PAGARME_API_KEY environment variable is not set")
      return NextResponse.json(
        {
          success: false,
          error: "Configuracao de pagamento invalida. Entre em contato com o suporte.",
        },
        { status: 500 },
      )
    }

    const body: PaymentRequest = await request.json()
    console.log("[v0] Payment request received:", {
      paymentMethod: body.paymentMethod,
      amount: body.amount,
      installments: body.installments,
      customerEmail: body.customer.email,
    })

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
    const finalAmountCents = Math.round(finalAmount * 100)
    console.log("[v0] Calculated final amount:", { originalAmount, finalAmount, finalAmountCents, installments })

    console.log("[v0] Starting Pagar.me payment flow...")

    // Build Pagar.me order payload
    const pagarmeItems = buildPagarmeItems(items, shipping)
    const pagarmeCustomer = buildPagarmeCustomer(customer, shipping)
    const pagarmeShipping = buildPagarmeShipping(shipping)

    // Build the payment object based on method
    let paymentObj: any = {}

    if (paymentMethod === "pix") {
      console.log("[v0] Payment method: PIX")
      paymentObj = {
        payment_method: "pix",
        pix: {
          expires_in: PAGARME_CONFIG.payment.pixExpirationTime,
        },
      }
    } else if (paymentMethod === "credit_card" && card) {
      console.log("[v0] Payment method: Credit Card")
      const [expMonth, expYear] = card.expirationDate.split("/")
      paymentObj = {
        payment_method: "credit_card",
        credit_card: {
          installments: Number(installments),
          card: {
            number: card.number.replace(/\s/g, ""),
            holder_name: card.holderName,
            exp_month: Number.parseInt(expMonth, 10),
            exp_year: Number.parseInt(`20${expYear}`, 10),
            cvv: card.cvv,
            billing_address: {
              country: "BR",
              state: shipping.state,
              city: shipping.city,
              neighborhood: shipping.neighborhood,
              street: shipping.address,
              street_number: shipping.number,
              complement: shipping.complement || "",
              zip_code: shipping.cep.replace(/\D/g, ""),
              line_1: `${shipping.number}, ${shipping.address}, ${shipping.neighborhood}`,
              line_2: shipping.complement || "",
            },
          },
        },
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Metodo de pagamento invalido ou dados do cartao ausentes." },
        { status: 400 },
      )
    }

    // Create order in Pagar.me
    const orderPayload = {
      items: pagarmeItems,
      customer: pagarmeCustomer,
      shipping: pagarmeShipping,
      payments: [
        {
          ...paymentObj,
          amount: finalAmountCents,
        },
      ],
    }

    console.log("[v0] Creating order in Pagar.me...")
    const orderResult = await pagarmeRequest(PAGARME_CONFIG.ENDPOINTS.ORDERS, {
      method: "POST",
      body: orderPayload,
    })

    if (!orderResult.success) {
      console.error("[v0] Pagar.me order creation failed:", orderResult.error)
      const errorMsg = typeof orderResult.error === "string" ? orderResult.error : "Erro ao processar pagamento."
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: orderResult.status || 500 },
      )
    }

    const pagarmeOrder = orderResult.data
    const pagarmeOrderId = pagarmeOrder.id
    const orderStatus = pagarmeOrder.status
    const charge = pagarmeOrder.charges?.[0]

    console.log("[v0] Pagar.me order created successfully:", {
      orderId: pagarmeOrderId,
      status: orderStatus,
      chargeStatus: charge?.status,
    })

    // Extract PIX data if applicable
    let pixQrCode: string | null = null
    let pixEmv: string | null = null

    if (paymentMethod === "pix" && charge?.last_transaction) {
      const lastTx = charge.last_transaction
      pixQrCode = lastTx.qr_code_url || lastTx.qr_code || null
      pixEmv = lastTx.qr_code || null
      console.log("[v0] PIX payment generated:", { hasQrCode: !!pixQrCode, hasEmv: !!pixEmv })
    }

    // Buscar dados do formulario inicial pelo email do cliente
    console.log("[v0] Buscando dados do formulario para o email:", customer.email)
    const formData = await buscarDadosFormularioInicial(customer.email)

    let fotos = null
    let raca = ""
    let observacoes = ""

    if (formData.success) {
      console.log("[v0] Dados do formulario encontrados:", {
        totalFotos: formData.petPhotos?.length || 0,
        raca: formData.petTypeBreed,
      })
      fotos = formData.petPhotos
      raca = formData.petTypeBreed
      observacoes = formData.petNotes
    } else {
      console.log("[v0] Dados do formulario nao encontrados")
    }

    // Criar pedido na tabela
    const pedidoData = {
      customer: {
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        cpf: customer.cpf,
        cep: shipping.cep,
        cidade: shipping.city,
        estado: shipping.state,
        endereco: shipping.address,
        numero: shipping.number,
        complemento: shipping.complement,
        bairro: shipping.neighborhood,
      },
      itens: items,
      recorrentes: recurringProducts,
      pagamento: {
        metodo: paymentMethod,
        total: finalAmount,
        id: pagarmeOrderId,
        status: orderStatus || "pending",
        data: new Date().toISOString(),
      },
      fotos,
      raca,
      observacoes,
    }

    // Criar pedido no Supabase
    console.log("[v0] Creating order in Supabase...")
    const pedidoResult = await criarPedido(pedidoData)
    console.log("[v0] Resultado da criacao do pedido:", pedidoResult.success)

    // --- Enviar email de download do app (fire-and-forget) ---
    try {
      await sendAppDownloadEmail({
        to: customer.email,
        customerName: customer.name,
      })
      console.log("[v0] Email de download do app enviado para:", customer.email)
    } catch (emailError) {
      console.error("[v0] Erro ao enviar email (nao-bloqueante):", emailError)
    }

    // --- Criar assinatura Pagar.me se appPetloo estiver ativo e pagamento for cartao ---
    let subscriptionId: string | null = null
    let subscriptionCustomerId: string | null = null

    if (
      paymentMethod === "credit_card" &&
      card &&
      recurringProducts?.appPetloo &&
      PAGARME_CONFIG.features.subscriptionsEnabled
    ) {
      try {
        console.log("[v0] App Petloo ativo - iniciando criacao de assinatura...")

        // Step 1: Criar customer na Pagar.me
        const customerPayload = buildPagarmeCustomer(customer, shipping)
        const customerResult = await pagarmeRequest(PAGARME_CONFIG.ENDPOINTS.CUSTOMERS, {
          method: "POST",
          body: customerPayload,
        })

        if (!customerResult.success) {
          console.error("[v0] Falha ao criar customer para assinatura:", customerResult.error)
          throw new Error(`Customer creation failed: ${customerResult.error}`)
        }

        const customerId = customerResult.data.id
        subscriptionCustomerId = customerId
        console.log("[v0] Customer criado para assinatura:", customerId)

        // Step 2: Salvar cartao no customer
        const [expMonth, expYear] = card.expirationDate.split("/")
        const cardPayload = {
          number: card.number.replace(/\s/g, ""),
          holder_name: card.holderName,
          exp_month: Number.parseInt(expMonth, 10),
          exp_year: Number.parseInt(`20${expYear}`, 10),
          cvv: card.cvv,
          billing_address: {
            country: "BR",
            state: shipping.state,
            city: shipping.city,
            neighborhood: shipping.neighborhood,
            street: shipping.address,
            street_number: shipping.number,
            complement: shipping.complement || "",
            zip_code: shipping.cep.replace(/\D/g, ""),
            line_1: `${shipping.number}, ${shipping.address}, ${shipping.neighborhood}`,
            line_2: shipping.complement || "",
          },
        }

        const cardResult = await pagarmeRequest(`${PAGARME_CONFIG.ENDPOINTS.CUSTOMERS}/${customerId}${PAGARME_CONFIG.ENDPOINTS.CARDS}`, {
          method: "POST",
          body: cardPayload,
        })

        if (!cardResult.success) {
          console.error("[v0] Falha ao criar card para assinatura:", cardResult.error)
          throw new Error(`Card creation failed: ${cardResult.error}`)
        }

        const cardId = cardResult.data.id
        console.log("[v0] Card criado para assinatura:", cardId)

        // Step 3: Criar assinatura com o plano existente
        const subscriptionPayload = {
          customer_id: customerId,
          plan_id: PAGARME_CONFIG.subscription.planId,
          card_id: cardId,
          billing_type: "prepaid",
          statement_descriptor: "PETLOO",
          metadata: {
            customer_name: customer.name,
            customer_email: customer.email,
            order_id: pagarmeOrderId,
            created_at: new Date().toISOString(),
          },
        }

        const subscriptionResult = await pagarmeRequest(PAGARME_CONFIG.ENDPOINTS.SUBSCRIPTIONS, {
          method: "POST",
          body: subscriptionPayload,
        })

        if (!subscriptionResult.success) {
          console.error("[v0] Falha ao criar assinatura:", subscriptionResult.error)
          throw new Error(`Subscription creation failed: ${subscriptionResult.error}`)
        }

        subscriptionId = subscriptionResult.data.id
        console.log("[v0] Assinatura criada com sucesso:", {
          subscriptionId,
          status: subscriptionResult.data.status,
        })

        // Step 4: Salvar na tabela pagarme_transactions
        const { error: dbError } = await supabase.from("pagarme_transactions").insert({
          customer_id: customerId,
          card_id: cardId,
          order_id: pagarmeOrderId,
          subscription_id: subscriptionId,
          plan_id: PAGARME_CONFIG.subscription.planId,
          amount: finalAmountCents,
          installments,
          status: subscriptionResult.data.status || "active",
          customer_data: {
            name: customer.name,
            email: customer.email,
            cpf: customer.cpf,
            phone: customer.phone,
          },
          created_at: new Date().toISOString(),
        })

        if (dbError) {
          console.error("[v0] Erro ao salvar assinatura no Supabase:", dbError)
        } else {
          console.log("[v0] Dados da assinatura salvos no Supabase")
        }
      } catch (subscriptionError) {
        // Nao bloquear o fluxo principal - o pedido ja foi criado com sucesso
        console.error("[v0] Erro na criacao da assinatura (nao bloqueia pedido):", subscriptionError)
      }
    }

    // Preparar resposta de sucesso
    const response: any = {
      success: true,
      orderId: pagarmeOrderId,
      status: orderStatus || "pending",
      finalAmount: finalAmount,
      originalAmount: originalAmount,
      interestAmount: finalAmount - originalAmount,
      paymentMethod: paymentMethod,
    }

    if (paymentMethod === "pix" && (pixQrCode || pixEmv)) {
      response.pixCode = pixEmv || pixQrCode
      response.pixQrCodeUrl = pixQrCode
      console.log("[v0] PIX payment - QR code generated")
    }

    if (paymentMethod === "credit_card") {
      response.installments = installments
      response.installmentAmount = Math.round((finalAmount / installments) * 100) / 100
      console.log("[v0] Credit card payment - installments:", installments)
    }

    if (pedidoResult.success && pedidoResult.pedido) {
      response.pedidoNumero = pedidoResult.pedido.pedido_numero
      console.log("[v0] Order number:", response.pedidoNumero)
    }

    // Incluir info da assinatura na resposta
    if (subscriptionId) {
      response.subscriptionId = subscriptionId
      response.subscriptionCustomerId = subscriptionCustomerId
      console.log("[v0] Subscription included in response:", subscriptionId)
    }

    console.log("[v0] Payment processed successfully via Pagar.me")
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Payment processing error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor. Tente novamente.",
      },
      { status: 500 },
    )
  }
}
