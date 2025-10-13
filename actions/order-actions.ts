"use server"

import { criarPedido } from "./pedidos-actions"

export interface OrderData {
  customer: {
    name: string
    email: string
    phone: string
    cpf: string
  }
  shipping: {
    cep: string
    address: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
    method: string
    price: number
  }
  items: Array<{
    id: string
    name: string
    color: string
    petCount: number
    quantity: number
    price: number
    imageSrc: string
    productId?: string
    variantId?: string
    sku?: string
    accessories?: string[]
  }>
  recurringProducts: {
    appPetloo: boolean
    loobook: boolean
  }
  paymentMethod: string
  totalAmount: number
  installments: number
  paymentId: string
  paymentStatus: string
  // === NOVOS CAMPOS PARA DADOS DO PET ===
  petPhotos?: string[]
  petTypeBreed?: string
  petNotes?: string
}

export async function saveOrderToDatabase(orderData: OrderData) {
  try {
    console.log("🚀 DEBUG saveOrderToDatabase - orderData recebido:", JSON.stringify(orderData, null, 2))

    const allAccessories: string[] = []
    orderData.items.forEach((item) => {
      if (item.accessories && item.accessories.length > 0) {
        allAccessories.push(...item.accessories)
      }
    })
    const acessoriosString = allAccessories.join(", ")

    // Mapear os dados para o formato esperado por criarPedido
    const pedidoData = {
      customer: {
        email: orderData.customer.email,
        name: orderData.customer.name,
        phone: orderData.customer.phone,
        cpf: orderData.customer.cpf,
        cep: orderData.shipping.cep,
        cidade: orderData.shipping.city,
        estado: orderData.shipping.state,
        endereco: orderData.shipping.address,
        numero: orderData.shipping.number,
        complemento: orderData.shipping.complement,
        bairro: orderData.shipping.neighborhood,
      },
      itens: orderData.items,
      recorrentes: orderData.recurringProducts,
      pagamento: {
        metodo: orderData.paymentMethod,
        total: orderData.totalAmount,
        id: orderData.paymentId,
        status: orderData.paymentStatus,
        data: new Date().toISOString(),
      },
      // === MAPEAMENTO DOS DADOS DO PET ===
      fotos: orderData.petPhotos || [],
      raca: orderData.petTypeBreed || "",
      observacoes: orderData.petNotes || "",
      acessorios: acessoriosString,
    }

    console.log("🚀 DEBUG saveOrderToDatabase - pedidoData mapeado:", JSON.stringify(pedidoData, null, 2))
    console.log("🚀 DEBUG fotos enviadas para criarPedido:", pedidoData.fotos)
    console.log("🚀 DEBUG raca enviada para criarPedido:", pedidoData.raca)
    console.log("🚀 DEBUG acessorios enviados para criarPedido:", pedidoData.acessorios)

    const result = await criarPedido(pedidoData)

    if (!result.success) {
      console.error("Erro ao criar pedido:", result.error)
      throw new Error(result.error)
    }

    return result
  } catch (error) {
    console.error("Erro em saveOrderToDatabase:", error)
    throw error
  }
}
