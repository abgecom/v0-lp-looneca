"use client"

import { useEffect } from "react"
import Script from "next/script"

// Definir o tipo para a função fbq global
declare global {
  interface Window {
    fbq: any
    _fbq_initialized: boolean
  }
}

export default function FacebookPixel() {
  useEffect(() => {
    // Verificar se o fbq já foi inicializado para evitar duplicação
    if (!window._fbq_initialized) {
      window.fbq = () => {
        // @ts-ignore
        window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments)
      }

      if (!window._fbq) window._fbq = window.fbq
      window.fbq.push = window.fbq
      window.fbq.loaded = true
      window.fbq.version = "2.0"
      window.fbq.queue = []
      window._fbq_initialized = true

      // Inicializar o Pixel e rastrear PageView
      window.fbq("init", "1650496555439267")
      window.fbq("track", "PageView")
    }
  }, [])

  return (
    <>
      <Script
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
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
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=1650496555439267&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </>
  )
}

// Função auxiliar para disparar eventos do Facebook Pixel
export function trackFBEvent(event: string, params?: any) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, params)
  }
}
