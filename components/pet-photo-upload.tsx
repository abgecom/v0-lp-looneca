"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface PetPhotoUploadProps {
  onPhotosChange: (photos: string[]) => void
}

export function PetPhotoUpload({ onPhotosChange }: PetPhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const newPhotos = [...photos]

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Verificar o tipo de arquivo
        if (!file.type.startsWith("image/")) {
          setError("Por favor, envie apenas arquivos de imagem.")
          continue
        }

        // Verificar o tamanho do arquivo (limite de 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError("O tamanho máximo do arquivo é 5MB.")
          continue
        }

        // Criar um FormData para enviar o arquivo
        const formData = new FormData()
        formData.append("file", file)

        // Fazer upload através da API route
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Falha ao fazer upload da imagem.")
        }

        const data = await response.json()
        newPhotos.push(data.url)
      }

      setPhotos(newPhotos)
      onPhotosChange(newPhotos)
    } catch (err) {
      console.error("Erro ao fazer upload das fotos:", err)
      setError("Ocorreu um erro ao fazer upload das fotos. Por favor, tente novamente.")
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = [...photos]
    newPhotos.splice(index, 1)
    setPhotos(newPhotos)
    onPhotosChange(newPhotos)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="font-medium">Fotos do seu pet (opcional)</label>
        <p className="text-sm text-gray-500">Envie fotos do seu pet para personalizarmos melhor o seu produto.</p>

        <div className="flex items-center gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("pet-photos")?.click()}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Upload size={16} />
            {uploading ? "Enviando..." : "Enviar fotos"}
          </Button>
          <input id="pet-photos" type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
        </div>

        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <Image
                src={photo || "/placeholder.svg"}
                alt={`Foto do pet ${index + 1}`}
                width={200}
                height={200}
                className="w-full h-24 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remover foto"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
