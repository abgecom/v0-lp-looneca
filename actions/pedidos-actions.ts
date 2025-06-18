"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Inicializar cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

export interface PedidoItem {
  id: string
  name: string
  color: string
  petCount: number
  quantity: number
  price: number
  imageSrc: string
  productId?: string
  variantId?: string
  sku?: string
}

export interface PedidoData {
  customer: {
    email: string
    name: string
    phone: string
    cpf: string
    cep: string
    cidade: string
    estado: string
    endereco: string
    numero: string
    complemento?: string
    bairro: string
  }
  itens: PedidoItem[]
  recorrentes: {
    appPetloo: boolean
    loobook: boolean
  }
  pagamento: {
    metodo: string
    total: number
    id: string
    status: string
    data: string
  }
  fotos?: any
  raca?: string
  observacoes?: string
}

export async function criarPedido(data: PedidoData, req?: Request) {
  try {
    console.log("=== DEBUG CRIAR PEDIDO (COM TRIGGER ATIVO) ===")
    console.log("Dados recebidos (data):", JSON.stringify(data, null, 2))

    const { data: ultimoPedido, error: queryError } = await supabase
      .from("pedidos")
      .select("pedido_numero")
      .order("pedido_numero", { ascending: false })
      .limit(1)

    if (queryError) {
      console.error("Erro ao consultar último pedido:", queryError)
      return { success: false, error: "Erro ao gerar número do pedido" }
    }

    const novoNumero = ultimoPedido && ultimoPedido.length > 0 ? ultimoPedido[0].pedido_numero + 1 : 1001
    const { customer, itens, recorrentes, pagamento } = data
    const itensEscolhidos: PedidoItem[] = itens // Estes são os itens que vão para a coluna jsonb

    // Não precisamos mais extrair productIds, variantIds, skus aqui para popular colunas separadas.
    // O trigger do banco de dados fará isso a partir de 'itens_escolhidos'.

    let fotos = data.fotos
    let raca = data.raca
    let observacoes = data.observacoes
    const cookieStore = cookies()
    const petDataCookie = cookieStore.get("looneca-pet-data")

    if (petDataCookie) {
      try {
        const petData = JSON.parse(petDataCookie.value)
        fotos = fotos || petData.photos
        raca = raca || petData.typeBreed
        observacoes = observacoes || petData.notes
      } catch (error) {
        console.error("Erro ao analisar cookie de dados do pet:", error)
      }
    }

    if ((!fotos || !raca) && customer.email) {
      const { data: pedidosDataDb, error: pedidosErrorDb } = await supabase
        .from("looneca_pedidos")
        .select("fotos_urls, tipo_raca_pet, observacao")
        .eq("email_cliente", customer.email)
        .order("data_criacao", { ascending: false })
        .limit(1)
      if (!pedidosErrorDb && pedidosDataDb && pedidosDataDb.length > 0) {
        fotos = fotos || pedidosDataDb[0].fotos_urls
        raca = raca || pedidosDataDb[0].tipo_raca_pet
        observacoes = observacoes || pedidosDataDb[0].observacao
      }
    }

    const dadosParaInserir = {
      pedido_numero: novoNumero,
      email_cliente: customer.email,
      nome_cliente: customer.name,
      telefone_cliente: customer.phone,
      cpf_cliente: customer.cpf,
      cep_cliente: customer.cep,
      cidade_cliente: customer.cidade,
      estado_cliente: customer.estado,
      endereco_cliente: customer.endereco,
      numero_residencia_cliente: customer.numero,
      complemento_cliente: customer.complemento || "",
      bairro_cliente: customer.bairro,
      itens_escolhidos: itensEscolhidos, // O trigger usará esta coluna
      produtos_recorrentes: recorrentes,
      metodo_pagamento: pagamento.metodo,
      total_pago: pagamento.total,
      id_pagamento: pagamento.id,
      status_pagamento: pagamento.status,
      data_pagamento: pagamento.data,
      atualizacao_pagamento: pagamento.data,
      fotos_pet: fotos || null,
      raca_pet: raca || "",
      // As colunas product_ids, variant_ids, skus serão populadas pelo trigger
    }

    console.log("--- OBJETO PARA INSERÇÃO (trigger irá popular IDs) ---", JSON.stringify(dadosParaInserir, null, 2))

    const { data: novoPedido, error: insertError } = await supabase.from("pedidos").insert(dadosParaInserir).select(
      // Mantemos o select explícito para verificar o resultado
      "id, pedido_numero, email_cliente, nome_cliente, telefone_cliente, cpf_cliente, cep_cliente, cidade_cliente, estado_cliente, endereco_cliente, numero_residencia_cliente, complemento_cliente, bairro_cliente, itens_escolhidos, produtos_recorrentes, metodo_pagamento, total_pago, id_pagamento, status_pagamento, data_pagamento, atualizacao_pagamento, fotos_pet, raca_pet, criado_em, custumer, product_ids, variant_ids, skus",
    )

    if (insertError) {
      console.error("!!! ERRO AO INSERIR PEDIDO (COM TRIGGER):", JSON.stringify(insertError, null, 2))
      return { success: false, error: "Erro ao criar pedido no banco de dados" }
    }

    if (novoPedido && novoPedido.length > 0) {
      console.log("✅ PEDIDO CRIADO (COM TRIGGER) - Detalhes dos Arrays Retornados pelo SELECT:")
      console.log("Retorned product_ids:", JSON.stringify(novoPedido[0].product_ids))
      console.log("Retorned variant_ids:", JSON.stringify(novoPedido[0].variant_ids))
      console.log("Retorned skus:", JSON.stringify(novoPedido[0].skus))
      console.log("Objeto completo retornado:", JSON.stringify(novoPedido[0], null, 2))
    } else {
      console.log("⚠️ PEDIDO CRIADO (COM TRIGGER), MAS NENHUM DADO RETORNADO PELO SELECT.")
    }

    return { success: true, pedido: novoPedido ? novoPedido[0] : null }
  } catch (error) {
    console.error("!!! ERRO GERAL NA FUNÇÃO CRIARPEDIDO (COM TRIGGER):", error)
    return { success: false, error: "Erro interno ao processar pedido" }
  }
}

export async function getPedidoByIdPagamento(idPagamento: string) {
  try {
    const { data: pedido, error } = await supabase.from("pedidos").select("*").eq("id_pagamento", idPagamento).single()
    if (error) {
      console.error("Erro ao buscar pedido por ID de pagamento:", error)
      return { success: false, error: "Pedido não encontrado" }
    }
    return { success: true, data: pedido }
  } catch (error) {
    console.error("Erro interno ao buscar pedido por ID de pagamento:", error)
    return { success: false, error: "Erro interno ao buscar pedido" }
  }
}
