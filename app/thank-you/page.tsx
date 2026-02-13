"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, ChevronUp, Check, ArrowRight, Smartphone } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { getPedidoByIdPagamento } from "@/actions/pedidos-actions"

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
  const [hasInitialized, setHasInitialized] = useState(false)

  // Capturar parâmetros da URL
  const orderNumber = searchParams.get("pedido") || searchParams.get("orderNumber")
  const idPagamento = searchParams.get("id_pagamento")

  useEffect(() => {
    // Evitar múltiplas execuções
    if (hasInitialized) return
    setHasInitialized(true)

    // Se não tem nem pedido nem id_pagamento, redirecionar
    if (!orderNumber && !idPagamento) {
      router.push("/")
      return
    }

    // Se temos id_pagamento, buscar dados reais do Supabase
    if (idPagamento) {
      getPedidoByIdPagamento(idPagamento)
        .then((res) => {
          if (res.success && res.data) {
            setOrderData({
              pedido_numero: res.data.pedido_numero,
              nome_cliente: res.data.nome_cliente,
              email_cliente: res.data.email_cliente,
              telefone_cliente: res.data.telefone_cliente,
              cpf_cliente: res.data.cpf_cliente,
              endereco_cliente: res.data.endereco_cliente,
              numero_residencia_cliente: res.data.numero_residencia_cliente,
              complemento_cliente: res.data.complemento_cliente || "",
              bairro_cliente: res.data.bairro_cliente,
              cidade_cliente: res.data.cidade_cliente,
              estado_cliente: res.data.estado_cliente,
              cep_cliente: res.data.cep_cliente,
              itens_escolhidos: res.data.itens_escolhidos || [],
              metodo_pagamento: res.data.metodo_pagamento || "PIX",
              total_pago: res.data.total_pago,
              status_pagamento: res.data.status_pagamento || "paid",
            })
            // Limpar carrinho após pedido confirmado
            cart.clearCart()
          } else {
            console.error("Erro ao buscar pedido:", res.error)
            // Se não encontrar o pedido, usar dados mock como fallback
            setOrderData(getMockOrderData())
          }
          setIsLoading(false)
        })
        .catch((error) => {
          console.error("Erro na busca do pedido:", error)
          setOrderData(getMockOrderData())
          setIsLoading(false)
        })
    } else {
      // Fallback para dados mock se não tiver id_pagamento (compatibilidade)
      setOrderData(getMockOrderData())
      setIsLoading(false)
      cart.clearCart()
    }
  }, [orderNumber, idPagamento, router, cart, hasInitialized])

  // Função para dados mock
  const getMockOrderData = (): OrderData => ({
    pedido_numero: Number.parseInt(orderNumber || "10410") || 10410,
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
              id: "looneca-personalizada",
              name: "Caneca Personalizada com seu Pet",
              price: 49.9,
              quantity: 1,
              imageSrc: "/images/looneca-group-image.png",
            },
          ],
    metodo_pagamento: "PIX",
    total_pago: 67.8,
    status_pagamento: "paid",
  })

  // Format price for display
  const formatPrice = (price: number) => {
    return price.toFixed(2).replace(".", ",")
  }

  // Calcular totais usando dados reais do pedido
  const subtotal =
    orderData?.itens_escolhidos?.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0) ||
    (orderData?.total_pago ? orderData.total_pago - 17.9 : 49.9)
  const shipping = 17.9
  const discount = 0
  const total = orderData?.total_pago || 67.8

  // Loading state melhorado
  if (isLoading || !orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F1542E] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações do pedido...</p>
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
              {orderData.itens_escolhidos && orderData.itens_escolhidos.length > 0 ? (
                orderData.itens_escolhidos.map((item, index) => (
                  <div
                    key={`item-${index}-${item.id || index}`}
                    className="flex items-center py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden mr-3 flex-shrink-0">
                        <Image
                          src={item.imageSrc || "/images/looneca-group-image.png"}
                          alt={item.name || "Produto"}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          priority={index === 0}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/images/looneca-group-image.png"
                          }}
                        />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        {item.quantity || 1}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium text-sm">{item.name || "Produto"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R$ {formatPrice((item.price || 0) * (item.quantity || 1))}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>Nenhum item encontrado</p>
                </div>
              )}

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

        {/* Petloo App Download CTA */}
        <div className="bg-white rounded-lg border border-[#F1542E]/20 overflow-hidden">
          <div className="bg-[#FFF3F0] px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F1542E] flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm leading-tight">Sua tag Petloo vai chegar junto com a Looneca!</h3>
              <p className="text-xs text-gray-600 mt-0.5">Baixe o app agora para ativar o rastreamento quando ela chegar.</p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Para ativar a tag de rastreamento, o <strong>app Petloo</strong> precisa estar instalado no seu celular.
              Baixe agora e deixe tudo pronto!
            </p>

            <div className="flex gap-3">
              <a
                href="https://apps.apple.com/br/app/petloo/id6747433542"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gray-900 text-white text-center text-sm font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Baixar para iPhone
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=br.com.petloo.petloo_app&pcampaignid=web_share"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#F1542E] text-white text-center text-sm font-semibold py-3 rounded-lg hover:bg-[#e04020] transition-colors"
              >
                Baixar para Android
              </a>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-700">Enquanto a tag nao chega, o app ja tem:</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#F1542E] mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600"><strong>Cartao de vacina digital</strong> — com lembrete de vencimento</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#F1542E] mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600"><strong>Perfil completo do pet</strong> — todas as informacoes do seu companheiro</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#F1542E] mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600"><strong>E muito mais</strong> — sempre adicionando funcionalidades novas</p>
                </div>
              </div>
            </div>
          </div>
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
                {orderData.endereco_cliente}, {orderData.numero_residencia_cliente} - {orderData.bairro_cliente}
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
