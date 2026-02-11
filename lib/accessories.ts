export const ACCESSORIES = [
  { id: "bone", name: "Osso ao lado do pet" },
  { id: "id-tag", name: "Plaquinha no pescoço" },
  { id: "bandana-yellow", name: "Bandana Amarela" },
  { id: "collar-red", name: "Coleira Vermelha" },
  { id: "bow-tie", name: "Gravata Borboleta" },
  { id: "angel-wings", name: "Asas de Anjo" },
  { id: "tennis-ball", name: "Bola de Tênis" },
  { id: "carrot", name: "Cenoura" },
  { id: "scarf-red", name: "Cachecol Vermelho" },
  { id: "bell", name: "Sino" },
  { id: "pumpkin", name: "Abóbora" },
  { id: "worm", name: "Minhoca" },
  { id: "snail", name: "Caracol" },
  { id: "soccer-ball", name: "Bola de Futebol" },
  { id: "basketball", name: "Bola de Basquete" },
  { id: "love-text", name: "I love my pet" },
]

export const ACCESSORY_PRICE = 15

export function getAccessoryName(id: string) {
  return ACCESSORIES.find((a) => a.id === id)?.name || id
}
