// Mapeamento cor + quantidade de pets -> variante/SKU Shopify da Looneca.
// Fonte única, usada pelo carrinho (contexts/cart-context.tsx) e pela
// integração Shopify do upsell (uma segunda Looneca pode ter cor diferente da primeira).
export function getVariantInfo(color: string, petCount: number) {
  // Remove " Prisma" se existir e ajusta "Branco" para "Branca"
  let normalizedColor = color.replace(" Prisma", "").trim()
  if (normalizedColor === "Branco") normalizedColor = "Branca"

  const map: Record<string, Record<number, { variantId: string; sku: string }>> = {
    Branca: {
      1: { variantId: "49929335341378", sku: "LOONEBRANCA" },
      2: { variantId: "49929335374146", sku: "LOONEBRANCA" },
      3: { variantId: "49929335406914", sku: "LOONEBRANCA" },
    },
    Rosa: {
      1: { variantId: "50000505209154", sku: "LOONEROSA" },
      2: { variantId: "50000506782018", sku: "LOONEROSA" },
      3: { variantId: "50000507142466", sku: "LOONEROSA" },
    },
    Roxo: {
      1: { variantId: "50000508158274", sku: "LOONEROXO" },
      2: { variantId: "50000508518722", sku: "LOONEROXO" },
      3: { variantId: "50000508617026", sku: "LOONEROXO" },
    },
    Azul: {
      1: { variantId: "50000509108546", sku: "LOONEAZUL" },
      2: { variantId: "50000509239618", sku: "LOONEAZUL" },
      3: { variantId: "50000509337922", sku: "LOONEAZUL" },
    },
  }

  return map[normalizedColor]?.[petCount] || { variantId: "", sku: "" }
}
