"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, ChevronUp } from "lucide-react"

// Função para formatar preço (duplicada para manter o componente autônomo, idealmente viria de utils)
const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined) return "R$ 0,00"
  return `R$ ${price.toFixed(2).replace(".", ",")}`
}

interface OrderSummaryCardClientProps {
  // Usando 'any' temporariamente para itens_escolhidos, idealmente teria um tipo forte
  pedido: {
    itens_escolhidos: any[] | null | undefined
    subtotal_itens: number
    valor_frete: number
    total_pago: number | null | undefined
  }
  defaultOpen?: boolean
}

export default function OrderSummaryCardClient({ pedido, defaultOpen = true }: OrderSummaryCardClientProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card>
      <CardHeader
        className="p-4 border-b flex flex-row items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="text-base font-medium">Resumo do pedido</CardTitle>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </CardHeader>
      {isOpen && (
        <CardContent className="p-4 space-y-3">
          {pedido.itens_escolhidos?.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative w-12 h-12 mr-3 rounded overflow-hidden bg-gray-100">
                  <Image
                    src={item.image || item.imageSrc || "/placeholder.svg?width=48&height=48&query=product"}
                    alt={item.name || "Imagem do Produto"}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.quantity || 1} x {formatPrice(item.price)}
                  </p>
                </div>
              </div>
              <p className="font-medium text-sm">{formatPrice((item.quantity || 1) * item.price)}</p>
            </div>
          ))}
          <Separator />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(pedido.subtotal_itens)}</span>
            </div>
            <div className="flex justify-between">
              <span>Frete</span>
              <span>{formatPrice(pedido.valor_frete)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Total</span>
              <span>{formatPrice(pedido.total_pago)}</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
