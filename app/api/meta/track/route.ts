import { type NextRequest, NextResponse } from "next/server"
import { sendMetaEvent, type MetaUserData } from "@/lib/meta-capi"

/**
 * Bridge client → Conversions API.
 *
 * O Pixel no navegador chama este endpoint com o mesmo `eventId` usado no
 * `fbq('track', ...)`. O servidor enriquece com IP/User-Agent reais e reenvia
 * ao Meta. A deduplicação evita contagem dupla (Pixel + CAPI).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      eventName,
      eventId,
      eventSourceUrl,
      userData = {},
      customData,
    }: {
      eventName?: string
      eventId?: string
      eventSourceUrl?: string
      userData?: MetaUserData
      customData?: Record<string, unknown>
    } = body

    if (!eventName) {
      return NextResponse.json({ success: false, error: "eventName ausente" }, { status: 400 })
    }

    // Captura IP e User-Agent reais a partir dos headers da requisição
    const clientIpAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined
    const clientUserAgent = request.headers.get("user-agent") || undefined

    const result = await sendMetaEvent({
      eventName,
      eventId,
      eventSourceUrl,
      actionSource: "website",
      userData: { ...userData, clientIpAddress, clientUserAgent },
      customData,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[/api/meta/track] erro:", error)
    return NextResponse.json({ success: false, error: "internal_error" }, { status: 500 })
  }
}
