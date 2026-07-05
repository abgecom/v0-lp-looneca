// Preços base da Looneca por quantidade de pets — fonte única, usada tanto
// na página principal de venda quanto no upsell pós-compra (50% off destes valores).
export const PRECOS = {
  1: 169.9,
  2: 197.8,
  3: 225.7,
} as const

// Preços originais (riscados) por quantidade de pets, exibidos na página principal.
export const PRECOS_ORIGINAIS = {
  1: 229.0,
  2: 267.0,
  3: 305.0,
} as const

export type PetCount = keyof typeof PRECOS
