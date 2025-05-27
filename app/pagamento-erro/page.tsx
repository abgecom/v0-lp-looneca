"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PagamentoErro() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Parâmetros da URL
  const errorCode = searchParams.get("code") || "UNKNOWN_ERROR"
  const errorMessage = searchParams.get("message") || "Ocorreu um erro ao processar seu pagamento."
  const orderId = searchParams.get("order_id") || ""

  // Determinar mensagem e sugestões com base no código de erro
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [title, setTitle] = useState("Erro no pagamento")

  useEffect(() => {
    // Configurar título e sugestões com base no código de erro
    switch (errorCode) {
      case "GATEWAY_ERROR":
        setTitle("Erro no gateway de pagamento")
        setSuggestions([
          "Aguarde alguns minutos e tente novamente",
          "Verifique se há algum problema com o serviço PIX do seu banco",
          "Tente usar outro método de pagamento, como cartão de crédito",
        ])
        break
      case "CARD_ERROR":
        setTitle("Erro no processamento do cartão")
        setSuggestions([
          "Verifique os dados do cartão e tente novamente",
          "Entre em contato com seu banco para verificar se há alguma restrição",
          "Tente usar outro cartão ou método de pagamento",
        ])
        break
      case "GATEWAY_CONNECTION_ERROR":
        setTitle("Erro de conexão")
        setSuggestions([
          "Verifique sua conexão com a internet",
          "Aguarde alguns minutos e tente novamente",
          "Se o problema persistir, tente usar outro método de pagamento",
        ])
        break
      default:
        setTitle("Erro no pagamento")
        setSuggestions([
          "Tente novamente em alguns instantes",
          "Verifique se há algum problema com seu método de pagamento",
          "Entre em contato com nosso suporte se o problema persistir",
        ])
    }
  }, [errorCode])

  // Voltar para a página de checkout
  const handleTryAgain = () => {
    router.push("/checkout")
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex justify-center mb-6">
          <Image src="/images/petloo-logo-new.png" alt="Petloo Logo" width={150} height={60} className="h-12 w-auto" />
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
            <h1 className="text-xl font-bold text-red-700">{title}</h1>
          </div>

          <p className="text-gray-700 mb-6">{decodeURIComponent(errorMessage)}</p>

          <div className="bg-white rounded-lg p-4 mb-6">
            <h2 className="font-medium mb-3">Sugestões:</h2>
            <ul className="list-disc pl-5 space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-gray-700">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleTryAgain}
              className="flex items-center justify-center bg-[#00B8D4] text-white py-3 px-6 rounded-md font-medium hover:bg-[#00a0b8] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para o checkout
            </button>

            <Link
              href="/"
              className="flex items-center justify-center bg-gray-100 text-gray-700 py-3 px-6 rounded-md font-medium hover:bg-gray-200 transition-colors"
            >
              Voltar para a loja
            </Link>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>Se você continuar enfrentando problemas, entre em contato com nosso suporte:</p>
          <p className="font-medium mt-1">suporte@petloo.com.br</p>
        </div>
      </div>
    </div>
  )
}
