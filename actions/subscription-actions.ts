"use server"

// Inicializar o cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Pagar.me API keys - usando variáveis de ambiente de forma segura
const PAGARME_API_KEY = process.env.PAGARME_API_KEY!
const PAGARME_ACCOUNT_ID = process.env.PAGARME_ACCOUNT_ID!

/**
 * Cria um plano na Pagar.me
 * Esta função deve ser executada apenas uma vez para criar o plano
 * O ID do plano deve ser armazenado para uso futuro
 */
export async function createPetlooPlan(): Promise<{ success: boolean; planId?: string; error?: any }> {
  try {
    // Verificar se as variáveis de ambiente estão definidas
    if (!PAGARME_API_KEY || !PAGARME_ACCOUNT_ID) {
      console.error("Pagar.me environment variables are not properly configured")
      return {
        success: false,
        error: "Configuração de pagamento incompleta.",
      }
    }

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
          price: 3090,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Pagar.me API error:", errorData)
      return {
        success: false,
        error: errorData.message || "Erro ao criar plano.",
      }
    }

    const data = await response.json()
    console.log("Plano criado com sucesso:", data.id)

    return {
      success: true,
      planId: data.id,
    }
  } catch (error) {
    console.error("Error creating plan:", error)
    return {
      success: false,
      error: "Ocorreu um erro ao criar o plano.",
    }
  }
}

/**
 * Cria uma assinatura na Pagar.me
 * @param customerId ID do cliente na Pagar.me
 * @param cardId ID do cartão na Pagar.me
 * @param supabase Cliente Supabase para armazenar a assinatura
 * @returns Objeto com o resultado da operação
 */
export async function createPetlooSubscription(
  customerId: string,
  cardId: string,
  supabase: any,
): Promise<{ success: boolean; subscriptionId?: string; error?: any }> {
  try {
    // Verificar se as variáveis de ambiente estão definidas
    if (!PAGARME_API_KEY || !PAGARME_ACCOUNT_ID) {
      console.error("Pagar.me environment variables are not properly configured")
      return {
        success: false,
        error: "Configuração de pagamento incompleta.",
      }
    }

    // Calcular a data de vencimento (30 dias a partir de hoje)
    const firstDueDate = new Date()
    firstDueDate.setDate(firstDueDate.getDate() + 30)
    const formattedDueDate = firstDueDate.toISOString().split("T")[0] // Formato YYYY-MM-DD

    // ID do plano criado anteriormente - em produção, este valor deve ser armazenado em uma variável de ambiente
    // ou recuperado de um banco de dados
    const PLAN_ID = "plan_XXXXXXXXXXXXXXXX" // Substitua pelo ID real do plano criado

    // Criar a assinatura na Pagar.me
    const response = await fetch("https://api.pagar.me/core/v5/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ":").toString("base64")}`,
        "X-Account-Id": PAGARME_ACCOUNT_ID,
      },
      body: JSON.stringify({
        customer_id: customerId,
        card_id: cardId,
        plan_id: PLAN_ID,
        payment_method: "credit_card",
        billing_type: "prepaid",
        first_due_date: formattedDueDate,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Pagar.me API error:", errorData)
      return {
        success: false,
        error: errorData.message || "Erro ao criar assinatura.",
      }
    }

    const data = await response.json()
    console.log("Assinatura criada com sucesso:", data.id)

    // Armazenar a assinatura no Supabase
    if (supabase) {
      const { error: supabaseError } = await supabase.from("subscriptions").insert({
        subscription_id: data.id,
        customer_id: customerId,
        status: data.status,
        first_due_date: formattedDueDate,
        amount: 3090, // Valor em centavos (R$ 30,90)
        created_at: new Date().toISOString(),
      })

      if (supabaseError) {
        console.error("Erro ao armazenar assinatura no Supabase:", supabaseError)
        // Não interrompemos o fluxo, apenas logamos o erro
      }
    }

    return {
      success: true,
      subscriptionId: data.id,
    }
  } catch (error) {
    console.error("Error creating subscription:", error)
    return {
      success: false,
      error: "Ocorreu um erro ao criar a assinatura.",
    }
  }
}
