"use client"

import type React from "react"

import { CartProvider } from "@/contexts/cart-context"
import { GoogleAnalytics } from "@next/third-parties/google"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CartProvider>{children}</CartProvider>
      <GoogleAnalytics gaId="G-CX4GKGS2GP" />
    </>
  )
}
