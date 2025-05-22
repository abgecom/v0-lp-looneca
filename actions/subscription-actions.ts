"use server"

// Pagar.me API keys - usando variáveis de ambiente de forma segura
const PAGARME_API_KEY = process.env.PAGARME_API_KEY!
const PAGARME_ACCOUNT_ID = process.env.PAGARME_ACCOUNT_ID!
const PETLOO_PLAN_ID = process.env.PETLOO_PLAN_ID! // ID do plano armazenado em variável de ambiente

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
    console.log(`Iniciando criação de assinatura para Customer: ${customerId}, Card: ${cardId}`)

    // Verificar se as variáveis de ambiente estão definidas
    if (!PAGARME_API_KEY || !PAGARME_ACCOUNT_ID || !PETLOO_PLAN_ID) {
      console.error("Pagar.me environment variables are not properly configured")
      console.error(`PAGARME_API_KEY: ${!!PAGARME_API_KEY}`)
      console.error(`PAGARME_ACCOUNT_ID: ${!!PAGARME_ACCOUNT_ID}`)
      console.error(`PETLOO_PLAN_ID: ${!!PETLOO_PLAN_ID}`)
      return {
        success: false,
        error: "Configuração de pagamento incompleta.",
      }
    }

    // Verificar se o cardId foi fornecido
    if (!cardId) {
      console.error("Card ID não fornecido para criação da assinatura")
      return {
        success: false,
        error: "ID do cartão não fornecido para criação da assinatura.",
      }
    }

    // Verificar se o customerId foi fornecido
    if (!customerId) {
      console.error("Customer ID não fornecido para criação da assinatura")
      return {
        success: false,
        error: "ID do cliente não fornecido para criação da assinatura.",
      }
    }

    // Calcular a data de vencimento (30 dias a partir de hoje)
    const firstDueDate = new Date()
    firstDueDate.setDate(firstDueDate.getDate() + 30)
    const formattedDueDate = firstDueDate.toISOString().split("T")[0] // Formato YYYY-MM-DD

    // Payload para a criação da assinatura
    const subscriptionPayload = {
      customer_id: customerId,
      plan_id: PETLOO_PLAN_ID,
      card_id: cardId,
      billing_type: "prepaid",
      first_due_date: formattedDueDate,
      metadata: {
        created_by: "looneca_checkout",
        plan_name: "Petloo Monthly Subscription",
        amount_cents: 3090, // R$ 30,90
      },
    }

    console.log("Enviando payload para criação de assinatura:", JSON.stringify(subscriptionPayload, null, 2))

    // Criar a assinatura na Pagar.me
    const response = await fetch("https://api.pagar.me/core/v5/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(PAGARME_API_KEY + ":").toString("base64")}`,
        "X-Account-Id": PAGARME_ACCOUNT_ID,
      },
      body: JSON.stringify(subscriptionPayload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Pagar.me API error (subscriptions):", errorData)
      return {
        success: false,
        error: errorData.message || "Erro ao criar assinatura.",
      }
    }

    const data = await response.json()
    console.log("Assinatura criada com sucesso:", JSON.stringify(data, null, 2))

    // Armazenar a assinatura no Supabase
    if (supabase) {
      const { error: supabaseError } = await supabase.from("subscriptions").insert({
        subscription_id: data.id,
        customer_id: customerId,
        card_id: cardId,
        plan_id: PETLOO_PLAN_ID,
        status: data.status,
        first_due_date: formattedDueDate,
        amount: 3090, // Valor em centavos (R$ 30,90)
        created_at: new Date().toISOString(),
        metadata: {
          plan_name: "Petloo Monthly Subscription",
          created_by: "looneca_checkout",
        },
      })

      if (supabaseError) {
        console.error("Erro ao armazenar assinatura no Supabase:", supabaseError)
        // Não interrompemos o fluxo, apenas logamos o erro
      } else {
        console.log("Assinatura armazenada no Supabase com sucesso")
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
