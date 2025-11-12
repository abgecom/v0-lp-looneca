"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

interface UpsellData {
  email: string
  tipoRacaPet: string
  fotosUrls: string[]
  observacao?: string
}

export async function salvarDadosUpsell(data: UpsellData) {
  try {
    // Validar dados obrigatórios
    if (!data.email) {
      return { success: false, error: "E-mail é obrigatório" }
    }

    if (!data.tipoRacaPet) {
      return { success: false, error: "Tipo e raça do pet são obrigatórios" }
    }

    if (!data.fotosUrls || data.fotosUrls.length === 0) {
      return { success: false, error: "É necessário enviar pelo menos uma foto do pet" }
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return { success: false, error: "E-mail inválido" }
    }

    console.log("[v0] Salvando dados de upsell:", data)

    // Inserir na tabela looneca_upsell_data
    const { data: upsellData, error } = await supabase
      .from("looneca_upsell_data")
      .insert({
        email_cliente: data.email,
        tipo_raca_pet: data.tipoRacaPet,
        fotos_urls: data.fotosUrls,
        observacao: data.observacao || null,
      })
      .select()

    if (error) {
      console.error("[v0] Erro ao salvar dados de upsell:", error)
      return { success: false, error: "Erro ao salvar dados. Tente novamente." }
    }

    console.log("[v0] Dados de upsell salvos com sucesso:", upsellData)

    // Revalidar a página
    revalidatePath("/upsell")

    return {
      success: true,
      message: "Dados enviados com sucesso!",
      upsellId: upsellData?.[0]?.id,
    }
  } catch (error) {
    console.error("[v0] Erro ao processar dados de upsell:", error)
    return { success: false, error: "Ocorreu um erro ao processar seus dados. Tente novamente." }
  }
}
