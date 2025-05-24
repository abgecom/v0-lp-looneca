// Pagar.me API Configuration
export const PAGARME_CONFIG = {
  BASE_URL: "https://api.pagar.me/core/v5",
  ENDPOINTS: {
    CUSTOMERS: "/customers",
    ORDERS: "/orders",
    PLANS: "/plans",
    SUBSCRIPTIONS: "/subscriptions",
  },
} as const

// Payment constants
export const PAYMENT_CONSTANTS = {
  PLAN: {
    AMOUNT: 3090, // R$ 30,90 in cents
    INTERVAL: "month",
    BILLING_TYPE: "prepaid",
    NAME: "Plano Petloo Mensal",
    DESCRIPTION: "Acesso ao App Petloo e Loobook Digital",
  },
  SUBSCRIPTION: {
    START_DELAY_DAYS: 30, // Subscription starts 30 days after payment
  },
} as const

// Error messages
export const PAYMENT_ERRORS = {
  MISSING_ENV_VARS: "Variáveis de ambiente da Pagar.me não configuradas",
  INVALID_CUSTOMER_DATA: "Dados do cliente inválidos",
  INVALID_CARD_DATA: "Dados do cartão inválidos",
  CUSTOMER_CREATION_FAILED: "Falha ao criar cliente",
  CARD_CREATION_FAILED: "Falha ao criar cartão",
  ORDER_CREATION_FAILED: "Falha ao criar pedido",
  PLAN_CREATION_FAILED: "Falha ao criar plano",
  SUBSCRIPTION_CREATION_FAILED: "Falha ao criar assinatura",
  PAYMENT_PROCESSING_FAILED: "Falha ao processar pagamento",
} as const
