import crypto from "crypto"

/**
 * Meta Conversions API (CAPI) — envio de eventos server-side.
 *
 * Reenvia eventos para o Meta diretamente do servidor, complementando o Pixel
 * no navegador. A deduplicação é feita pelo Meta combinando `event_name` +
 * `event_id` (o mesmo `eventID` usado no Pixel client-side).
 *
 * Variáveis de ambiente necessárias (configurar na Vercel):
 *   - META_PIXEL_ID         → ID do Pixel (ex: 1650496555439267)
 *   - META_CAPI_ACCESS_TOKEN→ token gerado no Events Manager > Configurações
 *   - META_TEST_EVENT_CODE  → (opcional) código de teste do Events Manager
 */

const GRAPH_API_VERSION = "v21.0"

// Fallback para o Pixel ID já usado no client (components/facebook-pixel.tsx)
const PIXEL_ID = process.env.META_PIXEL_ID || "1650496555439267"
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || ""
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || ""

/** Normaliza e aplica SHA-256 (formato exigido pelo Meta para dados pessoais). */
function hash(value?: string | null): string | undefined {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (!normalized) return undefined
  return crypto.createHash("sha256").update(normalized).digest("hex")
}

/** Telefone: somente dígitos, com DDI, antes do hash. */
function hashPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined
  const digits = phone.replace(/\D/g, "")
  if (!digits) return undefined
  // Garante DDI do Brasil quando ausente (11 dígitos = DDD + número)
  const withCountry = digits.length <= 11 ? `55${digits}` : digits
  return crypto.createHash("sha256").update(withCountry).digest("hex")
}

export interface MetaUserData {
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  /** cookie _fbp (NÃO é hasheado) */
  fbp?: string | null
  /** cookie _fbc / fbclid (NÃO é hasheado) */
  fbc?: string | null
  clientIpAddress?: string | null
  clientUserAgent?: string | null
}

export interface SendMetaEventParams {
  eventName: string
  /** Mesmo eventID do Pixel client-side — usado para deduplicação. */
  eventId?: string
  eventSourceUrl?: string
  /** "website" para eventos do browser, "server" para webhooks/back-end. */
  actionSource?: "website" | "server"
  userData?: MetaUserData
  customData?: Record<string, unknown>
  eventTime?: number
}

/**
 * Envia um único evento para a Conversions API.
 * Não lança erro — falhas são logadas e retornadas (fire-and-forget seguro).
 */
export async function sendMetaEvent(params: SendMetaEventParams): Promise<{ success: boolean; error?: unknown }> {
  if (!ACCESS_TOKEN) {
    console.warn("[Meta CAPI] META_CAPI_ACCESS_TOKEN ausente — evento não enviado:", params.eventName)
    return { success: false, error: "missing_access_token" }
  }

  const ud = params.userData || {}

  const userData: Record<string, unknown> = {
    em: hash(ud.email),
    ph: hashPhone(ud.phone),
    fn: hash(ud.firstName),
    ln: hash(ud.lastName),
    ct: hash(ud.city),
    st: hash(ud.state),
    zp: hash(ud.zip ? ud.zip.replace(/\D/g, "") : undefined),
    fbp: ud.fbp || undefined,
    fbc: ud.fbc || undefined,
    client_ip_address: ud.clientIpAddress || undefined,
    client_user_agent: ud.clientUserAgent || undefined,
  }

  // Remove chaves undefined (o Meta rejeita valores nulos em alguns campos)
  Object.keys(userData).forEach((k) => userData[k] === undefined && delete userData[k])

  const eventData: Record<string, unknown> = {
    event_name: params.eventName,
    event_time: params.eventTime || Math.floor(Date.now() / 1000),
    action_source: params.actionSource || "website",
    user_data: userData,
  }

  if (params.eventId) eventData.event_id = params.eventId
  if (params.eventSourceUrl) eventData.event_source_url = params.eventSourceUrl
  if (params.customData) eventData.custom_data = params.customData

  const payload: Record<string, unknown> = { data: [eventData] }
  if (TEST_EVENT_CODE) payload.test_event_code = TEST_EVENT_CODE

  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      console.error("[Meta CAPI] Falha ao enviar evento:", params.eventName, res.status, detail)
      return { success: false, error: detail }
    }

    console.log("[Meta CAPI] Evento enviado:", params.eventName, "eventId:", params.eventId || "(sem id)")
    return { success: true }
  } catch (error) {
    console.error("[Meta CAPI] Erro de rede ao enviar evento:", params.eventName, error)
    return { success: false, error }
  }
}
