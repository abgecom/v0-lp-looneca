"use client"

import type React from "react"

import { useState } from "react"
import { criarPedidoLooneca } from "@/actions/looneca-actions"
import ImageUpload from "./image-upload"
import { Check, Loader2 } from "lucide-react"

export default function LoonecaForm() {
  const [tipoRacaPet, setTipoRacaPet] = useState("")
  const [observacao, setObservacao] = useState("")
  const [fotosUrls, setFotosUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)
    setIsSubmitting(true)

    // Validar campos obrigatórios
    if (!tipoRacaPet) {
      setFormError("Por favor, selecione o tipo e raça do seu pet.")
      setIsSubmitting(false)
      return
    }

    if (fotosUrls.length === 0) {
      setFormError("Por favor, envie pelo menos uma foto do seu pet.")
      setIsSubmitting(false)
      return
    }

    try {
      const result = await criarPedidoLooneca({
        tipoRacaPet,
        observacao,
        fotosUrls,
      })

      if (result.success) {
        setFormSuccess(result.message)
        // Limpar formulário
        setTipoRacaPet("")
        setObservacao("")
        setFotosUrls([])
      } else {
        setFormError(result.error || "Ocorreu um erro ao processar seu pedido. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error)
      setFormError("Ocorreu um erro ao processar seu pedido. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImagesUploaded = (urls: string[]) => {
    setFotosUrls(urls)
  }

  return (
    <section id="looneca-form" className="py-12 px-4 bg-[#F1E9DB] border-t border-gray-200">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Faça seu pedido</h2>

        {formSuccess ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-2">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-green-800 mb-2">Pedido enviado com sucesso!</h3>
            <p className="text-green-700 mb-4">
              Recebemos seu pedido e entraremos em contato em breve para os próximos passos.
            </p>
            <button
              type="button"
              onClick={() => setFormSuccess(null)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Fazer outro pedido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            {formError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formError}
              </div>
            )}

            {/* Tipo e Raça do Pet */}
            <div className="mb-6">
              <label htmlFor="tipoRacaPet" className="block text-sm font-medium text-gray-700 mb-1">
                Selecione qual o tipo e a raça do seu Pet *
              </label>
              <select
                id="tipoRacaPet"
                value={tipoRacaPet}
                onChange={(e) => setTipoRacaPet(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]"
                required
              >
                <option value="">Selecione uma opção</option>

                <optgroup label="Cães">
                  <option value="Cachorro Sem Raça Definida">Cachorro Sem Raça Definida</option>
                  <option value="Cachorro Akita">Cachorro Akita</option>
                  <option value="Cachorro American Staffordshire Terrier">
                    Cachorro American Staffordshire Terrier
                  </option>
                  <option value="Cachorro Basenji">Cachorro Basenji</option>
                  <option value="Cachorro Basset Hound">Cachorro Basset Hound</option>
                  <option value="Cachorro Beagle">Cachorro Beagle</option>
                  <option value="Cachorro Bernese/boiadeiro-bernês">Cachorro Bernese/boiadeiro-bernês</option>
                  <option value="Cachorro Bichon Frisé">Cachorro Bichon Frisé</option>
                  <option value="Cachorro Biewer Yorkshire Terrier">Cachorro Biewer Yorkshire Terrier</option>
                  <option value="Cachorro Bloodhound">Cachorro Bloodhound</option>
                  <option value="Cachorro Boiadeiro Australiano/Blue Heeler">
                    Cachorro Boiadeiro Australiano/Blue Heeler
                  </option>
                  <option value="Cachorro Border Collie">Cachorro Border Collie</option>
                  <option value="Cachorro Border Terrier">Cachorro Border Terrier</option>
                  <option value="Cachorro Boston Terrier">Cachorro Boston Terrier</option>
                  <option value="Cachorro Borzoi">Cachorro Borzoi</option>
                  <option value="Cachorro Boxer">Cachorro Boxer</option>
                  <option value="Cachorro Bull Terrier">Cachorro Bull Terrier</option>
                  <option value="Cachorro Bullmastiff">Cachorro Bullmastiff</option>
                  <option value="Cachorro Bulldog Francês">Cachorro Bulldog Francês</option>
                  <option value="Cachorro Bulldog Inglês">Cachorro Bulldog Inglês</option>
                  <option value="Cachorro Cairn Terrier">Cachorro Cairn Terrier</option>
                  <option value="Cachorro Cavalier King Charles Spaniel">Cachorro Cavalier King Charles Spaniel</option>
                  <option value="Cachorro Cão de Água Português">Cachorro Cão de Água Português</option>
                  <option value="Cachorro Cão de Crista Chinês">Cachorro Cão de Crista Chinês</option>
                  <option value="Cachorro Chesapeake Bay Retriever">Cachorro Chesapeake Bay Retriever</option>
                  <option value="Cachorro Chihuahua">Cachorro Chihuahua</option>
                  <option value="Cachorro Chow Chow">Cachorro Chow Chow</option>
                  <option value="Cachorro Cocker Spaniel">Cachorro Cocker Spaniel</option>
                  <option value="Cachorro Dachshund (Salsicha)">Cachorro Dachshund (Salsicha)</option>
                  <option value="Cachorro Dálmata">Cachorro Dálmata</option>
                  <option value="Cachorro Dogue Alemão">Cachorro Dogue Alemão</option>
                  <option value="Cachorro Fox paulistinha">Cachorro Fox paulistinha</option>
                  <option value="Cachorro Galgo italiano">Cachorro Galgo italiano</option>
                  <option value="Cachorro Golden Retriever">Cachorro Golden Retriever</option>
                  <option value="Cachorro Goldendoodle">Cachorro Goldendoodle</option>
                  <option value="Cachorro Greyhound">Cachorro Greyhound</option>
                  <option value="Cachorro Havanês">Cachorro Havanês</option>
                  <option value="Cachorro Husky Siberiano">Cachorro Husky Siberiano</option>
                  <option value="Cachorro Irish Setter">Cachorro Irish Setter</option>
                  <option value="Cachorro Jack Russell Terrier">Cachorro Jack Russell Terrier</option>
                  <option value="Cachorro Labrador Retriever">Cachorro Labrador Retriever</option>
                  <option value="Cachorro Lhasa Apso">Cachorro Lhasa Apso</option>
                  <option value="Cachorro Lulu da Pomerânia">Cachorro Lulu da Pomerânia</option>
                  <option value="Cachorro Maltês">Cachorro Maltês</option>
                  <option value="Cachorro Papillon">Cachorro Papillon</option>
                  <option value="Cachorro Pastor Alemão">Cachorro Pastor Alemão</option>
                  <option value="Cachorro Pastor Australiano">Cachorro Pastor Australiano</option>
                  <option value="Cachorro Pastor Belga">Cachorro Pastor Belga</option>
                  <option value="Cachorro Pastor Suíço">Cachorro Pastor Suíço</option>
                  <option value="Cachorro Pinscher">Cachorro Pinscher</option>
                  <option value="Cachorro Pit Bull">Cachorro Pit Bull</option>
                  <option value="Cachorro Pomsky">Cachorro Pomsky</option>
                  <option value="Cachorro Poodle">Cachorro Poodle</option>
                  <option value="Cachorro Poodle Toy">Cachorro Poodle Toy</option>
                  <option value="Cachorro Pug">Cachorro Pug</option>
                  <option value="Cachorro Rottweiler">Cachorro Rottweiler</option>
                  <option value="Cachorro Samoieda">Cachorro Samoieda</option>
                  <option value="Cachorro São Bernardo">Cachorro São Bernardo</option>
                  <option value="Cachorro Sapsali">Cachorro Sapsali</option>
                  <option value="Cachorro Schnauzer">Cachorro Schnauzer</option>
                  <option value="Cachorro Shar-Pei">Cachorro Shar-Pei</option>
                  <option value="Cachorro Shetland Sheepdog (Sheltie)">Cachorro Shetland Sheepdog (Sheltie)</option>
                  <option value="Cachorro Shiba Inu">Cachorro Shiba Inu</option>
                  <option value="Cachorro Shih Tzu">Cachorro Shih Tzu</option>
                  <option value="Cachorro Spitz alemão">Cachorro Spitz alemão</option>
                  <option value="Cachorro Staffordshire Bull Terrier">Cachorro Staffordshire Bull Terrier</option>
                  <option value="Cachorro Welsh Corgi (Cardigan e Pembroke)">
                    Cachorro Welsh Corgi (Cardigan e Pembroke)
                  </option>
                  <option value="Cachorro West Highland White Terrier">Cachorro West Highland White Terrier</option>
                  <option value="Cachorro Whippet">Cachorro Whippet</option>
                  <option value="Yorkshire Terrier">Yorkshire Terrier</option>
                </optgroup>

                <optgroup label="Gatos">
                  <option value="Gato Sem Raça Definida">Gato Sem Raça Definida</option>
                  <option value="Gato Maine Coon">Gato Maine Coon</option>
                  <option value="Gato Sphynx">Gato Sphynx</option>
                  <option value="Gato Persa">Gato Persa</option>
                  <option value="Gato Ragdoll">Gato Ragdoll</option>
                  <option value="Gato Abyssinian">Gato Abyssinian</option>
                  <option value="Gato American Shorthair">Gato American Shorthair</option>
                  <option value="Gato Birman">Gato Birman</option>
                  <option value="Gato British Shorthair">Gato British Shorthair</option>
                  <option value="Gato Burmese">Gato Burmese</option>
                  <option value="Gato Devon Rex">Gato Devon Rex</option>
                  <option value="Gato Egyptian Mau">Gato Egyptian Mau</option>
                  <option value="Gato Exotic Shorthair">Gato Exotic Shorthair</option>
                  <option value="Gato Himalayan">Gato Himalayan</option>
                  <option value="Gato Norwegian Forest Cat">Gato Norwegian Forest Cat</option>
                  <option value="Gato Russian Blue">Gato Russian Blue</option>
                  <option value="Gato Scottish Fold">Gato Scottish Fold</option>
                  <option value="Gato Siamese">Gato Siamese</option>
                  <option value="Gato Singapura">Gato Singapura</option>
                  <option value="Gato Somali">Gato Somali</option>
                  <option value="Gato Turkish Angora">Gato Turkish Angora</option>
                </optgroup>

                <optgroup label="Outros">
                  <option value="Cavalo">Cavalo</option>
                  <option value="Porquinho da índia">Porquinho da índia</option>
                  <option value="Hamster">Hamster</option>
                  <option value="Lagarto">Lagarto</option>
                  <option value="Periquito">Periquito</option>
                  <option value="Calopsita">Calopsita</option>
                </optgroup>
              </select>
            </div>

            {/* Upload de Fotos */}
            <div className="mb-6">
              <ImageUpload onImagesUploaded={handleImagesUploaded} maxImages={5} maxSizeInMB={5} />
            </div>

            {/* Observações */}
            <div className="mb-6">
              <label htmlFor="observacao" className="block text-sm font-medium text-gray-700 mb-1">
                Alguma história especial que gostaria de compartilhar conosco?
              </label>
              <textarea
                id="observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Conte aqui a história do seu bichinho."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]"
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">
                Atenção: Não realizamos qualquer personalização extra que não esteja disponível nos campos acima.
              </p>
            </div>

            {/* Botão de Envio */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#F1542E] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e04020] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar pedido"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
