"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle, ArrowLeft, ShoppingBag, Loader2 } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { createClient } from "@supabase/supabase-js"

// Tipos para os dados do pedido
interface OrderData {
  pedido_numero: number
  email_cliente: string
  nome_cliente: string
  telefone_cliente: string
  cpf_cliente: string
  cep_cliente: string
  cidade_cliente: string
  estado_cliente: string
  endereco_cliente: string
  numero_residencia_cliente: string
  complemento_cliente?: string
  bairro_cliente: string
  itens_escolhidos: Array<{
    id: string
    name: string
    color: string
    petCount: number
    quantity: number
    price: number
    imageSrc?: string
  }>
  produtos_recorrentes: {
    appPetloo: boolean
    loobook: boolean
  }
  metodo_pagamento: string
  total_pago: number
  id_pagamento: string
  status_pagamento: string
  data_pagamento: string
  fotos_pet?: string[]
  raca_pet?: string
}

export default function ThankYouPage() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Obter o ID do pedido da URL
  const orderId = searchParams.get("order_id")
  const paymentMethod = searchParams.get("payment_method")

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        setError("ID do pedido não encontrado")
        setIsLoading(false)
        return
      }

      try {
        // Criar cliente Supabase (apenas no cliente)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error("Configuração do Supabase não encontrada")
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Buscar dados do pedido
        const { data, error } = await supabase.from("pedidos").select("*").eq("id_pagamento", orderId).single()

        if (error) {
          throw error
        }

        if (!data) {
          throw new Error("Pedido não encontrado")
        }

        setOrderData(data as OrderData)
      } catch (err) {
        console.error("Erro ao buscar dados do pedido:", err)
        setError("Não foi possível carregar os dados do pedido. Por favor, entre em contato com o suporte.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderData()
  }, [orderId])

  // Formatar preço para exibição
  const formatPrice = (price: number) => {
    return price.toFixed(2).replace(".", ",")
  }

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Formatar CPF para exibição
  const formatCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, "")
    if (cleanCPF.length !== 11) return cpf
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  // Formatar telefone para exibição
  const formatPhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "")
    if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    } else if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
    }
    return phone
  }

  return (
    <main className="min-h-screen bg-[#F1E9DB] font-anek">
      <Header />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-[#F1542E] animate-spin mb-4" />
              <p className="text-lg">Carregando informações do seu pedido...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-4">Ops! Algo deu errado</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                href="https://petloo.com.br/"
                className="bg-[#F1542E] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e04020] transition-colors inline-block"
              >
                Voltar para a loja
              </Link>
            </div>
          ) : orderData ? (
            <>
              {/* Cabeçalho da página */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Obrigado pela sua compra!</h1>
                <p className="text-gray-600 mb-2">
                  Seu pedido foi recebido e está sendo processado. Você receberá um e-mail com os detalhes do seu pedido
                  em breve.
                </p>
                <p className="text-lg font-semibold text-[#F1542E]">Número do pedido: #{orderData.pedido_numero}</p>
              </div>

              {/* Resumo do pedido */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-200">Resumo do Pedido</h2>

                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Status do pagamento:</span>
                    <span className="text-green-600 font-medium">
                      {orderData.status_pagamento === "paid" || orderData.status_pagamento === "authorized"
                        ? "Aprovado"
                        : orderData.status_pagamento === "pending"
                          ? "Pendente"
                          : orderData.status_pagamento}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Método de pagamento:</span>
                    <span>
                      {orderData.metodo_pagamento === "credit_card"
                        ? "Cartão de Crédito"
                        : orderData.metodo_pagamento === "pix"
                          ? "PIX"
                          : orderData.metodo_pagamento}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Data do pedido:</span>
                    <span>{formatDate(orderData.data_pagamento)}</span>
                  </div>
                </div>

                {/* Itens do pedido */}
                <h3 className="font-medium mb-3">Itens do pedido</h3>
                <div className="space-y-4 mb-6">
                  {orderData.itens_escolhidos.map((item, index) => (
                    <div key={index} className="flex items-start border-b border-gray-100 pb-4">
                      <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                        <Image
                          src={item.imageSrc || "/placeholder.svg"}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-grow">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          Cor: {item.color} | Pets: {item.petCount}
                        </p>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm">Qtd: {item.quantity}</span>
                          <span className="font-medium">R$ {formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Produtos recorrentes */}
                {(orderData.produtos_recorrentes.appPetloo || orderData.produtos_recorrentes.loobook) && (
                  <div className="mb-6">
                    <h3 className="font-medium mb-3">Produtos adicionais</h3>
                    <div className="space-y-3">
                      {orderData.produtos_recorrentes.appPetloo && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                              <Image
                                src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/imgapp1-VnnOgP7stsRZkKIeJkojR2Grh3ILVy.png"
                                alt="App Petloo"
                                width={40}
                                height={40}
                                className="w-8 h-8 object-contain"
                              />
                            </div>
                            <span>App Petloo</span>
                          </div>
                          <span className="text-green-600 font-medium">GRÁTIS</span>
                        </div>
                      )}
                      {orderData.produtos_recorrentes.loobook && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                              <Image
                                src="https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/imglivro%2Bapp1-bYzQDKdaCXTRBQgXxgOwAH3pCxOgM4.png"
                                alt="Livro digital Loobook"
                                width={40}
                                height={40}
                                className="w-8 h-8 object-contain"
                              />
                            </div>
                            <span>Livro digital Loobook</span>
                          </div>
                          <span className="text-green-600 font-medium">GRÁTIS</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R$ {formatPrice(orderData.total_pago)}</span>
                  </div>
                </div>
              </div>

              {/* Dados do cliente */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-200">Dados do Cliente</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informações pessoais */}
                  <div>
                    <h3 className="font-medium mb-3">Informações pessoais</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-600 text-sm">Nome:</span>
                        <p>{orderData.nome_cliente}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">E-mail:</span>
                        <p>{orderData.email_cliente}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Telefone:</span>
                        <p>{formatPhone(orderData.telefone_cliente)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">CPF:</span>
                        <p>{formatCPF(orderData.cpf_cliente)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Endereço de entrega */}
                  <div>
                    <h3 className="font-medium mb-3">Endereço de entrega</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-600 text-sm">Endereço:</span>
                        <p>
                          {orderData.endereco_cliente}, {orderData.numero_residencia_cliente}
                          {orderData.complemento_cliente ? ` - ${orderData.complemento_cliente}` : ""}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Bairro:</span>
                        <p>{orderData.bairro_cliente}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Cidade/Estado:</span>
                        <p>
                          {orderData.cidade_cliente}/{orderData.estado_cliente}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">CEP:</span>
                        <p>{orderData.cep_cliente}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações do pet */}
              {orderData.raca_pet && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-200">Informações do Pet</h2>

                  <div className="mb-4">
                    <span className="text-gray-600 text-sm">Raça(s):</span>
                    <p>{orderData.raca_pet}</p>
                  </div>

                  {orderData.fotos_pet && orderData.fotos_pet.length > 0 && (
                    <div>
                      <span className="text-gray-600 text-sm block mb-2">Fotos enviadas:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {orderData.fotos_pet.slice(0, 8).map((foto, index) => (
                          <div key={index} className="aspect-square rounded-md overflow-hidden border border-gray-200">
                            <Image
                              src={foto || "/placeholder.svg"}
                              alt={`Foto do pet ${index + 1}`}
                              width={100}
                              height={100}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {orderData.fotos_pet.length > 8 && (
                          <div className="aspect-square rounded-md overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-600">+{orderData.fotos_pet.length - 8} fotos</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Link
                  href="https://petloo.com.br/"
                  className="bg-[#F1542E] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e04020] transition-colors flex items-center justify-center"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Voltar para a loja
                </Link>
                <Link
                  href="/"
                  className="border border-[#F1542E] text-[#F1542E] px-6 py-3 rounded-lg font-bold hover:bg-[#F1542E]/5 transition-colors flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Voltar para a página inicial
                </Link>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="flex justify-center mb-4">
                <ShoppingBag className="w-16 h-16 text-gray-300" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
              <p className="text-gray-600 mb-6">
                Não foi possível encontrar informações sobre este pedido. Por favor, verifique o link ou entre em
                contato com o suporte.
              </p>
              <Link
                href="https://petloo.com.br/"
                className="bg-[#F1542E] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e04020] transition-colors inline-block"
              >
                Voltar para a loja
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
