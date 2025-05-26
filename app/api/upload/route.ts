import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  const formData = await request.formData()
  const file = formData.get("file") as File

  if (!file) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 400 })
  }

  // Verificar o tipo de arquivo
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de arquivo não suportado. Apenas .jpg, .png e .webp são permitidos." },
      { status: 400 },
    )
  }

  // Verificar o tamanho do arquivo (15MB)
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "O arquivo é muito grande. O tamanho máximo é 15MB." }, { status: 400 })
  }

  try {
    // Gerar um nome único para o arquivo
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`

    // Fazer upload para o Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Erro ao fazer upload para o Vercel Blob:", error)
    return NextResponse.json({ error: "Falha ao fazer upload do arquivo" }, { status: 500 })
  }
}
