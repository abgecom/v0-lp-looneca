export const PAGARME_CONFIG = {
  apiKey: process.env.PAGARME_API_KEY!,
  publicKey: process.env.PAGARME_PUBLIC_KEY!,
  accountId: process.env.PAGARME_ACCOUNT_ID!,
  planId: process.env.PETLOO_PLAN_ID!,
  webhookSecret: process.env.PAGARME_WEBHOOK_SECRET,
  baseUrl: "https://api.pagar.me/core/v5",

  // Plan configuration
  plan: {
    name: "Petloo Monthly Plan",
    amount: 3090, // R$ 30,90 in cents
    interval: "month" as const,
    billingType: "prepaid" as const,
    intervalCount: 1,
    paymentMethods: ["credit_card"] as const,
    installments: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },

  // Default subscription settings
  subscription: {
    startAtDaysOffset: 30, // Start subscription 30 days after payment
    billingType: "prepaid" as const,
  },

  // Payment settings
  payment: {
    currency: "BRL",
    defaultInstallments: 1,
    maxInstallments: 12,
  },
} as const

// Validation function
export function validatePagarmeConfig() {
  const required = ["apiKey", "publicKey", "accountId", "planId"]
  const missing = required.filter((key) => !PAGARME_CONFIG[key as keyof typeof PAGARME_CONFIG])

  if (missing.length > 0) {
    throw new Error(`Missing required Pagar.me environment variables: ${missing.join(", ")}`)
  }
}
