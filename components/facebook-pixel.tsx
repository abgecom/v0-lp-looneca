"use client"

import Script from "next/script"

// Definir o tipo para a função fbq global
declare global {
  interface Window {
    fbq: any
    _fbq: any
  }
}

const PIXEL_ID = "1650496555439267"

export default function FacebookPixel() {
  return (
    <>
      {/*
        Inicialização ÚNICA do Pixel (snippet padrão do Meta).
        Antes havia também um useEffect chamando init + PageView, o que causava
        PageView duplicado e redefinição de window.fbq. Removido.
      */}
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s){
              if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
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

export interface TrackUserData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  zip?: string
}

/**
 * Dispara um evento no Pixel (browser) e, quando há `eventID`, espelha o mesmo
 * evento para a Conversions API (server-side) via /api/meta/track.
 * A deduplicação no Meta é feita por event_name + event_id.
 */
export function trackFBEvent(event: string, params?: any, userData?: TrackUserData) {
  if (typeof window === "undefined") return

  // 1) Pixel no navegador
  if (window.fbq) {
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
