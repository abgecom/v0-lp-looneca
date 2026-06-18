"use client"

import type React from "react"

import { CartProvider } from "@/contexts/cart-context"

// GA4 (G-CX4GKGS2GP) e Google Ads agora são carregados globalmente no layout
// raiz (app/layout.tsx) via gtag.js. Removido daqui para não carregar o GA4 em
// duplicidade na rota de checkout.
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CartProvider>{children}</CartProvider>
}
