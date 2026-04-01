"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { CreditCard, Shield, Clock, Gift, AlertCircle, Loader2, Check, X } from "lucide-react"
import { getPedidoByIdPagamento } from "@/actions/pedidos-actions"

interface PedidoData {
  pedido_numero: number
  nome_cliente: string
  email_cliente: string
  telefone_cliente: string
  cpf_cliente: string
  endereco_cliente: string
  numero_residencia_cliente: string
  bairro_cliente: string
  cidade_cliente: string
  estado_cliente: string
  cep_cliente: string
}

export default function UpsellTagPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pedidoData, setPedidoData] = useState<PedidoData | null>(null)
  const [isLoadingPedido, setIsLoadingPedido] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state para cartão
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const idPagamento = searchParams.get("id_pagamento")
  const pedidoNumero = searchParams.get("pedido")

  // Buscar dados do pedido
  useEffect(() => {
    if (idPagamento) {
      setIsLoadingPedido(true)
      getPedidoByIdPagamento(idPagamento)
        .then((res) => {
          if (res.success && res.data) {
            setPedidoData({
              pedido_numero: res.data.pedido_numero,
              nome_cliente: res.data.nome_cliente,
              email_cliente: res.data.email_cliente,
              telefone_cliente: res.data.telefone_cliente,
              cpf_cliente: res.data.cpf_cliente,
              endereco_cliente: res.data.endereco_cliente,
              numero_residencia_cliente: res.data.numero_residencia_cliente,
              bairro_cliente: res.data.bairro_cliente,
              cidade_cliente: res.data.cidade_cliente,
              estado_cliente: res.data.estado_cliente,
              cep_cliente: res.data.cep_cliente,
            })
          }
          setIsLoadingPedido(false)
        })
        .catch(() => {
          setIsLoadingPedido(false)
        })
    } else {
      setIsLoadingPedido(false)
    }
  }, [idPagamento])

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4)
    }
    return v
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let processedValue = value

    if (name === "cardNumber") {
      processedValue = formatCardNumber(value)
    } else if (name === "cardExpiry") {
      processedValue = formatExpiry(value)
    } else if (name === "cardName") {
      processedValue = value.toUpperCase()
    } else if (name === "cardCvv") {
      processedValue = value.replace(/[^0-9]/g, "").substring(0, 4)
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }))

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, "").length < 16) {
      errors.cardNumber = "Número de cartão inválido"
    }

    if (!formData.cardName) {
      errors.cardName = "Nome no cartão é obrigatório"
    }

    if (!formData.cardExpiry || !/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) {
      errors.cardExpiry = "Data de validade inválida"
    }

    if (!formData.cardCvv || formData.cardCvv.length < 3) {
      errors.cardCvv = "CVV inválido"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!pedidoData) {
      setError("Dados do pedido não encontrados. Tente novamente.")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Garantir que todos os campos são strings válidas
      const telefone = (pedidoData.telefone_cliente || "").replace(/\D/g, "")
      const cpf = (pedidoData.cpf_cliente || "").replace(/\D/g, "")
      const cep = (pedidoData.cep_cliente || "").replace(/\D/g, "")
      const endereco = pedidoData.endereco_cliente || ""
      const numero = pedidoData.numero_residencia_cliente || ""
      const cidade = pedidoData.cidade_cliente || ""
      const estado = pedidoData.estado_cliente || ""
      const bairro = pedidoData.bairro_cliente || ""

      // Preparar dados do cliente
      const customerData = {
        name: pedidoData.nome_cliente || "",
        email: pedidoData.email_cliente || "",
        document: cpf,
        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: telefone.substring(0, 2) || "11",
            number: telefone.substring(2) || "999999999",
          },
        },
        address: {
          line_1: `${endereco}, ${numero}`.trim() || "Endereço não informado",
          line_2: bairro,
          zip_code: cep || "00000000",
          city: cidade || "São Paulo",
          state: estado || "SP",
          country: "BR",
        },
      }

      // Preparar dados do cartão
      const [expMonth, expYear] = formData.cardExpiry.split("/")
      const cardData = {
        number: formData.cardNumber.replace(/\s/g, ""),
        holder_name: formData.cardName,
        exp_month: parseInt(expMonth, 10),
        exp_year: parseInt(`20${expYear}`, 10),
        cvv: formData.cardCvv,
        billing_address: {
          line_1: `${endereco}, ${numero}`.trim() || "Endereço não informado",
          line_2: bairro,
          zip_code: cep || "00000000",
          city: cidade || "São Paulo",
          state: estado || "SP",
          country: "BR",
        },
      }

      // Chamar API para criar assinatura
      const response = await fetch("/api/pagarme/create-subscription-zero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customerData,
          card: cardData,
          pedidoId: idPagamento,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erro ao processar cadastro do cartão")
      }

      setSuccess(true)

      // Redirecionar para página de obrigado após 2 segundos
      setTimeout(() => {
        router.push(`/thank-you?id_pagamento=${idPagamento}&pedido=${pedidoData.pedido_numero}`)
      }, 2000)

    } catch (err) {
      console.error("Erro ao processar cadastro:", err)
      setError(err instanceof Error ? err.message : "Erro ao processar. Tente novamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Recusar oferta
  const handleDecline = () => {
    router.push(`/thank-you?id_pagamento=${idPagamento}&pedido=${pedidoNumero || pedidoData?.pedido_numero}`)
  }

  if (isLoadingPedido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F1542E] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cartão cadastrado com sucesso!</h2>
          <p className="text-gray-600 mb-4">
            Sua tag Petloo será enviada junto com seu pedido. Você terá 30 dias grátis para testar!
          </p>
          <p className="text-sm text-gray-500">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8F6] to-white py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header com oferta especial */}
        <div className="bg-[#F1542E] text-white rounded-t-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Gift className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Oferta Exclusiva</span>
          </div>
          <h1 className="text-xl font-bold">Receba sua Tag Petloo GRÁTIS!</h1>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-b-xl shadow-lg overflow-hidden">
          {/* Imagem do produto */}
          <div className="relative h-48">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_sp1jwfsp1jwfsp1j.png-mWfJvbDukdwhtbQveewIYC6X8CzGRW.jpeg"
              alt="Tag Petloo"
              fill
              className="object-cover"
            />
          </div>

          {/* Copy persuasiva */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                Parabéns pela compra, {pedidoData?.nome_cliente?.split(" ")[0] || "Cliente"}!
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Queremos que você receba a <strong>Tag de Rastreamento Petloo</strong> junto com sua Looneca 
                para proteger seu pet. Para isso, precisamos apenas cadastrar seu cartão.
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium mb-1">
                      Nenhuma cobrança será feita agora!
                    </p>
                    <p className="text-xs text-amber-700">
                      Você terá <strong>30 dias grátis</strong> para testar a tag. Se não gostar, 
                      é só cancelar antes do término do período de teste e você não pagará nada.
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefícios */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-700">Tag enviada <strong>junto com sua Looneca</strong></p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-700"><strong>30 dias grátis</strong> para testar</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-700">Cancele quando quiser, <strong>sem burocracia</strong></p>
                </div>
              </div>

              {/* Preço após trial */}
              <div className="bg-gray-50 rounded-lg p-4 text-center mb-6">
                <p className="text-xs text-gray-500 mb-1">Após o período de teste</p>
                <p className="text-lg font-bold text-gray-900">
                  R$ 30,05<span className="text-sm font-normal text-gray-500">/mês</span>
                </p>
              </div>
            </div>

            {/* Formulário do cartão */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Dados do Cartão</span>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Número do cartão */}
              <div>
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Número do Cartão
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className={`w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-[#F1542E] ${
                    formErrors.cardNumber ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {formErrors.cardNumber && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.cardNumber}</p>
                )}
              </div>

              {/* Nome no cartão */}
              <div>
                <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome no Cartão
                </label>
                <input
                  type="text"
                  id="cardName"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  placeholder="NOME COMO ESTÁ NO CARTÃO"
                  className={`w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-[#F1542E] ${
                    formErrors.cardName ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {formErrors.cardName && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.cardName}</p>
                )}
              </div>

              {/* Validade e CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                    Validade
                  </label>
                  <input
                    type="text"
                    id="cardExpiry"
                    name="cardExpiry"
                    value={formData.cardExpiry}
                    onChange={handleInputChange}
                    placeholder="MM/AA"
                    maxLength={5}
                    className={`w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-[#F1542E] ${
                      formErrors.cardExpiry ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {formErrors.cardExpiry && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.cardExpiry}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="cardCvv" className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    id="cardCvv"
                    name="cardCvv"
                    value={formData.cardCvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength={4}
                    className={`w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-[#F1542E] ${
                      formErrors.cardCvv ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {formErrors.cardCvv && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.cardCvv}</p>
                  )}
                </div>
              </div>

              {/* Botão de submit */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-[#F1542E] text-white py-3.5 px-4 rounded-lg font-semibold hover:bg-[#d94825] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-md"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    Quero receber minha Tag GRÁTIS
                  </>
                )}
              </button>

              {/* Segurança */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Pagamento 100% seguro - Dados criptografados</span>
              </div>
            </form>

            {/* Botão de recusa */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <button
                onClick={handleDecline}
                className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
              >
                Não desejo receber a tag
              </button>
            </div>
          </div>
        </div>

        {/* Informação adicional */}
        <p className="text-xs text-gray-400 text-center mt-4 px-4">
          Ao cadastrar seu cartão, você concorda com os termos de uso do serviço Petloo. 
          A primeira cobrança ocorrerá apenas após 30 dias.
        </p>
      </div>
    </div>
  )
}
