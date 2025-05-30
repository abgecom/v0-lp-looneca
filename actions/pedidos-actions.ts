import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for server-side actions

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Service Role Key is missing. Check environment variables.")
  // Consider throwing an error here if these are critical for the module to function
}

// Ensure Supabase client is initialized only if URL and Key are present
const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseKey!)

interface ItemEscolhido {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  petName?: string
  petGender?: string
  petBreed?: string
  mugColor?: string
  backgroundColor?: string
  backgroundImage?: string
  additionalInstructions?: string
  petImageKey?: string // S3 key for pet image
}

interface OrderData {
  nome_cliente: string
  email_cliente: string
  telefone_cliente: string
  cpf_cliente: string
  endereco_cliente: string
  numero_residencia_cliente: string
  complemento_cliente?: string
  bairro_cliente: string
  cidade_cliente: string
  estado_cliente: string
  cep_cliente: string
  metodo_pagamento: string
  total_pago: number
  itens_escolhidos: ItemEscolhido[]
  status_pagamento: string
  // Campos adicionais que podem vir do formulário ou serem calculados
  customer_id_pagarme?: string // ID do cliente no Pagarme
  charge_id_pagarme?: string // ID da cobrança no Pagarme
  order_id_pagarme?: string // ID do pedido no Pagarme
  valor_frete?: number
  // pedido_numero será gerado
}

// Função para gerar o próximo número de pedido
async function getNextPedidoNumero(): Promise<number> {
  if (!supabase) {
    throw new Error("Supabase client not initialized in getNextPedidoNumero.")
  }
  const { data, error } = await supabase
    .from("pedidos")
    .select("pedido_numero")
    .order("pedido_numero", { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116: "The result contains 0 rows"
    console.error("Erro ao buscar último número do pedido:", error)
    throw error
  }

  if (!data) {
    // Primeiro pedido
    return 1001 // Ou qualquer número inicial desejado
  }

  return (data.pedido_numero || 0) + 1
}

export async function criarPedido(orderData: OrderData) {
  if (!supabase) {
    console.error("Supabase client not initialized in criarPedido.")
    return { success: false, error: "Supabase client not initialized.", pedido: null, pedido_numero: null }
  }
  try {
    const novoNumeroPedido = await getNextPedidoNumero()

    const pedidoParaSalvar = {
      ...orderData,
      pedido_numero: novoNumeroPedido,
      data_criacao: new Date().toISOString(), // Adiciona data de criação
    }

    const { data: novoPedido, error: insertError } = await supabase
      .from("pedidos")
      .insert(pedidoParaSalvar)
      .select()
      .single()

    if (insertError) {
      console.error("Erro ao inserir pedido no Supabase:", insertError)
      return { success: false, error: "Erro ao salvar pedido no banco de dados.", pedido: null, pedido_numero: null }
    }

    console.log("Pedido criado com sucesso:", novoPedido)
    return { success: true, pedido: novoPedido, pedido_numero: novoNumeroPedido, error: null }
  } catch (error) {
    console.error("Erro inesperado ao criar pedido:", error)
    if (error instanceof Error) {
      return {
        success: false,
        error: `Erro interno ao criar pedido: ${error.message}`,
        pedido: null,
        pedido_numero: null,
      }
    }
    return { success: false, error: "Erro interno desconhecido ao criar pedido.", pedido: null, pedido_numero: null }
  }
}

export async function getPedidoByNumero(pedidoNumero: number) {
  if (isNaN(pedidoNumero)) {
    console.error("Número do pedido inválido:", pedidoNumero)
    return { success: false, error: "Número do pedido inválido", pedido: null }
  }
  if (!supabase) {
    console.error("Supabase client not initialized in getPedidoByNumero.")
    return { success: false, error: "Supabase client not initialized.", pedido: null }
  }

  try {
    const { data: pedidoData, error: queryError } = await supabase
      .from("pedidos")
      .select(`
        pedido_numero,
        nome_cliente,
        email_cliente,
        telefone_cliente,
        cpf_cliente,
        endereco_cliente,
        numero_residencia_cliente,
        complemento_cliente,
        bairro_cliente,
        cidade_cliente,
        estado_cliente,
        cep_cliente,
        metodo_pagamento,
        total_pago,
        itens_escolhidos,
        status_pagamento 
      `)
      .eq("pedido_numero", pedidoNumero)
      .single()

    if (queryError) {
      if (queryError.code === "PGRST116") {
        console.warn(`Pedido com número ${pedidoNumero} não encontrado.`)
        return { success: false, error: "Pedido não encontrado", pedido: null }
      }
      console.error(`Erro ao buscar pedido ${pedidoNumero}:`, queryError)
      return { success: false, error: "Erro ao buscar dados do pedido", pedido: null }
    }

    if (!pedidoData) {
      return { success: false, error: "Pedido não encontrado", pedido: null }
    }

    let subtotalItens = 0
    if (pedidoData.itens_escolhidos && Array.isArray(pedidoData.itens_escolhidos)) {
      pedidoData.itens_escolhidos.forEach((item: any) => {
        subtotalItens += (item.price || 0) * (item.quantity || 1)
      })
    }

    const freteEstimado = pedidoData.total_pago - subtotalItens

    const pedidoProcessado = {
      ...pedidoData,
      subtotal_itens: subtotalItens,
      valor_frete: freteEstimado < 0 ? 0 : freteEstimado,
    }

    return { success: true, pedido: pedidoProcessado, error: null }
  } catch (error) {
    console.error("Erro inesperado ao buscar pedido:", error)
    if (error instanceof Error) {
      return {
        success: false,
        error: `Erro interno ao processar solicitação do pedido: ${error.message}`,
        pedido: null,
      }
    }
    return { success: false, error: "Erro interno desconhecido ao processar solicitação do pedido.", pedido: null }
  }
}
