'use server'

import { exportShopifyOrder, type CheckoutInput } from "@/lib/shopify-order-service"

export async function exportOrderToShopify(input: CheckoutInput) {
  return exportShopifyOrder(input)
}

