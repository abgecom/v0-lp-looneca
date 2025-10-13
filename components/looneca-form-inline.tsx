"use client"

import React from "react"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { criarPedidoLooneca } from "@/actions/looneca-actions"
import { Upload, AlertCircle, X, Check, Loader2 } from "lucide-react"
import Image from "next/image"
import PetAutocomplete from "./pet-autocomplete"
import { useCart } from "@/contexts/cart-context"
import AccessoriesSection from "./accessories-section"

interface PetFormData {
  tipoRacaPet: string
  fotosUrls: string[]
}

interface LoonecaFormInlineProps {
  petCount: number
  onFormValidityChange?: (isValid: boolean) => void
  onAccessoriesChange?: (accessories: string[]) => void
}

export type LoonecaFormRef = {
  handleSubmit: () => Promise<boolean>
}

const LoonecaFormInline = forwardRef<LoonecaFormRef, LoonecaFormInlineProps>(
  ({ petCount, onFormValidityChange, onAccessoriesChange }, ref) => {
    const [observacao, setObservacao] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [petsData, setPetsData] = useState<PetFormData[]>([
      { tipoRacaPet: "", fotosUrls: [] },
      { tipoRacaPet: "", fotosUrls: [] },
      { tipoRacaPet: "", fotosUrls: [] },
      { tipoRacaPet: "", fotosUrls: [] },
    ])
    const [selectedAccessories, setSelectedAccessories] = useState<string[]>([])

    const { setPetData } = useCart()

    useImperativeHandle(ref, () => ({
      handleSubmit: async () => {
        return await handleSubmit()
      },
    }))

    useEffect(() => {
      const isValid = validateForm()
      if (onFormValidityChange) {
        onFormValidityChange(isValid)
      }
    }, [petsData, petCount, onFormValidityChange])

    useEffect(() => {
      if (onAccessoriesChange) {
        onAccessoriesChange(selectedAccessories)
      }
    }, [selectedAccessories, onAccessoriesChange])

    const validateForm = (): boolean => {
      for (let i = 0; i < petCount; i++) {
        if (!petsData[i].tipoRacaPet || petsData[i].fotosUrls.length === 0) {
          return false
        }
      }
      return true
    }

    const handleTipoRacaPetChange = (index: number, value: string) => {
      const newPetsData = [...petsData]
      newPetsData[index].tipoRacaPet = value
      setPetsData(newPetsData)
    }

    const handleImagesUploaded = (index: number, urls: string[]) => {
      const newPetsData = [...petsData]
      newPetsData[index].fotosUrls = urls
      setPetsData(newPetsData)
    }

    const handleAccessoriesChange = (accessories: string[]) => {
      setSelectedAccessories(accessories)
    }

    const handleSubmit = async () => {
      setFormError(null)
      setIsSubmitting(true)

      if (!validateForm()) {
        setFormError("Por favor, preencha todos os campos obrigatórios para cada pet.")
        setIsSubmitting(false)
        return false
      }

      try {
        const petDataToSubmit = petsData.slice(0, petCount)

        const combinedTipoRacaPet = petDataToSubmit.map((pet) => pet.tipoRacaPet).join(", ")
        const combinedFotosUrls = petDataToSubmit.flatMap((pet) => pet.fotosUrls)

        console.log("=== DEBUG LOONECA FORM ===")
        console.log("petDataToSubmit:", petDataToSubmit)
        console.log("combinedTipoRacaPet:", combinedTipoRacaPet)
        console.log("combinedFotosUrls:", combinedFotosUrls)
        console.log("observacao:", observacao)
        console.log("selectedAccessories:", selectedAccessories)

        setPetData(combinedFotosUrls, combinedTipoRacaPet, observacao)
        console.log("Dados do pet salvos no contexto do carrinho:", {
          photos: combinedFotosUrls,
          typeBreed: combinedTipoRacaPet,
          notes: observacao,
        })

        const result = await criarPedidoLooneca({
          tipoRacaPet: combinedTipoRacaPet,
          observacao,
          fotosUrls: combinedFotosUrls,
        })

        if (!result.success) {
          setFormError(result.error || "Ocorreu um erro ao processar seu pedido. Tente novamente.")
          setIsSubmitting(false)
          return false
        }

        setIsSubmitting(false)
        return true
      } catch (error) {
        console.error("Erro ao enviar formulário:", error)
        setFormError("Ocorreu um erro ao processar seu pedido. Tente novamente.")
        setIsSubmitting(false)
        return false
      }
    }

    return (
      <div className="space-y-6 mt-6">
        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {Array.from({ length: petCount }).map((_, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">{petCount > 1 ? `Pet ${index + 1}` : "Informações do Pet"}</h3>

            <div className="mb-4">
              <PetAutocomplete
                id={`tipoRacaPet-${index}`}
                value={petsData[index].tipoRacaPet}
                onChange={(value) => handleTipoRacaPetChange(index, value)}
                required={true}
                label={`Selecione qual o tipo e a raça do ${petCount > 1 ? `Pet ${index + 1}` : "seu Pet"}`}
                placeholder="Comece a digitar para buscar..."
              />
            </div>

            <div className="mb-4">
              <OptimizedPetImageUpload
                onImagesUploaded={(urls) => handleImagesUploaded(index, urls)}
                petIndex={index}
              />
            </div>
          </div>
        ))}

        <AccessoriesSection onSelectionChange={handleAccessoriesChange} petCount={petCount} />

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <label htmlFor="observacao" className="block text-sm font-medium text-gray-700 mb-1">
            Alguma história especial que gostaria de compartilhar conosco?
          </label>
          <textarea
            id="observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Conte aqui a história do seu bichinho."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]"
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">
            Atenção: Não realizamos qualquer personalização extra que não esteja disponível nos campos acima.
          </p>
        </div>

        {isSubmitting && (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#F1542E]" />
          </div>
        )}
      </div>
    )
  },
)

LoonecaFormInline.displayName = "LoonecaFormInline"

interface OptimizedPetImageUploadProps {
  onImagesUploaded: (urls: string[]) => void
  petIndex: number
}

function OptimizedPetImageUpload({ onImagesUploaded, petIndex }: OptimizedPetImageUploadProps) {
  const [uploadedImages, setUploadedImages] = useState<
    { url: string; file: File; status: "uploading" | "success" | "error" }[]
  >([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const compressImage = async (file: File): Promise<File> => {
    try {
      if (file.size <= 1024 * 1024) {
        console.log("Arquivo pequeno, não comprimindo")
        return file
      }

      console.log("Comprimindo imagem...")

      const img = new Image()
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Não foi possível criar contexto do canvas")
      }

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = (e) => {
          console.error("Erro ao carregar imagem:", e)
          reject(new Error("Erro ao carregar imagem"))
        }
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

      const compressedFile = new File([blob], file.name, {
        type: file.type,
        lastModified: Date.now(),
      })

      console.log(
        `Imagem comprimida: ${file.name} - Original: ${(file.size / 1024 / 1024).toFixed(2)}MB, Comprimida: ${(
          compressedFile.size / 1024 / 1024
        ).toFixed(2)}MB`,
      )

      return compressedFile
    } catch (error) {
      console.error("Erro ao comprimir imagem:", error)
      console.log("Retornando arquivo original devido ao erro na compressão")
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

      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error("Arquivo muito grande. Máximo 10MB")
      }

      console.log(`Iniciando upload: ${file.name}, Tamanho: ${(file.size / 1024 / 1024).toFixed(2)}MB`)

      const compressedFile = await compressImage(file)

      console.log(`Arquivo comprimido: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)

      const formData = new FormData()
      formData.append("file", compressedFile)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos timeout

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        console.log(`Response status: ${response.status}`)

        if (!response.ok) {
          let errorMessage = `Erro HTTP ${response.status}`
          try {
            const errorText = await response.text()
            console.error("Erro na resposta do servidor:", response.status, errorText)
            errorMessage = errorText || errorMessage
          } catch (e) {
            console.error("Erro ao ler resposta de erro:", e)
          }
          throw new Error(errorMessage)
        }

        let data
        try {
          const responseText = await response.text()
          console.log("Response text:", responseText)
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error("Erro ao analisar resposta JSON:", parseError)
          throw new Error("Resposta inválida do servidor")
        }

        if (!data || !data.url) {
          console.error("Dados da resposta:", data)
          throw new Error("URL não encontrada na resposta do servidor")
        }

        console.log("Upload bem-sucedido:", data.url)
        return data.url
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError.name === "AbortError") {
          throw new Error("Upload cancelado por timeout (30s)")
        }
        throw fetchError
      }
    } catch (error) {
      console.error(`Erro no upload (tentativa ${retryCount + 1}):`, error)

      if (retryCount < 2) {
        console.log(`Tentando novamente (${retryCount + 2}/3)...`)
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
  }, [])

  return (
    <div className="w-full">
      <div className="mb-2">
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
              {isUploading ? "Enviando..." : `Envie as fotos do seu pet clicando aqui: *`}
            </p>
            <p className="text-xs text-gray-500 mt-1">Envie fotos de vários ângulos para melhor resultado</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
          {uploadedImages.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                <div className="relative w-full h-full">
                  <Image
                    src={image.url || "/placeholder.svg"}
                    alt={`Imagem ${index + 1} do Pet ${petIndex + 1}`}
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

export default LoonecaFormInline
