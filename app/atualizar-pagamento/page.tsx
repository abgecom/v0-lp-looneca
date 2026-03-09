"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Loader2, CreditCard, Check, AlertCircle, Shield, Lock } from "lucide-react"

function AtualizarPagamentoContent() {
  const searchParams = useSearchParams()
  const subscriptionIdFromUrl = searchParams.get("subscription_id") || ""

  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    subscriptionId: subscriptionIdFromUrl,
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
    cep: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // CEP validation state
  const [cepStatus, setCepStatus] = useState<{
    isValid: boolean
    message: string
    loading: boolean
  }>({
    isValid: false,
    message: "",
    loading: false,
  })

  // Update subscription ID from URL when it changes
  useEffect(() => {
    if (subscriptionIdFromUrl) {
      setFormData((prev) => ({ ...prev, subscriptionId: subscriptionIdFromUrl }))
    }
  }, [subscriptionIdFromUrl])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Apply uppercase to card name
    const processedValue = name === "cardName" ? value.toUpperCase() : value

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }))

    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Format card number with spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")

    // Limit to 16 digits
    if (value.length > 16) {
      value = value.slice(0, 16)
    }

    // Add spaces every 4 digits
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ")

    setFormData((prev) => ({ ...prev, cardNumber: formatted }))

    if (formErrors.cardNumber) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.cardNumber
        return newErrors
      })
    }
  }

  // Format card expiry (MM/YY)
  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")

    if (value.length > 4) {
      value = value.slice(0, 4)
    }

    if (value.length >= 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`
    }

    setFormData((prev) => ({ ...prev, cardExpiry: value }))

    if (formErrors.cardExpiry) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.cardExpiry
        return newErrors
      })
    }
  }

  // Handle CVV input
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")

    if (value.length > 4) {
      value = value.slice(0, 4)
    }

    setFormData((prev) => ({ ...prev, cardCvv: value }))

    if (formErrors.cardCvv) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.cardCvv
        return newErrors
      })
    }
  }

  // Handle CEP change
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")

    if (value.length > 8) {
      value = value.slice(0, 8)
    }

    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5)}`
    }

    setFormData((prev) => ({ ...prev, cep: value }))

    // Auto-validate when 8 digits are entered
    if (value.replace(/\D/g, "").length === 8) {
      validateAndFetchCep(value)
    } else {
      setCepStatus({ isValid: false, message: "", loading: false })
    }
  }

  // Validate and fetch CEP data
  const validateAndFetchCep = async (cepValue: string) => {
    const cep = cepValue.replace(/\D/g, "")
    if (cep.length !== 8) return

    setCepStatus({ isValid: false, message: "", loading: true })

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (data.erro) {
        setCepStatus({
          isValid: false,
          message: "CEP invalido ou nao encontrado",
          loading: false,
        })
        return
      }

      setFormData((prev) => ({
        ...prev,
        address: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      }))

      setCepStatus({
        isValid: true,
        message: "Endereco encontrado",
        loading: false,
      })
    } catch (err) {
      console.error("Erro ao buscar CEP:", err)
      setCepStatus({
        isValid: false,
        message: "Erro ao buscar CEP",
        loading: false,
      })
    }
  }

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.subscriptionId.trim()) {
      errors.subscriptionId = "ID da assinatura e obrigatorio"
    }

    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, "").length < 16) {
      errors.cardNumber = "Numero do cartao invalido"
    }

    if (!formData.cardName.trim()) {
      errors.cardName = "Nome no cartao e obrigatorio"
    }

    if (!formData.cardExpiry || !/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) {
      errors.cardExpiry = "Data de validade invalida"
    } else {
      const [month, year] = formData.cardExpiry.split("/")
      const expMonth = parseInt(month, 10)
      const expYear = parseInt(`20${year}`, 10)
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1

      if (expMonth < 1 || expMonth > 12) {
        errors.cardExpiry = "Mes invalido"
      } else if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        errors.cardExpiry = "Cartao vencido"
      }
    }

    if (!formData.cardCvv || formData.cardCvv.length < 3) {
      errors.cardCvv = "CVV invalido"
    }

    // Address validation (optional but if CEP is filled, require full address)
    if (formData.cep && formData.cep.replace(/\D/g, "").length === 8) {
      if (!formData.address.trim()) {
        errors.address = "Endereco e obrigatorio"
      }
      if (!formData.number.trim()) {
        errors.number = "Numero e obrigatorio"
      }
      if (!formData.city.trim()) {
        errors.city = "Cidade e obrigatoria"
      }
      if (!formData.state.trim()) {
        errors.state = "Estado e obrigatorio"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      const firstErrorField = Object.keys(formErrors)[0]
      const element = document.querySelector(`[name="${firstErrorField}"]`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const [expMonth, expYear] = formData.cardExpiry.split("/")

      const requestBody: any = {
        subscription_id: formData.subscriptionId.trim(),
        card_data: {
          number: formData.cardNumber.replace(/\s/g, ""),
          holder_name: formData.cardName,
          exp_month: expMonth,
          exp_year: `20${expYear}`,
          cvv: formData.cardCvv,
        },
      }

      // Add billing address if provided
      if (formData.cep && formData.cep.replace(/\D/g, "").length === 8) {
        requestBody.billing_address = {
          line_1: `${formData.address}, ${formData.number}`,
          line_2: formData.complement || "",
          zip_code: formData.cep,
          city: formData.city,
          state: formData.state,
          country: "BR",
        }
      }

      const response = await fetch("/api/pagarme/update-payment-method", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Falha ao atualizar metodo de pagamento")
      }

      setSuccess(true)
    } catch (err) {
      console.error("Erro ao atualizar pagamento:", err)
      setError(err instanceof Error ? err.message : "Erro ao processar a solicitacao")
    } finally {
      setIsProcessing(false)
    }
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-[#FFFCF6] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pagamento Atualizado
          </h1>
          <p className="text-gray-600 mb-6">
            Seu metodo de pagamento foi atualizado com sucesso. As proximas cobrancas serao realizadas automaticamente no novo cartao cadastrado.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full bg-[#F1542E] text-white font-medium py-3 px-6 rounded-lg hover:bg-[#e04020] transition-colors"
          >
            Voltar para a pagina inicial
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFCF6]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/">
            <Image
              src="/images/petloo-logo-new.png"
              alt="Petloo Logo"
              width={150}
              height={50}
              className="h-10 w-auto"
            />
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#F1542E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-[#F1542E]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Atualizar Metodo de Pagamento
          </h1>
          <p className="text-gray-600">
            Atualize os dados do cartao de credito da sua assinatura
          </p>
        </div>

        {/* Security Badge */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-green-800 font-medium">Pagamento Seguro</p>
            <p className="text-xs text-green-700">
              Seus dados sao criptografados e processados com seguranca pela Pagar.me
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-medium">Erro ao atualizar</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {/* Subscription ID */}
          <div className="mb-6">
            <label htmlFor="subscriptionId" className="block text-sm font-medium text-gray-700 mb-2">
              ID da Assinatura
            </label>
            <input
              type="text"
              id="subscriptionId"
              name="subscriptionId"
              value={formData.subscriptionId}
              onChange={handleInputChange}
              placeholder="sub_xxxxxxxxxxxxxxxx"
              className={`w-full px-4 py-3 border ${
                formErrors.subscriptionId ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-transparent`}
            />
            {formErrors.subscriptionId && (
              <p className="text-red-500 text-xs mt-1">{formErrors.subscriptionId}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Voce pode encontrar o ID da assinatura no e-mail de confirmacao ou entrando em contato conosco
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />

          {/* Card Information */}
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-600" />
            Dados do Novo Cartao
          </h2>

          <div className="space-y-4 mb-6">
            {/* Card Number */}
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Numero do Cartao
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className={`w-full px-4 py-3 border ${
                    formErrors.cardNumber ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-transparent`}
                />
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {formErrors.cardNumber && (
                <p className="text-red-500 text-xs mt-1">{formErrors.cardNumber}</p>
              )}
            </div>

            {/* Card Holder Name */}
            <div>
              <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-2">
                Nome no Cartao
              </label>
              <input
                type="text"
                id="cardName"
                name="cardName"
                value={formData.cardName}
                onChange={handleInputChange}
                placeholder="NOME COMO ESTA NO CARTAO"
                className={`w-full px-4 py-3 border ${
                  formErrors.cardName ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-transparent uppercase`}
              />
              {formErrors.cardName && (
                <p className="text-red-500 text-xs mt-1">{formErrors.cardName}</p>
              )}
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 mb-2">
                  Validade
                </label>
                <input
                  type="text"
                  id="cardExpiry"
                  name="cardExpiry"
                  value={formData.cardExpiry}
                  onChange={handleCardExpiryChange}
                  placeholder="MM/AA"
                  maxLength={5}
                  className={`w-full px-4 py-3 border ${
                    formErrors.cardExpiry ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-transparent`}
                />
                {formErrors.cardExpiry && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.cardExpiry}</p>
                )}
              </div>

              <div>
                <label htmlFor="cardCvv" className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  id="cardCvv"
                  name="cardCvv"
                  value={formData.cardCvv}
                  onChange={handleCvvChange}
                  placeholder="000"
                  maxLength={4}
                  className={`w-full px-4 py-3 border ${
                    formErrors.cardCvv ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-transparent`}
                />
                {formErrors.cardCvv && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.cardCvv}</p>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />

          {/* Billing Address (Optional) */}
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Endereco de Cobranca
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Opcional - preencha se o endereco de cobranca for diferente
          </p>

          <div className="space-y-4">
            {/* CEP */}
            <div>
              <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-2">
                CEP
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="cep"
                  name="cep"
                  value={formData.cep}
                  onChange={handleCepChange}
                  placeholder="00000-000"
                  maxLength={9}
                  className={`w-full px-4 py-3 border ${
                    cepStatus.isValid
                      ? "border-green-500 bg-green-50"
                      : formErrors.cep
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-transparent`}
                />
                {cepStatus.loading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-[#F1542E]" />
                )}
                {cepStatus.isValid && !cepStatus.loading && (
                  <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {cepStatus.message && (
                <p className={`text-xs mt-1 ${cepStatus.isValid ? "text-green-600" : "text-red-500"}`}>
                  {cepStatus.message}
                </p>
              )}
            </div>

            {/* Address fields - show when CEP is valid */}
            {cepStatus.isValid && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Endereco
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Rua, Avenida, etc."
                      className={`w-full px-4 py-3 border ${
                        formErrors.address ? "border-red-500" : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-transparent bg-green-50`}
                    />
                    {formErrors.address && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">
                      Numero
                    </label>
                    <input
                      type="text"
                      id="number"
                      name="number"
                      value={formData.number}
                      onChange={handleInputChange}
                      placeholder="123"
                      className={`w-full px-4 py-3 border ${
                        formErrors.number ? "border-red-500" : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-transparent`}
                    />
                    {formErrors.number && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.number}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="complement" className="block text-sm font-medium text-gray-700 mb-2">
                    Complemento (opcional)
                  </label>
                  <input
                    type="text"
                    id="complement"
                    name="complement"
                    value={formData.complement}
                    onChange={handleInputChange}
                    placeholder="Apto, Bloco, etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-2">
                      Bairro
                    </label>
                    <input
                      type="text"
                      id="neighborhood"
                      name="neighborhood"
                      value={formData.neighborhood}
                      onChange={handleInputChange}
                      placeholder="Bairro"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-transparent bg-green-50"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Cidade"
                      className={`w-full px-4 py-3 border ${
                        formErrors.city ? "border-red-500" : "border-gray-300"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-transparent bg-green-50`}
                    />
                    {formErrors.city && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>
                    )}
                  </div>
                </div>

                <div className="w-1/3">
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="UF"
                    maxLength={2}
                    className={`w-full px-4 py-3 border ${
                      formErrors.state ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F1542E] focus:border-transparent bg-green-50 uppercase`}
                  />
                  {formErrors.state && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full mt-8 bg-[#F1542E] text-white font-semibold py-4 px-6 rounded-lg hover:bg-[#e04020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Atualizar Metodo de Pagamento
              </>
            )}
          </button>

          {/* Info text */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Ao clicar em atualizar, voce autoriza a alteracao do metodo de pagamento da sua assinatura.
            As proximas cobrancas serao realizadas no novo cartao cadastrado.
          </p>
        </form>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Precisa de ajuda?{" "}
            <a
              href="mailto:contato@petloo.com.br"
              className="text-[#F1542E] hover:underline font-medium"
            >
              Entre em contato
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#FFFCF6] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#F1542E]" />
    </div>
  )
}

// Main export with Suspense boundary
export default function AtualizarPagamentoPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AtualizarPagamentoContent />
    </Suspense>
  )
}
