"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Copy, Check, Smartphone, FileText } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { getPedidoByIdPagamento } from "@/actions/pedidos-actions"

export default function PixPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutes in seconds
  const cart = useCart()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [showOrderSummary, setShowOrderSummary] = useState(false)
  const [pedidoData, setPedidoData] = useState<any>(null)
  const [isLoadingPedido, setIsLoadingPedido] = useState(true)

  const [pixData, setPixData] = useState<{
    pixCode: string
    pixQrCodeUrl: string
    orderId: string
    amount: number
    pedidoNumero?: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPixData = sessionStorage.getItem("pixPaymentData")
      console.log("[v0] Raw sessionStorage data:", savedPixData)

      if (savedPixData) {
        try {
          const parsedData = JSON.parse(savedPixData)
          console.log("[v0] Parsed PIX data from sessionStorage:", parsedData)

          let qrcodeUrl = parsedData.qrcode || ""
          if (qrcodeUrl && !qrcodeUrl.startsWith("data:") && !qrcodeUrl.startsWith("http")) {
            qrcodeUrl = `data:image/png;base64,${qrcodeUrl}`
          }

          setPixData({
            pixCode: parsedData.copiacola || "",
            pixQrCodeUrl: qrcodeUrl,
            orderId: parsedData.orderId || "",
            amount: parsedData.amount || 0,
            pedidoNumero: parsedData.pedidoNumero,
          })

          console.log("[v0] Final pixData state:", {
            pixCode: parsedData.copiacola || "",
            pixQrCodeUrl: qrcodeUrl,
            orderId: parsedData.orderId || "",
            amount: parsedData.amount || 0,
          })

          setIsLoading(false)
          return
        } catch (error) {
          console.error("[v0] Error parsing PIX data from sessionStorage:", error)
        }
      }

      // Fallback to URL parameters if sessionStorage is empty
      const pixCodeParam = searchParams.get("pixCode") || ""
      const pixQrCodeUrlParam = searchParams.get("pixQrCodeUrl") || ""
      const orderIdParam = searchParams.get("orderId") || ""
      const amountParam = Number.parseFloat(searchParams.get("amount") || "0")

      if (pixCodeParam || pixQrCodeUrlParam) {
        console.log("[v0] PIX data loaded from URL parameters (fallback)")
        setPixData({
          pixCode: pixCodeParam,
          pixQrCodeUrl: pixQrCodeUrlParam,
          orderId: orderIdParam,
          amount: amountParam,
        })
      }

      setIsLoading(false)
    }
  }, [searchParams])

  // Get data from pixData state
  const pixCode = pixData?.pixCode || ""
  const pixQrCodeUrl = pixData?.pixQrCodeUrl || ""
  const orderId = pixData?.orderId || ""
  const orderNumber = pixData?.pedidoNumero || searchParams.get("pedido_numero") || "1028"
  const orderStatus = searchParams.get("status") || "RESERVADO"

  // Capturar id_pagamento da URL (pode vir como orderId ou id_pagamento)
  const idPagamento = orderId || searchParams.get("id_pagamento")

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Copy PIX code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // Format price for display
  const formatPrice = (price: number) => {
    return price.toFixed(2).replace(".", ",")
  }

  // Calculate shipping price
  const isShippingFree = cart.totalPrice >= 249.9
  const shippingPrice = isShippingFree ? 0 : 17.9

  // Start countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Redirect if no PIX code is provided
  useEffect(() => {
    if (!isLoading && (!pixCode || !pixQrCodeUrl)) {
      console.log("[v0] No PIX data available, redirecting to checkout")
      router.push("/checkout")
    }
  }, [pixCode, pixQrCodeUrl, router, isLoading])

  // Buscar dados do pedido pelo id_pagamento
  useEffect(() => {
    if (idPagamento) {
      setIsLoadingPedido(true)
      getPedidoByIdPagamento(idPagamento).then((res) => {
        if (res.success && res.data) {
          setPedidoData(res.data)
        }
        setIsLoadingPedido(false)
      })
    } else {
      setIsLoadingPedido(false)
    }
  }, [idPagamento])

  if (isLoading || !pixCode || !pixQrCodeUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F1542E]"></div>
      </div>
    )
  }

  // Usar dados do pedido quando disponíveis, senão usar dados do carrinho
  const itensParaExibir = pedidoData?.itens_escolhidos || cart.items
  const totalPedido =
    pedidoData?.total_pago || pixData?.amount || cart.totalPrice + (isShippingFree ? 0 : shippingPrice)
  const subtotalPedido = pedidoData ? pedidoData.total_pago - 17.9 : pixData?.amount || cart.totalPrice

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Order Summary */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div
            className="p-4 border-b border-gray-200 flex items-center justify-between cursor-pointer"
            onClick={() => setShowOrderSummary(!showOrderSummary)}
          >
            <div className="flex items-center">
              {showOrderSummary ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500 mr-2"
                >
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500 mr-2"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              )}
              <h3 className="font-medium text-gray-700">Resumo do Pedido</h3>
            </div>
            <span className="text-sm text-gray-500">{showOrderSummary ? "Ocultar" : "Mostrar"}</span>
          </div>

          {showOrderSummary && (
            <div className="p-4 transition-all duration-300 ease-in-out">
              {/* Items */}
              {itensParaExibir.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden mr-3 flex-shrink-0">
                      <Image
                        src={item.imageSrc || "/placeholder.svg"}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center bg-gray-500 text-white rounded-full w-5 h-5 text-xs mr-2">
                          {item.quantity}
                        </span>
                        <p className="font-medium text-sm">{item.name}</p>
                      </div>
                      <p className="text-xs text-gray-500">Petloo</p>
                    </div>
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
                  <span>R$ {formatPrice(subtotalPedido)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Desconto</span>
                  <span>---</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Entrega</span>
                  {isShippingFree ? (
                    <span className="text-green-600">Grátis</span>
                  ) : (
                    <span>R$ {formatPrice(shippingPrice)}</span>
                  )}
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>R$ {formatPrice(totalPedido)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PIX Payment Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="p-4 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">PIX gerado com sucesso</h2>
            <p className="text-gray-600 mb-4">
              Estamos aguardando o pagamento! Após realizar o pagamento, aguarde nesta tela para confirmar seu pedido.
            </p>

            {/* Timer */}
            <div className="mb-4">
              <div className="text-[#00A3C4] text-6xl font-bold">{formatTime(timeLeft)}</div>
              <p className="text-sm text-gray-500">Tempo para conclusão da operação</p>
            </div>

            <p className="text-gray-700 mb-3">
              Pague através do código <strong>PIX copia e cola.</strong>
            </p>

            {/* PIX Code */}
            <div className="flex mb-4">
              <div className="flex-grow border border-gray-300 rounded-l-md p-3 bg-gray-50 overflow-hidden text-ellipsis whitespace-nowrap">
                {pixCode}
              </div>
              <button
                onClick={copyToClipboard}
                className="bg-[#3B82F6] text-white px-4 py-2 rounded-r-md hover:bg-blue-600 flex items-center justify-center min-w-[100px]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" /> Copiar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* How to Pay Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="p-4">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Como pagar o seu pedido</h3>

            <div className="space-y-4">
              <div className="flex">
                <div className="mr-3 text-[#00A3C4]">
                  <FileText size={24} />
                </div>
                <div>
                  <p>
                    <strong>Copie o código</strong> acima clicando no botão Copiar
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="mr-3 text-[#00A3C4]">
                  <Smartphone size={24} />
                </div>
                <div>
                  <p>
                    <strong>Abra o aplicativo de seu banco</strong> e selecione <strong>Copia e Cola</strong> na opção
                    de <strong>pagamento por PIX</strong>. Certifique-se que os dados estão corretos e finalize o
                    pagamento
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Button */}
        <div className="text-center mb-6">
          <p className="text-gray-500 mb-2">ou</p>
          <button
            onClick={() => setShowQrCode(!showQrCode)}
            className="bg-[#10B981] text-white px-6 py-3 rounded-full font-medium hover:bg-green-600 transition-colors flex items-center justify-center mx-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <rect x="7" y="7" width="3" height="3"></rect>
              <rect x="14" y="7" width="3" height="3"></rect>
              <rect x="7" y="14" width="3" height="3"></rect>
              <rect x="14" y="14" width="3" height="3"></rect>
            </svg>
            MOSTRAR QR CODE
          </button>
        </div>

        {/* Payment Completed Button */}
        <div className="text-center mb-6">
          <button
            onClick={() =>
              router.push(`/thank-you?id_pagamento=${idPagamento}&pedido=${pedidoData?.pedido_numero || orderNumber}`)
            }
            className="bg-[#10B981] text-white px-8 py-3 rounded-full font-medium hover:bg-green-600 transition-colors flex items-center justify-center mx-auto"
          >
            <Check className="w-5 h-5 mr-2" />
            Já finalizei o pagamento
          </button>
        </div>

        {/* QR Code Modal */}
        {showQrCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="font-bold text-lg mb-4 text-center">QR Code PIX</h3>
              <div className="flex justify-center mb-4">
                <img
                  src={pixQrCodeUrl || "/placeholder.svg"}
                  alt="QR Code PIX"
                  width={200}
                  height={200}
                  className="border border-gray-200"
                />
              </div>
              <p className="text-sm text-gray-500 text-center mb-4">Escaneie o QR Code com o aplicativo do seu banco</p>
              <button
                onClick={() => setShowQrCode(false)}
                className="w-full bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Order Number - Dados dinâmicos do pedido */}
        <div className="text-center">
          {!isLoadingPedido && pedidoData ? (
            <div className="space-y-2">
              <p className="text-gray-700">
                PEDIDO <span className="text-[#10B981] font-bold">#{pedidoData.pedido_numero}</span> -{" "}
                {pedidoData.status_pagamento?.toUpperCase() || "AGUARDANDO"}
              </p>
              <p className="text-sm text-gray-600">Cliente: {pedidoData.nome_cliente}</p>
              <p className="text-sm text-gray-600">
                Endereço: {pedidoData.endereco_cliente}, {pedidoData.numero_residencia_cliente} -{" "}
                {pedidoData.bairro_cliente}
              </p>
              <p className="text-sm text-gray-600">
                {pedidoData.cidade_cliente} - {pedidoData.estado_cliente}
              </p>
            </div>
          ) : (
            <p className="text-gray-700">
              PEDIDO <span className="text-[#10B981] font-bold">#{orderNumber}</span> - {orderStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
