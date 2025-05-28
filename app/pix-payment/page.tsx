"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Copy, Check, ChevronDown, ChevronUp, QrCode } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/contexts/cart-context"

export default function PixPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState(false)
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutes in seconds
  const cart = useCart()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Get data from URL parameters
  const pixCode = searchParams.get("pixCode") || ""
  const pixQrCodeUrl = searchParams.get("pixQrCodeUrl") || ""
  const orderId = searchParams.get("orderId") || "1020" // Default to 1020 if not provided
  const orderStatus = searchParams.get("status") || "Reservado"

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
  const shippingPrice = isShippingFree ? 0 : 17.9 // Default shipping price

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
    if (!pixCode || !pixQrCodeUrl) {
      router.push("/checkout")
    }
  }, [pixCode, pixQrCodeUrl, router])

  // Check if we're on a mobile device
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false

  if (!pixCode || !pixQrCodeUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F1542E]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Image src="/images/petloo-logo-new.png" alt="Petloo Logo" width={150} height={50} className="mx-auto" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">PIX gerado com sucesso</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Estamos aguardando o pagamento! Após realizar o pagamento, aguarde nesta tela para confirmar seu pedido.
          </p>
        </div>

        {/* Main content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {/* Countdown timer */}
          <div className="bg-[#F1542E] text-white p-4 text-center">
            <p className="text-sm mb-1">Tempo restante para pagamento</p>
            <div className="text-3xl font-bold">{formatTime(timeLeft)}</div>
          </div>

          <div className="p-6">
            {/* Desktop: QR Code + Copy Code */}
            <div className="flex flex-col md:flex-row items-start justify-between gap-8">
              {/* Copy Code Section */}
              <div className="w-full">
                <div className="mb-4">
                  <h3 className="font-medium text-lg mb-3">Código PIX para copiar e colar:</h3>
                  <div className="relative">
                    <div className="border border-gray-300 rounded-md p-3 bg-gray-50 pr-12 break-all text-sm">
                      {pixCode}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#F1542E] text-white hover:bg-[#e04020] p-2 rounded-md"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {copied ? "Código copiado!" : "Clique no botão para copiar"}
                  </p>
                </div>

                {/* Mobile: Show QR Code Button */}
                <div className="md:hidden mb-6">
                  <button
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    <QrCode className="w-5 h-5" />
                    {showQrCode ? "Ocultar QR Code" : "Mostrar QR Code"}
                  </button>

                  {showQrCode && (
                    <div className="mt-4 flex justify-center">
                      <div className="bg-white p-4 border border-gray-200 rounded-lg">
                        <Image
                          src={pixQrCodeUrl || "/placeholder.svg"}
                          alt="QR Code PIX"
                          width={200}
                          height={200}
                          className="mx-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment instructions */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h3 className="font-medium text-lg mb-3">Como pagar com PIX:</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
                    <li>Abra o aplicativo do seu banco</li>
                    <li>Acesse a área PIX</li>
                    <li className="hidden md:list-item">Escaneie o QR Code ao lado ou</li>
                    <li>Selecione a opção "PIX Copia e Cola"</li>
                    <li>Cole o código que você copiou</li>
                    <li>Confirme as informações e finalize o pagamento</li>
                    <li>Aguarde nesta página para confirmação automática</li>
                  </ol>
                </div>
              </div>

              {/* QR Code (desktop only) */}
              <div className="hidden md:block">
                <h3 className="font-medium text-lg mb-3">QR Code PIX:</h3>
                <div className="bg-white p-4 border border-gray-200 rounded-lg">
                  <Image
                    src={pixQrCodeUrl || "/placeholder.svg"}
                    alt="QR Code PIX"
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">Escaneie o QR Code com o app do seu banco</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div
            className="p-4 border-b border-gray-200 flex justify-between items-center cursor-pointer"
            onClick={() => setOrderSummaryOpen(!orderSummaryOpen)}
          >
            <h3 className="font-medium">Resumo do pedido</h3>
            <button className="text-gray-500">
              {orderSummaryOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {orderSummaryOpen && (
            <div className="p-4">
              {/* Items */}
              {cart.items.map((item, index) => (
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
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.color} • {item.petCount} pet{item.petCount > 1 ? "s" : ""} • Qtd: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}

              {/* Recurring products */}
              {cart.recurringProducts.appPetloo && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden mr-3 flex-shrink-0">
                      <Image
                        src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/imgapp1-VnnOgP7stsRZkKIeJkojR2Grh3ILVy.png"
                        alt="App Petloo"
                        width={48}
                        height={48}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">App Petloo</p>
                      <p className="text-xs text-green-600">GRÁTIS</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ 0,00</p>
                  </div>
                </div>
              )}

              {cart.recurringProducts.loobook && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden mr-3 flex-shrink-0">
                      <Image
                        src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/imglivro%2Bapp1-bYzQDKdaCXTRBQgXxgOwAH3pCxOgM4.png"
                        alt="Livro digital Loobook"
                        width={48}
                        height={48}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Livro digital Loobook</p>
                      <p className="text-xs text-green-600">GRÁTIS</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ 0,00</p>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>R$ {formatPrice(cart.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Frete</span>
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

        {/* Order Status */}
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-2">Status do pedido</p>
          <p className="text-lg font-bold mb-1">
            PEDIDO #{orderId} - <span className="text-yellow-600">{orderStatus}</span>
          </p>
          <p className="text-sm text-gray-500">Aguardando confirmação do pagamento. Não feche esta página.</p>

          <div className="mt-6">
            <Link href="/" className="text-[#F1542E] hover:underline text-sm">
              Voltar para a loja
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
