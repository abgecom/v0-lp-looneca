import { createPetlooPlan } from "../actions/create-plan"

/**
 * Este script cria o plano de assinatura na Pagar.me
 * Deve ser executado apenas uma vez
 * O ID do plano retornado deve ser armazenado como variável de ambiente PETLOO_PLAN_ID
 */
async function main() {
  console.log("=== CRIAÇÃO DE PLANO DE ASSINATURA PETLOO ===")
  console.log("Iniciando processo de criação do plano na Pagar.me...")

  try {
    const result = await createPetlooPlan()

    if (result.success) {
      console.log("\n✅ SUCESSO! Plano criado com sucesso!")
      console.log(`🔑 ID do plano: ${result.planId}`)
      console.log("\n⚠️ IMPORTANTE: Adicione este ID como variável de ambiente:")
      console.log(`PETLOO_PLAN_ID=${result.planId}`)
      console.log("\nEste ID deve ser configurado no painel da Vercel ou no arquivo .env")
    } else {
      console.error("\n❌ ERRO: Falha ao criar o plano")
      console.error(`Detalhes do erro: ${result.error}`)
    }
  } catch (error) {
    console.error("\n❌ ERRO FATAL: Exceção não tratada")
    console.error(error)
  }

  console.log("\n=== FIM DO PROCESSO ===")
}

// Executar a função principal
main()
  .then(() => {
    console.log("Script finalizado.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Erro fatal no script:", error)
    process.exit(1)
  })
