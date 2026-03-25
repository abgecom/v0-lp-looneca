"use client"

import { useState } from "react"

export default function CriarPlanoTrimestralPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; data?: unknown; error?: string } | null>(null)

  const handleCreatePlan = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/pagarme/create-plan-trimestral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, data })
      } else {
        setResult({ success: false, error: data.error || "Erro ao criar plano" })
      }
    } catch (error) {
      setResult({ success: false, error: "Erro de conexão" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Criar Plano Trimestral na Pagar.me
          </h1>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Configuração do Plano:</h2>
            <ul className="space-y-2 text-gray-700">
              <li><strong>Nome:</strong> Petloo Trimestral + Tag - 30 Dias Grátis</li>
              <li><strong>Descrição:</strong> Assinatura trimestral com 30 dias grátis de teste</li>
              <li><strong>Tipo:</strong> Pré-pago</li>
              <li><strong>Periodicidade:</strong> A cada 3 meses</li>
              <li><strong>Trial:</strong> 30 dias</li>
              <li><strong>Valor:</strong> R$ 90,15</li>
              <li><strong>Forma de Pagamento:</strong> Cartão de crédito</li>
            </ul>
          </div>

          <button
            onClick={handleCreatePlan}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? "Criando Plano..." : "Criar Plano Trimestral"}
          </button>

          {result && (
            <div className={`mt-6 p-4 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              {result.success ? (
                <div>
                  <h3 className="text-green-800 font-semibold mb-2">Plano criado com sucesso!</h3>
                  <pre className="text-sm text-green-700 overflow-auto max-h-64 bg-green-100 p-3 rounded">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div>
                  <h3 className="text-red-800 font-semibold">Erro ao criar plano</h3>
                  <p className="text-red-700">{result.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
