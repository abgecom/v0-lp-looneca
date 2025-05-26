"use client"

import React from "react"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { criarPedidoLooneca } from "@/actions/looneca-actions"
import { Upload, AlertCircle, X, Check, Loader2 } from "lucide-react"
import Image from "next/image"
import PetAutocomplete from "./pet-autocomplete"

interface PetFormData {
  tipoRacaPet: string
  fotosUrls: string[]
}

interface LoonecaFormInlineProps {
  petCount: number
  onFormValidityChange?: (isValid: boolean) => void
}

export type LoonecaFormRef = {
  handleSubmit: () => Promise<boolean>
}

const LoonecaFormInline = forwardRef<LoonecaFormRef, LoonecaFormInlineProps>(
  ({ petCount, onFormValidityChange }, ref) => {
    const [observacao, setObservacao] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [petsData, setPetsData] = useState<PetFormData[]>([
      { tipoRacaPet: "", fotosUrls: [] },
      { tipoRacaPet: "", fotosUrls: [] },
      { tipoRacaPet: "", fotosUrls: [] },
    ])

    // Expor o método handleSubmit para o componente pai
    useImperativeHandle(ref, () => ({
      handleSubmit: async () => {
        return await handleSubmit()
      },
    }))

    // Atualizar a validade do formulário quando os dados mudarem
    useEffect(() => {
      const isValid = validateForm()
      if (onFormValidityChange) {
        onFormValidityChange(isValid)
      }
    }, [petsData, petCount, onFormValidityChange])

    const validateForm = (): boolean => {
      // Verificar se todos os pets selecionados têm tipo/raça e pelo menos uma foto
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

    const handleSubmit = async () => {
      setFormError(null)
      setIsSubmitting(true)

      // Validar campos obrigatórios
      if (!validateForm()) {
        setFormError("Por favor, preencha todos os campos obrigatórios para cada pet.")
        setIsSubmitting(false)
        return false
      }

      try {
        // Preparar dados para envio
        const petDataToSubmit = petsData.slice(0, petCount)

        // Combinar todos os tipos/raças e URLs de fotos
        const combinedTipoRacaPet = petDataToSubmit.map((pet) => pet.tipoRacaPet).join(", ")
        const combinedFotosUrls = petDataToSubmit.flatMap((pet) => pet.fotosUrls)

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

        {/* Formulários para cada pet */}
        {Array.from({ length: petCount }).map((_, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">{petCount > 1 ? `Pet ${index + 1}` : "Informações do Pet"}</h3>

            {/* Tipo e Raça do Pet - Agora usando o componente de Autocomplete */}
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

            {/* Upload de Fotos */}
            <div className="mb-4">
              <PetImageUpload
                onImagesUploaded={(urls) => handleImagesUploaded(index, urls)}
                maxImages={15}
                maxSizeInMB={15}
                petIndex={index}
              />
            </div>
          </div>
        ))}

        {/* Observações - Comum para todos os pets */}
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

// Componente de upload de imagens para cada pet
interface PetImageUploadProps {
  onImagesUploaded: (urls: string[]) => void
  maxImages?: number
  maxSizeInMB?: number
  petIndex: number
}

function PetImageUpload({ onImagesUploaded, maxImages = 15, maxSizeInMB = 15, petIndex }: PetImageUploadProps) {
  const [uploadedImages, setUploadedImages] = useState<{ url: string; file: File }[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

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
          className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
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
          <div className="flex flex-col items-center justify-center py-3">
            <Upload className="w-8 h-8 mb-1 text-[#F1542E]" />
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
                  alt={`Imagem ${index + 1} do Pet ${petIndex + 1}`}
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

export default LoonecaFormInline
