"use server"

import { createClient } from "@supabase/supabase-js"
import { createPetlooSubscription } from "./subscription-actions"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Pagar.me API keys - usando variáveis de ambiente de forma segura
const PAGARME_API_KEY = process.env.PAGARME_API_KEY!
const PAGARME_PUBLIC_KEY = process.env.PAGARME_PUBLIC_KEY!
const PAGARME_ACCOUNT_ID = process.env.PAGARME_ACCOUNT_ID!

interface PaymentRequest {
  paymentMethod: "credit_card" | "pix"
  amount: number
  installments: number
  quantity?: number // Quantidade de Loonecas
  petCount?: number // Número de pets em cada Looneca
  customer: {
    name: string
    email: string
    cpf: string
    phone?: string
  }
  card?: {
    number: string
    holderName: string
    expirationDate: string
    cvv: string
  }
  recurringProducts: {
    appPetloo: boolean
    loobook: boolean
  }
  // Adicionar o campo shipping opcional
  shipping?: {
    address?: string
    complement?: string
    cep?: string
    city?: string
    state?: string
  }
}

interface PaymentResponse {
  success: boolean
  paymentId?: string
  status?: string
  pixCode?: string
  pixQrCodeUrl?: string
  error?: string
  customerId?: string
  cardId?: string
}

export async function processPayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    // Verificar se as variáveis de ambiente estão definidas
    if (!PAGARME_API_KEY || !PAGARME_PUBLIC_KEY || !PAGARME_ACCOUNT_ID) {
      console.error("Pagar.me environment variables are not properly configured")
      return {
        success: false,
        error: "Configuração de pagamento incompleta. Entre em contato com o suporte.",
      }
    }

    // Obter a quantidade de Loonecas e pets do request
    const quantidadeDeLoonecas = Math.max(request.quantity || 1, 1) // Garantir que seja pelo menos 1
    const quantidadeDePets = Math.max(request.petCount || 1, 1) // Garantir que seja pelo menos 1

    // Usar o valor real do carrinho (já em reais) e converter para centavos
    const valorTotalEmCentavos = Math.round(request.amount * 100)

    // Calcular o preço unitário em centavos (por Looneca) baseado no valor real do carrinho
    const precoUnitarioEmCentavos = Math.round(valorTotalEmCentavos / quantidadeDeLoonecas)

    // Validar os valores calculados
    if (precoUnitarioEmCentavos < 1) {
      console.error("Erro de validação: unit_price não pode ser menor que 1")
      return { success: false, error: "Valor do produto inválido (menor que 1 centavo)" }
    }

    if (quantidadeDeLoonecas < 1) {
      console.error("Erro de validação: quantity não pode ser menor que 1")
      return { success: false, error: "Quantidade de produtos inválida (menor que 1)" }
    }

    // Verificar se o cliente selecionou produtos recorrentes
    const clienteSelecionouProdutosRecorrentes =
      request.recurringProducts.appPetloo || request.recurringProducts.loobook

    // Log para debug
    console.log(
      `Processando pagamento: ${quantidadeDePets} pets, ${quantidadeDeLoonecas} loonecas, valor total: R$ ${request.amount}, preço unitário: ${precoUnitarioEmCentavos} centavos, valor total em centavos: ${valorTotalEmCentavos}`,
    )
    console.log(`Cliente selecionou produtos recorrentes: ${clienteSelecionouProdutosRecorrentes}`)

    // Gerar um código único para o item
    const itemCode = `LOONECA-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Preparar o payload para o endpoint /orders
    const orderPayload: any = {
      items: [
        {
          name: "Looneca",
          quantity: quantidadeDeLoonecas,
          unit_price: precoUnitarioEmCentavos,
          description: `Looneca - ${quantidadeDePets} pets`,
          amount: valorTotalEmCentavos, // Usar o valor total real do carrinho
          code: itemCode,
        },
      ],
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: request.customer.cpf.replace(/\D/g, ""),
        type: "individual",
        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: request.customer.phone?.substring(1, 3) || "11",
            number: request.customer.phone?.replace(/\D/g, "").substring(2) || "999999999",
          },
        },
      },
      // Adicionar o campo billing com os mesmos dados do customer
      billing: {
        name: request.customer.name,
        address: {
          line_1: request.shipping?.address || "Endereço não informado",
          line_2: request.shipping?.complement || "",
          zip_code: request.shipping?.cep?.replace(/\D/g, "") || "00000000",
          city: request.shipping?.city || "São Paulo",
          state: request.shipping?.state || "SP",
          country: "BR",
        },
      },
      payments: [
        {
          payment_method: request.paymentMethod,
        },
      ],
      metadata: {
        recurringAppPetloo: request.recurringProducts.appPetloo,
        recurringLoobook: request.recurringProducts.loobook,
        quantidadeDePets: quantidadeDePets,
        quantidadeDeLoonecas: quantidadeDeLoonecas,
        valorOriginalReais: request.amount,
      },
    }

    // Adicionar dados específicos do método de pagamento
    if (request.paymentMethod === "credit_card") {
      if (!request.card) {
        return { success: false, error: "Dados do cartão não fornecidos" }
      }

      // Para pagamentos com cartão de crédito
      orderPayload.payments[0].credit_card = {
        installments: request.installments,
        statement_descriptor: "PETLOO",
        card: {
          number: request.card.number,
          holder_name: request.card.holderName,
          exp_month: request.card.expirationDate.split("/")[0],
          exp_year: `20${request.card.expirationDate.split("/")[1]}`,
          cvv: request.card.cvv,
        },
      }
    } else {
      // Para pagamentos PIX
      orderPayload.payments[0].pix = {
        expires_in: 3600, // Expira em 1 hora
      }
    }

    // Validar o payload antes de enviar
    console.log("Enviando payload para Pagar.me (orders):", JSON.stringify(orderPayload, null, 2))

    // Fazer requisição para a API da Pagar.me usando o endpoint /orders
    const response = await fetch("https://api.pagar.me/core/v5/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ":").toString("base64")}`,
        "X-Account-Id": PAGARME_ACCOUNT_ID,
      },
      body: JSON.stringify(orderPayload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Pagar.me API error (orders):", errorData)
      return {
        success: false,
        error: errorData.message || "Erro ao processar pagamento. Verifique os dados e tente novamente.",
      }
    }

    const data = await response.json()
    console.log("Resposta da API Pagar.me (orders):", JSON.stringify(data, null, 2))

    // Extrair os IDs necessários para a assinatura
    let customerId = ""
    let cardId = ""
    let paymentId = ""
    let paymentStatus = ""
    let pixCode = null
    let pixQrCodeUrl = null

    // Extrair o customerId da resposta
    if (data.customer && data.customer.id) {
      customerId = data.customer.id
      console.log(`Customer ID extraído: ${customerId}`)
    }

    // Extrair informações de pagamento
    if (data.charges && data.charges.length > 0) {
      const charge = data.charges[0]
      paymentId = charge.id
      paymentStatus = charge.status

      console.log(`Payment ID: ${paymentId}, Status: ${paymentStatus}`)

      // Extrair o cardId para pagamentos com cartão
      if (request.paymentMethod === "credit_card" && charge.last_transaction) {
        console.log("Last transaction:", JSON.stringify(charge.last_transaction, null, 2))

        if (charge.last_transaction.card && charge.last_transaction.card.id) {
          cardId = charge.last_transaction.card.id
          console.log(`Card ID extraído: ${cardId}`)
        } else {
          console.log("Card ID não encontrado na transação")
        }
      }

      // Extrair informações do PIX
      if (request.paymentMethod === "pix" && charge.last_transaction && charge.last_transaction.qr_code) {
        pixCode = charge.last_transaction.qr_code
        pixQrCodeUrl = charge.last_transaction.qr_code_url
      }
    }

    // Verificar se o pagamento foi bem-sucedido
    if (paymentStatus === "paid" || paymentStatus === "pending") {
      console.log(`Pagamento aprovado com status: ${paymentStatus}`)

      // Criar assinatura se o cliente selecionou produtos recorrentes
      if (clienteSelecionouProdutosRecorrentes) {
        console.log("Cliente selecionou produtos recorrentes, verificando condições para criar assinatura...")

        if (request.paymentMethod === "credit_card") {
          if (customerId && cardId) {
            console.log(`Criando assinatura com Customer ID: ${customerId} e Card ID: ${cardId}`)

            // Criar assinatura
            const assinatura = await createPetlooSubscription(customerId, cardId, supabase)

            if (!assinatura.success) {
              console.error("Falha ao criar assinatura Petloo:", assinatura.error)
              // Não interrompemos o fluxo do cliente, apenas logamos o erro
            } else {
              console.log("Assinatura criada com sucesso:", assinatura.subscriptionId)
            }
          } else {
            console.error(`Não foi possível criar assinatura - Customer ID: ${customerId}, Card ID: ${cardId}`)
          }
        } else {
          console.log("Pagamento via PIX - assinatura não pode ser criada automaticamente")
          // Para PIX, podemos implementar uma lógica diferente no futuro
        }
      } else {
        console.log("Cliente não selecionou produtos recorrentes - assinatura não será criada")
      }

      // Retornar a resposta apropriada com base no método de pagamento
      if (request.paymentMethod === "pix") {
        return {
          success: true,
          paymentId,
          status: paymentStatus,
          pixCode,
          pixQrCodeUrl,
          customerId,
          cardId,
        }
      } else {
        // Para pagamentos com cartão de crédito
        return {
          success: true,
          paymentId,
          status: paymentStatus,
          customerId,
          cardId,
        }
      }
    } else {
      return {
        success: false,
        error: "Pagamento não aprovado. Status: " + paymentStatus,
      }
    }
  } catch (error) {
    console.error("Payment processing error:", error)
    return {
      success: false,
      error: "Ocorreu um erro ao processar o pagamento. Tente novamente.",
    }
  }
}

// Mock implementation for development - usado apenas quando as variáveis de ambiente não estão disponíveis
export async function mockProcessPayment(request: PaymentRequest): Promise<PaymentResponse> {
  console.warn("Using mock payment processing - this should only be used in development")

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Generate a random payment ID
  const paymentId = `pay_${Math.random().toString(36).substring(2, 15)}`
  const customerId = `cus_${Math.random().toString(36).substring(2, 15)}`
  const cardId = `card_${Math.random().toString(36).substring(2, 15)}`

  // Verificar se o cliente selecionou produtos recorrentes
  const clienteSelecionouProdutosRecorrentes = request.recurringProducts.appPetloo || request.recurringProducts.loobook

  if (request.paymentMethod === "credit_card" && clienteSelecionouProdutosRecorrentes) {
    // Inicializar o cliente Supabase
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Criar assinatura apenas se o pagamento foi com cartão e o cliente selecionou produtos recorrentes
    const assinatura = await createPetlooSubscription(customerId, cardId, supabase)

    if (!assinatura.success) {
      console.error("Falha ao criar assinatura Petloo:", assinatura.error)
      // Não interrompemos o fluxo do cliente, apenas logamos o erro
    } else {
      console.log("Assinatura criada com sucesso:", assinatura.subscriptionId)
    }
  }

  if (request.paymentMethod === "credit_card") {
    // Simulate credit card payment
    return {
      success: true,
      paymentId,
      status: "paid",
      customerId,
      cardId,
    }
  } else {
    // Simulate PIX payment
    return {
      success: true,
      paymentId,
      status: "pending",
      pixCode:
        "00020101021226890014br.gov.bcb.pix2567pix.example.com/qr/v2/cobv/9d36b84f10394c4d82cb6c6a3861a3e04000053039865802BR5925PETLOO COMERCIO LTDA6009SAO PAULO62070503***6304E2CA",
      pixQrCodeUrl:
        "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020101021226890014br.gov.bcb.pix2567pix.example.com/qr/v2/cobv/9d36b84f10394c4d82cb6c6a3861a3e04000053039865802BR5925PETLOO%20COMERCIO%20LTDA6009SAO%20PAULO62070503***6304E2CA",
      customerId,
      cardId,
    }
  }
}
