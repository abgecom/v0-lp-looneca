/**
 * Helpers do Google Analytics 4 / Google Ads (gtag.js nativo).
 *
 * O gtag.js é carregado no <head> do app/layout.tsx com:
 *   - GA4:        G-CX4GKGS2GP
 *   - Google Ads: AW-11487232709
 *
 * Estes utilitários disparam os eventos de e-commerce (funil) que antes eram
 * montados pelo GTM a partir do dataLayer.
 */

export const GA4_ID = "G-CX4GKGS2GP"
export const GOOGLE_ADS_ID = "AW-11487232709"
export const GOOGLE_ADS_PURCHASE_LABEL = "yTWuCMvFhpAZEMWFxeUq"

/** Converte itens do carrinho para o formato de itens do GA4. */
export function ga4Items(items: any[] | undefined): Array<Record<string, unknown>> {
  return (items || []).map((it) => ({
    item_id: it.id,
    item_name: it.name,
    price: it.price,
    quantity: it.quantity ?? 1,
  }))
}

/** Dispara um evento no gtag (GA4). Seguro em SSR / quando o gtag ainda não carregou. */
export function gtagEvent(name: string, params: Record<string, unknown>): void {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, params)
  }
}

/** Conversão de compra do Google Ads (mesma do container GTM removido). */
export function googleAdsPurchase(value: number, transactionId: string): void {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
      value,
      currency: "BRL",
      transaction_id: transactionId,
    })
  }
}
