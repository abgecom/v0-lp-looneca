"use server"

// Pagar.me API keys - usando variáveis de ambiente de forma segura
const PAGARME_API_KEY = process.env.PAGARME_API_KEY!
const PAGARME_ACCOUNT_ID = process.env.PAGARME_ACCOUNT_ID!

/**
 * Cria um plano na Pagar.me
 * Esta função deve ser executada apenas uma vez para criar o plano
 * O ID do plano deve ser armazenado para uso futuro como PETLOO_PLAN_ID
 */
export async function createPetlooPlan(): Promise<{ success: boolean; planId?: string; error?: any }> {
  try {
    // Verificar se as variáveis de ambiente estão definidas
    if (!PAGARME_API_KEY || !PAGARME_ACCOUNT_ID) {
      console.error("Pagar.me environment variables are not properly configured")
      return {
        success: false,
        error: "Configuração de pagamento incompleta. PAGARME_API_KEY e PAGARME_ACCOUNT_ID são necessários.",
      }
    }

    console.log("Iniciando criação do plano na Pagar.me...")

    // Realizar a requisição para criar o plano
    const response = await fetch("https://api.pagar.me/core/v5/plans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ":").toString("base64")}`,
        "X-Account-Id": PAGARME_ACCOUNT_ID,
      },
      body: JSON.stringify({
        name: "Assinatura Mensal - App Petloo + Loobook",
        billing_type: "prepaid",
        payment_methods: ["credit_card"],
        interval: "month",
        interval_count: 1,
        installments: 1,
        pricing_scheme: {
          price: 3090, // R$ 30,90 em centavos
        },
      }),
    })

    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      const errorData = await response.json()
      console.error("Erro ao criar plano na Pagar.me:", errorData)
      return {
        success: false,
        error: errorData.message || "Erro ao criar plano. Verifique os logs para mais detalhes.",
      }
    }

    // Processar a resposta bem-sucedida
    const data = await response.json()
    console.log("Plano criado com sucesso na Pagar.me!")
    console.log("ID do plano:", data.id)
    console.log("Nome do plano:", data.name)
    console.log("Preço:", data.pricing_scheme.price / 100, "reais")
    console.log("⚠️ IMPORTANTE: Defina este ID como variável de ambiente PETLOO_PLAN_ID")

    return {
      success: true,
      planId: data.id,
    }
  } catch (error) {
    console.error("Erro inesperado ao criar plano:", error)
    return {
      success: false,
      error: "Ocorreu um erro inesperado ao criar o plano. Verifique os logs para mais detalhes.",
    }
  }
}
