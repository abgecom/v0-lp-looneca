import { createPetlooPlan } from "../actions/subscription-actions"

/**
 * Este script cria o plano de assinatura na Pagar.me
 * Deve ser executado apenas uma vez
 * O ID do plano retornado deve ser armazenado para uso futuro
 */
async function main() {
  console.log("Criando plano de assinatura na Pagar.me...")

  const result = await createPetlooPlan()

  if (result.success) {
    console.log("Plano criado com sucesso!")
    console.log("ID do plano:", result.planId)
    console.log("Guarde este ID para uso futuro na função createPetlooSubscription")
  } else {
    console.error("Erro ao criar plano:", result.error)
  }
}

main().catch(console.error)
