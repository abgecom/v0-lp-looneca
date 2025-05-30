"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

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
  observacoes?: string
}

// Função para obter os dados do pet armazenados no localStorage
async function getPetDataFromClient(req: Request) {
  try {
    // Tentativa de extrair o cabeçalho cookie
    const cookieHeader = req.headers.get("cookie")
    if (!cookieHeader) return null

    // Analisar os cookies
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((cookie) => {
        const [name, ...rest] = cookie.split("=")
        return [name, rest.join("=")]
      }),
    )

    // Extrair dados do pet
    const petDataCookie = cookies["looneca-pet-data"]
    if (!petDataCookie) return null

    // Decodificar e analisar JSON
    const decodedData = decodeURIComponent(petDataCookie)
    return JSON.parse(decodedData)
  } catch (error) {
    console.error("Erro ao obter dados do pet do cliente:", error)
    return null
  }
}

export async function criarPedido(data: PedidoData, req?: Request) {
  try {
    console.log("=== DEBUG CRIAR PEDIDO ===")
    console.log("Dados recebidos:", data)

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
    const novoNumero = ultimoPedido && ultimoPedido.length > 0 ? ultimoPedido[0].pedido_numero + 1 : 1045

    const { customer, itens, recorrentes, pagamento } = data

    // Se não temos fotos ou raça, tentar buscar do LocalStorage via cookies
    let fotos = data.fotos
    let raca = data.raca
    let observacoes = data.observacoes

    console.log("Dados iniciais do pedido:", { fotos, raca, observacoes })

    // Buscar os dados do carrinho armazenados no localStorage (via cookie)
    const cookieStore = cookies()
    const petDataCookie = cookieStore.get("looneca-pet-data")

    console.log("Cookie encontrado:", petDataCookie)

    if (petDataCookie) {
      try {
        const petData = JSON.parse(petDataCookie.value)
        console.log("Dados do pet recuperados do cookie:", petData)
        fotos = fotos || petData.photos
        raca = raca || petData.typeBreed
        observacoes = observacoes || petData.notes
        console.log("Dados após recuperação do cookie:", { fotos, raca, observacoes })
      } catch (error) {
        console.error("Erro ao analisar cookie de dados do pet:", error)
      }
    } else {
      console.log("Cookie de dados do pet não encontrado")
    }

    // Se ainda não temos os dados, tentar buscá-los do banco de dados usando o email
    if ((!fotos || !raca) && customer.email) {
      console.log("Tentando buscar dados do pet no banco de dados para o email:", customer.email)

      // Buscar na tabela looneca_pedidos
      const { data: pedidosData, error: pedidosError } = await supabase
        .from("looneca_pedidos")
        .select("fotos_urls, tipo_raca_pet, observacao")
        .order("data_criacao", { ascending: false })
        .limit(1)

      if (!pedidosError && pedidosData && pedidosData.length > 0) {
        console.log("Dados do pet encontrados na tabela looneca_pedidos:", pedidosData[0])
        fotos = fotos || pedidosData[0].fotos_urls
        raca = raca || pedidosData[0].tipo_raca_pet
        observacoes = observacoes || pedidosData[0].observacao
        console.log("Dados após recuperação do banco:", { fotos, raca, observacoes })
      } else {
        console.log("Nenhum dado encontrado na tabela looneca_pedidos:", pedidosError)
      }
    }

    console.log("Dados finais antes de inserir:", { fotos, raca, observacoes })

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

    console.log("Pedido criado com sucesso:", {
      pedidoNumero: novoNumero,
      email: customer.email,
      totalFotos: fotos ? (Array.isArray(fotos) ? fotos.length : "objeto") : "nenhuma",
      raca: raca || "não informada",
      pedidoInserido: novoPedido[0],
    })

    return { success: true, pedido: novoPedido[0] }
  } catch (error) {
    console.error("Erro ao criar pedido:", error)
    return { success: false, error: "Erro interno ao processar pedido" }
  }
}
