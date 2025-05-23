import { createPetlooPlan } from "../actions/create-plan"

/**
 * Este script cria o plano de assinatura na nova conta Pagar.me
 * Deve ser executado apenas uma vez
 * O ID do plano retornado deve ser armazenado como variável de ambiente PETLOO_PLAN_ID
 */
async function main() {
  console.log("=== CRIAÇÃO DE PLANO DE ASSINATURA PETLOO - NOVA CONTA ===")
  console.log("Iniciando processo de criação do plano na nova conta Pagar.me...")

  try {
    const result = await createPetlooPlan()

    if (result.success) {
      console.log("\n✅ SUCESSO! Plano criado com sucesso!")
      console.log(`🔑 ID do plano: ${result.planId}`)
      console.log("\n⚠️ IMPORTANTE: Adicione este ID como variável de ambiente:")
      console.log(`PETLOO_PLAN_ID=${result.planId}`)
      console.log("\nEste ID deve ser configurado no painel da Vercel ou no arquivo .env")
      console.log("\n📋 PRÓXIMOS PASSOS:")
      console.log("1. Atualizar a variável PETLOO_PLAN_ID com o ID acima")
      console.log("2. Configurar webhook na nova conta: https://lpl.petloo.com.br/api/webhooks/pagarme")
      console.log("3. Marcar os eventos: charge.paid, charge.failed")
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
