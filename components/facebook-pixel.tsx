"use client"

/**
 * Helpers do Meta Pixel (client-side).
 *
 * A INICIALIZAÇÃO do Pixel (init + PageView) fica direta no <head> do
 * app/layout.tsx — assim o PageView dispara o quanto antes e o Meta conta a
 * "Visualização de página de destino" (Landing Page View). Este arquivo contém
 * apenas os utilitários para disparar eventos adicionais e espelhar na CAPI.
 */

// Definir o tipo para a função fbq global
declare global {
  interface Window {
    fbq: any
    _fbq: any
    gtag?: (...args: any[]) => void
  }
}

/** Lê um cookie pelo nome (client-side). */
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? match[2] : undefined
}

/**
 * Retorna o _fbc apenas se ainda for válido (clique há menos de 90 dias).
 * Formato: fb.<idx>.<creationTimeMs>.<fbclid>. Evita enviar fbclid expirado.
 */
export function getFreshFbc(): string | undefined {
  const fbc = getCookie("_fbc")
  if (!fbc) return undefined
  const parts = fbc.split(".")
  if (parts.length < 4 || parts[0] !== "fb") return undefined
  const creationTime = Number(parts[2])
  if (!Number.isFinite(creationTime) || creationTime <= 0) return undefined
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000
  if (Date.now() - creationTime > NINETY_DAYS) return undefined
  return fbc
}

const PIXEL_ID = "1650496555439267"

export interface TrackUserData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  zip?: string
  /** identificador estável do cliente/pedido (melhora o match quality) */
  externalId?: string
}

/**
 * Atualiza o Advanced Matching do Pixel no navegador com os dados do cliente.
 * Isso faz os eventos do browser carregarem em/ph/fn/ln/ct/st/zp/country —
 * elevando a pontuação de correspondência (Event Match Quality) no Meta.
 * O SDK do Pixel faz o hashing SHA-256 automaticamente.
 */
function setAdvancedMatching(userData?: TrackUserData) {
  if (!userData || !window.fbq) return
  const am: Record<string, string> = { country: "br" }
  if (userData.email) am.em = userData.email
  if (userData.phone) am.ph = userData.phone
  if (userData.firstName) am.fn = userData.firstName
  if (userData.lastName) am.ln = userData.lastName
  if (userData.city) am.ct = userData.city
  if (userData.state) am.st = userData.state
  if (userData.zip) am.zp = userData.zip
  if (userData.externalId) am.external_id = userData.externalId
  // Re-inicializar com os dados atualiza o Advanced Matching (o Meta deduplica o init)
  window.fbq("init", PIXEL_ID, am)
}

/**
 * Dispara um evento no Pixel (browser) e, quando há `eventID`, espelha o mesmo
 * evento para a Conversions API (server-side) via /api/meta/track.
 * A deduplicação no Meta é feita por event_name + event_id.
 */
export function trackFBEvent(event: string, params?: any, userData?: TrackUserData) {
  if (typeof window === "undefined") return

  // 1) Pixel no navegador (com Advanced Matching quando há dados do cliente)
  if (window.fbq) {
    setAdvancedMatching(userData)
    window.fbq("track", event, params)
  }

  // 2) Conversions API (apenas quando temos eventID para deduplicar)
  const eventId = params?.eventID
  if (!eventId) return

  try {
    const { eventID, ...customData } = params || {}
    fetch("/api/meta/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventName: event,
        eventId,
        eventSourceUrl: window.location.href,
        customData,
        userData: {
          ...userData,
          country: "br",
          fbp: getCookie("_fbp"),
          fbc: getFreshFbc(),
        },
      }),
    }).catch(() => {
      /* fire-and-forget: falha no CAPI não afeta o checkout */
    })
  } catch {
    /* noop */
  }
}
