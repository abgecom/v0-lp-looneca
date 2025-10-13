import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { criarPedido } from "@/actions/pedidos-actions"
import { buscarDadosFormularioInicial } from "@/actions/cart-data-actions"

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

export async function POST(request: NextRequest) {
  try {
    if (!process.env.APPMAX_API_KEY) {
      console.error("[v0] APPMAX_API_KEY environment variable is not set")
      return NextResponse.json(
        {
          success: false,
          error: "Configuração de pagamento inválida. Entre em contato com o suporte.",
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
    console.log("[v0] Calculated final amount:", { originalAmount, finalAmount, installments })

    console.log("[v0] Creating order with Appmax API")

    // Montar payload para Appmax
    const appmaxPayload: any = {
      "access-token": process.env.APPMAX_API_KEY,
      customer: {
        name: customer.name,
        email: customer.email,
        cpf: customer.cpf.replace(/\D/g, ""),
        phone: customer.phone.replace(/\D/g, ""),
        street: shipping.address,
        number: shipping.number,
        complement: shipping.complement || "",
        district: shipping.neighborhood,
        city: shipping.city,
        state: shipping.state,
        zipcode: shipping.cep.replace(/\D/g, ""),
      },
      shipping: shipping.price, // Changed to numeric value as required by API
      products: items.map((item) => ({
        sku: item.id,
        name: `${item.name} - ${item.color} (${item.petCount} pet${item.petCount > 1 ? "s" : ""})`,
        qty: item.quantity, // Changed from 'quantity' to 'qty' as required by API
        price: item.price,
      })),
    }

    // Adicionar informações de pagamento
    if (paymentMethod === "pix") {
      appmaxPayload.payment = { type: "pix" }
      console.log("[v0] Payment method: PIX")
    } else if (paymentMethod === "credit_card" && card) {
      const [expMonth, expYear] = card.expirationDate.split("/")
      appmaxPayload.payment = {
        type: "creditcard",
        creditcard: {
          holder_name: card.holderName,
          number: card.number.replace(/\s/g, ""),
          expiration_month: expMonth,
          expiration_year: `20${expYear}`,
          cvv: card.cvv,
        },
        installments: Number(installments),
      }
      console.log("[v0] Payment method: Credit Card", {
        installments,
        holderName: card.holderName,
      })
    }

    const logPayload = { ...appmaxPayload }
    if (logPayload.payment?.creditcard) {
      logPayload.payment.creditcard = {
        ...logPayload.payment.creditcard,
        number: "****",
        cvv: "***",
      }
    }
    console.log("[v0] Complete Appmax payload:", JSON.stringify(logPayload, null, 2))

    // Fazer requisição para a API da Appmax
    console.log("[v0] Sending request to Appmax API...")
    const appmaxResponse = await fetch("https://admin.appmax.com.br/api/v3/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(appmaxPayload),
    })

    const responseData = await appmaxResponse.json()
    console.log("[v0] Appmax response status:", appmaxResponse.status)
    console.log("[v0] Appmax response data:", JSON.stringify(responseData, null, 2))

    if (!appmaxResponse.ok || responseData.success === false || !responseData.data) {
      console.error("[v0] Appmax API error:", {
        status: appmaxResponse.status,
        statusText: appmaxResponse.statusText,
        success: responseData.success,
        text: responseData.text,
        message: responseData.message,
        responseData,
      })

      let errorMessage = "Erro ao processar pagamento. Tente novamente."
      if (responseData.text === "Invalid Access Token") {
        errorMessage =
          "Erro de configuração do gateway de pagamento. Entre em contato com o suporte informando: Token de acesso inválido."
        console.error("[v0] CRITICAL: APPMAX_API_KEY is invalid or expired!")
      } else if (responseData.message) {
        errorMessage = responseData.message
      } else if (responseData.text) {
        errorMessage = responseData.text
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: responseData,
        },
        { status: 400 },
      )
    }

    // Extrair dados da resposta da Appmax
    const appmaxOrderId = responseData.data.id
    const pixQrCode = responseData.data.pix_qr_code
    const pixEmv = responseData.data.pix_emv

    console.log("[v0] Appmax order created successfully:", {
      orderId: appmaxOrderId,
      status: responseData.data.status,
      hasPix: !!pixQrCode,
    })

    // Buscar dados do formulário inicial pelo email do cliente
    console.log("[v0] Buscando dados do formulário para o email:", customer.email)
    const formData = await buscarDadosFormularioInicial(customer.email)

    let fotos = null
    let raca = ""
    let observacoes = ""

    if (formData.success) {
      console.log("[v0] Dados do formulário encontrados:", {
        totalFotos: formData.petPhotos?.length || 0,
        raca: formData.petTypeBreed,
      })
      fotos = formData.petPhotos
      raca = formData.petTypeBreed
      observacoes = formData.petNotes
    } else {
      console.log("[v0] Dados do formulário não encontrados")
    }

    // Criar pedido na nova tabela
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
        id: appmaxOrderId,
        status: responseData.data.status || "pending",
        data: new Date().toISOString(),
      },
      fotos,
      raca,
      observacoes,
    }

    // Criar pedido no Supabase
    console.log("[v0] Creating order in Supabase...")
    const pedidoResult = await criarPedido(pedidoData)
    console.log("[v0] Resultado da criação do pedido:", pedidoResult.success)

    // Preparar resposta de sucesso
    const response: any = {
      success: true,
      orderId: appmaxOrderId,
      status: responseData.data.status || "pending",
      finalAmount: finalAmount,
      originalAmount: originalAmount,
      interestAmount: finalAmount - originalAmount,
      paymentMethod: paymentMethod,
    }

    // Adicionar informações específicas do método de pagamento
    if (paymentMethod === "pix" && pixQrCode) {
      response.pixCode = pixEmv || pixQrCode
      response.pixQrCodeUrl = pixQrCode
      console.log("[v0] PIX payment - QR code generated")
    }

    if (paymentMethod === "credit_card") {
      response.installments = installments
      response.installmentAmount = Math.round((finalAmount / installments) * 100) / 100
      console.log("[v0] Credit card payment - installments:", installments)
    }

    // Adicionar número do pedido à resposta
    if (pedidoResult.success && pedidoResult.pedido) {
      response.pedidoNumero = pedidoResult.pedido.pedido_numero
      console.log("[v0] Order number:", response.pedidoNumero)
    }

    console.log("[v0] Payment processed successfully")
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
