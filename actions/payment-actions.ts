"use server"

import { createClient } from "@supabase/supabase-js"

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
  customer: {
    name: string
    email: string
    cpf: string
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
}

interface PaymentResponse {
  success: boolean
  paymentId?: string
  status?: string
  pixCode?: string
  pixQrCodeUrl?: string
  error?: string
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

    // Format amount to cents (Pagar.me requires amount in cents)
    const amountInCents = Math.round(request.amount * 100)

    // Common payment data
    const paymentData: any = {
      amount: amountInCents,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: request.customer.cpf.replace(/\D/g, ""),
        type: "individual",
      },
      payment: {
        payment_method: request.paymentMethod === "credit_card" ? "credit_card" : "pix",
      },
      metadata: {
        recurringAppPetloo: request.recurringProducts.appPetloo,
        recurringLoobook: request.recurringProducts.loobook,
      },
      shipping: {
        description: "Entrega padrão",
      },
    }

    // Add payment method specific data
    if (request.paymentMethod === "credit_card") {
      if (!request.card) {
        return { success: false, error: "Dados do cartão não fornecidos" }
      }

      // For credit card payments
      paymentData.payment.credit_card = {
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

      // If recurring products are selected, set up subscription
      if (request.recurringProducts.appPetloo || request.recurringProducts.loobook) {
        // In a real implementation, you would create a customer and subscription in Pagar.me
        // For now, we'll just add metadata to the payment
        paymentData.metadata.isRecurring = true
      }
    } else {
      // For PIX payments
      paymentData.payment.pix = {
        expires_in: 3600, // Expires in 1 hour
      }
    }

    // Make API request to Pagar.me
    const response = await fetch("https://api.pagar.me/core/v5/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ":").toString("base64")}`,
        "X-Account-Id": PAGARME_ACCOUNT_ID,
      },
      body: JSON.stringify(paymentData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Pagar.me API error:", errorData)
      return {
        success: false,
        error: errorData.message || "Erro ao processar pagamento. Verifique os dados e tente novamente.",
      }
    }

    const data = await response.json()

    // Handle response based on payment method
    if (request.paymentMethod === "credit_card") {
      return {
        success: true,
        paymentId: data.id,
        status: data.status,
      }
    } else {
      // For PIX payments, return the QR code and copy-paste code
      return {
        success: true,
        paymentId: data.id,
        status: data.status,
        pixCode: data.pix?.qr_code,
        pixQrCodeUrl: data.pix?.qr_code_url,
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

  if (request.paymentMethod === "credit_card") {
    // Simulate credit card payment
    return {
      success: true,
      paymentId,
      status: "paid",
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
    }
  }
}
