/**
 * Calcula o preço total em centavos para Loonecas com base na quantidade de pets e quantidade de canecas
 * @param quantidadeDePets Número de pets em cada Looneca
 * @param quantidadeDeLoonecas Número total de Loonecas no pedido
 * @returns Preço total em centavos
 */
export function calcularPrecoLoonecaEmCentavos(quantidadeDePets: number, quantidadeDeLoonecas: number): number {
  // Preço base por pet em centavos (R$ 50,00)
  const precoPorPet = 5000

  // Calcula o preço unitário baseado na quantidade de pets
  const precoUnitario = quantidadeDePets * precoPorPet

  // Calcula o preço total multiplicando pelo número de Loonecas
  const precoTotal = precoUnitario * quantidadeDeLoonecas

  // Garante que o valor seja pelo menos 1 centavo
  return Math.max(precoTotal, 1)
}

/**
 * Calcula o preço unitário em centavos para cada Looneca
 * @param quantidadeDePets Número de pets em cada Looneca
 * @returns Preço unitário em centavos
 */
export function calcularPrecoUnitarioEmCentavos(quantidadeDePets: number): number {
  // Preço base por pet em centavos (R$ 50,00)
  const precoPorPet = 5000

  // Calcula o preço unitário baseado na quantidade de pets
  const precoUnitario = quantidadeDePets * precoPorPet

  // Garante que o valor seja pelo menos 1 centavo
  return Math.max(precoUnitario, 1)
}
