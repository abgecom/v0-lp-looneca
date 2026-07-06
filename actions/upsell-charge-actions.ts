"use server"

import { createClient } from "@supabase/supabase-js"
import { pagarmeRequest, formatPhoneForPagarme, formatDocumentForPagarme } from "@/lib/pagarme/api"
import { PAGARME_CONFIG } from "@/lib/pagarme/config"
import { createLooAppSubscription } from "@/lib/pagarme/subscriptions"
import { attachUpsellToShopify } from "@/lib/shopify-order-service"
import { PRECOS, type PetCount } from "@/lib/pricing"
import { getVariantInfo } from "@/lib/variant-map"
import { getPedidoByIdPagamento, atualizarPagarmeTokens } from "@/actions/pedidos-actions"

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { persistSession: false } },
)

export type ChargeMode = "one_click" | "fresh_card"

export interface UpsellCard {
  number: string
  holderName: string
  expirationDate: string
  cvv: string
}

// ============================================================
// Localizar o pedido original
// ============================================================

export async function lookupOriginalPedido(input: { idPagamento?: string; email?: string }) {
  if (input.idPagamento) {
    const result = await getPedidoByIdPagamento(input.idPagamento)
    return result.success ? { success: true, pedido: result.data } : { success: false, error: result.error }
  }

  if (input.email) {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("email_cliente", input.email)
      .order("criado_em", { ascending: false })
      .limit(1)

    if (error) {
      console.error("[lookupOriginalPedido] Erro na busca por e-mail:", error)
      return { success: false, error: "Erro ao buscar pedido" }
    }

    if (!data || data.length === 0) {
      return { success: false, error: "Pedido não encontrado para esse e-mail" }
    }

    return { success: true, pedido: data[0] }
  }

  return { success: false, error: "Informe o id_pagamento ou o e-mail do pedido" }
}

// ============================================================
// Bloquear reuso do upsell
// ============================================================

export async function checkUpsellAlreadyUsed(pedidoNumeroOriginal: number) {
  const { data, error } = await supabase
    .from("looneca_upsell_data")
    .select("*")
    .eq("pedido_numero_original", pedidoNumeroOriginal)
    .in("status_pagamento_upsell", ["paid", "pending"])
    .limit(1)

  if (error) {
    console.error("[checkUpsellAlreadyUsed] Erro na consulta:", error)
    return { alreadyUsed: false, record: null }
  }

  return { alreadyUsed: !!(data && data.length > 0), record: data?.[0] || null }
}

// ============================================================
// Modo de cobrança e preço
// ============================================================

// Server Actions precisam ser async (exigência do Next.js para exports de
// arquivos "use server"), mesmo sendo funções puras sem I/O.
export async function determineChargeMode(pedido: any): Promise<ChargeMode> {
  if (pedido?.metodo_pagamento === "credit_card" && pedido?.pagarme_customer_id && pedido?.pagarme_card_id) {
    return "one_click"
  }
  return "fresh_card"
}

export async function calculateUpsellPrice(petCount: PetCount): Promise<number> {
  return Math.round(PRECOS[petCount] * 0.5 * 100) / 100
}

// ============================================================
// Cobrança do upsell
// ============================================================

export interface ChargeUpsellParams {
  originalPedido: any
  chargeMode: ChargeMode
  card?: UpsellCard
  color: string
  petCount: PetCount
  accessories: string[]
  breeds: string[]
  photos: string[]
  notes?: string
}

export interface ChargeUpsellResult {
  success: boolean
  error?: string
  idPagamentoUpsell?: string
  status?: string
}

export async function chargeUpsellOrder(params: ChargeUpsellParams): Promise<ChargeUpsellResult> {
  const { originalPedido, chargeMode, card, color, petCount, accessories, breeds, photos, notes } = params
  const pedidoNumeroOriginal = originalPedido.pedido_numero

  // Guarda de corrida: última checagem antes de cobrar
  const alreadyUsed = await checkUpsellAlreadyUsed(pedidoNumeroOriginal)
  if (alreadyUsed.alreadyUsed) {
    return { success: false, error: "Esta oferta já foi utilizada para este pedido." }
  }

  const price = await calculateUpsellPrice(petCount)
  const priceCents = Math.round(price * 100)

  // Insere uma linha "pending" ANTES de cobrar — o índice único parcial do
  // banco (pedido_numero_original + status pending/paid) barra tentativas
  // concorrentes (duplo clique / corrida) mesmo que a checagem acima passe.
  const { data: pendingRow, error: pendingError } = await supabase
    .from("looneca_upsell_data")
    .insert({
      email_cliente: originalPedido.email_cliente,
      tipo_raca_pet: breeds.join(", "),
      fotos_urls: photos,
      observacao: notes || null,
      cor: color,
      quantidade_pets: petCount,
      acessorios: accessories.join(", "),
      pedido_numero_original: pedidoNumeroOriginal,
      valor_pago_upsell: price,
      status_pagamento_upsell: "pending",
    })
    .select()

  if (pendingError || !pendingRow || pendingRow.length === 0) {
    console.error("[chargeUpsellOrder] Falha ao reservar upsell (possível corrida):", pendingError)
    return { success: false, error: "Esta oferta já está sendo processada ou já foi utilizada para este pedido." }
  }

  const upsellRowId = pendingRow[0].id

  try {
    const customerFields = {
      name: originalPedido.nome_cliente,
      email: originalPedido.email_cliente,
      phone: originalPedido.telefone_cliente,
      cpf: originalPedido.cpf_cliente,
    }
    const shippingFields = {
      cep: originalPedido.cep_cliente,
      address: originalPedido.endereco_cliente,
      number: originalPedido.numero_residencia_cliente,
      complement: originalPedido.complemento_cliente || "",
      neighborhood: originalPedido.bairro_cliente,
      city: originalPedido.cidade_cliente,
      state: originalPedido.estado_cliente,
    }

    const pagarmeShippingAddress = {
      country: "BR",
      state: shippingFields.state,
      city: shippingFields.city,
      neighborhood: shippingFields.neighborhood,
      street: shippingFields.address,
      street_number: shippingFields.number,
      complement: shippingFields.complement,
      zip_code: shippingFields.cep.replace(/\D/g, ""),
    }

    const orderItems = [
      {
        amount: priceCents,
        description: `Looneca Upsell - ${color} (${petCount} pet${petCount > 1 ? "s" : ""})`,
        quantity: 1,
        code: "LOONECA-UPSELL",
      },
    ]

    let paymentObj: any
    let orderCustomer: any

    if (chargeMode === "one_click") {
      orderCustomer = { id: originalPedido.pagarme_customer_id }
      paymentObj = {
        payment_method: "credit_card",
        credit_card: {
          installments: 1,
          card_id: originalPedido.pagarme_card_id,
        },
      }
    } else {
      if (!card) {
        throw new Error("Dados do cartão são obrigatórios para este pedido")
      }
      const [expMonth, expYear] = card.expirationDate.split("/")
      orderCustomer = {
        name: customerFields.name,
        email: customerFields.email,
        document: formatDocumentForPagarme(customerFields.cpf),
        document_type: "CPF",
        type: "individual",
        phones: { mobile_phone: formatPhoneForPagarme(customerFields.phone) },
        address: pagarmeShippingAddress,
      }
      paymentObj = {
        payment_method: "credit_card",
        credit_card: {
          installments: 1,
          card: {
            number: card.number.replace(/\s/g, ""),
            holder_name: card.holderName,
            exp_month: Number.parseInt(expMonth, 10),
            exp_year: Number.parseInt(`20${expYear}`, 10),
            cvv: card.cvv,
            billing_address: {
              ...pagarmeShippingAddress,
              line_1: `${shippingFields.number}, ${shippingFields.address}, ${shippingFields.neighborhood}`,
              line_2: shippingFields.complement,
            },
          },
        },
      }
    }

    const orderPayload = {
      items: orderItems,
      customer: orderCustomer,
      shipping: { amount: 0, description: "Reenvio junto ao pedido original", address: pagarmeShippingAddress },
      payments: [{ ...paymentObj, amount: priceCents }],
    }

    const orderResult = await pagarmeRequest(PAGARME_CONFIG.ENDPOINTS.ORDERS, {
      method: "POST",
      body: orderPayload,
    })

    if (!orderResult.success) {
      await supabase
        .from("looneca_upsell_data")
        .update({ status_pagamento_upsell: "failed" })
        .eq("id", upsellRowId)
      const errorMsg = typeof orderResult.error === "string" ? orderResult.error : "Erro ao processar pagamento."
      return { success: false, error: errorMsg }
    }

    const pagarmeOrder = orderResult.data
    const pagarmeOrderId = pagarmeOrder.id
    const orderStatus = pagarmeOrder.status || "pending"
    const charge = pagarmeOrder.charges?.[0]
    const newCustomerId: string | null = pagarmeOrder.customer?.id || null
    const newCardId: string | null = charge?.last_transaction?.card?.id || null

    // Atualiza a linha do upsell com o resultado do pagamento
    await supabase
      .from("looneca_upsell_data")
      .update({
        id_pagamento_upsell: pagarmeOrderId,
        status_pagamento_upsell: orderStatus,
      })
      .eq("id", upsellRowId)

    // --- Shopify: tenta anexar ao pedido original, com fallback ---
    try {
      const { sku } = getVariantInfo(color, petCount)
      const shopifyResult = await attachUpsellToShopify({
        originalShopifyOrderId: originalPedido.shopify_order_id || null,
        originalPedidoNumero: pedidoNumeroOriginal,
        customer: {
          name: customerFields.name,
          email: customerFields.email,
          phone: customerFields.phone,
        },
        title: `Looneca Upsell - ${color} (${petCount} pet${petCount > 1 ? "s" : ""})`,
        price,
        quantity: 1,
        properties: [
          { name: "Cor", value: color },
          { name: "Quantidade de Pets", value: String(petCount) },
          { name: "Raça(s)", value: breeds.join(", ") },
          { name: "Acessórios", value: accessories.join(", ") || "Nenhum" },
          { name: "SKU Referência", value: sku || "" },
        ],
      })

      if (shopifyResult.success) {
        await supabase
          .from("looneca_upsell_data")
          .update({ shopify_order_id: shopifyResult.shopifyOrderId })
          .eq("id", upsellRowId)
      } else {
        console.error("[chargeUpsellOrder] Falha ao registrar upsell na Shopify:", shopifyResult.error)
      }
    } catch (shopifyError) {
      // Não bloqueia o fluxo — o pagamento já foi aprovado
      console.error("[chargeUpsellOrder] Erro na integração Shopify (não bloqueia):", shopifyError)
    }

    // --- Ativação retroativa da assinatura LooApp (pedido original PIX + LooApp marcado) ---
    if (chargeMode === "fresh_card" && newCustomerId && newCardId) {
      try {
        const recorrentes = originalPedido.produtos_recorrentes || {}
        const needsSubscription = originalPedido.metodo_pagamento === "pix" && recorrentes.appPetloo === true

        if (needsSubscription) {
          const { data: existingSub } = await supabase
            .from("pagarme_transactions")
            .select("id")
            .eq("order_id", originalPedido.id_pagamento)
            .limit(1)

          if (!existingSub || existingSub.length === 0) {
            const subscriptionResult = await createLooAppSubscription({
              customer: customerFields,
              shipping: shippingFields,
              card: card as UpsellCard,
              orderId: originalPedido.id_pagamento,
            })

            if (subscriptionResult.success) {
              console.log("[chargeUpsellOrder] Assinatura LooApp ativada retroativamente:", subscriptionResult.subscriptionId)
              await atualizarPagarmeTokens(originalPedido.id_pagamento, newCustomerId, newCardId)
            } else {
              console.error("[chargeUpsellOrder] Falha ao ativar assinatura retroativa:", subscriptionResult.error)
            }
          }
        }
      } catch (subError) {
        console.error("[chargeUpsellOrder] Erro na ativação retroativa da assinatura (não bloqueia):", subError)
      }
    }

    return { success: true, idPagamentoUpsell: pagarmeOrderId, status: orderStatus }
  } catch (error) {
    await supabase
      .from("looneca_upsell_data")
      .update({ status_pagamento_upsell: "failed" })
      .eq("id", upsellRowId)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno ao processar o upsell",
    }
  }
}
