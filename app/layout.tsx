import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { CartProvider } from "@/contexts/cart-context"
import { GoogleAnalytics } from "@next/third-parties/google"
import FacebookPixel from "@/components/facebook-pixel"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Looneca - Caneca Personalizada com seu Pet",
  description: "Caneca personalizada com seu pet. Eternize seu pet em uma caneca única e especial.",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <CartProvider>{children}</CartProvider>
        <GoogleAnalytics gaId="G-XXXXXXXXXX" />
        <FacebookPixel />
      </body>
    </html>
  )
}
