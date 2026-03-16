"use client"

import { sendGAEvent } from "@next/third-parties/google"

export function trackPageView(url: string) {
  if (typeof window !== "undefined") {
    sendGAEvent({ event: "page_view", page_path: url })
  }
}

export function trackPurchase(transactionId: string, value: number) {
  if (typeof window !== "undefined") {
    sendGAEvent({
      event: "purchase",
      transaction_id: transactionId,
      value: value,
      currency: "BRL",
    })
  }
}
