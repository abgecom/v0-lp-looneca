// Taxas de juros para cartão de crédito
export const INTEREST_RATES = {
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

// Taxa para PIX (sem juros)
export const PIX_RATE = 0.0 // 0% para PIX

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
    return INTEREST_RATES[installments as keyof typeof INTEREST_RATES] || 0
  }

  return 0
}
