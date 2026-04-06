"use client"

import { useState } from "react"

export default function CriarPlanoTrimestral2TagsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; planId?: string; error?: string } | null>(null)

  const handleCreatePlan = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/pagarme/create-plan-trimestral-2tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, planId: data.id })
      } else {
        setResult({ success: false, error: data.error || "Erro ao criar plano" })
      }
    } catch (error) {
      setResult({ success: false, error: "Erro de conexão" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Criar Plano Pagar.me</h1>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-gray-700 mb-2">Detalhes do Plano:</h2>
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
          onClick={handleCreatePlan}
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {isLoading ? "Criando plano..." : "Criar Plano Trimestral + 2 Tags"}
        </button>

        {result && (
          <div className={`mt-4 p-4 rounded-lg ${result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {result.success ? (
              <>
                <p className="font-semibold">Plano criado com sucesso!</p>
                <p className="text-sm mt-1">ID do Plano: <code className="bg-green-200 px-1 rounded">{result.planId}</code></p>
                <p className="text-xs mt-2">Copie este ID e configure na variável de ambiente se necessário.</p>
              </>
            ) : (
              <p>Erro: {result.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
