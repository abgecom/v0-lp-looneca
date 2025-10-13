// Pagar.me API Configuration
export const PAGARME_CONFIG = {
  // API Keys from environment variables
  apiKey: process.env.PAGARME_API_KEY || "",
  publicKey: process.env.PAGARME_PUBLIC_KEY || "",
  accountId: process.env.PAGARME_ACCOUNT_ID || "",
  webhookSecret: process.env.PAGARME_WEBHOOK_SECRET || "",

  // Base URL for Pagar.me API v5
  baseUrl: "https://api.pagar.me/core/v5",

  // API Endpoints
  ENDPOINTS: {
    CUSTOMERS: "/customers",
    CARDS: "/cards",
    ORDERS: "/orders",
    PLANS: "/plans",
    SUBSCRIPTIONS: "/subscriptions",
    CHARGES: "/charges",
  },

  features: {
    subscriptionsEnabled: false, // Set to true to re-enable subscription creation
  },

  // Subscription configuration
  subscription: {
    planId: process.env.PETLOO_PLAN_ID || "",
    startAtDaysOffset: 30, // Start subscription 30 days after payment
    billingType: "prepaid",
    interval: "month",
    intervalCount: 1,
  },

  // Payment configuration
  payment: {
    defaultCurrency: "BRL",
    pixExpirationTime: 3600, // 1 hour in seconds
  },
}
