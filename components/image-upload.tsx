"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, X, Check, AlertCircle } from "lucide-react"

interface ImageUploadProps {
  onImagesUploaded: (urls: string[]) => void
  maxImages?: number
  maxSizeInMB?: number
}

export default function ImageUpload({ onImagesUploaded, maxImages = 5, maxSizeInMB = 5 }: ImageUploadProps) {
  const [uploadedImages, setUploadedImages] = useState<{ url: string; file: File }[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maxSizeInBytes = maxSizeInMB * 1024 * 1024

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setError(null)
    setIsUploading(true)

    // Verificar se não excede o limite de imagens
    if (uploadedImages.length + files.length > maxImages) {
      setError(`Você pode enviar no máximo ${maxImages} imagens.`)
      setIsUploading(false)
      return
    }

    const newImages: { url: string; file: File }[] = []
    const newUrls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Verificar o tipo de arquivo
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Apenas arquivos .jpg, .png e .webp são permitidos.")
        setIsUploading(false)
        return
      }

      // Verificar o tamanho do arquivo
      if (file.size > maxSizeInBytes) {
        setError(`Cada imagem deve ter no máximo ${maxSizeInMB}MB.`)
        setIsUploading(false)
        return
      }

      try {
        // Fazer upload para o Vercel Blob
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Falha ao fazer upload da imagem.")
        }

        const data = await response.json()
        newImages.push({ url: data.url, file })
        newUrls.push(data.url)
      } catch (err) {
        console.error("Erro ao fazer upload:", err)
        setError("Ocorreu um erro ao fazer upload da imagem. Tente novamente.")
        setIsUploading(false)
        return
      }
    }

    setUploadedImages((prev) => [...prev, ...newImages])
    onImagesUploaded([...uploadedImages.map((img) => img.url), ...newUrls])
    setIsUploading(false)

    // Limpar o input de arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...uploadedImages]
    newImages.splice(index, 1)
    setUploadedImages(newImages)
    onImagesUploaded(newImages.map((img) => img.url))
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <div className="mb-2">
        <div
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isUploading ? "bg-gray-100 border-gray-300" : "border-[#F1542E] hover:bg-[#F1542E]/5 hover:border-[#F1542E]"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            disabled={isUploading || uploadedImages.length >= maxImages}
          />
          <div className="flex flex-col items-center justify-center py-4">
            <Upload className="w-10 h-10 mb-2 text-[#F1542E]" />
            <p className="text-sm font-medium">
              {isUploading
                ? "Enviando..."
                : uploadedImages.length >= maxImages
                  ? `Limite de ${maxImages} imagens atingido`
                  : `Envie as fotos do seu pet clicando aqui: *`}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Formatos aceitos: .jpg, .png, .webp (máx. {maxSizeInMB}MB cada)
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Envie o máximo de fotos possíveis, de vários ângulos, de todos os pets.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm mb-4 p-2 bg-red-50 rounded-md">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-4">
          {uploadedImages.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-md overflow-hidden border border-gray-200">
                <Image
                  src={image.url || "/placeholder.svg"}
                  alt={`Imagem ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md opacity-70 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
              <div className="absolute bottom-1 left-1 bg-white rounded-full px-2 py-0.5 text-xs shadow-md opacity-70">
                {index + 1}/{uploadedImages.length}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500">
          {uploadedImages.length} de {maxImages} imagens
        </p>
        {uploadedImages.length > 0 && (
          <div className="flex items-center text-green-600 text-xs">
            <Check className="w-4 h-4 mr-1" />
            <span>
              {uploadedImages.length} {uploadedImages.length === 1 ? "imagem enviada" : "imagens enviadas"}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
