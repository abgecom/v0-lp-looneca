import { PAGARME_CONFIG } from "./payment-constants"

// Get Pagar.me configuration from environment variables
export function getPagarmeConfig() {
  const apiKey = process.env.PAGARME_API_KEY
  const publicKey = process.env.PAGARME_PUBLIC_KEY
  const accountId = process.env.PAGARME_ACCOUNT_ID
  const planId = process.env.PETLOO_PLAN_ID

  if (!apiKey || !publicKey || !accountId) {
    throw new Error("Missing Pagar.me environment variables")
  }

  return {
    apiKey,
    publicKey,
    accountId,
    planId,
  }
}

// Create authorization header for Pagar.me API
export function createAuthHeader(apiKey: string): string {
  const credentials = Buffer.from(`${apiKey}:`).toString("base64")
  return `Basic ${credentials}`
}

// Create headers for Pagar.me API requests
export function createPagarmeHeaders(apiKey: string) {
  return {
    Authorization: createAuthHeader(apiKey),
    "Content-Type": "application/json",
    Accept: "application/json",
  }
}

// Make request to Pagar.me API
export async function pagarmeRequest(
  endpoint: string,
  options: {
    method: "GET" | "POST" | "PUT" | "DELETE"
    body?: any
    apiKey: string
  },
) {
  const url = `${PAGARME_CONFIG.BASE_URL}${endpoint}`
  const headers = createPagarmeHeaders(options.apiKey)

  const response = await fetch(url, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error(`Pagar.me API Error (${response.status}):`, errorData)
    throw new Error(`Pagar.me API Error: ${response.status}`)
  }

  return response.json()
}

// Format card number for logging (show only last 4 digits)
export function formatCardForLogging(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\s/g, "")
  if (cleanNumber.length < 4) return "****"
  return `****${cleanNumber.slice(-4)}`
}

// Validate customer data
export function validateCustomerData(customer: any): boolean {
  return !!(customer.name && customer.email && customer.document && customer.phones && customer.address)
}

// Validate card data
export function validateCardData(card: any): boolean {
  return !!(card.number && card.holder_name && card.exp_month && card.exp_year && card.cvv && card.billing_address)
}

// Calculate subscription start date (30 days from now)
export function calculateSubscriptionStartDate(): string {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + 30)
  return startDate.toISOString()
}

// Format phone number for Pagar.me
export function formatPhoneForPagarme(phone: string) {
  const cleanPhone = phone.replace(/\D/g, "")

  if (cleanPhone.length === 11) {
    return {
      country_code: "55",
      area_code: cleanPhone.slice(0, 2),
      number: cleanPhone.slice(2),
    }
  }

  if (cleanPhone.length === 10) {
    return {
      country_code: "55",
      area_code: cleanPhone.slice(0, 2),
      number: cleanPhone.slice(2),
    }
  }

  throw new Error("Invalid phone number format")
}

// Format document for Pagar.me
export function formatDocumentForPagarme(document: string) {
  const cleanDocument = document.replace(/\D/g, "")

  if (cleanDocument.length === 11) {
    return {
      type: "cpf",
      number: cleanDocument,
    }
  }

  if (cleanDocument.length === 14) {
    return {
      type: "cnpj",
      number: cleanDocument,
    }
  }

  throw new Error("Invalid document format")
}

// Format address for Pagar.me
export function formatAddressForPagarme(address: any) {
  return {
    line_1: `${address.number}, ${address.address}`,
    line_2: address.complement || "",
    zip_code: address.cep.replace(/\D/g, ""),
    city: address.city,
    state: address.state,
    country: "BR",
  }
}
