"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/cart-context"
import { saveOrderToDatabase } from "@/actions/order-actions"
import { Loader2, Info, Check, Plus, Minus, Trash2 } from "lucide-react"
import Link from "next/link"
import { processPayment } from "@/actions/payment-actions"
import { exportOrderToShopify } from "@/actions/shopify-actions"
import { calculatePaymentAmount } from "@/lib/payment-utils"
import { trackFBEvent } from "@/components/facebook-pixel"
import { ACCESSORY_PRICE, getAccessoryName } from "@/components/accessories-section"

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "") // remove tudo que não for número
  return `+55${digits}`
}

export default function CheckoutPage() {
  const router = useRouter()
  const cart = useCart()
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "pix">("credit_card")
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string | null>(null)
  const [showShippingOptions, setShowShippingOptions] = useState(false)
  const [showOrderSummary, setShowOrderSummary] = useState(true) // Mudado para true (aberto por padrão)

  // Refs para rastrear eventos do Facebook Pixel
  const cepInputTrackedRef = useRef(false)
  const purchaseEventTrackedRef = useRef(false)
  const checkoutEventTrackedRef = useRef(false)

  // Shipping options state
  const [shippingOption, setShippingOption] = useState<{
    type: "standard" | "express"
    price: number
    name: string
  }>({
    type: "standard",
    price: 17.9,
    name: "Frete Padrão - 15 a 20 dias (Produção) + 4 a 12 dias (Entrega)",
  })

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    cpf: "",
    cep: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
    installments: "1",
    saveInfo: true,
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Estado para controlar o status do CEP
  const [cepStatus, setCepStatus] = useState<{
    isValid: boolean
    message: string
    loading: boolean
  }>({
    isValid: false,
    message: "",
    loading: false,
  })

  // Payment calculation state
  const [paymentCalculation, setPaymentCalculation] = useState<{
    originalAmount: number
    finalAmount: number
    interestAmount: number
    rate: number
    installmentAmount: number
  } | null>(null)

  // Preparar opções de parcelamento
  const [installmentOptions, setInstallmentOptions] = useState<
    Array<{
      value: string
      label: string
      amount: number
    }>
  >([])

  // Verificar se o frete deve ser grátis (subtotal >= 249.90)
  const isShippingFree = cart.isInitialized && cart.totalPrice >= 249.9

  // Calcular o preço do frete com base na regra de frete grátis
  const getShippingPrice = () => {
    if (shippingOption.type === "standard" && isShippingFree) {
      return 0
    }
    return shippingOption.price
  }

  // Calculate total with shipping - only if cart is initialized
  const totalWithShipping = cart.isInitialized ? cart.totalPrice + (showShippingOptions ? getShippingPrice() : 0) : 0

  // Format price for display
  const formatPrice = (price: number) => {
    return price.toFixed(2).replace(".", ",")
  }

  // Funções para controlar quantidade
  const handleIncreaseQuantity = (itemId: string) => {
    const item = cart.items.find((item) => item.id === itemId)
    if (item) {
      cart.updateQuantity(itemId, item.quantity + 1)
    }
  }

  const handleDecreaseQuantity = (itemId: string) => {
    const item = cart.items.find((item) => item.id === itemId)
    if (item) {
      if (item.quantity > 1) {
        cart.updateQuantity(itemId, item.quantity - 1)
      } else {
        cart.removeItem(itemId)
      }
    }
  }

  const handleRemoveItem = (itemId: string) => {
    cart.removeItem(itemId)
  }

  // Verificar se o carrinho está vazio e redirecionar para a página inicial
  useEffect(() => {
    // Aguardar a inicialização do carrinho
    if (cart.isInitialized) {
      setIsLoading(false)

      // Se o carrinho estiver vazio após a inicialização, redirecionar para a página inicial
      if (cart.isEmpty) {
        console.log("Carrinho vazio, redirecionando para a página inicial")
        router.push("/")
      }
    }
  }, [cart.isInitialized, cart.isEmpty, router])

  // Disparar evento InitiateCheckout quando a página carregar
  useEffect(() => {
    if (cart.isInitialized && !checkoutEventTrackedRef.current) {
      const eventId = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`

      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: "begin_checkout",
        event_id: eventId,
        ecommerce: {
          currency: "BRL",
          value: cart.totalPrice,
          items: cart.items.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      })

      trackFBEvent("InitiateCheckout", {
        value: cart.totalPrice,
        currency: "BRL",
        eventID: eventId,
      })

      checkoutEventTrackedRef.current = true
    }
  }, [cart.isInitialized, cart.totalPrice, cart.items])

  // Disparar evento Purchase quando o pagamento for bem-sucedido ou quando o QR Code do PIX for exibido
  useEffect(() => {
    if (!cart.isInitialized || purchaseEventTrackedRef.current) return

    // Verificar se o pagamento foi bem-sucedido (cartão de crédito)
    if (paymentSuccess) {
      trackFBEvent("Purchase", { value: totalWithShipping, currency: "BRL" })
      purchaseEventTrackedRef.current = true
    }

    // Verificar se o QR Code do PIX foi exibido
    if (pixCode && pixQrCodeUrl) {
      trackFBEvent("Purchase", { value: totalWithShipping, currency: "BRL" })
      purchaseEventTrackedRef.current = true
    }
  }, [paymentSuccess, pixCode, pixQrCodeUrl, cart.isInitialized, totalWithShipping])

  // Gerar opções de parcelamento quando o total mudar
  useEffect(() => {
    if (cart.isInitialized && totalWithShipping > 0) {
      const options = []

      // Opção à vista (1x)
      options.push({
        value: "1",
        label: `1x de R$ ${formatPrice(totalWithShipping)}`,
        amount: totalWithShipping,
      })

      // Opções parceladas (2x-12x)
      for (let i = 2; i <= 12; i++) {
        const calculation = calculatePaymentAmount(totalWithShipping, "credit_card", i)
        options.push({
          value: i.toString(),
          label: `${i}x de R$ ${formatPrice(calculation.installmentAmount)}*`,
          amount: calculation.installmentAmount,
        })
      }

      setInstallmentOptions(options)
    }
  }, [cart.isInitialized, totalWithShipping])

  // Calculate payment amounts when payment method or installments change
  useEffect(() => {
    if (cart.isInitialized && totalWithShipping > 0) {
      try {
        const calculation = calculatePaymentAmount(totalWithShipping, paymentMethod, Number(formData.installments))
        setPaymentCalculation(calculation)
      } catch (error) {
        console.error("Error calculating payment amount:", error)
        setPaymentCalculation(null)
      }
    }
  }, [cart.isInitialized, totalWithShipping, paymentMethod, formData.installments])

  // Handle shipping option change
  const handleShippingOptionChange = (type: "standard" | "express") => {
    if (type === "standard") {
      setShippingOption({
        type: "standard",
        price: 17.9,
        name: "Frete Padrão - 15 a 20 dias (Produção) + 4 a 12 dias (Entrega)",
      })
    } else {
      setShippingOption({
        type: "express",
        price: 29.9,
        name: "Frete Expresso - 15 a 20 dias (Produção) + 2 a 6 dias (Entrega)",
      })
    }
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined

    // Aplicar caixa alta automaticamente nos campos de nome
    const processedValue = (name === "name" || name === "cardName") ? value.toUpperCase() : value

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : processedValue,
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

  // Função para formatar o CEP e validar automaticamente
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")

    // Limitar a 8 dígitos
    if (value.length > 8) {
      value = value.slice(0, 8)
    }

    // Aplicar máscara 99999-999
    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5)}`
    }

    setFormData((prev) => ({ ...prev, cep: value }))

    // Disparar evento AddPaymentInfo na primeira vez que o usuário digitar no campo CEP
    if (!cepInputTrackedRef.current && value.length > 0) {
      cepInputTrackedRef.current = true

      if (typeof window !== "undefined") {
        const getCookie = (name: string): string | undefined => {
          const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
          return match ? match[2] : undefined
        }

        const getFbclidFromUrl = (): string | undefined => {
          const params = new URLSearchParams(window.location.search)
          return params.get("fbclid") || undefined
        }

        window.dataLayer = window.dataLayer || []
        window.dataLayer.push({
          event: "user_identified",
          user_data: {
            email: formData.email,
            first_name: formData.name.split(" ")[0] || "",
            last_name: formData.name.split(" ").slice(1).join(" ") || "",
            phone: formatPhone(formData.phone),
            _fbc: getCookie("_fbc"),
            _fbp: getCookie("_fbp"),
            fbclid: getFbclidFromUrl(),
          },
        })
      }

      trackFBEvent("AddPaymentInfo")
    }

    // Se o usuário digitou o 8º dígito, validar e buscar o CEP automaticamente
    if (value.replace(/\D/g, "").length === 8) {
      validateAndFetchCep(value)
    } else {
      // Limpar mensagem de erro/sucesso se o usuário estiver editando o CEP
      setCepStatus({ isValid: false, message: "", loading: false })
    }
  }

  // Função para validar e buscar o CEP
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
          message: "CEP inválido ou não encontrado. Por favor, verifique.",
          loading: false,
        })
        return
      }

      // Preencher os campos com os dados retornados
      setFormData((prev) => ({
        ...prev,
        address: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      }))

      setCepStatus({
        isValid: true,
        message: "Endereço encontrado com sucesso",
        loading: false,
      })

      setShowShippingOptions(true)
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      setCepStatus({
        isValid: false,
        message: "Erro ao buscar CEP. Tente novamente.",
        loading: false,
      })
    }
  }

  // Validate form before submission
  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Required fields validation
    const requiredFields = [
      "email",
      "name",
      "phone",
      "cpf",
      "cep",
      "address",
      "number",
      "neighborhood",
      "city",
      "state",
    ]

    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        errors[field] = "Este campo é obrigatório"
      }
    })

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email inválido"
    }

    // CPF validation
    if (formData.cpf && formData.cpf.replace(/\D/g, "").length !== 11) {
      errors.cpf = "CPF inválido"
    }

    // Phone validation
    if (formData.phone && formData.phone.replace(/\D/g, "").length < 10) {
      errors.phone = "Telefone inválido"
    }

    // Credit card validation if payment method is credit card
    if (paymentMethod === "credit_card") {
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
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Função para formatar o número de telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")

    if (value.length > 0) {
      // Formatar como (XX) XXXXX-XXXX
      if (value.length <= 2) {
        value = `(${value}`
      } else if (value.length <= 7) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`
      } else if (value.length <= 11) {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`
      } else {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`
      }
    }

    setFormData((prev) => ({ ...prev, phone: value }))
  }

  // Função para formatar o CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")

    if (value.length > 0) {
      // Formatar como XXX.XXX.XXX-XX
      if (value.length <= 3) {
        // Nada a fazer
      } else if (value.length <= 6) {
        value = `${value.slice(0, 3)}.${value.slice(3)}`
      } else if (value.length <= 9) {
        value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`
      } else if (value.length <= 11) {
        value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`
      } else {
        value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9, 11)}`
      }
    }

    setFormData((prev) => ({ ...prev, cpf: value }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = Object.keys(formErrors)[0]
      const element = document.querySelector(`[name="${firstErrorField}"]`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    try {
      // Prepare order data
      const orderData = {
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          cpf: formData.cpf,
        },
        shipping: {
          cep: formData.cep,
          address: formData.address,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          method: shippingOption.name,
          price: getShippingPrice(),
        },
        items: cart.items.map((item, index) => {
          // ✅ CORREÇÃO: Buscar dados do pet por item OU usar fallback global
          const itemPetPhotos = (item as any).petPhotos || []
          const itemPetBreeds = (item as any).petBreeds || ""
          const itemPetNotes = (item as any).petNotes || ""

          // Se o item não tem dados próprios E é o primeiro item, usar dados globais
          const useFallback = index === 0 && !itemPetBreeds && !itemPetPhotos.length

          return {
            id: item.id,
            name: item.name,
            color: item.color,
            petCount: item.petCount,
            quantity: item.quantity,
            price: item.price,
            imageSrc: item.imageSrc,
            productId: item.productId,
            variantId: item.variantId,
            sku: item.sku,
            accessories: item.accessories?.map((acc: any) => acc.id || acc) || [],

            // ✅ DADOS DO PET POR ITEM (com fallback global)
            petPhotos: useFallback ? (cart.petPhotos || []) : itemPetPhotos,
            petBreeds: useFallback ? (cart.petTypeBreed || "") : itemPetBreeds,
            petNotes: useFallback ? (cart.petNotes || "") : itemPetNotes,
          }
        }),
        recurringProducts: cart.recurringProducts,
        paymentMethod,
        totalAmount: totalWithShipping,
        installments: Number(formData.installments),

        // ✅ MANTER dados globais para compatibilidade
        petPhotos: cart.petPhotos || [],
        petTypeBreed: cart.petTypeBreed || "",
        petNotes: cart.petNotes || "",

        accessories: cart.accessories?.map((accessory) => ({
          id: accessory.id,
          name: accessory.name,
          price: accessory.price,
          quantity: accessory.quantity,
        })) || [],
      }

      // Process payment
      const paymentResult = await processPayment({
        // ... (argumentos existentes para processPayment)
        // Os dados do pet não são diretamente necessários para processPayment,
        // mas estarão em orderData para saveOrderToDatabase.
        amount: totalWithShipping,
        paymentMethod,
        installments: Number(formData.installments),
        customer: {
          name: formData.name,
          email: formData.email,
          cpf: formData.cpf,
          phone: formData.phone,
        },
        shipping: {
          cep: formData.cep,
          address: formData.address,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          method: shippingOption.name,
          price: getShippingPrice(),
        },
        items: cart.items,
        card:
          paymentMethod === "credit_card"
            ? {
              number: formData.cardNumber.replace(/\s/g, ""),
              holderName: formData.cardName,
              expirationDate: formData.cardExpiry,
              cvv: formData.cardCvv,
            }
            : undefined,
        recurringProducts: cart.recurringProducts,
        // Adicionar dados dos acessórios para o processPayment, se necessário
        accessories: cart.accessories || [],
      })

      if (paymentResult.success) {
        // Save order to database
        // A função saveOrderToDatabase (em order-actions.ts, não mostrada aqui)
        // receberá todos os campos de orderData (incluindo petPhotos, petTypeBreed, petNotes)
        // e deve mapeá-los para os campos 'fotos', 'raca', 'observacoes' ao chamar criarPedido.
        await saveOrderToDatabase({
          ...orderData, // orderData agora contém petPhotos, petTypeBreed, petNotes
          paymentId: paymentResult.orderId || "",
          paymentStatus: paymentResult.status || "pending",
        })

        try {
          const shopifyData = await exportOrderToShopify({
            ...orderData,
            paymentId: paymentResult.orderId || "",
            paymentStatus: paymentResult.status || "pending",
          } as any)
          if (!shopifyData?.success) {
            console.error("❌ [Shopify] Falha ao criar pedido:", {
              status: shopifyData?.status,
              data: shopifyData,
            })
          } else {
            console.log("✅ [Shopify] Pedido criado com sucesso:", {
              orderId: shopifyData.orderId,
              shopifyOrderId: shopifyData.shopifyOrderId,
              orderNumber: shopifyData.orderNumber,
            })
            try {
              sessionStorage.setItem(
                "shopifyOrder",
                JSON.stringify({
                  orderId: shopifyData.orderId,
                  shopifyOrderId: shopifyData.shopifyOrderId,
                  orderNumber: shopifyData.orderNumber,
                }),
              )
            } catch (err) {
              console.error("⚠️ SessionStorage error:", err)
            }
          }
        } catch (err) {
          console.error("❌ [Shopify] Erro ao enviar pedido:", err)
        }

        if (typeof window !== "undefined") {
          const eventId = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`

          const getCookie = (name: string): string | undefined => {
            const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
            return match ? match[2] : undefined
          }

          const getFbclidFromUrl = (): string | undefined => {
            const params = new URLSearchParams(window.location.search)
            return params.get("fbclid") || undefined
          }

          window.dataLayer = window.dataLayer || []
          window.dataLayer.push({
            event: "purchase",
            event_id: eventId,
            ecommerce: {
              transaction_id: paymentResult.orderId || "",
              affiliation: "Loja Petloo",
              value: totalWithShipping,
              currency: "BRL",
              payment_type: paymentMethod,
              items: cart.items.map((item) => ({
                item_id: item.id,
                item_name: item.name,
                price: item.price,
                quantity: item.quantity,
              })),
            },
            user_data: {
              email: formData.email,
              first_name: formData.name.split(" ")[0] || "",
              last_name: formData.name.split(" ").slice(1).join(" ") || "",
              phone: formatPhone(formData.phone),
              _fbc: getCookie("_fbc"),
              _fbp: getCookie("_fbp"),
              fbclid: getFbclidFromUrl(),
            },
          })

          trackFBEvent("Purchase", {
            value: totalWithShipping,
            currency: "BRL",
            eventID: eventId,
          })
        }

        if (paymentMethod === "pix") {
          console.log("[v0] PIX payment result:", {
            orderId: paymentResult.orderId,
            amount: paymentResult.finalAmount,
            pixQrCodeUrl: paymentResult.pixQrCodeUrl,
            pixCode: paymentResult.pixCode,
            pedidoNumero: paymentResult.pedidoNumero,
          })

          const pixDataToSave = {
            orderId: paymentResult.orderId,
            amount: paymentResult.finalAmount,
            qrcode: paymentResult.pixQrCodeUrl,
            copiacola: paymentResult.pixCode,
            pedidoNumero: paymentResult.pedidoNumero,
          }

          console.log("[v0] Saving PIX data to sessionStorage:", pixDataToSave)
          sessionStorage.setItem("pixPaymentData", JSON.stringify(pixDataToSave))

          router.push(`/pix-payment?orderId=${paymentResult.orderId || ""}&amount=${paymentResult.finalAmount || 0}`)
        } else {
          router.push(
            `/thank-you?id_pagamento=${paymentResult.orderId}&pedido=${paymentResult.pedidoNumero || paymentResult.orderId}`,
          )
        }
      } else {
        setPaymentError(paymentResult.error || "Ocorreu um erro ao processar o pagamento. Tente novamente.")
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      setPaymentError("Ocorreu um erro ao processar o pagamento. Tente novamente.")
    } finally {
      setIsProcessing(false)
    }
  }

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

  // Format card expiry date
  const formatCardExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")

    if (v.length > 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`
    }

    return value
  }

  // Handle card number input
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value)
    setFormData((prev) => ({ ...prev, cardNumber: formattedValue }))
  }

  // Handle card expiry input
  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardExpiry(e.target.value)
    setFormData((prev) => ({ ...prev, cardExpiry: formattedValue }))
  }

  // Mostrar tela de carregamento enquanto verifica o carrinho
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#F1E9DB]">
        <Loader2 className="w-8 h-8 animate-spin text-[#F1542E]" />
      </div>
    )
  }

  // Show success message after payment
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">Pagamento realizado com sucesso!</h1>
            <p className="text-gray-600 mb-6">
              Obrigado pela sua compra. Você receberá um e-mail com os detalhes do seu pedido em breve.
            </p>
            <Link
              href="/"
              className="bg-[#F1542E] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e04020] transition-colors"
            >
              Voltar para a loja
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show PIX payment information

  return (
    <div className="min-h-screen bg-white">
      {/* Notification bar */}
      <div className="bg-[#f33] text-white text-center py-2 px-4 text-sm">
        ATENÇÃO: O prazo de entrega dos produtos personalizados inclui o tempo de frete + o prazo de produção (2 a 3
        semanas).
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Mobile: Order summary first, Desktop: Right column - Order summary */}
          <div className="md:w-2/5 order-1 md:order-2">
            {/* Título colapsável para mobile */}
            <div className="md:hidden mb-4">
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                onClick={() => setShowOrderSummary(!showOrderSummary)}
              >
                <span className="font-medium">Resumo do pedido</span>
                <svg
                  className={`w-5 h-5 transition-transform ${showOrderSummary ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div
              className={`bg-white rounded-lg border border-gray-200 p-6 md:sticky md:top-6 ${showOrderSummary ? "block" : "hidden md:block"}`}
            >
              {cart.items.map((item, index) => (
                <div key={index} className="mb-4">
                  <div className="flex">
                    <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                      <Image
                        src={item.imageSrc || "/placeholder.svg"}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-grow">
                      <h3 className="font-medium">
                        {item.name}
                        <br />
                        {item.color}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.petCount === 1 && "Pet 1: Cachorro Sem Raça Definida"}
                        {item.petCount === 2 && (
                          <>
                            Pet 1: Cachorro Sem Raça Definida
                            <br />
                            Pet 2: Cachorro American Staffordshire Terrier
                          </>
                        )}
                        {item.petCount === 3 && (
                          <>
                            Pet 1: Cachorro Sem Raça Definida
                            <br />
                            Pet 2: Cachorro American Staffordshire Terrier
                            <br />
                            Pet 3: Cachorro Golden Retriever
                          </>
                        )}
                      </p>
                      {item.accessories && item.accessories.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-700 mb-1">Acessórios:</p>
                          <ul className="text-xs text-gray-600 space-y-0.5">
                            {item.accessories.map((accessory: any) => (
                              <li key={accessory.id || accessory} className="flex justify-between">
                                <span>{getAccessoryName(accessory.id || accessory)}</span>
                                <span className="text-[#F1542E] font-medium">
                                  + R$ {ACCESSORY_PRICE.toFixed(2).replace(".", ",")}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        {/* Controles de quantidade */}
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleDecreaseQuantity(item.id)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            {item.quantity === 1 ? (
                              <Trash2 className="w-4 h-4 text-red-500" />
                            ) : (
                              <Minus className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                          <span className="text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleIncreaseQuantity(item.id)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        <span className="font-medium">R$ {formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {false && cart.recurringProducts.appPetloo && (
                <div className="mb-4">
                  <div className="flex">
                    <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                      <Image
                        src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/imgapp1-VnnOgP7stsRZkKIeJkojR2Grh3ILVy.png"
                        alt="App Petloo"
                        width={80}
                        height={80}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="ml-4 flex-grow">
                      <h3 className="font-medium">App Petloo</h3>
                      <p className="text-sm text-green-600 font-medium">GRÁTIS</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm">Qtd: 1</span>
                        <span className="font-medium">R$ 0,00</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {false && cart.recurringProducts.loobook && (
                <div className="mb-4">
                  <div className="flex">
                    <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                      <Image
                        src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/imglivro%2Bapp1-bYzQDKdaCXTRBQgXxgOwAH3pCxOgM4.png"
                        alt="Livro digital Loobook"
                        width={80}
                        height={80}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="ml-4 flex-grow">
                      <h3 className="font-medium">Livro digital Loobook</h3>
                      <p className="text-sm text-green-600 font-medium">GRÁTIS</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm">Qtd: 1</span>
                        <span className="font-medium">R$ 0,00</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Exibir acessóriosos */}
              {cart.accessories &&
                cart.accessories.length > 0 &&
                cart.accessories.map((accessory, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex">
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                        <Image
                          src={accessory.imageSrc || "/placeholder.svg"}
                          alt={accessory.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-grow">
                        <h3 className="font-medium">{getAccessoryName(accessory.name)}</h3>
                        <p className="text-sm text-gray-600">
                          {accessory.color && `Cor: ${accessory.color}`}
                          {accessory.size && ` Tamanho: ${accessory.size}`}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              // Implemente lógica para diminuir quantidade ou remover acessório
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="text-sm font-medium min-w-[2rem] text-center">{accessory.quantity}</span>
                            <button
                              type="button"
                              // Implemente lógica para aumentar quantidade
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                          <span className="font-medium">R$ {formatPrice(accessory.price * accessory.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              <div className="mt-4">
                <p className="text-sm mb-2">Tem cupom de desconto ou vale presente?</p>
                <div className="flex mb-4">
                  <input
                    type="text"
                    placeholder="Código do cupom"
                    className="flex-grow border border-gray-300 rounded-l-md px-3 py-2
                    focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]"
                  />
                  <button className="bg-[#F1542E] text-white px-4 py-2 rounded-r-md hover:bg-[#e04020] transition-colors">
                    Aplicar
                  </button>
                </div>
              </div>

              <div className="mb-4 border-t border-gray-200 pt-4">
                <div className="flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span>R$ {formatPrice(cart.totalPrice)}</span>
                </div>
                {showShippingOptions && (
                  <div className="flex justify-between mt-2 font-medium">
                    <span>Frete</span>
                    {isShippingFree && shippingOption.type === "standard" ? (
                      <span className="text-green-600">Grátis</span>
                    ) : (
                      <span>R$ {formatPrice(getShippingPrice())}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>R$ {formatPrice(totalWithShipping)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Em até 12x{Number(formData.installments) > 1 ? "*" : ""} no cartão de crédito
                </p>
              </div>
            </div>
          </div>

          {/* Mobile: Order summary first, Desktop: Left column - Customer information and payment */}
          <div className="md:w-3/5 order-2 md:order-1">
            <div className="mb-6">
              <Link href="/">
                <Image
                  src="/images/petloo-logo-new.png"
                  alt="Petloo Logo"
                  width={150}
                  height={50}
                  className="h-12 w-auto"
                />
              </Link>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Personal Information */}
              <div className="mb-6">
                <h2 className="text-xl font-medium mb-2">Informações Pessoais</h2>
                <p className="text-gray-600 text-sm mb-4">Para quem devemos entregar o pedido?</p>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Digite seu e-mail"
                      className={`w-full px-3 py-2 border ${formErrors.email ? "border-red-500" : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]`}
                      required
                    />
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Digite seu nome completo"
                      className={`w-full px-3 py-2 border ${formErrors.name ? "border-red-500" : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]`}
                      required
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Celular
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="(00) 00000-0000"
                        className={`w-full px-3 py-2 border ${formErrors.phone ? "border-red-500" : "border-gray-300"
                          } rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]`}
                        required
                      />
                      {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                    </div>

                    <div>
                      <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
                        CPF
                      </label>
                      <input
                        type="text"
                        id="cpf"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleCpfChange}
                        placeholder="000.000.000-00"
                        className={`w-full px-3 py-2 border ${formErrors.cpf ? "border-red-500" : "border-gray-300"
                          } rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]`}
                        required
                      />
                      {formErrors.cpf && <p className="text-red-500 text-xs mt-1">{formErrors.cpf}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              <div className="mb-6">
                <h2 className="text-xl font-medium mb-2">Informações de Entrega</h2>
                <p className="text-gray-600 text-sm mb-4">Para onde devemos entregar o pedido?</p>

                <div className="space-y-4">
                  <div className="relative flex-grow">
                    <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-1">
                      CEP
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="cep"
                        name="cep"
                        value={formData.cep}
                        onChange={handleCepChange}
                        placeholder="99999-999"
                        className={`w-full px-3 py-2 ${cepStatus.isValid ? "bg-green-50" : "bg-[#f0f7ff]"} border ${formErrors.cep ? "border-red-500" : cepStatus.isValid ? "border-green-500" : "border-gray-300"
                          } rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]`}
                        required
                      />
                      {cepStatus.loading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="w-5 h-5 animate-spin text-[#F1542E]" />
                        </div>
                      )}
                      {!cepStatus.loading && cepStatus.isValid && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16.6667 5L7.50004 14.1667L3.33337 10"
                              stroke="#22C55E"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    {cepStatus.message && (
                      <p className={`text-xs mt-1 ${cepStatus.isValid ? "text-green-600" : "text-red-500"}`}>
                        {cepStatus.message}
                      </p>
                    )}
                    {formErrors.cep && <p className="text-red-500 text-xs mt-1">{formErrors.cep}</p>}
                  </div>

                  {showShippingOptions && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 relative">
                          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                            Endereço
                          </label>
                          <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Digite seu endereço"
                            className={`w-full px-3 py-2 ${cepStatus.isValid ? "bg-green-50" : "bg-[#f0f7ff]"} border ${formErrors.address
                                ? "border-red-500"
                                : cepStatus.isValid
                                  ? "border-green-500"
                                  : "border-gray-300"
                              } rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]`}
                            required
                          />
                          {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
                        </div>

                        <div>
                          <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                            Número
                          </label>
                          <input
                            type="text"
                            id="number"
                            name="number"
                            value={formData.number}
                            onChange={handleInputChange}
                            placeholder="Nº"
                            className={`w-full px-3 py-2 border ${formErrors.number ? "border-red-500" : "border-gray-300"
                              } rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]`}
                            required
                          />
                          {formErrors.number && <p className="text-red-500 text-xs mt-1">{formErrors.number}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 relative">
                          <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-1">
                            Bairro
                          </label>
                          <input
                            type="text"
                            id="neighborhood"
                            name="neighborhood"
                            value={formData.neighborhood}
                            onChange={handleInputChange}
                            placeholder="Digite seu bairro"
                            className={`w-full px-3 py-2 ${cepStatus.isValid ? "bg-green-50" : "bg-[#f0f7ff]"} border ${formErrors.neighborhood
                                ? "border-red-500"
                                : cepStatus.isValid
                                  ? "border-green-500"
                                  : "border-gray-300"
                              } rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]`}
                            required
                          />
                          {formErrors.neighborhood && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.neighborhood}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="complement" className="block text-sm font-medium text-gray-700 mb-1">
                            Complemento
                          </label>
                          <input
                            type="text"
                            id="complement"
                            name="complement"
                            value={formData.complement}
                            onChange={handleInputChange}
                            placeholder="Apto, bloco..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                            Cidade
                          </label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="Digite sua cidade"
                            className={`w-full px-3 py-2 ${cepStatus.isValid ? "bg-green-50" : "bg-[#f0f7ff]"} border ${formErrors.city
                                ? "border-red-500"
                                : cepStatus.isValid
                                  ? "border-green-500"
                                  : "border-gray-300"
                              } rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]`}
                            required
                          />
                          {formErrors.city && <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>}
                        </div>

                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                            Estado
                          </label>
                          <input
                            type="text"
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            placeholder="UF"
                            className={`w-full px-3 py-2 ${cepStatus.isValid ? "bg-green-50" : "bg-[#f0f7ff]"} border ${formErrors.state
                                ? "border-red-500"
                                : cepStatus.isValid
                                  ? "border-green-500"
                                  : "border-gray-300"
                              } rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]`}
                            required
                          />
                          {formErrors.state && <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Shipping Method */}
              <div className="mb-6">
                <h2 className="text-xl font-medium mb-2">Método de envio</h2>
                <p className="text-gray-600 text-sm mb-4">
                  {showShippingOptions
                    ? "Escolha o seu método de entrega abaixo"
                    : "Preencha seu endereço de entrega para visualizar métodos de entrega."}
                </p>

                {isShippingFree && showShippingOptions && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4 flex items-center">
                    <Check className="text-green-500 mr-2 h-5 w-5" />
                    <p className="text-green-700 text-sm">
                      <span className="font-medium">Parabéns!</span> Você ganhou frete grátis para o método padrão.
                    </p>
                  </div>
                )}

                {showShippingOptions && (
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="border-b border-gray-200">
                      <label className="flex items-center p-4 cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center">
                          <div
                            className="w-5 h-5 rounded-full border border-[#f33] flex items-center justify-center mr-3"
                            onClick={() => handleShippingOptionChange("standard")}
                          >
                            {shippingOption.type === "standard" && (
                              <div className="w-3 h-3 rounded-full bg-[#f33]"></div>
                            )}
                          </div>
                        </div>
                        <div className="flex-grow" onClick={() => handleShippingOptionChange("standard")}>
                          <span className="block">Frete Padrão - 15 a 20 dias (Produção) + 4 a 12 dias (Entrega)</span>
                        </div>
                        <div className="ml-4 font-medium">
                          {isShippingFree ? <span className="text-green-600">Grátis</span> : <span>R$ 17,90</span>}
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center p-4 cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center">
                          <div
                            className={`w-5 h-5 rounded-full border ${shippingOption.type === "express" ? "border-[#f33]" : "border-gray-300"} flex items-center justify-center mr-3`}
                            onClick={() => handleShippingOptionChange("express")}
                          >
                            {shippingOption.type === "express" && (
                              <div className="w-3 h-3 rounded-full bg-[#f33]"></div>
                            )}
                          </div>
                        </div>
                        <div className="flex-grow" onClick={() => handleShippingOptionChange("express")}>
                          <span className="block">Frete Expresso - 15 a 20 dias (Produção) + 2 a 6 dias (Entrega)</span>
                        </div>
                        <div className="ml-4 font-medium">R$ 29,90</div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h2 className="text-xl font-medium mb-2">Método de pagamento</h2>
                <p className="text-gray-600 text-sm mb-4">Escolha o seu método de pagamento abaixo</p>

                <div className="space-y-4">
                  {/* Credit Card Option */}
                  <div
                    className={`border rounded-md p-4 cursor-pointer ${paymentMethod === "credit_card" ? "border-[#F1542E]" : "border-gray-300"
                      }`}
                    onClick={() => setPaymentMethod("credit_card")}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === "credit_card" ? "border-[#F1542E]" : "border-gray-400"
                          }`}
                      >
                        {paymentMethod === "credit_card" && <div className="w-3 h-3 rounded-full bg-[#F1542E]"></div>}
                      </div>
                      <label className="ml-2 font-medium cursor-pointer">Cartão de Crédito</label>
                      <div className="ml-auto flex items-center space-x-2">
                        <Image
                          src="/images/design-mode/ChatGPT%20Image%2022%20de%20mai.%20de%202025%2C%2013_19_05%201.png"
                          alt="Métodos de pagamento"
                          width={100}
                          height={30}
                          className="h-6 w-auto"
                        />
                        <span className="text-xs text-gray-500">E muito mais...</span>
                      </div>
                    </div>

                    {paymentMethod === "credit_card" && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <input
                            type="text"
                            id="cardNumber"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleCardNumberChange}
                            maxLength={19}
                            className={`w-full px-3 py-2 border ${formErrors.cardNumber ? "border-red-500" : "border-gray-300"
                              } rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]`}
                            placeholder="Número do cartão"
                          />
                          {formErrors.cardNumber && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.cardNumber}</p>
                          )}
                        </div>

                        <div>
                          <input
                            type="text"
                            id="cardName"
                            name="cardName"
                            value={formData.cardName}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border ${formErrors.cardName ? "border-red-500" : "border-gray-300"
                              } rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]`}
                            placeholder="Nome impresso no cartão"
                          />
                          {formErrors.cardName && <p className="text-red-500 text-xs mt-1">{formErrors.cardName}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <input
                              type="text"
                              id="cardExpiry"
                              name="cardExpiry"
                              value={formData.cardExpiry}
                              onChange={handleCardExpiryChange}
                              maxLength={5}
                              className={`w-full px-3 py-2 border ${formErrors.cardExpiry ? "border-red-500" : "border-gray-300"
                                } rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]`}
                              placeholder="MM/AA"
                            />
                            {formErrors.cardExpiry && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.cardExpiry}</p>
                            )}
                          </div>

                          <div>
                            <input
                              type="text"
                              id="cardCvv"
                              name="cardCvv"
                              value={formData.cardCvv}
                              onChange={handleInputChange}
                              maxLength={4}
                              className={`w-full px-3 py-2 border ${formErrors.cardCvv ? "border-red-500" : "border-gray-300"
                                } rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]`}
                              placeholder="CVV"
                            />
                            {formErrors.cardCvv && <p className="text-red-500 text-xs mt-1">{formErrors.cardCvv}</p>}
                          </div>
                        </div>

                        <div>
                          <select
                            id="installments"
                            name="installments"
                            value={formData.installments}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E]"
                          >
                            {installmentOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PIX Option */}
                  <div
                    className={`border rounded-md p-4 cursor-pointer ${paymentMethod === "pix" ? "border-[#F1542E]" : "border-gray-300"
                      }`}
                    onClick={() => setPaymentMethod("pix")}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === "pix" ? "border-[#F1542E]" : "border-gray-400"
                          }`}
                      >
                        {paymentMethod === "pix" && <div className="w-3 h-3 rounded-full bg-[#F1542E]"></div>}
                      </div>
                      <label className="ml-2 font-medium cursor-pointer">PIX</label>
                      <div className="ml-auto">
                        <Image
                          src="/images/design-mode/pix.svg"
                          alt="PIX"
                          width={32}
                          height={32}
                          className="h-8 w-auto"
                        />
                      </div>
                    </div>

                    {paymentMethod === "pix" && (
                      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900">PIX</span>
                          </div>
                          <div className="flex items-center">
                            <Image
                              src="/images/design-mode/pix.svg"
                              alt="PIX"
                              width={32}
                              height={32}
                              className="h-8 w-auto"
                            />
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 mb-3">Clique em "Finalizar Compra" para gerar o PIX.</p>

                        <div className="border-t border-gray-200 pt-3">
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            Informações sobre o pagamento via PIX:
                          </p>
                          <ul className="text-sm text-gray-700 space-y-1">
                            <li className="flex items-start">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              <span>
                                Valor à vista <strong>R$ {formatPrice(totalWithShipping)}</strong>;
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              <span>
                                <strong>Não pode ser parcelado!</strong> Use cartão de crédito para parcelar sua compra;
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              <span>
                                Prazo de até <strong>30 minutos</strong> para compensar.
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="saveInfo"
                      checked={formData.saveInfo}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-[#F1542E] focus:ring-[#F1542E] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Salvar minhas informações com segurança para compras futuras.
                    </span>
                  </label>
                </div>
              </div>

              {paymentCalculation && paymentCalculation.interestAmount > 0 && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h3 className="font-medium mb-2">Resumo do Pagamento</h3>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal + Frete:</span>
                      <span>R$ {formatPrice(paymentCalculation.originalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa ({paymentCalculation.rate.toFixed(2)}%):</span>
                      <span>R$ {formatPrice(paymentCalculation.interestAmount)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total Final:</span>
                      <span>R$ {formatPrice(paymentCalculation.finalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-[#f33] text-white px-6 py-3 rounded-md font-bold hover:bg-[#e02020] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Finalizar compra"
                )}
              </button>

              {paymentError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
                  <Info className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{paymentError}</p>
                </div>
              )}

              <div className="mt-4 text-center text-sm text-gray-600">
                Ao prosseguir, você concorda com os{" "}
                <Link href="/termos" className="text-[#F1542E] hover:underline">
                  Termos de Serviço
                </Link>
              </div>

              {/* Adicionar esta nova seção */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 mb-3">Petloo - Todos os direitos reservados</p>
                <div className="flex justify-center">
                  <Image
                    src="/images/design-mode/image.png"
                    alt="Site Seguro"
                    width={200}
                    height={60}
                    className="h-12 w-auto"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
