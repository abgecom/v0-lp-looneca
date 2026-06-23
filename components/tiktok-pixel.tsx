"use client"

import Script from "next/script"

declare global {
  interface Window {
    ttq?: any
    TiktokAnalyticsObject?: string
  }
}

/**
 * Pixel do TikTok (nativo), substituindo a tag que rodava no GTM removido.
 *
 * O ID do pixel é público (client-side), então vem de NEXT_PUBLIC_TIKTOK_PIXEL_ID.
 * Configure na Vercel: Settings → Environment Variables →
 *   NEXT_PUBLIC_TIKTOK_PIXEL_ID = <ID do pixel do TikTok>
 * Sem o ID, o componente não renderiza nada (TikTok fica inativo, sem erro).
 */
const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "C9BCUK3C77U63IDIED40"

export default function TikTokPixel() {
  if (!TIKTOK_PIXEL_ID) return null

  return (
    <Script id="tiktok-pixel" strategy="afterInteractive">
      {`
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
          ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
          ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
          for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
          ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
          ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var s=document.createElement("script");s.type="text/javascript",s.async=!0,s.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(s,a)};
          ttq.load('${TIKTOK_PIXEL_ID}');
          ttq.page();
        }(window, document, 'ttq');
      `}
    </Script>
  )
}

/** Dispara um evento no pixel do TikTok. Seguro em SSR / antes do carregamento. */
export function trackTikTokEvent(event: string, params?: Record<string, unknown>): void {
  if (typeof window !== "undefined" && window.ttq && typeof window.ttq.track === "function") {
    window.ttq.track(event, params || {})
  }
}
