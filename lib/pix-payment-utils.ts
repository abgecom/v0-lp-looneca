// Function to format time as MM:SS
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
}

// Function to check PIX payment status
export async function checkPixPaymentStatus(orderId: string): Promise<{
  status: "pending" | "paid" | "cancelled" | "expired"
  message?: string
}> {
  try {
    // This is a placeholder - in a real implementation, you would call your backend API
    // to check the payment status with Pagar.me or your payment provider
    const response = await fetch(`/api/payment/check-status?orderId=${orderId}`)

    if (!response.ok) {
      throw new Error("Failed to check payment status")
    }

    const data = await response.json()
    return {
      status: data.status,
      message: data.message,
    }
  } catch (error) {
    console.error("Error checking PIX payment status:", error)
    return {
      status: "pending",
      message: "Não foi possível verificar o status do pagamento",
    }
  }
}
