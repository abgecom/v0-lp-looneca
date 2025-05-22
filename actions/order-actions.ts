"use server"

import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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
        created_at: new Date().toISOString(),
      })
      .select()

    if (orderError) {
      console.error("Error saving order to database:", orderError)
      throw new Error("Failed to save order")
    }

    const orderId = orderResult[0].id

    // If the customer selected the Loobook product, create entries in the loobooks table
    if (orderData.recurringProducts.loobook) {
      // For each pet in the order, create a loobook entry
      for (const item of orderData.items) {
        if (item.petCount > 0) {
          // Create a pet ID for each pet in the order
          for (let i = 0; i < item.petCount; i++) {
            const petId = uuidv4()

            // Create a loobook entry for this pet
            await supabase.from("loobooks").insert({
              id: uuidv4(),
              pet_id: petId,
              color: item.color,
              cover_url: item.imageSrc,
              created_at: new Date().toISOString(),
            })
          }
        }
      }
    }

    // Record the payment in the payments table if it exists
    try {
      await supabase.from("payments").insert({
        order_id: orderId,
        payment_id: orderData.paymentId,
        amount: orderData.totalAmount,
        status: orderData.paymentStatus,
        payment_method: orderData.paymentMethod,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      // If the payments table doesn't exist or has a different structure, log the error but continue
      console.error("Error recording payment:", error)
    }

    return { success: true, orderId }
  } catch (error) {
    console.error("Error in saveOrderToDatabase:", error)
    throw error
  }
}
