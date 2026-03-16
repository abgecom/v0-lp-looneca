import { Resend } from "resend"

const apiKey = process.env.RESEND_API_KEY

if (!apiKey) {
  console.warn("[Resend] RESEND_API_KEY is not set — emails will not be sent.")
}

const resend = new Resend(apiKey)

export { resend }

interface SendAppDownloadEmailParams {
  to: string
  customerName: string
}

export async function sendAppDownloadEmail({ to, customerName }: SendAppDownloadEmailParams) {
  if (!apiKey) {
    console.warn("[Resend] Skipping email — RESEND_API_KEY not configured.")
    return null
  }

  console.log("[Resend] Sending app download email to:", to)

  const { AppDownloadEmail } = await import("@/emails/app-download-email")

  const { data, error } = await resend.emails.send({
    from: "Petloo <noreply@send.petloo.com.br>",
    to: [to],
    subject: "Sua tag Petloo está a caminho! Baixe o app agora",
    react: AppDownloadEmail({ customerName }),
  })

  if (error) {
    console.error("[Resend] API returned error:", JSON.stringify(error))
    throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`)
  }

  console.log("[Resend] Email sent successfully. ID:", data?.id)
  return data
}
