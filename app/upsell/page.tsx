"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * A oferta de upsell (segunda Looneca com 50% off) passou a ficar embutida
 * diretamente na página de obrigado (app/thank-you/page.tsx), logo após a
 * confirmação do pedido. Esta rota existe apenas para não quebrar links
 * antigos (`/upsell?id_pagamento=...&pedido=...`) já compartilhados.
 */
export default function UpsellRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const idPagamento = searchParams.get("id_pagamento") || ""
    const pedido = searchParams.get("pedido") || ""
    router.replace(`/thank-you?id_pagamento=${idPagamento}&pedido=${pedido}`)
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFCF6]">
      <Loader2 className="w-8 h-8 animate-spin text-[#F1542E]" />
    </div>
  )
}
