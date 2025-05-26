"use server"

import { createClient } from "@supabase/supabase-js"

// Inicializar cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

/**
 * Salva os dados do formulário inicial para uso posterior no checkout
 */
export async function salvarDadosFormularioInicial(
  email: string,
  petPhotos: string[],
  petTypeBreed: string,
  petNotes: string,
) {
  try {
    console.log("Salvando dados do formulário para:", email)

    // Verificar se já existe um registro para este email
    const { data: existingData, error: queryError } = await supabase
      .from("looneca_form_data")
      .select("id")
      .eq("email", email)
      .limit(1)

    if (queryError) {
      console.error("Erro ao verificar dados existentes:", queryError)
      throw new Error("Erro ao verificar dados existentes")
    }

    if (existingData && existingData.length > 0) {
      // Atualizar registro existente
      const { error: updateError } = await supabase
        .from("looneca_form_data")
        .update({
          pet_photos: petPhotos,
          pet_type_breed: petTypeBreed,
          pet_notes: petNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData[0].id)

      if (updateError) {
        console.error("Erro ao atualizar dados do formulário:", updateError)
        throw new Error("Erro ao atualizar dados do formulário")
      }

      console.log("Dados do formulário atualizados com sucesso")
    } else {
      // Inserir novo registro
      const { error: insertError } = await supabase.from("looneca_form_data").insert({
        email,
        pet_photos: petPhotos,
        pet_type_breed: petTypeBreed,
        pet_notes: petNotes,
      })

      if (insertError) {
        console.error("Erro ao inserir dados do formulário:", insertError)
        throw new Error("Erro ao inserir dados do formulário")
      }

      console.log("Dados do formulário inseridos com sucesso")
    }

    return { success: true }
  } catch (error) {
    console.error("Erro ao salvar dados do formulário:", error)
    return { success: false, error: "Erro ao salvar dados do formulário" }
  }
}

/**
 * Busca os dados do formulário inicial pelo email do cliente
 */
export async function buscarDadosFormularioInicial(email: string) {
  try {
    console.log("Buscando dados do formulário para o email:", email)

    const { data, error } = await supabase
      .from("looneca_form_data")
      .select("pet_photos, pet_type_breed, pet_notes")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Erro ao buscar dados do formulário:", error)
      return { success: false, error: "Erro ao buscar dados do formulário" }
    }

    if (!data || data.length === 0) {
      console.log("Nenhum dado do formulário encontrado para o email:", email)
      return { success: false, error: "Nenhum dado encontrado" }
    }

    console.log("Dados do formulário encontrados:", {
      totalFotos: data[0].pet_photos?.length || 0,
      raca: data[0].pet_type_breed,
    })

    return {
      success: true,
      petPhotos: data[0].pet_photos,
      petTypeBreed: data[0].pet_type_breed,
      petNotes: data[0].pet_notes,
    }
  } catch (error) {
    console.error("Erro ao buscar dados do formulário:", error)
    return { success: false, error: "Erro ao buscar dados do formulário" }
  }
}
