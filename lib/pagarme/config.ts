export const PAGARME_CONFIG = {
  apiKey: process.env.PAGARME_API_KEY || "",
  publicKey: process.env.PAGARME_PUBLIC_KEY || "",
  accountId: process.env.PAGARME_ACCOUNT_ID || "",
  planId: process.env.PETLOO_PLAN_ID || "",
  webhookSecret: process.env.PAGARME_WEBHOOK_SECRET || "",

  // Base URL for Pagar.me API
  baseUrl: "https://api.pagar.me/core/v5",

  // API Endpoints
  ENDPOINTS: {
    CUSTOMERS: "/customers",
    CARDS: "/cards", // This is a standalone endpoint, not nested
    ORDERS: "/orders",
    PLANS: "/plans",
    SUBSCRIPTIONS: "/subscriptions",
    WEBHOOKS: "/hooks",
  },

  // Subscription configuration
  subscription: {
    startAtDaysOffset: 30, // Start subscription 30 days after payment
    planName: "Plano Mensal Petloo",
    planAmount: 3090, // R$ 30,90
    planInterval: "month",
    planIntervalCount: 1,
    planBillingType: "prepaid",
    planDescription: "Assinatura mensal do aplicativo Petloo",
  },

  // Payment configuration
  payment: {
    defaultInstallments: 1,
    maxInstallments: 12,
    pixExpirationHours: 24,
  },

  // Logging configuration
  logging: {
    maskCardNumber: true,
    logPayloads: true,
    logResponses: true,
  },
}
