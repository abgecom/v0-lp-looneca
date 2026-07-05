import { type NextRequest, NextResponse } from "next/server"
import { criarPedido } from "@/actions/pedidos-actions"
import { buscarDadosFormularioInicial } from "@/actions/cart-data-actions"
import { pagarmeRequest, formatPhoneForPagarme, formatDocumentForPagarme } from "@/lib/pagarme/api"
import { PAGARME_CONFIG } from "@/lib/pagarme/config"
import { sendAppDownloadEmail } from "@/lib/resend"
import { LOOTAG_PRICE, LOOTAG_NAME } from "@/lib/payment-utils"
import { createLooAppSubscription } from "@/lib/pagarme/subscriptions"

// Taxas de juros para cartao de credito
const INTEREST_RATES: Record<number, number> = {
  1: 0.0,
  2: 0.0,
  3: 0.0,
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
    looTag: boolean
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

function buildPagarmeItems(
  items: PaymentRequest["items"],
  shipping: PaymentRequest["shipping"],
  recurringProducts?: PaymentRequest["recurringProducts"],
) {
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

  if (recurringProducts?.looTag) {
    pagarmeItems.push({
      amount: Math.round(LOOTAG_PRICE * 100),
      description: LOOTAG_NAME,
      quantity: 1,
      code: "LOOTAG",
    })
  }

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
    const pagarmeItems = buildPagarmeItems(items, shipping, recurringProducts)
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

    // Capturar customer_id/card_id tokenizados por TODO pedido pago com cartão
    // (independente de LooTag/LooApp) para permitir cobranças 1-clique futuras
    // (ex.: upsell pós-compra) sem pedir os dados do cartão novamente.
    const pagarmeCustomerId: string | null = pagarmeOrder.customer?.id || null
    const pagarmeCardId: string | null =
      paymentMethod === "credit_card" ? charge?.last_transaction?.card?.id || null : null

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
      pagarmeCustomerId,
      pagarmeCardId,
    }

    // Criar pedido no Supabase
    console.log("[v0] Creating order in Supabase...")
    const pedidoResult = await criarPedido(pedidoData)
    console.log("[v0] Resultado da criacao do pedido:", pedidoResult.success)

    // --- Enviar email de download do app (fire-and-forget) ---
    // Para cartao de credito, o pagamento e confirmado imediatamente, entao enviamos aqui.
    // Para PIX, o email sera enviado pelo webhook quando o pagamento for confirmado (charge.paid).
    if (paymentMethod === "credit_card") {
      try {
        await sendAppDownloadEmail({
          to: customer.email,
          customerName: customer.name,
        })
        console.log("[v0] Email de download do app enviado para:", customer.email)
      } catch (emailError) {
        console.error("[v0] Erro ao enviar email (nao-bloqueante):", emailError)
      }
    } else {
      console.log("[v0] Pagamento PIX - email sera enviado apos confirmacao via webhook")
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
      console.log("[v0] App Petloo ativo - iniciando criacao de assinatura...")
      const subscriptionResult = await createLooAppSubscription({
        customer,
        shipping,
        card,
        orderId: pagarmeOrderId,
      })

      if (subscriptionResult.success) {
        subscriptionId = subscriptionResult.subscriptionId || null
        subscriptionCustomerId = subscriptionResult.subscriptionCustomerId || null
        console.log("[v0] Assinatura criada com sucesso:", { subscriptionId })
      } else {
        // Nao bloquear o fluxo principal - o pedido ja foi criado com sucesso
        console.error("[v0] Erro na criacao da assinatura (nao bloqueia pedido):", subscriptionResult.error)
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

    // IDs tokenizados pela Pagar.me (permitem cobranças 1-clique futuras, ex. upsell)
    response.pagarmeCustomerId = pagarmeCustomerId
    response.pagarmeCardId = pagarmeCardId

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
