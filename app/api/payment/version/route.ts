import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    version: "3.0.0-pagarme",
    paymentGateway: "Pagar.me",
    timestamp: new Date().toISOString(),
    environment: {
      hasPagarmeKey: !!process.env.PAGARME_API_KEY,
      hasPagarmePublicKey: !!process.env.PAGARME_PUBLIC_KEY,
    },
  })
}
