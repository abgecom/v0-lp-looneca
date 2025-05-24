"use server"

import { INTEREST_RATES, PIX_RATE } from "@/lib/payment-constants"

export interface PaymentCard {
  number: string
  holderName: string
  expirationDate: string
  cvv: string
}

export interface PaymentData {
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

export interface PaymentResponse {
  success: boolean
  orderId?: string
  status?: string
  finalAmount?: number
  originalAmount?: number
  interestAmount?: number
  paymentMethod?: string
  pixCode?: string
  pixQrCodeUrl?: string
  installments?: number
  installmentAmount?: number
  error?: string
}

export async function processPayment(data: PaymentData): Promise<PaymentResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    return result
  } catch (error) {
    console.error("Error processing payment:", error)
    return {
      success: false,
      error: "Erro ao processar pagamento. Tente novamente.",
    }
  }
}

export async function calculatePaymentAmount(
  originalAmount: number,
  paymentMethod: "credit_card" | "pix",
  installments = 1,
) {
  let rate = 0

  if (paymentMethod === "pix") {
    rate = PIX_RATE
  } else if (paymentMethod === "credit_card") {
    rate = INTEREST_RATES[installments as keyof typeof INTEREST_RATES] || INTEREST_RATES[1]
  }

  const finalAmount = originalAmount * (1 + rate)
  const interestAmount = finalAmount - originalAmount

  return {
    originalAmount,
    finalAmount: Math.round(finalAmount * 100) / 100,
    interestAmount: Math.round(interestAmount * 100) / 100,
    rate: rate * 100, // Retorna em porcentagem
    installmentAmount:
      paymentMethod === "credit_card" ? Math.round((finalAmount / installments) * 100) / 100 : finalAmount,
  }
}
