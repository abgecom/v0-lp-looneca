"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag, Check } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useCart } from "@/contexts/cart-context"
import { trackFBEvent } from "@/components/facebook-pixel"
import { ACCESSORY_PRICE, getAccessoryName } from "@/components/accessories-section"

// Adicionar interfaces para as ofertas adicionais
interface AdditionalOffer {
  id: string
  name: string
  description: string
  benefits: string[]
  originalPrice: number
  currentPrice: number
  imageSrc: string
}

export default function CartPage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const cartEventTrackedRef = useRef(false)

  const ENABLE_SUBSCRIPTION_OFFERS = true

  // Estado para armazenar os dados do carrinho
  const [cartItems, setCartItems] = useState<any[]>([])
  const [cartTotalPrice, setCartTotalPrice] = useState(0)
  const [cartTotalItems, setCartTotalItems] = useState(0)

  const cart = useCart() // Call the hook at the top level

  // Usar useEffect para acessar o contexto do carrinho apenas no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Disparar evento AddToCart quando a página carregar
  useEffect(() => {
    if (!cartEventTrackedRef.current && cart.items.length > 0) {
      const eventId = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`

      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: "add_to_cart",
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

      trackFBEvent("AddToCart", {
        value: cart.totalPrice,
        currency: "BRL",
        eventID: eventId,
      })

      cartEventTrackedRef.current = true
    }
  }, [cart.items])

  // Atualizar os estados locais quando o carrinho mudar
  useEffect(() => {
    if (isClient) {
      setCartItems(cart.items)
      setCartTotalPrice(cart.totalPrice)
      setCartTotalItems(cart.totalItems)
    }
  }, [isClient, cart.items, cart.totalPrice, cart.totalItems])

  // Dados das ofertas adicionais (apenas tag de rastreamento Petloo ativa)
  const additionalOffers: AdditionalOffer[] = [
    {
      id: "app-petloo",
      name: "App Petloo",
      description: "Aplicativo completo para cuidar do seu pet",
      benefits: [
        "Tag de rastreamento para coleira",
        "Cartão de vacina digital",
        "Descontos exclusivos",
        "Registro do pet",
      ],
      originalPrice: 30.0,
      currentPrice: 0,
      imageSrc: "https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Tag%20rastreamento/foto%20crossell.png",
    },
  ]

  const handleCheckout = () => {
    setIsProcessing(true)

    // Verificar se o carrinho tem itens
    if (cartItems.length === 0) {
      setIsProcessing(false)
      alert("Seu carrinho está vazio. Adicione produtos antes de finalizar a compra.")
      return
    }

    // Salvar o estado do carrinho no localStorage para garantir que esteja disponível na página de checkout
    localStorage.setItem("looneca-cart", JSON.stringify(cartItems))

    // Redirect to checkout page after a short delay
    setTimeout(() => {
      router.push("/checkout")
      setIsProcessing(false)
    }, 500)
  }

  // Atualizar a função toggleOffer para usar o contexto do carrinho
  const toggleOffer = (offerId: string) => {
    if (offerId === "app-petloo") {
      cart.toggleRecurringProduct("appPetloo")
    } else if (offerId === "loobook") {
      cart.toggleRecurringProduct("loobook")
    }
  }

  // Formatar preço para o padrão brasileiro
  const formatPrice = (price: number) => {
    return price.toFixed(2).replace(".", ",")
  }

  return (
    <main className="min-h-screen bg-[#FFFCF6] font-anek">
      <Header />

      <div className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-6">
            <Link href="/" className="flex items-center text-gray-600 hover:text-[#F1542E]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Voltar para a loja</span>
            </Link>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-8">Seu Carrinho</h1>

          {!isClient || !cart.isInitialized ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F1542E]"></div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="flex justify-center mb-4">
                <ShoppingBag className="w-16 h-16 text-gray-300" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Seu carrinho está vazio</h2>
              <p className="text-gray-600 mb-6">Adicione alguns produtos para continuar comprando</p>
              <Link
                href="/"
                className="bg-[#F1542E] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e04020] transition-colors inline-block"
              >
                Voltar para a loja
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Lista de produtos */}
              <div className="order-1 lg:w-6/12 lg:order-1">
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="p-4 border-b border-gray-200 hidden md:flex">
                    <div className="w-2/5 font-semibold">Produto</div>
                    <div className="w-1/5 text-center font-semibold">Preço</div>
                    <div className="w-1/5 text-center font-semibold">Quantidade</div>
                    <div className="w-1/5 text-center font-semibold">Total</div>
                  </div>

                  {cartItems.map((item) => (
                    <div key={item.id} className="p-4 border-b border-gray-200 flex flex-col md:flex-row">
                      {/* Produto - Mobile e Desktop */}
                      <div className="w-full md:w-2/5 flex items-center mb-4 md:mb-0">
                        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                          <Image
                            src={item.imageSrc || "/placeholder.svg"}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-gray-600">Cor: {item.color}</p>
                          <p className="text-sm text-gray-600">Pets: {item.petCount}</p>
                          {item.accessories && item.accessories.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700">Acessórios:</p>
                              <ul className="text-xs text-gray-600 list-disc list-inside">
                                {item.accessories.map((accessoryId: string) => (
                                  <li key={accessoryId}>
                                    {getAccessoryName(accessoryId)}
                                    {accessoryId === "angel-wings" && item.angelWingsPets && item.angelWingsPets.length > 0 && (
                                      <span className="text-gray-400 ml-1">
                                        {"("}
                                        {item.angelWingsPets.length === 2
                                          ? "Ambos os pets"
                                          : item.angelWingsPets[0] === "pet1"
                                            ? "Pet 1"
                                            : "Pet 2"}
                                        {")"}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                              <p className="text-xs text-[#F1542E] font-medium mt-1">
                                + R$ {(item.accessories.length * ACCESSORY_PRICE).toFixed(2).replace(".", ",")}
                              </p>
                            </div>
                          )}
                          <button
                            onClick={() => cart.removeItem(item.id)}
                            className="text-red-500 text-sm flex items-center mt-2 md:hidden"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remover
                          </button>
                        </div>
                      </div>

                      {/* Preço - Mobile e Desktop */}
                      <div className="w-full md:w-1/5 flex justify-between md:justify-center items-center mb-4 md:mb-0">
                        <span className="md:hidden font-semibold">Preço:</span>
                        <span>R$ {formatPrice(item.price)}</span>
                      </div>

                      {/* Quantidade - Mobile e Desktop */}
                      <div className="w-full md:w-1/5 flex justify-between md:justify-center items-center mb-4 md:mb-0">
                        <span className="md:hidden font-semibold">Quantidade:</span>
                        <div className="flex items-center">
                          <button
                            onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="mx-2 w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Total - Mobile e Desktop */}
                      <div className="w-full md:w-1/5 flex justify-between md:justify-center items-center">
                        <span className="md:hidden font-semibold">Total:</span>
                        <span className="font-semibold">R$ {formatPrice(item.price * item.quantity)}</span>
                      </div>

                      {/* Botão Remover - Apenas Desktop */}
                      <div className="hidden md:flex md:items-center md:justify-end">
                        <button
                          onClick={() => cart.removeItem(item.id)}
                          className="text-gray-500 hover:text-red-500"
                          aria-label="Remover item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo do pedido */}
              <div className="order-2 lg:w-3/12 lg:order-3 mb-6 lg:mb-0">
                <div className="bg-white rounded-lg shadow-md p-6 lg:sticky lg:top-24">
                  <h2 className="text-xl font-bold mb-4">Resumo do Pedido</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span>
                        Subtotal ({cartTotalItems} {cartTotalItems === 1 ? "item" : "itens"})
                      </span>
                      <span>R$ {formatPrice(cartTotalPrice)}</span>
                    </div>

                    {ENABLE_SUBSCRIPTION_OFFERS &&
                      additionalOffers.map((offer) => {
                        const isSelected =
                          offer.id === "app-petloo"
                            ? cart.recurringProducts.appPetloo
                            : offer.id === "loobook"
                              ? cart.recurringProducts.loobook
                              : false

                        if (isSelected) {
                          return (
                            <div key={offer.id} className="flex justify-between text-sm">
                              <span>{offer.name}</span>
                              <span className="text-green-600">Grátis</span>
                            </div>
                          )
                        }
                        return null
                      })}

                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>R$ {formatPrice(cartTotalPrice)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Em até 12x de R$ {formatPrice(cartTotalPrice / 12)}*
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full bg-[#F1542E] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e04020] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processando...
                      </>
                    ) : (
                      "Finalizar compra"
                    )}
                  </button>

                  <div className="mt-6">
                    <Link href="/" className="text-[#F1542E] hover:underline flex items-center justify-center">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Continuar comprando
                    </Link>
                  </div>
                </div>
              </div>

              {ENABLE_SUBSCRIPTION_OFFERS && (
                <div className="order-3 lg:w-3/12 lg:order-2 space-y-4">
                  <h2 className="text-xl font-bold">Parabéns, você ganhou dois bônus grátis</h2>
                  <p className="text-[#4A4A4A] text-[0.9rem] mb-4">
                    Você terá acesso vip ao App Petloo, onde você encontrará funcionalidades exclusivas 100% gratuitas e
                    também receberá o nosso Loobook, um guia sobre alimentação, hábitos, saúde e comportamento do seu
                    pet.
                  </p>

                  {additionalOffers.map((offer) => {
                    const isSelected =
                      (offer.id === "app-petloo" && cart.recurringProducts.appPetloo) ||
                      (offer.id === "loobook" && cart.recurringProducts.loobook)

                    return (
                      <div
                        key={offer.id}
                        className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 ${
                          isSelected ? "border-2 border-green-500" : "border border-gray-200"
                        }`}
                      >
                        <div className="p-4">
                          {/* Header: imagem + info + botao */}
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                              <Image
                                src={offer.imageSrc || "/placeholder.svg"}
                                alt={offer.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-grow min-w-0">
                              <h3 className="font-semibold text-sm leading-tight">{offer.name}</h3>
                              <p className="text-xs text-gray-600 mt-0.5 leading-snug">{offer.description}</p>
                              <div className="mt-1 flex items-center">
                                <span className="line-through text-gray-400 mr-1.5 text-xs">R$30,00/mes</span>
                                <span className="font-bold text-green-600 text-sm">GRATIS</span>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleOffer(offer.id)}
                              className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                isSelected
                                  ? "bg-green-500 hover:bg-green-600 text-white focus:ring-green-500"
                                  : "bg-gray-200 hover:bg-gray-300 text-gray-600 focus:ring-gray-400"
                              } cursor-pointer`}
                              aria-label={isSelected ? "Remover oferta" : "Adicionar oferta"}
                            >
                              {isSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            </button>
                          </div>

                          {/* Beneficios */}
                          <ul className="mt-3 space-y-1">
                            {offer.benefits.map((benefit, index) => (
                              <li key={index} className="flex items-start">
                                <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 mr-1.5 flex-shrink-0" />
                                <span className="text-xs leading-snug">{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )
                  })}

                  {/* Disclaimer desktop - letras miudas */}
                  {cart.recurringProducts.appPetloo && (
                    <p className="hidden lg:block text-[10px] leading-tight text-gray-400 mt-3">
                      {"Apos o primeiro mes a assinatura do aplicativo sera ativada no valor de R$30,90. Cancele a qualquer momento."}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer
        topDisclaimer={
          ENABLE_SUBSCRIPTION_OFFERS && cart.recurringProducts.appPetloo
            ? "Apos o primeiro mes a assinatura do aplicativo sera ativada no valor de R$30,90. Cancele a qualquer momento."
            : undefined
        }
      />
    </main>
  )
}
