import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Anek_Bangla } from "next/font/google"

const anekBangla = Anek_Bangla({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-anek-bangla",
})

export const metadata: Metadata = {
  title: "Looneca - Eternize seu pet em uma caneca",
  description: "Canecas personalizadas com a imagem do seu pet",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${anekBangla.variable} font-anek`}>{children}</body>
    </html>
  )
}
