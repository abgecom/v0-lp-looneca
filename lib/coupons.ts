// Configuração de cupons de desconto
// Baseado nos cupons ativos do Shopify

export type CouponType = "order" | "products" | "collection" | "free_shipping"

export interface Coupon {
  code: string
  discountPercent: number
  type: CouponType
  description: string
  oneTimeUse: boolean // Um uso por cliente
  isActive: boolean
  minQuantity?: number // Quantidade mínima de itens
  collections?: string[] // Coleções aplicáveis (para tipo "collection")
  products?: string[] // Produtos aplicáveis (para tipo "products")
}

// Lista de cupons ativos
export const COUPONS: Coupon[] = [
  // === CUPONS DE DESCONTO NO PEDIDO INTEIRO ===
  { code: "OREOLOOS", discountPercent: 5, type: "order", description: "5% de desconto no pedido inteiro", oneTimeUse: false, isActive: true },
  { code: "ZEDLOOS", discountPercent: 5, type: "order", description: "5% de desconto no pedido inteiro", oneTimeUse: false, isActive: true },
  { code: "FINALIZE20", discountPercent: 10, type: "order", description: "10% de desconto no pedido inteiro", oneTimeUse: true, isActive: true },
  { code: "joaquim10", discountPercent: 10, type: "order", description: "10% de desconto no pedido inteiro", oneTimeUse: false, isActive: true },
  { code: "oreo10", discountPercent: 10, type: "order", description: "10% de desconto no pedido inteiro", oneTimeUse: false, isActive: true },
  { code: "VOLTEI10", discountPercent: 10, type: "order", description: "10% de desconto no pedido inteiro", oneTimeUse: true, isActive: true },
  { code: "MAEDEPET25", discountPercent: 25, type: "order", description: "25% de desconto no pedido inteiro", oneTimeUse: true, isActive: true },
  { code: "MAISA10", discountPercent: 10, type: "order", description: "10% de desconto no pedido inteiro", oneTimeUse: true, isActive: true },
  { code: "PRIMEIRACOMPRA", discountPercent: 10, type: "order", description: "10% de desconto no pedido inteiro", oneTimeUse: true, minQuantity: 1, isActive: true },
  
  // === CUPONS DE DESCONTO EM PRODUTOS ===
  { code: "amigos40", discountPercent: 40, type: "products", description: "40% de desconto em 5 produtos", oneTimeUse: true, isActive: true },
  { code: "ADICIONAR10OFF", discountPercent: 10, type: "products", description: "10% de desconto em 3 produtos", oneTimeUse: true, isActive: true },
  
  // === CUPONS DE DESCONTO EM COLEÇÕES ===
  { code: "FRED15", discountPercent: 15, type: "collection", description: "15% de desconto em 5 coleções", oneTimeUse: false, isActive: true },
  { code: "AIKA15", discountPercent: 15, type: "collection", description: "15% de desconto em 5 coleções", oneTimeUse: false, isActive: true },
  { code: "PINGOLUIS", discountPercent: 15, type: "collection", description: "15% de desconto em 5 coleções", oneTimeUse: false, isActive: true },
  { code: "ZEDALMEIDA", discountPercent: 15, type: "collection", description: "15% de desconto em 5 coleções", oneTimeUse: false, isActive: true },
  { code: "SPITZCATARINA", discountPercent: 15, type: "collection", description: "15% de desconto em 4 coleções", oneTimeUse: false, isActive: true },
  { code: "ADRISI10", discountPercent: 10, type: "collection", description: "10% de desconto em 12 coleções", oneTimeUse: false, isActive: true },
  { code: "LANCAMENTO10", discountPercent: 10, type: "collection", description: "10% de desconto em Personalizados", oneTimeUse: false, isActive: true },
  { code: "pet10", discountPercent: 10, type: "collection", description: "10% de desconto em 4 coleções", oneTimeUse: false, isActive: true },
  { code: "loo5", discountPercent: 5, type: "collection", description: "5% de desconto em 4 coleções", oneTimeUse: false, isActive: true },
  { code: "loo10", discountPercent: 10, type: "collection", description: "10% de desconto em 4 coleções", oneTimeUse: false, isActive: true },
  { code: "pet5", discountPercent: 5, type: "collection", description: "5% de desconto em 2 coleções", oneTimeUse: false, isActive: true },
  { code: "GANHEI50", discountPercent: 50, type: "collection", description: "50% de desconto em Cuidados", oneTimeUse: true, isActive: true },
  
  // === CUPONS DE DESCONTO EM LIMPA LÁGRIMAS ===
  { code: "CLIENTEVIP", discountPercent: 15, type: "products", description: "15% de desconto em Limpa Lágrimas ácidas Petioo", oneTimeUse: false, isActive: true },
  { code: "LA-BULLDOG", discountPercent: 15, type: "products", description: "15% de desconto em Limpa Lágrimas ácidas Petioo", oneTimeUse: false, isActive: true },
  { code: "LA-PEQUINES", discountPercent: 15, type: "products", description: "15% de desconto em Limpa Lágrimas ácidas Petioo", oneTimeUse: false, isActive: true },
  { code: "LA-PUG", discountPercent: 15, type: "products", description: "15% de desconto em Limpa Lágrimas ácidas Petioo", oneTimeUse: false, isActive: true },
  { code: "LA-SPITZ", discountPercent: 15, type: "products", description: "15% de desconto em Limpa Lágrimas ácidas Petioo", oneTimeUse: false, isActive: true },
  { code: "LA-CHIHUAHUA", discountPercent: 15, type: "products", description: "15% de desconto em Limpa Lágrimas ácidas Petioo", oneTimeUse: false, isActive: true },
  { code: "LA-POODLE", discountPercent: 15, type: "products", description: "15% de desconto em Limpa Lágrimas ácidas Petioo", oneTimeUse: false, isActive: true },
  { code: "LA-MALTES", discountPercent: 15, type: "products", description: "15% de desconto em Limpa Lágrimas ácidas Petioo", oneTimeUse: false, isActive: true },
  { code: "LA-SHIHTZU", discountPercent: 15, type: "products", description: "15% de desconto em Limpa Lágrimas ácidas Petioo", oneTimeUse: false, isActive: true },
  { code: "LA-APSO", discountPercent: 15, type: "products", description: "15% de desconto em Limpa Lágrimas ácidas Petioo", oneTimeUse: false, isActive: true },
  
  // === FRETE GRÁTIS ===
  { code: "Frete", discountPercent: 0, type: "free_shipping", description: "Frete grátis para todos os produtos", oneTimeUse: false, isActive: true },
]

// Função para validar um cupom
export function validateCoupon(code: string): { valid: boolean; coupon?: Coupon; error?: string } {
  if (!code || code.trim() === "") {
    return { valid: false, error: "Por favor, insira um código de cupom" }
  }

  const normalizedCode = code.trim().toUpperCase()
  const coupon = COUPONS.find(c => c.code.toUpperCase() === normalizedCode)

  if (!coupon) {
    return { valid: false, error: "Cupom inválido ou expirado" }
  }

  if (!coupon.isActive) {
    return { valid: false, error: "Este cupom não está mais ativo" }
  }

  return { valid: true, coupon }
}

// Função para calcular o desconto
export function calculateDiscount(
  subtotal: number,
  coupon: Coupon
): { discountAmount: number; discountPercent: number; finalSubtotal: number } {
  // Para cupons de tipo "order", "products" ou "collection", aplicamos o desconto no subtotal
  // Para "free_shipping", não há desconto no valor, apenas no frete
  if (coupon.type === "free_shipping") {
    return {
      discountAmount: 0,
      discountPercent: 0,
      finalSubtotal: subtotal,
    }
  }

  const discountAmount = subtotal * (coupon.discountPercent / 100)
  const finalSubtotal = subtotal - discountAmount

  return {
    discountAmount,
    discountPercent: coupon.discountPercent,
    finalSubtotal,
  }
}

// Função para verificar se o cupom dá frete grátis
export function isFreeShippingCoupon(coupon: Coupon | null): boolean {
  return coupon?.type === "free_shipping"
}
