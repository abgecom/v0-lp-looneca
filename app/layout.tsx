import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { CartProvider } from "@/contexts/cart-context"
import { GoogleAnalytics } from "@next/third-parties/google"
import FacebookPixel from "@/components/facebook-pixel"
import { Suspense } from "react"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Looneca - Caneca Personalizada com seu Pet",
  description: "Caneca personalizada com seu pet. Eternize seu pet em uma caneca única e especial.",
  generator: "v0.dev",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-NMHNL73T');`}
        </Script>
      </head>
      <body className={inter.className}>
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NMHNL73T" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          }}
        />
        <Suspense fallback={null}>
          <CartProvider>{children}</CartProvider>
          <GoogleAnalytics gaId="G-XXXXXXXXXX" />
          <FacebookPixel />
        </Suspense>
      </body>
    </html>
  )
}
