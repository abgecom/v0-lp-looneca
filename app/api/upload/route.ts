import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("API Upload: Arquivo não encontrado no FormData")
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 400 })
    }

    // Verificar o tipo de arquivo (aceitar qualquer tipo de imagem)
    if (!file.type.startsWith("image/")) {
      console.error(`API Upload: Tipo de arquivo não suportado: ${file.type}`)
      return NextResponse.json(
        { error: "Tipo de arquivo não suportado. Apenas imagens são permitidas." },
        { status: 400 },
      )
    }

    console.log(`API Upload: Processando arquivo: ${file.name}, tipo: ${file.type}, tamanho: ${file.size} bytes`)

    // Gerar um nome único para o arquivo
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`

    try {
      // Fazer upload para o Vercel Blob
      const blob = await put(filename, file, {
        access: "public",
        contentType: file.type, // Garantir que o tipo de conteúdo seja preservado
        cacheControl: "public, max-age=31536000", // Cache por 1 ano para melhor performance
      })

      console.log(`API Upload: Upload bem-sucedido para ${blob.url}`)

      // Retornar a URL do blob
      return NextResponse.json({ url: blob.url })
    } catch (blobError) {
      console.error("API Upload: Erro no Vercel Blob:", blobError)
      return NextResponse.json(
        { error: "Falha ao fazer upload para o armazenamento. Tente novamente." },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("API Upload: Erro geral:", error)
    return NextResponse.json({ error: "Falha ao processar o upload do arquivo. Tente novamente." }, { status: 500 })
  }
}
