import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Simulate payment processing (replace with actual payment gateway integration)
    const paymentSuccessful = Math.random() > 0.1 // Simulate a 90% success rate
    const errorCode = paymentSuccessful ? null : Math.random() > 0.5 ? "GATEWAY_ERROR" : "GATEWAY_CONNECTION_ERROR"
    const errorMessage = paymentSuccessful
      ? null
      : errorCode === "GATEWAY_ERROR"
        ? "Erro genérico no gateway de pagamento."
        : "Não foi possível conectar ao gateway de pagamento."
    const responseData = { id: "order123", transactionId: "txn456" } // Simulate response data

    if (paymentSuccessful) {
      return NextResponse.json({ success: true, data: responseData }, { status: 200 })
    } else {
      // Para erros de gateway, redirecionar para a página de erro
      if (errorCode === "GATEWAY_ERROR" || errorCode === "GATEWAY_CONNECTION_ERROR") {
        const encodedMessage = encodeURIComponent(errorMessage)
        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            errorCode: errorCode,
            details: responseData,
            redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento-erro?code=${errorCode}&message=${encodedMessage}&order_id=${responseData.id || ""}`,
          },
          { status: 400 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          errorCode: errorCode,
          details: responseData,
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error("Erro durante o processamento do pagamento:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor.", details: error.message },
      { status: 500 },
    )
  }
}
