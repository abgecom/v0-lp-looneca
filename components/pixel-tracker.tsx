"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { trackFBEvent, getFreshFbc } from "@/components/facebook-pixel"

/** Lê um cookie pelo nome (client-side). */
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? match[2] : undefined
}

/**
 * Rastreamento de PageView com cobertura server-side (Conversions API).
 *
 * - 1º carregamento: o PageView do navegador já foi disparado no <head> (rápido,
 *   para a Landing Page View) com um eventID em `window.__fbPvEventId`. Aqui
 *   apenas espelhamos esse MESMO evento para a CAPI (dedup por event_id).
 * - Navegações SPA (troca de rota via Next router): o snippet do <head> não
 *   refaz PageView, então disparamos aqui (navegador + CAPI) com um novo eventID.
 */
export default function PixelTracker() {
  const pathname = usePathname()
  const isFirstLoad = useRef(true)

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false

      // Espelha o PageView inicial (disparado no <head>) para a CAPI
      const eventId = (window as any).__fbPvEventId as string | undefined
      if (eventId) {
        fetch("/api/meta/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            eventName: "PageView",
            eventId,
            eventSourceUrl: window.location.href,
            userData: {
              fbp: getCookie("_fbp"),
              fbc: getFreshFbc(),
            },
          }),
        }).catch(() => {
          /* fire-and-forget */
        })
      }
      return
    }

    // Navegação client-side: novo PageView (navegador + CAPI deduplicados)
    trackFBEvent("PageView", {
      eventID: `pv.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`,
    })
  }, [pathname])

  return null
}
