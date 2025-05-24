"use server"

import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface PaymentData {
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
  card: {
    number: string
    holder_name: string
    exp_month: string
    exp_year: string
    cvv: string
  }
  amount: number
  installments: number
  hasRecurringProducts: boolean
}

export async function processPayment(paymentData: PaymentData) {
  try {
    console.log("Processing payment for:", {
      customer_email: paymentData.customer.email,
      amount: paymentData.amount,
      installments: paymentData.installments,
      has_recurring: paymentData.hasRecurringProducts,
    })

    // Prepare customer data for Pagar.me
    const customerData = {
      name: paymentData.customer.name,
      email: paymentData.customer.email,
      document: paymentData.customer.cpf,
      phones: {
        mobile_phone: paymentData.customer.phone,
      },
      address: {
        cep: paymentData.shipping.cep,
        address: paymentData.shipping.address,
        number: paymentData.shipping.number,
        complement: paymentData.shipping.complement || "",
        neighborhood: paymentData.shipping.neighborhood,
        city: paymentData.shipping.city,
        state: paymentData.shipping.state,
      },
    }

    // Prepare card data for Pagar.me
    const cardData = {
      number: paymentData.card.number,
      holder_name: paymentData.card.holder_name,
      exp_month: paymentData.card.exp_month,
      exp_year: paymentData.card.exp_year,
      cvv: paymentData.card.cvv,
      billing_address: customerData.address,
    }

    // If customer has recurring products, create subscription
    if (paymentData.hasRecurringProducts) {
      console.log("Creating subscription for recurring products")

      const subscriptionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pagarme/create-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: customerData,
          card: cardData,
          installments: paymentData.installments,
          amount: paymentData.amount,
        }),
      })

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json()
        throw new Error(errorData.error || "Failed to create subscription")
      }

      const subscriptionResult = await subscriptionResponse.json()

      console.log("Subscription created successfully:", {
        order_id: subscriptionResult.order_id,
        subscription_id: subscriptionResult.subscription_id,
        status: subscriptionResult.status,
      })

      return {
        success: true,
        payment_id: subscriptionResult.order_id,
        subscription_id: subscriptionResult.subscription_id,
        status: subscriptionResult.status,
        message: "Pagamento processado com sucesso",
      }
    } else {
      // For one-time payments, create customer and card, then create order
      console.log("Processing one-time payment")

      // Create customer
      const customerResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pagarme/create-customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      })

      if (!customerResponse.ok) {
        throw new Error("Failed to create customer")
      }

      const { customer_id } = await customerResponse.json()

      // Create card
      const cardResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pagarme/create-card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...cardData,
          customer_id,
        }),
      })

      if (!cardResponse.ok) {
        throw new Error("Failed to create card")
      }

      const { card_id } = await cardResponse.json()

      // Create order
      const orderData = {
        customer_id,
        items: [
          {
            amount: paymentData.amount,
            description: "Caneca Personalizada Looneca",
            quantity: 1,
          },
        ],
        payments: [
          {
            payment_method: "credit_card",
            amount: paymentData.amount,
            installments: paymentData.installments,
            credit_card: {
              card_id,
              statement_descriptor: "PETLOO",
            },
          },
        ],
      }

      const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pagarme/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      if (!orderResponse.ok) {
        throw new Error("Failed to create order")
      }

      const orderResult = await orderResponse.json()

      console.log("Order created successfully:", {
        order_id: orderResult.id,
        status: orderResult.status,
      })

      return {
        success: true,
        payment_id: orderResult.id,
        status: orderResult.status,
        message: "Pagamento processado com sucesso",
      }
    }
  } catch (error) {
    console.error("Error processing payment:", error)

    // Store error in database for debugging
    await supabase.from("payment_errors").insert({
      customer_email: paymentData.customer.email,
      error_message: error instanceof Error ? error.message : "Unknown error",
      payment_data: paymentData,
      created_at: new Date().toISOString(),
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao processar pagamento",
    }
  }
}

export async function getPaymentStatus(paymentId: string) {
  try {
    // Check payment status in Supabase
    const { data, error } = await supabase.from("pagarme_transactions").select("*").eq("order_id", paymentId).single()

    if (error) {
      console.error("Error fetching payment status:", error)
      return { success: false, error: "Payment not found" }
    }

    return {
      success: true,
      status: data.status,
      payment: data,
    }
  } catch (error) {
    console.error("Error getting payment status:", error)
    return {
      success: false,
      error: "Failed to get payment status",
    }
  }
}
