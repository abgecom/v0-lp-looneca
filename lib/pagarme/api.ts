import { PAGARME_CONFIG } from "./config"

export interface PagarmeRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: any
  apiKey?: string
  headers?: Record<string, string>
}

/**
 * Makes authenticated requests to Pagar.me API
 */
export async function pagarmeRequest(endpoint: string, options: PagarmeRequestOptions = {}) {
  const { method = "GET", body, headers = {} } = options

  // Sempre ler a API key diretamente da env var no momento da chamada,
  // pois PAGARME_CONFIG.apiKey pode estar vazia se avaliada no momento da importação do módulo.
  const resolvedApiKey = options.apiKey || process.env.PAGARME_API_KEY || PAGARME_CONFIG.apiKey

  if (!resolvedApiKey) {
    console.error("[v0] PAGARME_API_KEY is not set. Check your environment variables.")
    return {
      success: false,
      error: "PAGARME_API_KEY is not configured. Please set it in your environment variables.",
      status: 500,
    }
  }

  try {
    // Prepare authentication
    const keyPrefix = resolvedApiKey.substring(0, 10)
    const keyLength = resolvedApiKey.length
    console.log(`[v0] pagarmeRequest auth debug: keyLength=${keyLength}, prefix="${keyPrefix}...", source=${options.apiKey ? "options" : process.env.PAGARME_API_KEY ? "env" : "config"}`)
    const auth = Buffer.from(`${resolvedApiKey}:`).toString("base64")

    // Prepare request headers - incluir account_id se disponível (necessário para contas marketplace)
    const accountId = process.env.PAGARME_ACCOUNT_ID || PAGARME_CONFIG.accountId
    const requestHeaders: Record<string, string> = {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    }

    // Adicionar account_id se disponível - algumas contas Pagar.me exigem este header
    if (accountId) {
      requestHeaders["account_id"] = accountId
      console.log(`[v0] Including account_id header: ${accountId.substring(0, 8)}...`)
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    }

    // Add body for POST/PUT requests
    if (body && (method === "POST" || method === "PUT")) {
      requestOptions.body = JSON.stringify(body)
    }

    // Make the request
    const url = `${PAGARME_CONFIG.baseUrl}${endpoint}`
    console.log(`Making Pagar.me API request: ${method} ${url}`)

    const response = await fetch(url, requestOptions)

    // Check if response is JSON
    const contentType = response.headers.get("content-type")
    const isJson = contentType && contentType.includes("application/json")

    let responseData
    if (isJson) {
      responseData = await response.json()
    } else {
      const text = await response.text()
      console.error("Non-JSON response from Pagar.me:", text.substring(0, 500))
      console.error("Status:", response.status, response.statusText)
      console.error("Headers:", Object.fromEntries(response.headers.entries()))

      return {
        success: false,
        error: `Invalid response format (${response.status}): ${text.substring(0, 100)}...`,
        status: response.status,
      }
    }

    // Log response for debugging (without sensitive data)
    console.log(`Pagar.me API response (${response.status}):`, {
      success: response.ok,
      endpoint,
      status: response.status,
      hasData: !!responseData,
    })

    if (!response.ok) {
      const errorMessage = responseData?.message || responseData?.error || "Unknown error"
      console.error("Pagar.me API Error:", {
        status: response.status,
        error: errorMessage,
        endpoint,
        data: responseData,
      })

      return {
        success: false,
        error: errorMessage,
        status: response.status,
        data: responseData,
      }
    }

    return {
      success: true,
      data: responseData,
      status: response.status,
    }
  } catch (error) {
    console.error("Pagar.me API Request Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}

/**
 * Helper function to format card number for logging (shows only last 4 digits)
 */
export function formatCardForLog(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) return "****"
  return `****${cardNumber.slice(-4)}`
}

/**
 * Helper function to format phone number for Pagar.me API
 */
export function formatPhoneForPagarme(phone: string) {
  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.length >= 10) {
    return {
      country_code: "55",
      area_code: cleaned.slice(0, 2),
      number: cleaned.slice(2),
    }
  }

  throw new Error("Invalid phone number format")
}

/**
 * Helper function to format document (CPF/CNPJ) for Pagar.me API
 */
export function formatDocumentForPagarme(document: string): string {
  return document.replace(/\D/g, "")
}

/**
 * Helper function to calculate subscription start date (30 days from now)
 */
export function calculateSubscriptionStartDate(): string {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + PAGARME_CONFIG.subscription.startAtDaysOffset)
  return startDate.toISOString()
}

/**
 * Helper function to validate required fields for customer creation
 */
export function validateCustomerData(customer: any): string[] {
  const errors: string[] = []

  if (!customer.name) errors.push("Name is required")
  if (!customer.email) errors.push("Email is required")
  if (!customer.document) errors.push("Document is required")

  return errors
}

/**
 * Helper function to validate required fields for card creation
 */
export function validateCardData(card: any): string[] {
  const errors: string[] = []

  if (!card.number) errors.push("Card number is required")
  if (!card.holder_name) errors.push("Holder name is required")
  if (!card.exp_month) errors.push("Expiration month is required")
  if (!card.exp_year) errors.push("Expiration year is required")
  if (!card.cvv) errors.push("CVV is required")

  return errors
}
