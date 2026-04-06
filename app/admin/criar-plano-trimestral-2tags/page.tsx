"use client"

import { useState } from "react"

export default function CriarPlanosTrimestralPage() {
  const [isLoading2Tags, setIsLoading2Tags] = useState(false)
  const [isLoading3Tags, setIsLoading3Tags] = useState(false)
  const [result2Tags, setResult2Tags] = useState<{ success: boolean; planId?: string; error?: string } | null>(null)
  const [result3Tags, setResult3Tags] = useState<{ success: boolean; planId?: string; error?: string } | null>(null)

  const handleCreatePlan2Tags = async () => {
    setIsLoading2Tags(true)
    setResult2Tags(null)

    try {
      const response = await fetch("/api/pagarme/create-plan-trimestral-2tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        setResult2Tags({ success: true, planId: data.plan_id })
      } else {
        setResult2Tags({ success: false, error: data.error || "Erro ao criar plano" })
      }
    } catch (error) {
      setResult2Tags({ success: false, error: "Erro de conexão" })
    } finally {
      setIsLoading2Tags(false)
    }
  }

  const handleCreatePlan3Tags = async () => {
    setIsLoading3Tags(true)
    setResult3Tags(null)

    try {
      const response = await fetch("/api/pagarme/create-plan-trimestral-3tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        setResult3Tags({ success: true, planId: data.plan_id })
      } else {
        setResult3Tags({ success: false, error: data.error || "Erro ao criar plano" })
      }
    } catch (error) {
      setResult3Tags({ success: false, error: "Erro de conexão" })
    } finally {
      setIsLoading3Tags(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Criar Planos Pagar.me</h1>
        
        {/* Plano 2 Tags */}
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <div className="bg-orange-50 rounded-lg p-4 mb-4">
            <h2 className="font-semibold text-gray-700 mb-2">Plano 2 Tags:</h2>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Nome:</strong> Petloo Trimestral + 2 Tags - 30 Dias Grátis</li>
              <li><strong>Tipo:</strong> Pré-pago</li>
              <li><strong>Periodicidade:</strong> A cada 3 meses</li>
              <li><strong>Trial:</strong> 30 dias</li>
              <li><strong>Valor:</strong> R$ 102,00/trimestre</li>
              <li><strong>Pagamento:</strong> Cartão de crédito</li>
            </ul>
          </div>

          <button
            onClick={handleCreatePlan2Tags}
            disabled={isLoading2Tags}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading2Tags ? "Criando plano..." : "Criar Plano Trimestral + 2 Tags"}
          </button>

          {result2Tags && (
            <div className={`mt-4 p-4 rounded-lg ${result2Tags.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {result2Tags.success ? (
                <>
                  <p className="font-semibold">Plano criado com sucesso!</p>
                  <p className="text-sm mt-1">ID do Plano: <code className="bg-green-200 px-1 rounded">{result2Tags.planId}</code></p>
                  <p className="text-xs mt-2">Copie este ID e configure na variável de ambiente se necessário.</p>
                </>
              ) : (
                <p>Erro: {result2Tags.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Plano 3 Tags */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h2 className="font-semibold text-gray-700 mb-2">Plano 3 Tags:</h2>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Nome:</strong> Petloo Trimestral + 3 Tags - 30 Dias Grátis</li>
              <li><strong>Tipo:</strong> Pré-pago</li>
              <li><strong>Periodicidade:</strong> A cada 3 meses</li>
              <li><strong>Trial:</strong> 30 dias</li>
              <li><strong>Valor:</strong> R$ 111,00/trimestre</li>
              <li><strong>Pagamento:</strong> Cartão de crédito</li>
            </ul>
          </div>

          <button
            onClick={handleCreatePlan3Tags}
            disabled={isLoading3Tags}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading3Tags ? "Criando plano..." : "Criar Plano Trimestral + 3 Tags"}
          </button>

          {result3Tags && (
            <div className={`mt-4 p-4 rounded-lg ${result3Tags.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {result3Tags.success ? (
                <>
                  <p className="font-semibold">Plano criado com sucesso!</p>
                  <p className="text-sm mt-1">ID do Plano: <code className="bg-green-200 px-1 rounded">{result3Tags.planId}</code></p>
                  <p className="text-xs mt-2">Copie este ID e configure na variável de ambiente se necessário.</p>
                </>
              ) : (
                <p>Erro: {result3Tags.error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
