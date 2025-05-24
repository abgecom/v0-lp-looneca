// Taxas de juros para cartão de crédito
export const INTEREST_RATES = {
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

// Taxa para PIX
export const PIX_RATE = 0.0119 // 1.19%

// Função para formatar valor monetário
export function formatCurrency(value: number): string {
  return value.toFixed(2).replace(".", ",")
}

// Função para obter a taxa de juros
export function getInterestRate(paymentMethod: "credit_card" | "pix", installments = 1): number {
  if (paymentMethod === "pix") {
    return PIX_RATE
  }

  if (paymentMethod === "credit_card") {
    return INTEREST_RATES[installments as keyof typeof INTEREST_RATES] || INTEREST_RATES[1]
  }

  return 0
}

// Função para calcular valores de pagamento (versão client-side)
export function calculatePaymentAmount(originalAmount: number, paymentMethod: "credit_card" | "pix", installments = 1) {
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
