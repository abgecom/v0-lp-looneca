import { supabase } from "@/lib/supabaseClient"

interface OrderItem {
  id: string
  name: string
  color: string
  petCount: number
  quantity: number
  price: number
  imageSrc: string
}

interface OrderData {
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
    complement?: string
    neighborhood: string
    city: string
    state: string
    method?: string
    price?: number
  }
  items: OrderItem[]
  recurringProducts: {
    appPetloo: boolean
    loobook: boolean
  }
  paymentMethod: "credit_card" | "pix"
  totalAmount: number
  installments: number
  paymentId: string
  paymentStatus: string
  petPhotos?: string[] // Novo campo para armazenar as URLs das fotos dos pets
}

export async function saveOrderToDatabase(orderData: OrderData) {
  try {
    // Create order in Supabase
    const { data: orderResult, error: orderError } = await supabase
      .from("looneca_orders")
      .insert({
        customer_name: orderData.customer.name,
        customer_email: orderData.customer.email,
        customer_phone: orderData.customer.phone,
        customer_cpf: orderData.customer.cpf,
        shipping_address: {
          cep: orderData.shipping.cep,
          address: orderData.shipping.address,
          number: orderData.shipping.number,
          complement: orderData.shipping.complement || "",
          neighborhood: orderData.shipping.neighborhood,
          city: orderData.shipping.city,
          state: orderData.shipping.state,
          method: orderData.shipping.method || "",
          price: orderData.shipping.price || 0,
        },
        items: orderData.items.map((item) => ({
          id: item.id,
          name: item.name,
          color: item.color,
          pet_count: item.petCount,
          quantity: item.quantity,
          price: item.price,
          image_src: item.imageSrc,
        })),
        recurring_products: {
          app_petloo: orderData.recurringProducts.appPetloo,
          loobook: orderData.recurringProducts.loobook,
        },
        payment_method: orderData.paymentMethod,
        total_amount: orderData.totalAmount,
        installments: orderData.installments,
        payment_id: orderData.paymentId,
        payment_status: orderData.paymentStatus,
        pet_photos: orderData.petPhotos || [], // Adicionando as fotos dos pets
        created_at: new Date().toISOString(),
      })
      .select()

    if (orderError) {
      console.error("Error creating order:", orderError)
      throw new Error(orderError.message)
    }

    return orderResult
  } catch (error: any) {
    console.error("Error saving order to database:", error)
    throw new Error(error.message)
  }
}
