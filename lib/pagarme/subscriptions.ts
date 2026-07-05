import { createClient } from "@supabase/supabase-js"
import { pagarmeRequest } from "./api"
import { PAGARME_CONFIG } from "./config"

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { persistSession: false } },
)

interface SubscriptionCustomer {
  name: string
  email: string
  phone: string
  cpf: string
}

interface SubscriptionShipping {
  cep: string
  address: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
}

interface SubscriptionCard {
  number: string
  holderName: string
  expirationDate: string
  cvv: string
}

export interface CreateLooAppSubscriptionResult {
  success: boolean
  subscriptionId?: string
  subscriptionCustomerId?: string
  cardId?: string
  error?: string
}

/**
 * Cria customer + card + assinatura do LooApp na Pagar.me e registra em
 * pagarme_transactions. Usado tanto no checkout principal (cartão + LooApp
 * marcado) quanto na ativação retroativa via upsell (pedido original pago
 * por PIX, assinatura nunca ativada, cliente cadastra cartão no upsell).
 *
 * Não lança erro: falhas retornam { success: false, error }, para não
 * bloquear o fluxo de pagamento/upsell que já foi aprovado.
 */
export async function createLooAppSubscription(params: {
  customer: SubscriptionCustomer
  shipping: SubscriptionShipping
  card: SubscriptionCard
  orderId: string
}): Promise<CreateLooAppSubscriptionResult> {
  const { customer, shipping, card, orderId } = params

  try {
    // Step 1: Criar customer na Pagar.me
    const customerPayload = {
      name: customer.name,
      email: customer.email,
      document: customer.cpf.replace(/\D/g, ""),
      document_type: "CPF",
      type: "individual",
      phones: {
        mobile_phone: {
          country_code: "55",
          area_code: customer.phone.replace(/\D/g, "").slice(0, 2),
          number: customer.phone.replace(/\D/g, "").slice(2),
        },
      },
      address: {
        country: "BR",
        state: shipping.state,
        city: shipping.city,
        neighborhood: shipping.neighborhood,
        street: shipping.address,
        street_number: shipping.number,
        complement: shipping.complement || "",
        zip_code: shipping.cep.replace(/\D/g, ""),
      },
    }

    const customerResult = await pagarmeRequest(PAGARME_CONFIG.ENDPOINTS.CUSTOMERS, {
      method: "POST",
      body: customerPayload,
    })

    if (!customerResult.success) {
      return { success: false, error: `Customer creation failed: ${customerResult.error}` }
    }

    const customerId = customerResult.data.id

    // Step 2: Salvar cartao no customer
    const [expMonth, expYear] = card.expirationDate.split("/")
    const cardPayload = {
      number: card.number.replace(/\s/g, ""),
      holder_name: card.holderName,
      exp_month: Number.parseInt(expMonth, 10),
      exp_year: Number.parseInt(`20${expYear}`, 10),
      cvv: card.cvv,
      billing_address: {
        country: "BR",
        state: shipping.state,
        city: shipping.city,
        neighborhood: shipping.neighborhood,
        street: shipping.address,
        street_number: shipping.number,
        complement: shipping.complement || "",
        zip_code: shipping.cep.replace(/\D/g, ""),
        line_1: `${shipping.number}, ${shipping.address}, ${shipping.neighborhood}`,
        line_2: shipping.complement || "",
      },
    }

    const cardResult = await pagarmeRequest(
      `${PAGARME_CONFIG.ENDPOINTS.CUSTOMERS}/${customerId}${PAGARME_CONFIG.ENDPOINTS.CARDS}`,
      { method: "POST", body: cardPayload },
    )

    if (!cardResult.success) {
      return { success: false, error: `Card creation failed: ${cardResult.error}` }
    }

    const cardId = cardResult.data.id

    // Step 3: Criar assinatura com o plano existente
    const subscriptionPayload = {
      customer_id: customerId,
      plan_id: PAGARME_CONFIG.subscription.planId,
      card_id: cardId,
      billing_type: "prepaid",
      statement_descriptor: "PETLOO",
      metadata: {
        customer_name: customer.name,
        customer_email: customer.email,
        order_id: orderId,
        created_at: new Date().toISOString(),
      },
    }

    const subscriptionResult = await pagarmeRequest(PAGARME_CONFIG.ENDPOINTS.SUBSCRIPTIONS, {
      method: "POST",
      body: subscriptionPayload,
    })

    if (!subscriptionResult.success) {
      return { success: false, error: `Subscription creation failed: ${subscriptionResult.error}` }
    }

    const subscriptionId = subscriptionResult.data.id

    // Step 4: Salvar na tabela pagarme_transactions
    const { error: dbError } = await supabase.from("pagarme_transactions").insert({
      customer_id: customerId,
      card_id: cardId,
      order_id: orderId,
      subscription_id: subscriptionId,
      plan_id: PAGARME_CONFIG.subscription.planId,
      status: subscriptionResult.data.status || "active",
      customer_data: {
        name: customer.name,
        email: customer.email,
        cpf: customer.cpf,
        phone: customer.phone,
      },
      created_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error("[createLooAppSubscription] Erro ao salvar assinatura no Supabase:", dbError)
    }

    return {
      success: true,
      subscriptionId,
      subscriptionCustomerId: customerId,
      cardId,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao criar assinatura",
    }
  }
}
