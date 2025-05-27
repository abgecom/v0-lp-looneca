"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { ChevronDown, Copy, Check, Smartphone, QrCode } from "lucide-react"
import { useRouter } from "next/navigation"

interface OrderItem {
  id: string
  name: string
  color: string
  petCount: number
  quantity: number
  price: number
  imageSrc?: string
}

export default function PagamentoPix() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Parâmetros da URL
  const orderId = searchParams.get("order_id") || ""
  const pixCode = searchParams.get("pix_code") || ""
  const pixQrCodeUrl = searchParams.get("pix_qrcode_url") || ""
  const pedidoNumero = searchParams.get("pedido_numero") || "0000"
  const total = searchParams.get("total") || "0,00"

  // Tentar obter os itens do pedido
  const itemsParam = searchParams.get("items") || "[]"
  const [items, setItems] = useState<OrderItem[]>([])

  // Estados para controle da interface
  const [timeLeft, setTimeLeft] = useState(3600) // 1 hora em segundos
  const [copied, setCopied] = useState(false)
  const [showQrCode, setShowQrCode] = useState(true)
  const [showOrderSummary, setShowOrderSummary] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Verificar se é dispositivo móvel
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Inicializar itens do pedido
  useEffect(() => {
    try {
      if (itemsParam) {
        const decodedItems = decodeURIComponent(itemsParam)
        const parsedItems = JSON.parse(decodedItems)
        if (Array.isArray(parsedItems)) {
          setItems(parsedItems)
        } else {
          console.error("Itens do pedido não são um array:", parsedItems)
          setItems([])
        }
      } else {
        console.log("Nenhum item de pedido encontrado nos parâmetros")
        setItems([])
      }
    } catch (error) {
      console.error("Erro ao processar itens do pedido:", error)
      setItems([])
    }
  }, [itemsParam])

  // Timer regressivo
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Formatar o tempo restante
  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Copiar código PIX
  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // Redirecionar para a página de agradecimento
  const handlePaymentConfirmation = () => {
    router.push(`/obrigado?order_id=${orderId}&payment_method=pix`)
  }

  // Calcular subtotal com verificação de segurança
  const subtotal =
    items.length > 0 ? items.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0) : 0

  // Calcular frete com verificação de segurança
  const totalValue = Number.parseFloat(total?.replace(",", ".") || "0")
  const shipping = isNaN(totalValue) ? 0 : Math.max(0, totalValue - subtotal)

  // Renderizar versão desktop
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col md:flex-row gap-8">
          {/* Coluna esquerda - Informações do PIX */}
          <div className="md:w-3/5">
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <h1 className="text-2xl font-bold text-center mb-2">PIX gerado com sucesso</h1>
              <p className="text-center text-gray-700 mb-6">
                Estamos aguardando o pagamento! Após realizar o pagamento, aguarde nesta tela para confirmar seu pedido.
              </p>

              <div className="flex flex-col items-center mb-6">
                <div className="text-[#00B8D4] text-6xl font-bold mb-2">{formatTime()}</div>
                <p className="text-gray-600">Tempo para conclusão da operação</p>
              </div>

              <p className="text-center mb-6">
                Efetue o pagamento agora mesmo <strong>escaneando o QR code</strong>
              </p>

              <div className="flex justify-center mb-8">
                <div className="border border-gray-300 rounded-lg p-4 bg-white">
                  <Image
                    src={pixQrCodeUrl || "/placeholder.svg?height=200&width=200&query=QR%20Code%20PIX"}
                    alt="QR Code PIX"
                    width={250}
                    height={250}
                    className="mx-auto"
                  />
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Como pagar o seu pedido</h2>

              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#f0f7ff] rounded-full flex items-center justify-center mr-3">
                  <Smartphone className="w-4 h-4 text-[#00B8D4]" />
                </div>
                <div>
                  <p className="font-medium">
                    Abra o aplicativo de seu banco e selecione <strong>QR Code</strong> na opção de{" "}
                    <strong>pagamento por PIX</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start mb-6">
                <div className="flex-shrink-0 w-8 h-8 bg-[#f0f7ff] rounded-full flex items-center justify-center mr-3">
                  <QrCode className="w-4 h-4 text-[#00B8D4]" />
                </div>
                <div>
                  <p className="font-medium">
                    Utilize a câmera do celular para <strong>escanear o QR Code</strong> certifique-se que os dados
                    estão corretos e finalize o pagamento.
                  </p>
                </div>
              </div>

              <div className="text-center mb-4">
                <p className="text-gray-500">ou</p>
              </div>

              <button
                onClick={copyPixCode}
                className="w-full bg-[#00B8D4] text-white py-3 px-4 rounded-md font-medium flex items-center justify-center"
              >
                <Copy className="w-5 h-5 mr-2" />
                UTILIZAR PIX COPIA E COLA
              </button>

              <div className="mt-6 text-center">
                <p className="text-gray-700">
                  PEDIDO <span className="text-[#00B8D4] font-bold">#{pedidoNumero}</span> - RESERVADO
                </p>
              </div>
            </div>
          </div>

          {/* Coluna direita - Resumo do pedido */}
          <div className="md:w-2/5">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Image
                    src="/images/petloo-logo-new.png"
                    alt="Petloo Logo"
                    width={100}
                    height={40}
                    className="h-8 w-auto"
                  />
                </div>
              </div>

              {items.map((item, index) => (
                <div key={index} className="mb-4 pb-4 border-b border-gray-100">
                  <div className="flex">
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                      <Image
                        src={item.imageSrc || "/placeholder.svg?height=64&width=64&query=product"}
                        alt={item.name || "Produto"}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-3 flex-grow">
                      <div className="flex justify-between">
                        <h3 className="text-sm font-medium">{item.name}</h3>
                        <span className="text-sm font-medium">
                          R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{item.color}</p>
                      <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Desconto</span>
                  <span>---</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Entrega</span>
                  <span>R$ {shipping.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>R$ {total}</span>
                </div>
              </div>

              <button
                onClick={handlePaymentConfirmation}
                className="w-full bg-[#F1542E] text-white py-3 px-4 rounded-md font-bold hover:bg-[#e04020] transition-colors"
              >
                Já paguei o PIX
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar versão mobile
  return (
    <div className="min-h-screen bg-white">
      {/* Resumo do pedido colapsável */}
      <button
        onClick={() => setShowOrderSummary(!showOrderSummary)}
        className="w-full bg-white border-b border-gray-200 p-4 flex items-center justify-between"
      >
        <div className="flex items-center">
          <ChevronDown className={`w-5 h-5 mr-2 transition-transform ${showOrderSummary ? "rotate-180" : ""}`} />
          <span className="font-medium">Resumo do Pedido</span>
        </div>
        <span className="font-bold">R$ {total}</span>
      </button>

      {showOrderSummary && (
        <div className="bg-white border-b border-gray-200 p-4">
          {items.map((item, index) => (
            <div key={index} className="flex items-center mb-3">
              <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden mr-3">
                <Image
                  src={item.imageSrc || "/placeholder.svg?height=64&width=64&query=product"}
                  alt={item.name || "Produto"}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium">{item.name}</h3>
                  <span className="text-sm font-medium">
                    R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
              </div>
            </div>
          ))}

          <div className="space-y-1 text-sm pt-2 border-t border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Entrega</span>
              <span>R$ {shipping.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="flex justify-between font-bold pt-1 border-t border-gray-100">
              <span>Total</span>
              <span>R$ {total}</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold">PIX gerado com sucesso</h1>
          <p className="text-sm text-gray-700 mt-1">
            Estamos aguardando o pagamento! Após realizar o pagamento, aguarde nesta tela para confirmar seu pedido.
          </p>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="text-[#00B8D4] text-6xl font-bold mb-1">{formatTime()}</div>
          <p className="text-sm text-gray-600">Tempo para conclusão da operação</p>
        </div>

        <p className="text-center text-sm mb-4">
          Pague através do código <strong>PIX copia e cola</strong>.
        </p>

        <div className="relative mb-6">
          <div className="flex">
            <div className="flex-grow border border-gray-300 rounded-l-md p-3 bg-gray-50 overflow-hidden">
              <p className="text-sm truncate">{pixCode}</p>
            </div>
            <button
              onClick={copyPixCode}
              className="bg-[#00B8D4] text-white px-4 py-2 rounded-r-md flex items-center justify-center"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              <span className="ml-1">{copied ? "Copiado" : "Copiar"}</span>
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold mb-3">Como pagar o seu pedido</h2>

          <div className="flex items-start mb-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[#f0f7ff] rounded-full flex items-center justify-center mr-3">
              <Copy className="w-4 h-4 text-[#00B8D4]" />
            </div>
            <div>
              <p className="text-sm">Copie o código acima clicando no botão</p>
            </div>
          </div>

          <div className="flex items-start mb-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[#f0f7ff] rounded-full flex items-center justify-center mr-3">
              <Smartphone className="w-4 h-4 text-[#00B8D4]" />
            </div>
            <div>
              <p className="text-sm">
                Abra o aplicativo de seu banco e selecione <strong>Copia e Cola</strong> na opção de{" "}
                <strong>pagamento por PIX</strong>. Certifique-se que os dados estão corretos e finalize o pagamento.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-gray-500 text-sm">ou</p>
        </div>

        <button
          onClick={() => setShowQrCode(!showQrCode)}
          className="w-full bg-[#00B8D4] text-white py-3 px-4 rounded-md font-medium flex items-center justify-center mb-6"
        >
          <QrCode className="w-5 h-5 mr-2" />
          MOSTRAR QR CODE
        </button>

        {showQrCode && (
          <div className="flex justify-center mb-6">
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <Image
                src={pixQrCodeUrl || "/placeholder.svg?height=200&width=200&query=QR%20Code%20PIX"}
                alt="QR Code PIX"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>
          </div>
        )}

        <button
          onClick={handlePaymentConfirmation}
          className="w-full bg-[#F1542E] text-white py-3 px-4 rounded-md font-bold hover:bg-[#e04020] transition-colors mb-4"
        >
          Já paguei o PIX
        </button>

        <div className="text-center">
          <p className="text-gray-700 text-sm">
            PEDIDO <span className="text-[#00B8D4] font-bold">#{pedidoNumero}</span> - RESERVADO
          </p>
        </div>
      </div>
    </div>
  )
}
