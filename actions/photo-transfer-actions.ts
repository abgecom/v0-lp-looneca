"use server"

import { createClient } from "@supabase/supabase-js"

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

export async function transferPhotosToOrder(orderData: {
  orderId: string
  customerEmail: string
  totalAmount: number
}) {
  try {
    console.log("Iniciando transferência de fotos para o pedido:", orderData.orderId)

    // Buscar os registros na tabela looneca_pedidos associados ao email do cliente
    // Ordenamos pelo mais recente, assumindo que o último pedido criado é o relevante
    const { data: pedidos, error: pedidosError } = await supabase
      .from("looneca_pedidos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)

    if (pedidosError) {
      console.error("Erro ao buscar pedidos de fotos:", pedidosError)
      return { success: false, error: "Erro ao buscar pedidos de fotos" }
    }

    if (!pedidos || pedidos.length === 0) {
      console.log("Nenhum pedido de foto encontrado para o cliente")
      return { success: false, error: "Nenhum pedido de foto encontrado" }
    }

    const ultimoPedido = pedidos[0]
    console.log("Último pedido de fotos encontrado:", ultimoPedido.id)

    // Verificar se o pedido tem fotos
    if (!ultimoPedido.fotos_urls || ultimoPedido.fotos_urls.length === 0) {
      console.log("Pedido não contém fotos para transferir")
      return { success: false, error: "Pedido não contém fotos" }
    }

    // Atualizar o registro na tabela looneca_orders
    const { error: updateError } = await supabase
      .from("looneca_orders")
      .update({
        pet_photos: ultimoPedido.fotos_urls,
        pet_type_breed: ultimoPedido.tipo_raca_pet,
        pet_notes: ultimoPedido.observacao,
      })
      .eq("order_id", orderData.orderId)

    if (updateError) {
      console.error("Erro ao atualizar pedido com fotos:", updateError)
      return { success: false, error: "Erro ao atualizar pedido com fotos" }
    }

    // Opcional: Atualizar o status do pedido de fotos para indicar que foi processado
    await supabase
      .from("looneca_pedidos")
      .update({ status_pagamento: "processado", order_id: orderData.orderId })
      .eq("id", ultimoPedido.id)

    console.log("Fotos transferidas com sucesso para o pedido:", orderData.orderId)
    return { success: true, message: "Fotos transferidas com sucesso" }
  } catch (error) {
    console.error("Erro ao transferir fotos para o pedido:", error)
    return { success: false, error: "Erro ao processar transferência de fotos" }
  }
}
