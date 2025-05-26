"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { salvarDadosFormularioInicial } from "./cart-data-actions"

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

interface LoonecaPedidoData {
  tipoRacaPet: string
  observacao?: string
  fotosUrls: string[]
  email?: string // Adicionado campo de email, mas não será salvo na tabela looneca_pedidos
}

export async function criarPedidoLooneca(data: LoonecaPedidoData) {
  try {
    // Validar dados
    if (!data.tipoRacaPet) {
      return { success: false, error: "Tipo e raça do pet são obrigatórios" }
    }

    if (!data.fotosUrls || data.fotosUrls.length === 0) {
      return { success: false, error: "É necessário enviar pelo menos uma foto do pet" }
    }

    // Se temos email, salvar os dados do formulário em uma tabela separada
    if (data.email) {
      try {
        await salvarDadosFormularioInicial(data.email, data.fotosUrls, data.tipoRacaPet, data.observacao || "")
        console.log("Dados do formulário salvos com sucesso para:", data.email)
      } catch (error) {
        console.error("Erro ao salvar dados do formulário:", error)
        // Não interromper o fluxo se falhar ao salvar os dados do formulário
      }
    }

    // Inserir na tabela looneca_pedidos (sem o email)
    const { data: pedido, error } = await supabase
      .from("looneca_pedidos")
      .insert({
        tipo_raca_pet: data.tipoRacaPet,
        observacao: data.observacao || null,
        fotos_urls: data.fotosUrls,
        status_pagamento: "pendente",
      })
      .select()

    if (error) {
      console.error("Erro ao criar pedido:", error)
      return { success: false, error: "Erro ao criar pedido. Tente novamente." }
    }

    // Revalidar a página para atualizar os dados
    revalidatePath("/")

    return {
      success: true,
      message: "Pedido criado com sucesso!",
      pedidoId: pedido?.[0]?.id,
    }
  } catch (error) {
    console.error("Erro ao processar pedido:", error)
    return { success: false, error: "Ocorreu um erro ao processar seu pedido. Tente novamente." }
  }
}
