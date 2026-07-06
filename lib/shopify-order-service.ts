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
  angelWingsPets?: ("pet1" | "pet2")[]
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
  recurringProducts?: { appPetloo?: boolean; looTag?: boolean; loobook?: boolean }
  paymentMethod: PaymentMethod
  totalAmount: number
  installments?: number
  petPhotos?: string[]
  petTypeBreed?: string
  petNotes?: string
  paymentId?: string
  paymentStatus?: string
  dryRun?: boolean
  dispositivo_os?: string | null
}

const DEFAULT_API_VERSION = "2025-01"
const RATE_LIMIT_MS = 550
import { ACCESSORY_PRICE, getAccessoryName } from "@/lib/accessories"
import { LOOTAG_PRICE, LOOTAG_NAME } from "@/lib/payment-utils"

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

async function getCustomerMetafields(customerId: number) {
  const resp = await shopifyFetch<{ metafields: Array<{ namespace: string; key: string; value: string }> }>(
    `/customers/${customerId}/metafields.json`,
    { method: "GET" },
  )
  return resp
}

async function verifyCustomerCPF(customerId: number, expectedCpf: string) {
  await sleep(RATE_LIMIT_MS)
  const resp = await getCustomerMetafields(customerId)
  if (resp.ok) {
    const cpfMf = resp.data.metafields?.find((m) => m.namespace === "custom" && m.key === "cpf")
    console.log("[Shopify Service] Verificar CPF:", { customerId, saved: cpfMf?.value, expected: normalizeDigits(expectedCpf) })
  } else {
    console.log("[Shopify Service] Verificar CPF falhou:", { status: resp.status })
  }
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
  const accessoryIds = Array.isArray(item.accessories) ? item.accessories : []
  const accessoryCount = accessoryIds.length
  const accessoryNames = accessoryIds.map((id) => getAccessoryName(id))

  const properties = [
    { name: "Caneca", value: `Caneca ${index + 1}` },
    { name: "Pet Count", value: String(item.petCount) },
    { name: "Fotos", value: Array.isArray(fotos) ? fotos.join(", ") : "" },
    { name: "Raças", value: racas || "" },
    { name: "Observações", value: observacoes || "" },
    { name: "Acessórios", value: accessoryIds.join(", ") || "" },
    { name: "Acessórios Nomes", value: accessoryNames.join(", ") || "" },
    { name: "Acessórios Quantidade", value: String(accessoryCount) },
    { name: "Acessórios Total (R$)", value: (accessoryCount * ACCESSORY_PRICE).toFixed(2) },
  ]

  // Add angel wings pet assignment if applicable
  const angelWingsPets = Array.isArray(item.angelWingsPets) ? item.angelWingsPets : []
  if (angelWingsPets.length > 0 && accessoryIds.includes("angel-wings")) {
    const label = angelWingsPets.length === 2
      ? "Ambos os pets (Pet 1 e Pet 2)"
      : angelWingsPets[0] === "pet1"
        ? "Pet 1"
        : "Pet 2"
    properties.push({ name: "Asas de Anjo - Pet(s)", value: label })
  }
  return properties
}

function buildOrderPayload(input: CheckoutInput, customerId: number) {
  const financial_status = determineFinancialStatus(input.paymentMethod, input.paymentStatus)
  const { first_name, last_name } = splitName(input.customer.name)
  const line_items: any[] = input.items.map((item, idx) => ({
    variant_id: Number(item.variantId),
    quantity: item.quantity,
    price: (() => {
      const accCount = Array.isArray(item.accessories) ? item.accessories.length : 0
      const perUnitAccessory = accCount * ACCESSORY_PRICE
      const adjusted = Number(item.price) + perUnitAccessory
      return Number.isFinite(adjusted) ? adjusted.toFixed(2) : String(adjusted)
    })(),
    properties: buildLineItemProperties(item as CheckoutItem, idx, input),
  }))

  // LooTag é cobrada no checkout (Pagar.me) mas não tinha item correspondente no pedido
  // Shopify, o que deixava o valor do pedido menor que o efetivamente cobrado.
  // Usa a variante Crossell (R$49,90) do produto "Tag Rastreamento Petloo" já cadastrado
  // na Shopify — assim o pedido mantém rastreio de estoque/catálogo. SHOPIFY_LOOTAG_VARIANT_ID
  // permite trocar a variante sem alterar código, caso o produto seja recriado.
  if (input.recurringProducts?.looTag) {
    const tagVariantId = getEnv("SHOPIFY_LOOTAG_VARIANT_ID", "54953762947394")
    line_items.push(
      tagVariantId
        ? { variant_id: Number(tagVariantId), quantity: 1, price: LOOTAG_PRICE.toFixed(2) }
        : {
            title: LOOTAG_NAME,
            quantity: 1,
            price: LOOTAG_PRICE.toFixed(2),
            requires_shipping: false,
            taxable: false,
          },
    )
  }
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
  const totalMugs = input.items.reduce((sum, it) => sum + (Number((it as CheckoutItem).quantity) || 0), 0)
  const note_attributes = [
    { name: "CPF", value: input.customer.cpf },
    { name: "ID Pagamento", value: input.paymentId || "" },
    { name: "Método Pagamento", value: input.paymentMethod },
    { name: "Parcelas", value: String(input.installments || 1) },
    { name: "Total de Canecas", value: String(totalMugs) },
    { name: "Resumo Raças", value: summaryRacas },
    { name: "LooTag (cobrada)", value: input.recurringProducts?.looTag ? "Sim" : "Não" },
    { name: "LooApp (assinatura)", value: input.recurringProducts?.appPetloo ? "Sim" : "Não" },
    { name: "Dispositivo", value: input.dispositivo_os || "" },
  ]

  // Add angel wings summary to note_attributes if any item has it
  const angelWingsItems = input.items
    .map((item, i) => {
      const ci = item as CheckoutItem
      if (Array.isArray(ci.angelWingsPets) && ci.angelWingsPets.length > 0 && ci.accessories?.includes("angel-wings")) {
        const label = ci.angelWingsPets.length === 2
          ? "Ambos os pets"
          : ci.angelWingsPets[0] === "pet1" ? "Pet 1" : "Pet 2"
        return `Caneca ${i + 1}: ${label}`
      }
      return null
    })
    .filter(Boolean)
  if (angelWingsItems.length > 0) {
    note_attributes.push({ name: "Asas de Anjo", value: angelWingsItems.join(" | ") })
  }
  const tagParts = [`looneca`, `supabase`, `importado`, input.paymentMethod]
  if (input.recurringProducts?.looTag) {
    tagParts.push("tag-rastreamento", "lootag-cobrada")
  }
  if (input.recurringProducts?.appPetloo) {
    tagParts.push("app-petloo", "app-petloo-sim")
  }
  const tags = tagParts.join(",")
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
    await verifyCustomerCPF(customerId, input.customer.cpf)
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

// ============================================================
// Upsell pós-compra (segunda Looneca, 50% off)
// ============================================================
// Tenta anexar o item de upsell ao pedido Shopify original via Order Edit
// (GraphQL). Se não houver GID do pedido original ou a mutação falhar,
// cria um pedido Shopify separado como fallback — a venda nunca é bloqueada
// por uma falha na integração Shopify.

async function shopifyGraphQLFetch<T>(
  query: string,
  variables: Record<string, any>,
): Promise<{ ok: boolean; data?: T; errors?: any[] }> {
  const apiVersion = getEnv("SHOPIFY_API_VERSION", DEFAULT_API_VERSION) || DEFAULT_API_VERSION
  let baseUrl = getEnv("SHOPIFY_STORE_URL") || getEnv("SHOPIFY_STORE") || `https://f1ef0b-3.myshopify.com`
  if (baseUrl && !/^https?:\/\//i.test(baseUrl)) baseUrl = `https://${baseUrl}`
  baseUrl = baseUrl.replace(/\/+$/g, "")
  const token = getEnv("SHOPIFY_ACCESS_TOKEN")

  if (!token) {
    console.error("[Shopify Service] SHOPIFY_ACCESS_TOKEN ausente (GraphQL)")
    return { ok: false, errors: [{ message: "SHOPIFY_ACCESS_TOKEN ausente" }] }
  }

  const res = await fetch(`${baseUrl}/admin/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok || json.errors) {
    console.error("[Shopify Service] Erro GraphQL:", { status: res.status, errors: json.errors })
    return { ok: false, errors: json.errors }
  }

  return { ok: true, data: json.data as T }
}

interface UpsellShopifyParams {
  originalShopifyOrderId: string | null // GID GraphQL, ex: gid://shopify/Order/123
  originalPedidoNumero: number
  customer: { name: string; email: string; phone: string }
  title: string
  price: number // em reais
  quantity: number
  properties?: Array<{ name: string; value: string }>
}

/**
 * Anexa o item de upsell ao pedido Shopify original via Order Edit.
 * Usa orderEditAddCustomItem (não orderEditAddVariant) porque o preço é o
 * de 50% off, diferente do preço de catálogo da variante.
 */
async function appendUpsellLineItemToOrder(
  params: UpsellShopifyParams,
): Promise<{ success: boolean; error?: string }> {
  const { originalShopifyOrderId, title, price, quantity, properties } = params

  if (!originalShopifyOrderId) {
    return { success: false, error: "Pedido original sem shopify_order_id" }
  }

  const beginResult = await shopifyGraphQLFetch<{
    orderEditBegin: { calculatedOrder?: { id: string }; userErrors: Array<{ message: string }> }
  }>(
    `mutation orderEditBegin($id: ID!) {
      orderEditBegin(id: $id) {
        calculatedOrder { id }
        userErrors { field message }
      }
    }`,
    { id: originalShopifyOrderId },
  )

  const calculatedOrderId = beginResult.data?.orderEditBegin?.calculatedOrder?.id
  const beginErrors = beginResult.data?.orderEditBegin?.userErrors
  if (!beginResult.ok || !calculatedOrderId || (beginErrors && beginErrors.length > 0)) {
    return { success: false, error: `orderEditBegin falhou: ${JSON.stringify(beginErrors || beginResult.errors)}` }
  }

  await sleep(RATE_LIMIT_MS)

  const addItemResult = await shopifyGraphQLFetch<{
    orderEditAddCustomItem: { calculatedOrder?: { id: string }; userErrors: Array<{ message: string }> }
  }>(
    `mutation orderEditAddCustomItem($id: ID!, $title: String!, $price: MoneyInput!, $quantity: Int!) {
      orderEditAddCustomItem(id: $id, title: $title, price: $price, quantity: $quantity) {
        calculatedOrder { id }
        userErrors { field message }
      }
    }`,
    {
      id: calculatedOrderId,
      title,
      price: { amount: price.toFixed(2), currencyCode: "BRL" },
      quantity,
    },
  )

  const addItemErrors = addItemResult.data?.orderEditAddCustomItem?.userErrors
  if (!addItemResult.ok || (addItemErrors && addItemErrors.length > 0)) {
    return { success: false, error: `orderEditAddCustomItem falhou: ${JSON.stringify(addItemErrors || addItemResult.errors)}` }
  }

  await sleep(RATE_LIMIT_MS)

  const commitResult = await shopifyGraphQLFetch<{
    orderEditCommit: { order?: { id: string }; userErrors: Array<{ message: string }> }
  }>(
    `mutation orderEditCommit($id: ID!, $notifyCustomer: Boolean, $staffNote: String) {
      orderEditCommit(id: $id, notifyCustomer: $notifyCustomer, staffNote: $staffNote) {
        order { id name }
        userErrors { field message }
      }
    }`,
    {
      id: calculatedOrderId,
      notifyCustomer: false,
      // orderEditAddCustomItem não aceita "properties" (isso é um recurso só do line
      // item REST) — guardamos a personalização no staffNote para não perder a
      // informação quando o upsell é anexado ao pedido original via Order Edit.
      staffNote: [
        `Upsell pós-compra: ${title} (pedido original #${params.originalPedidoNumero})`,
        ...(properties || []).map((p) => `${p.name}: ${p.value}`),
      ].join(" | "),
    },
  )

  const commitErrors = commitResult.data?.orderEditCommit?.userErrors
  if (!commitResult.ok || !commitResult.data?.orderEditCommit?.order || (commitErrors && commitErrors.length > 0)) {
    return { success: false, error: `orderEditCommit falhou: ${JSON.stringify(commitErrors || commitResult.errors)}` }
  }

  return { success: true }
}

/**
 * Fallback: cria um pedido Shopify separado para o item de upsell, tagueado
 * e anotado com o número do pedido original. Usado quando o pedido original
 * não tem shopify_order_id (pedidos antigos) ou o Order Edit falha.
 */
async function createFallbackUpsellOrder(
  params: UpsellShopifyParams,
): Promise<{ success: boolean; shopifyOrderId?: string; error?: string }> {
  const { customer, originalPedidoNumero, title, price, quantity, properties } = params

  const { first_name, last_name } = splitName(customer.name)
  const order = {
    email: customer.email,
    financial_status: "paid",
    line_items: [
      {
        title,
        quantity,
        price: price.toFixed(2),
        properties: properties || [],
      },
    ],
    customer: { first_name, last_name, email: customer.email, phone: customer.phone },
    note_attributes: [{ name: "Pedido Original", value: String(originalPedidoNumero) }],
    tags: `looneca,upsell,linked-to-${originalPedidoNumero}`,
  }

  const createOrder = await shopifyFetch<{ order: any }>(`/orders.json`, {
    method: "POST",
    body: JSON.stringify({ order }),
  })

  if (!createOrder.ok || !createOrder.data?.order?.id) {
    const bodyText = await createOrder.raw.text().catch(() => "")
    return { success: false, error: bodyText || "SHOPIFY_FALLBACK_ORDER_CREATE_FAILED" }
  }

  return { success: true, shopifyOrderId: createOrder.data.order.admin_graphql_api_id }
}

/**
 * Ponto de entrada único usado pelo fluxo de cobrança do upsell: tenta o
 * Order Edit no pedido original; se não for possível, cria o pedido
 * separado como fallback. Nunca lança erro — a venda já foi cobrada na
 * Pagar.me antes disso, então uma falha aqui não pode bloquear o fluxo.
 */
export async function attachUpsellToShopify(
  params: UpsellShopifyParams,
): Promise<{ success: boolean; shopifyOrderId?: string; method: "order_edit" | "fallback_order"; error?: string }> {
  try {
    if (params.originalShopifyOrderId) {
      const editResult = await appendUpsellLineItemToOrder(params)
      if (editResult.success) {
        return { success: true, shopifyOrderId: params.originalShopifyOrderId, method: "order_edit" }
      }
      console.error("[Shopify Service] Order Edit falhou, usando fallback:", editResult.error)
    }

    const fallbackResult = await createFallbackUpsellOrder(params)
    return {
      success: fallbackResult.success,
      shopifyOrderId: fallbackResult.shopifyOrderId,
      method: "fallback_order",
      error: fallbackResult.error,
    }
  } catch (error) {
    return {
      success: false,
      method: "fallback_order",
      error: error instanceof Error ? error.message : "Erro desconhecido na integração Shopify do upsell",
    }
  }
}
