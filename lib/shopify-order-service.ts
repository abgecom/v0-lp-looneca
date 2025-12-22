type PaymentMethod = "credit_card" | "pix"

export interface CheckoutItem {
  id: string
  name: string
  color: string
  petCount: number
  quantity: number
  price: number
  imageSrc?: string
  productId?: number | string
  variantId: number | string
  sku?: string
  accessories?: string[]
  petPhotos?: string[]
  petBreeds?: string
  petNotes?: string
}

export interface CheckoutInput {
  customer: { name: string; email: string; phone: string; cpf: string }
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
  items: CheckoutItem[]
  recurringProducts?: { appPetloo?: boolean; loobook?: boolean }
  paymentMethod: PaymentMethod
  totalAmount: number
  installments?: number
  petPhotos?: string[]
  petTypeBreed?: string
  petNotes?: string
  paymentId?: string
  paymentStatus?: string
  dryRun?: boolean
}

const DEFAULT_API_VERSION = "2025-01"
const RATE_LIMIT_MS = 550

function getEnv(key: string, fallback?: string) {
  const v = process.env[key]
  return v && v.length ? v : fallback
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  const first_name = parts[0] || ""
  const last_name = parts.slice(1).join(" ") || ""
  return { first_name, last_name }
}

function normalizeDigits(value: string) {
  return (value || "").replace(/\D/g, "")
}

function determineFinancialStatus(method: PaymentMethod, status?: string) {
  const s = (status || "").toLowerCase()
  if (method === "pix") {
    if (["paid", "approved", "captured", "succeeded"].some((k) => s.includes(k))) return "paid"
    return "pending"
  }
  if (method === "credit_card") {
    if (["paid", "captured", "succeeded", "approved"].some((k) => s.includes(k))) return "paid"
    return "pending"
  }
  return "pending"
}

async function shopifyFetch<T>(
  path: string,
  init?: RequestInit & { baseUrl?: string; apiVersion?: string },
): Promise<{ ok: boolean; status: number; data: T; raw: Response }> {
  const apiVersion = init?.apiVersion || getEnv("SHOPIFY_API_VERSION", DEFAULT_API_VERSION) || DEFAULT_API_VERSION
  const envStoreUrl = getEnv("SHOPIFY_STORE_URL") || getEnv("SHOPIFY_STORE")
  let baseUrl = init?.baseUrl || envStoreUrl || `https://f1ef0b-3.myshopify.com`
  if (baseUrl && !/^https?:\/\//i.test(baseUrl)) {
    baseUrl = `https://${baseUrl}`
  }
  baseUrl = baseUrl.replace(/\/+$/g, "")
  const token = getEnv("SHOPIFY_ACCESS_TOKEN")

  if (!token) {
    console.error("[Shopify Service] SHOPIFY_ACCESS_TOKEN ausente")
    return {
      ok: false,
      status: 500,
      data: {} as T,
      raw: new Response(null),
    }
  }

  const url = `${baseUrl}/admin/api/${apiVersion}${path}`
  console.log("[Shopify Service] Request:", { method: init?.method || "GET", url })
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": token,
  }
  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers || {}) },
  })
  const data = (await res.json().catch(() => ({}))) as T
  return { ok: res.ok, status: res.status, data, raw: res }
}

async function findOrCreateCustomer(input: CheckoutInput) {
  const { customer } = input
  const query = `email:${customer.email}`
  console.log("[Shopify Service] Buscar cliente:", { email: customer.email })
  const search = await shopifyFetch<{
    customers: Array<{ id: number; email: string; phone?: string; first_name?: string; last_name?: string }>
  }>(`/customers/search.json?query=${encodeURIComponent(query)}`, { method: "GET" })
  if (!search.ok) {
    throw new Error(`SHOPIFY_CUSTOMER_SEARCH_FAILED:${search.status}`)
  }
  const found = search.data?.customers?.[0]
  if (found?.id) {
    console.log("[Shopify Service] Cliente encontrado:", { id: found.id, email: found.email })
    return found.id
  }
  const { first_name, last_name } = splitName(customer.name)
  await sleep(RATE_LIMIT_MS)
  console.log("[Shopify Service] Criar cliente:", { email: customer.email })
  const create = await shopifyFetch<{ customer: { id: number } }>(`/customers.json`, {
    method: "POST",
    body: JSON.stringify({
      customer: {
        first_name,
        last_name,
        email: customer.email,
        phone: customer.phone,
        verified_email: true,
        tags: "looneca,importado",
      },
    }),
  })
  if (!create.ok || !create.data?.customer?.id) {
    throw new Error(`SHOPIFY_CUSTOMER_CREATE_FAILED:${create.status}`)
  }
  console.log("[Shopify Service] Cliente criado:", { id: create.data.customer.id })
  return create.data.customer.id
}

async function setCustomerCPF(customerId: number, cpf: string) {
  const cleanCpf = normalizeDigits(cpf)
  console.log("[Shopify Service] Salvar CPF metafield:", { customerId, cpf: cleanCpf })
  await sleep(RATE_LIMIT_MS)
  const resp = await shopifyFetch<{ metafield: any }>(`/metafields.json`, {
    method: "POST",
    body: JSON.stringify({
      metafield: {
        namespace: "custom",
        key: "cpf",
        value: cleanCpf,
        type: "single_line_text_field",
        owner_id: customerId,
        owner_resource: "customer",
      },
    }),
  })
  if (!resp.ok) {
    throw new Error(`SHOPIFY_METAFIELD_SET_FAILED:${resp.status}`)
  }
  return true
}

function buildLineItemProperties(item: CheckoutItem, index: number, input: CheckoutInput) {
  const fallbackIndex = index === 0
  const fotos =
    (Array.isArray(item.petPhotos) && item.petPhotos.length ? item.petPhotos : undefined) ??
    (fallbackIndex ? input.petPhotos || [] : [])
  const racas =
    (item.petBreeds && item.petBreeds.length ? item.petBreeds : undefined) ??
    (fallbackIndex ? input.petTypeBreed || "" : "")
  const observacoes =
    (item.petNotes && item.petNotes.length ? item.petNotes : undefined) ??
    (fallbackIndex ? input.petNotes || "" : "")
  const properties = [
    { name: "Caneca", value: `Caneca ${index + 1}` },
    { name: "Pet Count", value: String(item.petCount) },
    { name: "Fotos", value: Array.isArray(fotos) ? fotos.join(", ") : "" },
    { name: "Raças", value: racas || "" },
    { name: "Observações", value: observacoes || "" },
  ]
  return properties
}

function buildOrderPayload(input: CheckoutInput, customerId: number) {
  const financial_status = determineFinancialStatus(input.paymentMethod, input.paymentStatus)
  const { first_name, last_name } = splitName(input.customer.name)
  const line_items = input.items.map((item, idx) => ({
    variant_id: Number(item.variantId),
    quantity: item.quantity,
    price: Number.isFinite(item.price) ? item.price.toFixed(2) : String(item.price),
    properties: buildLineItemProperties(item as CheckoutItem, idx, input),
  }))
  const shipping_address = {
    first_name,
    last_name,
    address1: `${input.shipping.address}, ${input.shipping.number}`,
    address2: input.shipping.complement || "",
    city: input.shipping.city,
    province: input.shipping.state,
    zip: normalizeDigits(input.shipping.cep),
    country: "BR",
    phone: input.customer.phone,
  }
  const shipping_lines = [
    {
      title: input.shipping.method,
      price: Number.isFinite(input.shipping.price) ? input.shipping.price.toFixed(2) : String(input.shipping.price),
    },
  ]
  const summaryRacas = input.items
    .map((item, i) => {
      const racas =
        ((item as CheckoutItem).petBreeds && (item as CheckoutItem).petBreeds!.length
          ? (item as CheckoutItem).petBreeds
          : undefined) ?? (i === 0 ? input.petTypeBreed || "Sem raça" : "Sem raça")
      return `Caneca ${i + 1}: ${racas || "Sem raça"}`
    })
    .join(" | ")
  const note_attributes = [
    { name: "CPF", value: input.customer.cpf },
    { name: "ID Pagamento", value: input.paymentId || "" },
    { name: "Método Pagamento", value: input.paymentMethod },
    { name: "Parcelas", value: String(input.installments || 1) },
    { name: "Total de Canecas", value: String(input.items.length) },
    { name: "Resumo Raças", value: summaryRacas },
  ]
  const tags = `looneca,supabase,importado,${input.paymentMethod}`
  const order = {
    email: input.customer.email,
    financial_status,
    line_items,
    customer: { id: customerId, email: input.customer.email, phone: input.customer.phone },
    shipping_address,
    shipping_lines,
    note_attributes,
    tags,
  }
  return { order }
}

export async function exportShopifyOrder(input: CheckoutInput) {
  if (!input?.customer?.email || !input?.customer?.cpf || !Array.isArray(input.items) || input.items.length === 0) {
    return { success: false, status: 400, error: "INVALID_INPUT" }
  }
  const hasToken = !!getEnv("SHOPIFY_ACCESS_TOKEN")
  if (!hasToken && !input.dryRun) {
    return { success: false, status: 500, error: "SHOPIFY_CONFIG_MISSING" }
  }
  const customerId = input.dryRun ? 0 : await findOrCreateCustomer(input)
  if (!input.dryRun) {
    await setCustomerCPF(customerId, input.customer.cpf)
    await sleep(RATE_LIMIT_MS)
  }
  const payload = buildOrderPayload(input, customerId)
  if (input.dryRun) {
    console.log("[Shopify Service] DryRun payload construído")
    return { success: true, dryRun: true, preview: payload }
  }
  console.log("[Shopify Service] Criar pedido na Shopify")
  const createOrder = await shopifyFetch<{ order: any }>(`/orders.json`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  if (!createOrder.ok || !createOrder.data?.order?.id) {
    const bodyText = await createOrder.raw.text().catch(() => "")
    return {
      success: false,
      status: createOrder.status,
      error: "SHOPIFY_ORDER_CREATE_FAILED",
      detail: bodyText || createOrder.data,
    }
  }
  const order = createOrder.data.order
  console.log("[Shopify Service] Pedido criado:", {
    id: order.id,
    number: order.order_number,
    name: order.name,
    financial_status: order.financial_status,
    line_items_count: Array.isArray(order.line_items) ? order.line_items.length : undefined,
  })
  return {
    success: true,
    orderId: order.id,
    shopifyOrderId: order.admin_graphql_api_id,
    orderNumber: order.order_number,
  }
}

