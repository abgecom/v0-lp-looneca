const DEFAULT_API_VERSION = "2025-01"

function getEnv(key: string, fallback?: string): string {
  const v = process.env[key]
  return v && v.length ? v : (fallback || "")
}

function getShopifyConfig() {
  const envStoreUrl = getEnv("SHOPIFY_STORE_URL") || getEnv("SHOPIFY_STORE")
  let baseUrl = envStoreUrl || "https://f1ef0b-3.myshopify.com"
  if (baseUrl && !/^https?:\/\//i.test(baseUrl)) {
    baseUrl = `https://${baseUrl}`
  }
  baseUrl = baseUrl.replace(/\/+$/g, "")
  const token = getEnv("SHOPIFY_ACCESS_TOKEN")
  const apiVersion = getEnv("SHOPIFY_API_VERSION", DEFAULT_API_VERSION)
  return { baseUrl, token, apiVersion }
}

async function shopifyRequest<T>(
  path: string,
  options: { method?: string; body?: any } = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const { baseUrl, token, apiVersion } = getShopifyConfig()
  if (!token) {
    console.error("[Shopify Payment Sync] SHOPIFY_ACCESS_TOKEN não configurado")
    return { ok: false, status: 500, data: {} as T }
  }
  const url = `${baseUrl}/admin/api/${apiVersion}${path}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": token,
  }
  const fetchOptions: RequestInit = {
    method: options.method || "GET",
    headers,
  }
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body)
  }
  console.log(`[Shopify Payment Sync] ${fetchOptions.method} ${url}`)
  const res = await fetch(url, fetchOptions)
  const data = (await res.json().catch(() => ({}))) as T
  return { ok: res.ok, status: res.status, data }
}

async function findShopifyOrderByPaymentId(
  pagarmeOrderId: string
): Promise<{ orderId: number; orderName: string } | null> {
  const searchResult = await shopifyRequest<{
    orders: Array<{
      id: number
      name: string
      financial_status: string
      note_attributes: Array<{ name: string; value: string }>
      tags: string
    }>
  }>(`/orders.json?financial_status=pending&status=any&limit=50&fields=id,name,financial_status,note_attributes,tags`)
  if (!searchResult.ok || !searchResult.data.orders) {
    console.error("[Shopify Payment Sync] Erro ao buscar pedidos:", searchResult.status)
    return null
  }
  const matchingOrder = searchResult.data.orders.find((order) => {
    const paymentIdAttr = order.note_attributes?.find(
      (attr) => attr.name === "ID Pagamento"
    )
    return paymentIdAttr?.value === pagarmeOrderId
  })
  if (!matchingOrder) {
    console.log(`[Shopify Payment Sync] Nenhum pedido Shopify encontrado para Pagar.me order: ${pagarmeOrderId}`)
    return null
  }
  console.log(`[Shopify Payment Sync] Pedido encontrado: ${matchingOrder.name} (ID: ${matchingOrder.id})`)
  return { orderId: matchingOrder.id, orderName: matchingOrder.name }
}

async function markShopifyOrderAsPaid(
  shopifyOrderId: number,
  amount: number,
  pagarmeOrderId: string
): Promise<boolean> {
  const transactionPayload = {
    transaction: {
      kind: "capture",
      status: "success",
      amount: amount.toFixed(2),
      currency: "BRL",
      gateway: "Pagar.me PIX",
      source: "external",
      authorization: pagarmeOrderId,
    },
  }
  const result = await shopifyRequest<{ transaction: any }>(
    `/orders/${shopifyOrderId}/transactions.json`,
    { method: "POST", body: transactionPayload }
  )
  if (!result.ok) {
    console.error(`[Shopify Payment Sync] Erro ao criar transaction para pedido ${shopifyOrderId}:`, result.status, result.data)
    return false
  }
  console.log(`[Shopify Payment Sync] ✅ Pedido ${shopifyOrderId} marcado como PAGO com sucesso`)
  return true
}

export interface SyncPixPaymentParams {
  pagarmeOrderId: string
  amount: number
  chargeId?: string
}

export async function syncPixPaymentToShopify(
  params: SyncPixPaymentParams
): Promise<{ success: boolean; shopifyOrderId?: number; error?: string }> {
  const { pagarmeOrderId, amount, chargeId } = params
  console.log("[Shopify Payment Sync] === INICIANDO SINCRONIZAÇÃO PIX → SHOPIFY ===")
  console.log("[Shopify Payment Sync] Pagar.me Order ID:", pagarmeOrderId)
  console.log("[Shopify Payment Sync] Charge ID:", chargeId || "N/A")
  console.log("[Shopify Payment Sync] Valor:", amount)
  const { token } = getShopifyConfig()
  if (!token) {
    console.warn("[Shopify Payment Sync] SHOPIFY_ACCESS_TOKEN não configurado. Pulando sync.")
    return { success: false, error: "SHOPIFY_ACCESS_TOKEN não configurado" }
  }
  try {
    const shopifyOrder = await findShopifyOrderByPaymentId(pagarmeOrderId)
    if (!shopifyOrder) {
      console.warn(`[Shopify Payment Sync] Pedido não encontrado na Shopify para: ${pagarmeOrderId}.`)
      return { success: false, error: "Pedido não encontrado na Shopify" }
    }
    const paymentMarked = await markShopifyOrderAsPaid(shopifyOrder.orderId, amount, pagarmeOrderId)
    if (!paymentMarked) {
      return { success: false, shopifyOrderId: shopifyOrder.orderId, error: "Falha ao criar transaction na Shopify" }
    }
    console.log("[Shopify Payment Sync] === SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO ===")
    return { success: true, shopifyOrderId: shopifyOrder.orderId }
  } catch (error) {
    console.error("[Shopify Payment Sync] Erro inesperado:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}
