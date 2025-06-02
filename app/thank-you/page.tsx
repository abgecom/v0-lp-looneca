"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, ChevronUp, Check, ArrowRight } from "lucide-react"
import { useCart } from "@/contexts/cart-context"

interface OrderData {
  pedido_numero: number
  nome_cliente: string
  email_cliente: string
  telefone_cliente: string
  cpf_cliente: string
  endereco_cliente: string
  numero_residencia_cliente: string
  complemento_cliente: string
  bairro_cliente: string
  cidade_cliente: string
  estado_cliente: string
  cep_cliente: string
  itens_escolhidos: any[]
  metodo_pagamento: string
  total_pago: number
  status_pagamento: string
}

export default function ThankYouPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cart = useCart()
  const [showOrderSummary, setShowOrderSummary] = useState(false)
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get order number from URL params
  const orderNumber = searchParams.get("pedido") || searchParams.get("orderNumber")

  useEffect(() => {
    // If no order number, redirect to home
    if (!orderNumber) {
      router.push("/")
      return
    }

    // For now, we'll use mock data based on the reference image
    // In a real implementation, you would fetch from Supabase using the order number
    const mockOrderData: OrderData = {
      pedido_numero: Number.parseInt(orderNumber) || 10410,
      nome_cliente: "GABRIEL",
      email_cliente: "gabrielcostalonga@gmail.com",
      telefone_cliente: "+5527997831907",
      cpf_cliente: "13699206793",
      endereco_cliente: "Rua Milton Caldeira, 13",
      numero_residencia_cliente: "13",
      complemento_cliente: "",
      bairro_cliente: "Vila Velha ES",
      cidade_cliente: "Itapuã",
      estado_cliente: "ES",
      cep_cliente: "29101-650",
      itens_escolhidos:
        cart.items.length > 0
          ? cart.items
          : [
              {
                id: "shampoo-neutro",
                name: "Shampoo Neutro para cães e gatos Petloo",
                price: 49.9,
                quantity: 1,
                imageSrc: "/placeholder.svg?height=80&width=80",
              },
            ],
      metodo_pagamento: "PIX",
      total_pago: 67.8,
      status_pagamento: "paid",
    }

    setOrderData(mockOrderData)
    setIsLoading(false)

    // Clear cart after successful order
    cart.clearCart()
  }, [orderNumber, router, cart])

  // Format price for display
  const formatPrice = (price: number) => {
    return price.toFixed(2).replace(".", ",")
  }

  // Calculate totals
  const subtotal = orderData?.itens_escolhidos.reduce((total, item) => total + item.price * item.quantity, 0) || 49.9
  const shipping = 17.9
  const discount = 0
  const total = orderData?.total_pago || 67.8

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F1542E]"></div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
          <Link href="/" className="text-[#F1542E] hover:underline">
            Voltar para a loja
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Order Summary */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div
            className="p-4 border-b border-gray-200 flex items-center justify-between cursor-pointer"
            onClick={() => setShowOrderSummary(!showOrderSummary)}
          >
            <h3 className="font-medium text-gray-700">Resumo do pedido</h3>
            {showOrderSummary ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>

          {showOrderSummary && (
            <div className="p-4 transition-all duration-300 ease-in-out">
              {/* Items */}
              {orderData.itens_escolhidos.map((item, index) => (
                <div key={index} className="flex items-center py-3 border-b border-gray-100 last:border-0">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden mr-3 flex-shrink-0">
                      <Image
                        src={item.imageSrc || "/placeholder.svg?height=64&width=64&query=product"}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium text-sm">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>R$ {formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Desconto</span>
                  <span>- R$ {formatPrice(discount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Entrega</span>
                  <span>R$ {formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>R$ {formatPrice(total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Confirmation */}
        <div className="bg-white rounded-lg p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">PEDIDO #{orderData.pedido_numero}</h1>
          <p className="text-lg text-gray-700 mb-4">Obrigado, {orderData.nome_cliente}</p>
        </div>

        {/* Confirmation Message */}
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-medium text-gray-800 text-center">Seu pedido foi Confirmado</h2>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Informações do cliente</h3>

          {/* Contact Information */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Informações de contato</h4>
            <p className="text-gray-600 text-sm">{orderData.email_cliente}</p>
          </div>

          {/* Shipping Address */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Endereço de envio</h4>
            <div className="text-gray-600 text-sm space-y-1">
              <p>{orderData.nome_cliente}</p>
              <p>{orderData.cpf_cliente}</p>
              <p>
                {orderData.endereco_cliente} - {orderData.bairro_cliente}
              </p>
              <p>
                {orderData.cidade_cliente} {orderData.estado_cliente}
              </p>
              <p>{orderData.cep_cliente}</p>
              <p>Brasil</p>
              <p>{orderData.telefone_cliente}</p>
            </div>
          </div>

          {/* Shipping Method */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Método de envio</h4>
            <p className="text-gray-600 text-sm">Frete Padrão - Prazo de 4 a 12 dias</p>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Método de pagamento</h4>
            <p className="text-gray-600 text-sm">
              {orderData.metodo_pagamento} - R$ {formatPrice(orderData.total_pago)}
            </p>
          </div>

          {/* Order Number */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Número do pedido</h4>
            <p className="text-gray-600 text-sm">#{orderData.pedido_numero}</p>
          </div>
        </div>

        {/* Continue Shopping Button */}
        <div className="pt-4">
          <Link
            href="/"
            className="w-full bg-[#10B981] text-white py-4 px-6 rounded-full font-medium hover:bg-green-600 transition-colors flex items-center justify-center"
          >
            Continue a comprar
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  )
}
