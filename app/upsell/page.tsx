"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import PetAutocomplete from "@/components/pet-autocomplete"
import { Upload, AlertCircle, X, Check, Loader2 } from "lucide-react"
import Image from "next/image"
import { salvarDadosUpsell } from "@/actions/upsell-actions"

export default function UpsellPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [quantidadePets, setQuantidadePets] = useState(1)
  const [tipoRacaPets, setTipoRacaPets] = useState<string[]>([""])
  const [fotosUrls, setFotosUrls] = useState<string[]>([])
  const [observacao, setObservacao] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setTipoRacaPets((prev) => {
      const newArray = Array(quantidadePets).fill("")
      return newArray.map((_, index) => prev[index] || "")
    })
  }, [quantidadePets])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    const allBreedsCompleted = tipoRacaPets.slice(0, quantidadePets).every((breed) => breed.trim() !== "")

    if (!email || !allBreedsCompleted || fotosUrls.length === 0) {
      setFormError("Por favor, preencha todos os campos obrigatórios.")
      setIsSubmitting(false)
      return
    }

    try {
      const tipoRacaPetConcatenado = tipoRacaPets.slice(0, quantidadePets).join(", ")

      const result = await salvarDadosUpsell({
        email,
        tipoRacaPet: tipoRacaPetConcatenado,
        fotosUrls,
        observacao,
      })

      if (!result.success) {
        setFormError(result.error || "Ocorreu um erro ao enviar seus dados. Tente novamente.")
        setIsSubmitting(false)
        return
      }

      router.push("/upsell/obrigado")
    } catch (error) {
      console.error("Erro ao enviar formulário:", error)
      setFormError("Ocorreu um erro ao enviar seus dados. Tente novamente.")
      setIsSubmitting(false)
    }
  }

  const handlePetBreedChange = (index: number, value: string) => {
    setTipoRacaPets((prev) => {
      const newArray = [...prev]
      newArray[index] = value
      return newArray
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFCF6]">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Parabéns pela sua Looneca Adicional!</h1>
            <p className="text-gray-600 mb-6 text-center">
              Por favor, envie as informações do pet para sua segunda caneca com 50% OFF.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* E-mail */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail do Pedido <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use o mesmo e-mail do pedido original para vincularmos sua segunda caneca.
                </p>
              </div>

              {/* Quantidade de Pets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantos pets você incluiu na sua caneca? <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3 mb-2">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantidadePets(num)}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                        quantidadePets === num
                          ? "bg-[#F1542E] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-amber-600 font-medium">
                  Atenção: A quantidade de pets selecionada deve ser a mesma que você escolheu na oferta anterior.
                </p>
              </div>

              {/* Campos de Tipo e Raça dos Pets */}
              {Array.from({ length: quantidadePets }).map((_, index) => (
                <div key={index}>
                  <PetAutocomplete
                    id={`tipoRacaPet-${index}`}
                    value={tipoRacaPets[index] || ""}
                    onChange={(value) => handlePetBreedChange(index, value)}
                    required={true}
                    label={quantidadePets === 1 ? "Tipo e Raça do Pet" : `Tipo e Raça do Pet ${index + 1}`}
                    placeholder="Comece a digitar para buscar..."
                  />
                </div>
              ))}

              {/* Fotos do Pet */}
              <div>
                <UpsellImageUpload onImagesUploaded={setFotosUrls} quantidadePets={quantidadePets} />
              </div>

              {/* Observações */}
              <div>
                <label htmlFor="observacao" className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  id="observacao"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Alguma informação adicional sobre o seu pet..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]"
                />
              </div>

              {/* Botão de Enviar */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#F1542E] text-white py-3 px-4 rounded-md font-medium hover:bg-[#d94825] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Informações"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

interface UpsellImageUploadProps {
  onImagesUploaded: (urls: string[]) => void
  quantidadePets: number
}

function UpsellImageUpload({ onImagesUploaded, quantidadePets }: UpsellImageUploadProps) {
  const [uploadedImages, setUploadedImages] = useState<
    { url: string; file: File; status: "uploading" | "success" | "error" }[]
  >([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const compressImage = async (file: File): Promise<File> => {
    try {
      if (file.size <= 1024 * 1024) {
        return file
      }

      const img = new Image()
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Não foi possível criar contexto do canvas")
      }

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Erro ao carregar imagem"))
        img.crossOrigin = "anonymous"
        img.src = URL.createObjectURL(file)
      })

      const MAX_WIDTH = 1920
      const MAX_HEIGHT = 1920
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width
          width = MAX_WIDTH
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height
          height = MAX_HEIGHT
        }
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Erro ao comprimir imagem"))
            }
          },
          file.type,
          0.7,
        )
      })

      URL.revokeObjectURL(img.src)

      return new File([blob], file.name, {
        type: file.type,
        lastModified: Date.now(),
      })
    } catch (error) {
      console.error("Erro ao comprimir imagem:", error)
      return file
    }
  }

  const uploadSingleImage = async (file: File, retryCount = 0): Promise<string> => {
    try {
      if (!file || file.size === 0) {
        throw new Error("Arquivo inválido ou vazio")
      }

      if (!file.type.startsWith("image/")) {
        throw new Error("Arquivo deve ser uma imagem")
      }

      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error("Arquivo muito grande. Máximo 10MB")
      }

      const compressedFile = await compressImage(file)
      const formData = new FormData()
      formData.append("file", compressedFile)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || `Erro HTTP ${response.status}`)
        }

        const data = await response.json()

        if (!data || !data.url) {
          throw new Error("URL não encontrada na resposta do servidor")
        }

        return data.url
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === "AbortError") {
          throw new Error("Upload cancelado por timeout (30s)")
        }
        throw fetchError
      }
    } catch (error) {
      if (retryCount < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)))
        return uploadSingleImage(file, retryCount + 1)
      }

      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido no upload"
      throw new Error(`Falha no upload após 3 tentativas: ${errorMessage}`)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setError(null)
    setIsUploading(true)

    const newImages = Array.from(files).map((file) => ({
      url: URL.createObjectURL(file),
      file,
      status: "uploading" as const,
    }))

    setUploadedImages((prev) => [...prev, ...newImages])

    const uploadedUrls: string[] = []
    const failedUploads: number[] = []

    for (let i = 0; i < newImages.length; i++) {
      const image = newImages[i]

      try {
        const url = await uploadSingleImage(image.file)
        uploadedUrls.push(url)

        setUploadedImages((prev) =>
          prev.map((img) => (img === image ? { ...img, url, status: "success" as const } : img)),
        )
      } catch (error) {
        console.error(`Erro no upload da imagem ${i}:`, error)
        failedUploads.push(i)

        setUploadedImages((prev) => prev.map((img) => (img === image ? { ...img, status: "error" as const } : img)))
      }
    }

    const allUrls = [...uploadedImages.filter((img) => img.status === "success").map((img) => img.url), ...uploadedUrls]

    onImagesUploaded(allUrls)

    if (failedUploads.length > 0) {
      setError(`${failedUploads.length} imagem(ns) não pôde(puderam) ser enviada(s). Tente novamente.`)
    }

    setIsUploading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...uploadedImages]
    const removedImage = newImages.splice(index, 1)[0]
    setUploadedImages(newImages)

    if (removedImage.url.startsWith("blob:")) {
      URL.revokeObjectURL(removedImage.url)
    }

    onImagesUploaded(newImages.filter((img) => img.status === "success").map((img) => img.url))
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  useEffect(() => {
    return () => {
      uploadedImages.forEach((image) => {
        if (image.url.startsWith("blob:")) {
          URL.revokeObjectURL(image.url)
        }
      })
    }
  }, [uploadedImages])

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Fotos do Pet <span className="text-red-500">*</span>
      </label>

      <div
        onClick={triggerFileInput}
        className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
          isUploading ? "bg-gray-100 border-gray-300" : "border-[#F1542E] hover:bg-[#F1542E]/5 hover:border-[#F1542E]"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
          disabled={isUploading}
        />
        <div className="flex flex-col items-center justify-center py-3">
          <Upload className="w-8 h-8 mb-1 text-[#F1542E]" />
          <p className="text-sm font-medium">
            {isUploading
              ? "Enviando..."
              : `Clique para enviar fotos ${quantidadePets > 1 ? "de todos os seus pets" : "do seu pet"}`}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {quantidadePets > 1
              ? "Envie fotos de todos os pets"
              : "Envie fotos de vários ângulos para melhor resultado"}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm mt-2 p-2 bg-red-50 rounded-md">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          {uploadedImages.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                <div className="relative w-full h-full">
                  <Image
                    src={image.url || "/placeholder.svg"}
                    alt={`Imagem ${index + 1} do pet`}
                    width={200}
                    height={200}
                    className={`w-full h-full object-cover ${image.status === "uploading" ? "opacity-50" : ""}`}
                  />

                  {image.status === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white bg-opacity-70 rounded-full p-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#F1542E]" />
                      </div>
                    </div>
                  )}

                  {image.status === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-50">
                      <div className="bg-white bg-opacity-70 rounded-full p-2">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md opacity-70 group-hover:opacity-100 transition-opacity"
                disabled={image.status === "uploading"}
              >
                <X className="w-4 h-4 text-red-500" />
              </button>

              <div
                className={`absolute bottom-1 left-1 rounded-full px-2 py-0.5 text-xs shadow-md ${
                  image.status === "uploading"
                    ? "bg-blue-100 text-blue-700"
                    : image.status === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                }`}
              >
                {image.status === "uploading" ? "Enviando..." : image.status === "error" ? "Erro" : "Enviado"}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500">
          {uploadedImages.filter((img) => img.status === "success").length} fotos enviadas
        </p>
        {uploadedImages.filter((img) => img.status === "success").length > 0 && (
          <div className="flex items-center text-green-600 text-xs">
            <Check className="w-4 h-4 mr-1" />
            <span>
              {uploadedImages.filter((img) => img.status === "success").length}{" "}
              {uploadedImages.filter((img) => img.status === "success").length === 1
                ? "imagem enviada"
                : "imagens enviadas"}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
