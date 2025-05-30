"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Copy, Check, Smartphone, FileText, QrCode, ChevronUp, ChevronDown } from "lucide-react" // Adicionado QrCode, ChevronUp, ChevronDown
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button" // Importando Button

export default function PixPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutes in seconds
  const cart = useCart()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [showOrderSummary, setShowOrderSummary] = useState(false)

  const pixCode = searchParams.get("pixCode") || ""
  const pixQrCodeUrl = searchParams.get("pixQrCodeUrl") || ""
  // Usar 'pedido' como o nome do parâmetro para consistência com a página de obrigado
  const orderNumberFromUrl = searchParams.get("pedido") || searchParams.get("pedido_numero") || ""
  const orderStatus = searchParams.get("status") || "RESERVADO"

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const copyToClipboard = () => {
    if (pixCode) {
      navigator.clipboard.writeText(pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace(".", ",")
  }

  const isShippingFree = cart.totalPrice >= 249.9
  const shippingPrice = isShippingFree ? 0 : 17.9

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
  }, [timeLeft]) // Adicionado timeLeft como dependência

  useEffect(() => {
    if (!pixCode || !pixQrCodeUrl || !orderNumberFromUrl) {
      // Se algum dado essencial estiver faltando, redireciona para o checkout
      // Idealmente, deveria haver uma mensagem de erro mais específica
      console.warn("Dados PIX ou número do pedido ausentes. Redirecionando para checkout.")
      router.push("/checkout")
    }
  }, [pixCode, pixQrCodeUrl, orderNumberFromUrl, router])

  const handlePaymentConfirmed = () => {
    if (orderNumberFromUrl) {
      router.push(`/thank-you?pedido=${orderNumberFromUrl}`)
    } else {
      // Fallback ou mensagem de erro se orderNumberFromUrl não estiver disponível
      console.error("Número do pedido não disponível para redirecionamento.")
      router.push("/checkout") // Ou uma página de erro
    }
  }

  if (!pixCode || !pixQrCodeUrl || !orderNumberFromUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F1542E]"></div>
        <p className="ml-4 text-gray-600">Carregando dados do pagamento...</p>
      </div>
    )
  }

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
                <ChevronUp className="text-gray-500 mr-2 h-5 w-5" />
              ) : (
                <ChevronDown className="text-gray-500 mr-2 h-5 w-5" />
              )}
              <h3 className="font-medium text-gray-700">Resumo do Pedido</h3>
            </div>
            <span className="text-sm text-gray-500">{showOrderSummary ? "Ocultar" : "Mostrar"}</span>
          </div>

          {showOrderSummary && (
            <div className="p-4 transition-all duration-300 ease-in-out">
              {cart.items.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden mr-3 flex-shrink-0">
                      <Image
                        src={item.imageSrc || "/placeholder.svg?width=48&height=48&query=product"}
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
                      <p className="text-xs text-gray-500">Petloo</p> {/* Exemplo, pode ser dinâmico */}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>R$ {formatPrice(cart.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Desconto</span>
                  <span>---</span> {/* Ou valor real do desconto */}
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
                  <span>R$ {formatPrice(cart.totalPrice + (isShippingFree ? 0 : shippingPrice))}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6 p-6 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">PIX gerado com sucesso!</h2>
          <p className="text-gray-600 mb-4">
            Aguardando pagamento. Após pagar, clique no botão abaixo ou aguarde a confirmação automática.
          </p>
          <div className="mb-4">
            <div className="text-[#00A3C4] text-5xl font-bold">{formatTime(timeLeft)}</div>
            <p className="text-sm text-gray-500">Tempo para conclusão da operação</p>
          </div>
          <p className="text-gray-700 mb-1">Pague com o código PIX Copia e Cola:</p>
          <div className="flex mb-4">
            <input
              type="text"
              value={pixCode}
              readOnly
              className="flex-grow border border-gray-300 rounded-l-md p-3 bg-gray-50 text-sm overflow-hidden text-ellipsis whitespace-nowrap"
            />
            <Button
              onClick={copyToClipboard}
              variant="default"
              className="bg-[#3B82F6] hover:bg-blue-700 text-white rounded-l-none min-w-[110px]"
            >
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <p className="text-gray-500 mb-2 text-sm">ou</p>
          <Button
            onClick={() => setShowQrCode(true)}
            variant="outline"
            className="w-full mb-6 border-[#10B981] text-[#10B981] hover:bg-green-50"
          >
            <QrCode className="w-5 h-5 mr-2" />
            Mostrar QR Code
          </Button>
        </div>

        {/* Botão "Já paguei via Pix" */}
        <Button
          onClick={handlePaymentConfirmed}
          size="lg"
          className="w-full bg-[#10B981] hover:bg-[#0d9269] text-white text-base mb-6"
        >
          <Check className="w-5 h-5 mr-2" />
          Já paguei via Pix
        </Button>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6 p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Como pagar o seu pedido</h3>
          <div className="space-y-4 text-sm">
            <div className="flex items-start">
              <FileText size={20} className="mr-3 text-[#00A3C4] flex-shrink-0 mt-1" />
              <p>
                <strong>Copie o código</strong> acima e cole no app do seu banco na área PIX Copia e Cola.
              </p>
            </div>
            <div className="flex items-start">
              <Smartphone size={20} className="mr-3 text-[#00A3C4] flex-shrink-0 mt-1" />
              <p>
                Ou <strong>escaneie o QR Code</strong> com a câmera do seu celular no app do banco.
              </p>
            </div>
          </div>
        </div>

        {showQrCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
              <h3 className="font-bold text-lg mb-4">QR Code PIX</h3>
              <div className="flex justify-center mb-4">
                {pixQrCodeUrl ? (
                  <Image
                    src={pixQrCodeUrl || "/placeholder.svg"}
                    alt="QR Code PIX"
                    width={250}
                    height={250}
                    className="border border-gray-300"
                  />
                ) : (
                  <p className="text-red-500">Erro ao carregar QR Code.</p>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-4">Escaneie o QR Code com o aplicativo do seu banco.</p>
              <Button onClick={() => setShowQrCode(false)} variant="outline" className="w-full">
                Fechar
              </Button>
            </div>
          </div>
        )}

        <div className="text-center text-sm text-gray-600">
          <p>
            PEDIDO <span className="text-[#10B981] font-bold">#{orderNumberFromUrl}</span> - {orderStatus}
          </p>
        </div>
      </div>
    </div>
  )
}
