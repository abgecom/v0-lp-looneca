/**
 * Calcula o preço total em centavos para Loonecas com base na quantidade de pets e quantidade de Loonecas
 * @param quantidadeDePets Número de pets em cada Looneca
 * @param quantidadeDeLoonecas Número total de Loonecas
 * @returns Preço total em centavos
 */
export function calcularPrecoLoonecaEmCentavos(quantidadeDePets: number, quantidadeDeLoonecas: number): number {
  const precoPorPet = 5000 // Exemplo: R$ 50,00 por pet
  const precoUnitario = quantidadeDePets * precoPorPet
  const precoTotal = precoUnitario * quantidadeDeLoonecas
  return precoTotal
}
