import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export { resend }

interface SendAppDownloadEmailParams {
  to: string
  customerName: string
}

export async function sendAppDownloadEmail({ to, customerName }: SendAppDownloadEmailParams) {
  const { AppDownloadEmail } = await import("@/emails/app-download-email")

  const { data, error } = await resend.emails.send({
    from: "Petloo <noreply@send.petloo.com.br>",
    to: [to],
    subject: "Sua tag Petloo está a caminho! 🐾 Baixe o app agora",
    react: AppDownloadEmail({ customerName }),
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }

  return data
}
