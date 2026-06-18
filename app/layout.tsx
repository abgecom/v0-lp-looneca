import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { CartProvider } from "@/contexts/cart-context"
import { GoogleAnalytics } from "@next/third-parties/google"
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
            fbq('init', '1650496555439267');
            fbq('track', 'PageView');
          `}
        </Script>
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-NMHNL73T');`}
        </Script>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window,document,"clarity","script","vmkpbtgz98");`}
        </Script>
      </head>
      <body className={inter.className}>
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NMHNL73T" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          }}
        />
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1650496555439267&ev=PageView&noscript=1" alt="" />`,
          }}
        />
        <Suspense fallback={null}>
          <CartProvider>{children}</CartProvider>
          <GoogleAnalytics gaId="G-XXXXXXXXXX" />
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
