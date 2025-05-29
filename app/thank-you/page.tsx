"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

// Inicializar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface OrderData {
  id: string
  pedido_numero: string
  nome_cliente: string
  email_cliente: string
  telefone_cliente: string
  cpf_cliente: string
  cep_cliente: string
  cidade_cliente: string
  estado_cliente: string
  endereco_cliente: string
  numero_residencia_cliente: string
  complemento_cliente?: string
  bairro_cliente: string
  itens_escolhidos: Array<{
    name: string
    quantity: number
    price: number
  }>
  metodo_pagamento: string
  total_pago: number
  id_pagamento: string
  status_pagamento: string
}

export default function ThankYouPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showOrderSummary, setShowOrderSummary] = useState(false)

  useEffect(() => {
    if (orderId) {
      console.log("Buscando pedido com ID:", orderId)
      fetchOrderData(orderId)
    } else {
      console.log("Nenhum ID de pedido fornecido na URL")
      setIsLoading(false)
    }
  }, [orderId])

  const fetchOrderData = async (id: string) => {
    try {
      setIsLoading(true)

      // Buscar pelo id_pagamento na tabela pedidos
      const { data, error } = await supabase.from("pedidos").select("*").eq("id_pagamento", id).single()

      if (error) {
        console.error("Erro ao buscar pedido pelo id_pagamento:", error)
        throw new Error("Pedido não encontrado")
      }

      console.log("Dados do pedido encontrados:", data)
      setOrderData(data)
    } catch (error) {
      console.error("Erro ao buscar dados do pedido:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace(".", ",")
  }

  const formatCPF = (cpf: string) => {
    if (!cpf) return ""
    // Remove caracteres não numéricos
    const cleaned = cpf.replace(/\D/g, "")
    // Aplica a máscara XXX.XXX.XXX-XX
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const formatPhone = (phone: string) => {
    if (!phone) return ""
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, "")
    // Aplica a máscara (XX) XXXXX-XXXX
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }
    return phone
  }

  const formatCEP = (cep: string) => {
    if (!cep) return ""
    // Remove caracteres não numéricos
    const cleaned = cep.replace(/\D/g, "")
    // Aplica a máscara XXXXX-XXX
    return cleaned.replace(/(\d{5})(\d{3})/, "$1-$2")
  }

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
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Pedido não encontrado</h1>
          <p className="text-gray-600 mb-6">
            Não conseguimos encontrar os detalhes do seu pedido. Isso pode acontecer pelos seguintes motivos:
          </p>
          <ul className="text-left text-gray-600 mb-6 space-y-2">
            <li>• O pagamento ainda está sendo processado</li>
            <li>• O link que você está usando pode estar incorreto</li>
            <li>• Houve um problema técnico ao buscar os dados</li>
          </ul>
          <Link
            href="/"
            className="block w-full bg-[#10B981] text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors text-center"
          >
            Voltar para a loja
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Order Summary Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div
            className="p-4 border-b border-gray-200 flex items-center justify-between cursor-pointer"
            onClick={() => setShowOrderSummary(!showOrderSummary)}
          >
            <div className="flex items-center">
              {showOrderSummary ? (
                <ChevronUp className="w-4 h-4 text-gray-500 mr-2" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500 mr-2" />
              )}
              <h3 className="font-medium text-gray-700">Resumo do Pedido</h3>
            </div>
            <span className="text-sm text-gray-500">{showOrderSummary ? "Ocultar" : "Mostrar"}</span>
          </div>

          {showOrderSummary && (
            <div className="p-4">
              {orderData.itens_escolhidos.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">Quantidade: {item.quantity}</p>
                  </div>
                  <p className="font-medium">R$ {formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>R$ {formatPrice(orderData.total_pago)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Thank You Message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Obrigado, {orderData.nome_cliente.split(" ")[0]}</h1>
          <p className="text-gray-600">Seu pedido foi confirmado</p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Informações de contato</h3>
              <p className="text-gray-600">{orderData.email_cliente}</p>
              <p className="text-gray-600">CPF: {formatCPF(orderData.cpf_cliente)}</p>
              <p className="text-gray-600">{formatPhone(orderData.telefone_cliente)}</p>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Endereço de entrega</h3>
              <p className="text-gray-600">
                {orderData.endereco_cliente}, {orderData.numero_residencia_cliente}
                {orderData.complemento_cliente && ` - ${orderData.complemento_cliente}`}
              </p>
              <p className="text-gray-600">{orderData.bairro_cliente}</p>
              <p className="text-gray-600">
                {orderData.cidade_cliente}, {orderData.estado_cliente}
              </p>
              <p className="text-gray-600">CEP: {formatCEP(orderData.cep_cliente)}</p>
              <p className="text-gray-600">Brasil</p>
            </div>

            {/* Shipping Method */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Método de envio</h3>
              <p className="text-gray-600">Frete Padrão - 15 a 20 dias (Produção) + 4 a 12 dias (Entrega)</p>
            </div>

            {/* Payment Method */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Método de pagamento</h3>
              <p className="text-gray-600">
                {orderData.metodo_pagamento === "pix" ? "PIX" : "Cartão de Crédito"} - R${" "}
                {formatPrice(orderData.total_pago)}
              </p>
            </div>

            {/* Order Number */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                Número do pedido: <span className="font-semibold">#{orderData.pedido_numero}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Continue Shopping Button */}
        <Link
          href="/"
          className="w-full bg-[#10B981] text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center"
        >
          Continue a comprar
          <ArrowRight className="w-5 h-5 ml-2" />
        </Link>
      </div>
    </div>
  )
}
