import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { CartProvider } from "@/contexts/cart-context"
import PixelTracker from "@/components/pixel-tracker"
import TikTokPixel from "@/components/tiktok-pixel"
import { Suspense } from "react"
import Script from "next/script"
import { Analytics } from "@vercel/analytics/react"

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
        {/*
          Meta Pixel base — colocado PRIMEIRO no <head> para que o PageView
          dispare o quanto antes após o clique no anúncio. Isso é o que faz o
          Meta contar a "Visualização de página de destino" (Landing Page View).
          Antes ficava como componente no fim do <body> dentro de <Suspense>,
          disparando tarde — por isso a LP não marcava LPV (a presell, que tem o
          pixel no <head>, marcava).
        */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){
              if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
            window.__fbPvEventId = 'pv.' + Date.now() + '.' + Math.random().toString(36).slice(2, 10);
            fbq('init', '1650496555439267');
            fbq('track', 'PageView', {}, { eventID: window.__fbPvEventId });
          `}
        </Script>
        {/*
          GA4 + Google Ads nativos (gtag.js), substituindo o container GTM
          (GTM-NMHNL73T) que foi removido. O GTM alimentava um container
          server-side (api.petloo.com.br / Stape) que enviava CAPI do Facebook
          com fbclid expirado. Sem o GTM, esse sender deixa de existir; o
          Facebook agora é 100% nativo (pixel + Conversions API próprios).
          GA4: G-CX4GKGS2GP | Google Ads: AW-11487232709
        */}
        <Script
          id="gtag-src"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-CX4GKGS2GP"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CX4GKGS2GP');
            gtag('config', 'AW-11487232709');
          `}
        </Script>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window,document,"clarity","script","vmkpbtgz98");`}
        </Script>
        <TikTokPixel />
      </head>
      <body className={inter.className}>
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1650496555439267&ev=PageView&noscript=1" alt="" />`,
          }}
        />
        <Suspense fallback={null}>
          <CartProvider>{children}</CartProvider>
          <PixelTracker />
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
