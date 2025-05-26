"use server"

import { createClient } from "@supabase/supabase-js"

// Inicializar cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

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
  itens: any[]
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
}

export async function criarPedido(data: PedidoData) {
  try {
    // Obter o último número de pedido
    const { data: ultimoPedido, error: queryError } = await supabase
      .from("pedidos")
      .select("pedido_numero")
      .order("pedido_numero", { ascending: false })
      .limit(1)

    if (queryError) {
      console.error("Erro ao consultar último pedido:", queryError)
      return { success: false, error: "Erro ao gerar número do pedido" }
    }

    // Gerar novo número de pedido
    const novoNumero = ultimoPedido && ultimoPedido.length > 0 ? ultimoPedido[0].pedido_numero + 1 : 1001

    const { customer, itens, recorrentes, pagamento, fotos, raca } = data

    // Inserir novo pedido
    const { data: novoPedido, error: insertError } = await supabase
      .from("pedidos")
      .insert({
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
        itens_escolhidos: itens,
        produtos_recorrentes: recorrentes,
        metodo_pagamento: pagamento.metodo,
        total_pago: pagamento.total,
        id_pagamento: pagamento.id,
        status_pagamento: pagamento.status,
        data_pagamento: pagamento.data,
        atualizacao_pagamento: pagamento.data,
        fotos_pet: fotos || null,
        raca_pet: raca || "",
      })
      .select()

    if (insertError) {
      console.error("Erro ao inserir pedido:", insertError)
      return { success: false, error: "Erro ao criar pedido" }
    }

    return { success: true, pedido: novoPedido[0] }
  } catch (error) {
    console.error("Erro ao criar pedido:", error)
    return { success: false, error: "Erro interno ao processar pedido" }
  }
}

// Função para buscar fotos de pet pelo email do cliente
export async function buscarFotosPetPorEmail(email: string) {
  try {
    const { data, error } = await supabase
      .from("looneca_pedidos")
      .select("fotos_urls, tipo_raca_pet, observacao")
      .eq("email", email)
      .order("data_criacao", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Erro ao buscar fotos do pet:", error)
      return { success: false, error: "Erro ao buscar fotos do pet" }
    }

    if (!data || data.length === 0) {
      return { success: false, error: "Nenhuma foto encontrada" }
    }

    return {
      success: true,
      fotos: data[0].fotos_urls,
      raca: data[0].tipo_raca_pet,
      observacao: data[0].observacao,
    }
  } catch (error) {
    console.error("Erro ao buscar fotos do pet:", error)
    return { success: false, error: "Erro interno ao buscar fotos" }
  }
}
