import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    version: "2.0.0-appmax",
    paymentGateway: "Appmax",
    timestamp: new Date().toISOString(),
    environment: {
      hasAppmaxKey: !!process.env.APPMAX_API_KEY,
      hasPagarmeKey: !!process.env.PAGARME_API_KEY,
    },
  })
}
