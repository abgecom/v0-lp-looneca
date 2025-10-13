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
  accessories?: string[]
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
  fotos?: string[]
  raca?: string
  observacoes?: string
  acessorios?: string
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
    const { customer, itens, recorrentes, pagamento, fotos, raca, observacoes, acessorios } = data
    const itensEscolhidos: PedidoItem[] = itens

    // === EXTRAÇÃO DOS DADOS DO PET ===
    let fotosPet = fotos || []
    let racaPet = raca || ""
    let observacoesPet = observacoes || ""
    let acessoriosPet = acessorios || ""

    // Fallback: tentar recuperar do cookie se não vieram nos dados
    const cookieStore = cookies()
    const petDataCookie = cookieStore.get("looneca-pet-data")

    if (petDataCookie && (!fotosPet.length || !racaPet || !acessoriosPet)) {
      try {
        const petData = JSON.parse(petDataCookie.value)
        fotosPet = fotosPet.length > 0 ? fotosPet : petData.photos || []
        racaPet = racaPet || petData.typeBreed || ""
        observacoesPet = observacoesPet || petData.notes || ""
        acessoriosPet = acessoriosPet || petData.accessories || ""
      } catch (error) {
        console.error("Erro ao analisar cookie de dados do pet:", error)
      }
    }

    // Fallback: buscar dados de pedidos anteriores do mesmo cliente
    if ((!fotosPet.length || !racaPet || !acessoriosPet) && customer.email) {
      const { data: pedidosDataDb, error: pedidosErrorDb } = await supabase
        .from("looneca_pedidos")
        .select("fotos_urls, tipo_raca_pet, observacao, acessorios")
        .eq("email_cliente", customer.email)
        .order("data_criacao", { ascending: false })
        .limit(1)
      if (!pedidosErrorDb && pedidosDataDb && pedidosDataDb.length > 0) {
        fotosPet = fotosPet.length > 0 ? fotosPet : pedidosDataDb[0].fotos_urls || []
        racaPet = racaPet || pedidosDataDb[0].tipo_raca_pet || ""
        observacoesPet = observacoesPet || pedidosDataDb[0].observacao || ""
        acessoriosPet = acessoriosPet || pedidosDataDb[0].acessorios || ""
      }
    }

    console.log("🚀 DEBUG fotos:", fotosPet)
    console.log("🚀 DEBUG raca:", racaPet)
    console.log("🚀 DEBUG observacoes:", observacoesPet)
    console.log("🚀 DEBUG acessorios:", acessoriosPet)

    // === VERIFICAÇÃO DE PEDIDO EXISTENTE ===
    const { data: existing } = await supabase.from("pedidos").select("*").eq("id_pagamento", pagamento.id).maybeSingle()

    if (existing) {
      const isIncomplete =
        existing.fotos_pet === null ||
        existing.raca_pet === "" ||
        existing.raca_pet === "EMPTY" ||
        existing.acessorios === ""
      const isNewComplete =
        fotosPet?.length > 0 || (racaPet && racaPet !== "" && racaPet !== "EMPTY") || acessoriosPet !== ""

      if (isIncomplete && isNewComplete) {
        console.log("⚠️ Substituindo pedido incompleto por um completo.")
        await supabase.from("pedidos").delete().eq("id", existing.id)
        // Depois segue com o insert do novo pedido normalmente
      } else {
        console.log("🚫 Pedido já existe e está completo. Ignorando novo.")
        return { success: true, pedido: existing }
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
      itens_escolhidos: itensEscolhidos,
      produtos_recorrentes: recorrentes,
      metodo_pagamento: pagamento.metodo,
      total_pago: pagamento.total,
      id_pagamento: pagamento.id,
      status_pagamento: pagamento.status,
      data_pagamento: pagamento.data,
      atualizacao_pagamento: pagamento.data,
      fotos_pet: fotosPet,
      raca_pet: racaPet,
      Acessorios: acessoriosPet,
      // As colunas product_ids, variant_ids, skus serão populadas pelo trigger
    }

    console.log("--- OBJETO PARA INSERÇÃO (trigger irá popular IDs) ---", JSON.stringify(dadosParaInserir, null, 2))

    const { data: novoPedido, error: insertError } = await supabase
      .from("pedidos")
      .insert(dadosParaInserir)
      .select(
        "id, pedido_numero, email_cliente, nome_cliente, telefone_cliente, cpf_cliente, cep_cliente, cidade_cliente, estado_cliente, endereco_cliente, numero_residencia_cliente, complemento_cliente, bairro_cliente, itens_escolhidos, produtos_recorrentes, metodo_pagamento, total_pago, id_pagamento, status_pagamento, data_pagamento, atualizacao_pagamento, fotos_pet, raca_pet, criado_em, custumer, product_ids, variant_ids, skus, Acessorios",
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
      console.log("✅ DADOS DO PET INSERIDOS:")
      console.log("fotos_pet:", JSON.stringify(novoPedido[0].fotos_pet))
      console.log("raca_pet:", novoPedido[0].raca_pet)
      console.log("Acessorios:", novoPedido[0].Acessorios)
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
    console.log("🔍 Buscando pedido por ID de pagamento:", idPagamento)

    // Primeiro, vamos buscar todos os registros para debug
    const { data: allPedidos, error: debugError } = await supabase
      .from("pedidos")
      .select("id, pedido_numero, id_pagamento")
      .eq("id_pagamento", idPagamento)

    if (debugError) {
      console.error("Erro na consulta de debug:", debugError)
    } else {
      console.log("📊 Registros encontrados:", allPedidos?.length || 0)
      console.log("📋 Dados encontrados:", JSON.stringify(allPedidos, null, 2))
    }

    // Agora fazemos a consulta principal
    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id_pagamento", idPagamento)
      .order("criado_em", { ascending: false }) // Pega o mais recente se houver múltiplos

    if (error) {
      console.error("Erro ao buscar pedido por ID de pagamento:", error)
      return { success: false, error: "Erro na consulta do pedido" }
    }

    if (!pedidos || pedidos.length === 0) {
      console.log("❌ Nenhum pedido encontrado para ID:", idPagamento)
      return { success: false, error: "Pedido não encontrado" }
    }

    if (pedidos.length > 1) {
      console.warn("⚠️ Múltiplos pedidos encontrados para ID:", idPagamento, "- Usando o mais recente")
    }

    const pedido = pedidos[0] // Pega o primeiro (mais recente devido ao order by)
    console.log("✅ Pedido encontrado:", pedido.pedido_numero)

    return { success: true, data: pedido }
  } catch (error) {
    console.error("Erro interno ao buscar pedido por ID de pagamento:", error)
    return { success: false, error: "Erro interno ao buscar pedido" }
  }
}
