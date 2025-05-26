"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Copy, QrCode, Smartphone } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function PagamentoPix() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [countdown, setCountdown] = useState(3600) // 1 hora em segundos
  const [showQrCode, setShowQrCode] = useState(true) // No desktop sempre mostra, no mobile começa escondido
  const [copied, setCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Parâmetros da URL
  const orderId = searchParams.get("order_id") || ""
  const pixCode = searchParams.get("pix_code") || ""
  const pixQrCodeUrl = searchParams.get("pix_qrcode_url") || ""
  const pedidoNumero = searchParams.get("pedido_numero") || "0000"
  const totalAmount = searchParams.get("total") || "0,00"

  // Itens do pedido (simulados para demonstração)
  const orderItems = JSON.parse(decodeURIComponent(searchParams.get("items") || "[]"))

  // Detectar se é mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setShowQrCode(window.innerWidth >= 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  // Formatar o countdown
  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60)
    const seconds = countdown % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Copiar código PIX
  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // Redirecionar para página de obrigado
  const handlePaymentComplete = () => {
    router.push(`/obrigado?order_id=${orderId}&payment_method=pix`)
  }

  return (
    <main className="min-h-screen bg-[#F1E9DB] font-anek">
      <Header />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Container principal */}
          <div className="md:flex md:gap-6">
            {/* Coluna esquerda (PIX) */}
            <div className="md:flex-1">
              {/* Resumo do pedido (apenas mobile) */}
              <div className="md:hidden mb-4">
                <button
                  className="w-full border border-gray-300 rounded-md p-3 bg-white flex justify-between items-center"
                  onClick={() => {}}
                >
                  <div className="flex items-center gap-2">
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
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    <span className="font-medium">Resumo do Pedido</span>
                  </div>
                  <span className="font-bold">R$ {totalAmount}</span>
                </button>
              </div>

              {/* Card principal do PIX */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
                {/* Cabeçalho */}
                <div className="p-4 text-center border-b border-gray-100">
                  <h1 className="text-xl font-bold mb-2">PIX gerado com sucesso</h1>
                  <p className="text-gray-700">
                    Estamos aguardando o pagamento! Após realizar o pagamento, aguarde nesta tela para confirmar seu
                    pedido.
                  </p>
                </div>

                {/* Timer */}
                <div className="p-4 text-center border-b border-gray-100">
                  <div className="text-[#00A8B3] text-6xl font-bold mb-2">{formatCountdown()}</div>
                  <p className="text-gray-700">Tempo para conclusão da operação</p>
                </div>

                {/* QR Code (desktop) ou Instruções (mobile) */}
                <div className="p-4 text-center border-b border-gray-100">
                  {showQrCode ? (
                    <>
                      <p className="mb-4 font-medium">
                        Efetue o pagamento agora mesmo <span className="font-bold">escaneando o QR code</span>
                      </p>
                      <div className="flex justify-center mb-4">
                        <div className="border-2 border-gray-200 p-2 rounded-lg inline-block">
                          <Image
                            src={pixQrCodeUrl || "/placeholder.svg?height=200&width=200&query=QR Code"}
                            alt="QR Code PIX"
                            width={200}
                            height={200}
                            className="mx-auto"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mb-4 font-medium">
                        Pague através do código <span className="font-bold">PIX copia e cola</span>.
                      </p>
                      <div className="flex mb-4">
                        <input
                          type="text"
                          value={pixCode}
                          readOnly
                          className="flex-1 border border-gray-300 rounded-l-md p-3 bg-gray-50 text-sm"
                        />
                        <button
                          onClick={copyPixCode}
                          className="bg-[#00A8B3] text-white px-4 rounded-r-md flex items-center justify-center"
                        >
                          {copied ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Instruções de pagamento */}
                <div className="p-4">
                  <h2 className="text-lg font-bold mb-4">Como pagar o seu pedido</h2>

                  {/* Desktop: Duas instruções lado a lado */}
                  <div className="space-y-4">
                    {/* Instrução 1 */}
                    <div className="flex items-start gap-3">
                      <div className="text-[#00A8B3] mt-1">
                        <Smartphone size={24} />
                      </div>
                      <div>
                        <p className="font-medium">
                          Abra o aplicativo de seu banco e selecione <span className="font-bold">QR Code</span> na opção
                          de <span className="font-bold">pagamento por PIX</span>.
                        </p>
                      </div>
                    </div>

                    {/* Instrução 2 */}
                    <div className="flex items-start gap-3">
                      <div className="text-[#00A8B3] mt-1">
                        <QrCode size={24} />
                      </div>
                      <div>
                        <p className="font-medium">
                          Utilize a câmera do celular para <span className="font-bold">escanear o QR Code</span>{" "}
                          certifique-se que os dados estão corretos e finalize o pagamento.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="text-center">
                {isMobile ? (
                  <>
                    <div className="mb-4">
                      <button
                        onClick={() => setShowQrCode(!showQrCode)}
                        className="w-full bg-[#4CAF50] text-white py-3 px-6 rounded-md font-bold flex items-center justify-center"
                      >
                        <QrCode size={20} className="mr-2" />
                        {showQrCode ? "UTILIZAR PIX COPIA E COLA" : "MOSTRAR QR CODE"}
                      </button>
                    </div>
                    <div className="text-center text-gray-500 mb-4">ou</div>
                  </>
                ) : (
                  <>
                    <div className="text-center text-gray-500 mb-4">ou</div>
                    <div className="mb-4">
                      <button
                        onClick={copyPixCode}
                        className="w-full bg-[#4CAF50] text-white py-3 px-6 rounded-md font-bold flex items-center justify-center"
                      >
                        <Copy size={20} className="mr-2" />
                        UTILIZAR PIX COPIA E COLA
                      </button>
                    </div>
                  </>
                )}

                <div className="mb-4">
                  <button
                    onClick={handlePaymentComplete}
                    className="w-full border border-[#F1542E] text-[#F1542E] bg-white py-3 px-6 rounded-md font-bold"
                  >
                    JÁ PAGUEI O PIX
                  </button>
                </div>

                <div className="text-center text-gray-700 font-medium">
                  PEDIDO <span className="text-[#4CAF50]">#{pedidoNumero}</span> - RESERVADO
                </div>
              </div>
            </div>

            {/* Coluna direita (Resumo do pedido) - apenas desktop */}
            <div className="hidden md:block md:w-80">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-bold text-lg">Resumo do Pedido</h2>
                </div>

                {/* Itens do pedido */}
                <div className="p-4 border-b border-gray-200">
                  {orderItems.length > 0 ? (
                    <div className="space-y-4">
                      {orderItems.map((item: any, index: number) => (
                        <div key={index} className="flex gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 left-0 bg-gray-700 text-white w-5 h-5 flex items-center justify-center text-xs rounded-br-md">
                              {item.quantity}
                            </div>
                            <Image
                              src={item.imageSrc || "/placeholder.svg?height=64&width=64&query=product"}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.color} • {item.petCount} pet{item.petCount > 1 ? "s" : ""}
                            </p>
                            <p className="font-bold mt-1">
                              R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 relative overflow-hidden">
                        <div className="absolute top-0 left-0 bg-gray-700 text-white w-5 h-5 flex items-center justify-center text-xs rounded-br-md">
                          1
                        </div>
                        <Image
                          src="/placeholder.svg?height=64&width=64&query=product"
                          alt="Produto"
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-2">Caneca Looneca Personalizada</p>
                        <p className="text-xs text-gray-500">Branca • 1 pet</p>
                        <p className="font-bold mt-1">R$ 49,90</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtotal, frete e total */}
                <div className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Subtotal</span>
                      <span>R$ 49,90</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Desconto</span>
                      <span>---</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Entrega</span>
                      <span>R$ 17,90</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t border-gray-100">
                      <span>Total</span>
                      <span>R$ {totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
