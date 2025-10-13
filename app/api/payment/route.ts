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

async function createAppmaxCustomer(customerData: any, accessToken: string) {
  console.log("[v0] Step 1: Creating customer in Appmax...")

  const nameParts = customerData.name.trim().split(" ")
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""

  const customerPayload = {
    firstname: firstName,
    lastname: lastName,
    email: customerData.email,
    document: customerData.cpf.replace(/\D/g, ""),
    zipcode: customerData.zipcode.replace(/\D/g, ""),
    address: customerData.street,
    number: customerData.number,
    neighborhood: customerData.district,
    city: customerData.city,
    state: customerData.state,
    telephone: customerData.phone.replace(/\D/g, ""),
  }

  const response = await fetch("https://admin.appmax.com.br/api/v3/customer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access-token": accessToken,
    },
    body: JSON.stringify(customerPayload),
  })

  const responseData = await response.json()
  console.log("[v0] Customer creation response:", {
    status: response.status,
    success: responseData.success,
    hasId: !!responseData.data?.id,
  })

  // Even if the customer already exists, the API may return the customer data
  if (responseData.data?.id) {
    console.log("[v0] Customer ID obtained:", responseData.data.id)
    return responseData.data.id
  }

  // If no ID was returned, throw an error
  throw new Error(responseData.text || responseData.message || "Failed to create customer")
}

async function createAppmaxOrder(orderData: any, accessToken: string) {
  console.log("[v0] Step 2: Creating order in Appmax...")

  const orderPayload = {
    customer_id: orderData.customerId,
    products: orderData.products,
  }

  // Add payment info for credit card
  if (orderData.payment) {
    orderPayload.payment = orderData.payment
  }

  const response = await fetch("https://admin.appmax.com.br/api/v3/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access-token": accessToken,
    },
    body: JSON.stringify(orderPayload),
  })

  const responseData = await response.json()
  console.log("[v0] Order creation response:", {
    status: response.status,
    success: responseData.success,
    hasId: !!responseData.data?.id,
  })

  if (!response.ok || responseData.success === false || !responseData.data?.id) {
    throw new Error(responseData.text || responseData.message || "Failed to create order")
  }

  return {
    orderId: responseData.data.id,
    status: responseData.data.status,
  }
}

async function generateAppmaxPixPayment(pixData: any, accessToken: string) {
  console.log("[v0] Step 3: Generating PIX payment in Appmax...")

  const pixPayload = {
    cart: {
      order_id: pixData.orderId,
    },
    customer: {
      name: pixData.customer.name,
      email: pixData.customer.email,
      document: pixData.customer.cpf.replace(/\D/g, ""),
      telephone: pixData.customer.phone.replace(/\D/g, ""),
    },
    payment: {
      pix: {
        document_number: pixData.customer.cpf.replace(/\D/g, ""),
      },
    },
  }

  const response = await fetch("https://admin.appmax.com.br/api/v3/payment/pix", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access-token": accessToken,
    },
    body: JSON.stringify(pixPayload),
  })

  const responseData = await response.json()
  console.log("[v0] PIX payment response:", {
    status: response.status,
    success: responseData.success,
    hasQrCode: !!responseData.data?.pix_qrcode,
  })

  if (!response.ok || responseData.success === false) {
    throw new Error(responseData.text || responseData.message || "Failed to generate PIX payment")
  }

  return {
    pixQrCode: responseData.data.pix_qrcode,
    pixEmv: responseData.data.pix_emv,
  }
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

    console.log("[v0] Starting Appmax payment flow...")

    const customerId = await createAppmaxCustomer(
      {
        name: customer.name,
        email: customer.email,
        cpf: customer.cpf,
        phone: customer.phone,
        street: shipping.address,
        number: shipping.number,
        complement: shipping.complement,
        district: shipping.neighborhood,
        city: shipping.city,
        state: shipping.state,
        zipcode: shipping.cep,
      },
      process.env.APPMAX_API_KEY,
    )

    const orderData: any = {
      customerId,
      products: items.map((item) => ({
        sku: item.id,
        name: `${item.name} - ${item.color} (${item.petCount} pet${item.petCount > 1 ? "s" : ""})`,
        qty: item.quantity,
        price: item.price,
      })),
    }

    // Add payment info for credit card
    if (paymentMethod === "credit_card" && card) {
      const [expMonth, expYear] = card.expirationDate.split("/")
      orderData.payment = {
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

    const orderResult = await createAppmaxOrder(orderData, process.env.APPMAX_API_KEY)
    const appmaxOrderId = orderResult.orderId
    const orderStatus = orderResult.status

    let pixQrCode = null
    let pixEmv = null

    if (paymentMethod === "pix") {
      console.log("[v0] Payment method: PIX")
      const pixResult = await generateAppmaxPixPayment(
        {
          orderId: appmaxOrderId,
          customer: {
            name: customer.name,
            email: customer.email,
            cpf: customer.cpf,
            phone: customer.phone,
          },
        },
        process.env.APPMAX_API_KEY,
      )
      pixQrCode = pixResult.pixQrCode
      pixEmv = pixResult.pixEmv
      console.log("[v0] PIX payment generated successfully")
    }

    console.log("[v0] Appmax order created successfully:", {
      orderId: appmaxOrderId,
      status: orderStatus,
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
    console.log("[v0] Resultado da criação do pedido:", pedidoResult.success)

    // Preparar resposta de sucesso
    const response: any = {
      success: true,
      orderId: appmaxOrderId,
      status: orderStatus || "pending",
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
