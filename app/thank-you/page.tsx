import { Suspense } from "react"
import Link from "next/link"
// import { redirect } from "next/navigation" // Não usado diretamente aqui
import { CheckCircle, Info } from "lucide-react"

import { getPedidoByNumero } from "@/actions/pedidos-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import ThankYouClientLogic from "./thank-you-client-logic"
import OrderSummaryCardClient from "./order-summary-card-client" // Novo componente cliente

// Função para formatar preço
const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined) return "R$ 0,00"
  return `R$ ${price.toFixed(2).replace(".", ",")}`
}

interface ThankYouPageProps {
  searchParams: {
    pedido?: string
  }
}

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const pedidoNumeroStr = searchParams.pedido

  if (!pedidoNumeroStr) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <Info className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Parâmetro do Pedido Ausente</h1>
        <p className="text-gray-600 mb-6">
          O número do pedido não foi fornecido. Verifique o link ou entre em contato com o suporte.
        </p>
        <Button asChild className="bg-[#10B981] hover:bg-[#0d9269] text-white">
          <Link href="/">Voltar para a Loja</Link>
        </Button>
      </div>
    )
  }

  const pedidoNumero = Number.parseInt(pedidoNumeroStr, 10)

  if (isNaN(pedidoNumero)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <Info className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Número do Pedido Inválido</h1>
        <p className="text-gray-600 mb-6">
          O número do pedido fornecido é inválido. Verifique o link ou entre em contato com o suporte.
        </p>
        <Button asChild className="bg-[#10B981] hover:bg-[#0d9269] text-white">
          <Link href="/">Voltar para a Loja</Link>
        </Button>
      </div>
    )
  }

  const { pedido, error, success } = await getPedidoByNumero(pedidoNumero)

  if (!success || !pedido) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <Info className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Pedido Não Encontrado</h1>
        <p className="text-gray-600 mb-6">
          Não encontramos um pedido com o número #{pedidoNumeroStr}. Verifique o número ou entre em contato com o
          suporte.
        </p>
        <Button asChild className="bg-[#10B981] hover:bg-[#0d9269] text-white">
          <Link href="/">Voltar para a Loja</Link>
        </Button>
      </div>
    )
  }

  const pedidoCompletoParaCard = {
    itens_escolhidos: pedido.itens_escolhidos,
    subtotal_itens: pedido.subtotal_itens || 0,
    valor_frete: pedido.valor_frete || 0,
    total_pago: pedido.total_pago,
  }

  return (
    <Suspense fallback={<ThankYouPageLoading />}>
      <ThankYouClientLogic>
        {" "}
        {/* Para limpar o carrinho */}
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-lg mx-auto space-y-6">
            <OrderSummaryCardClient pedido={pedidoCompletoParaCard} />

            <Card className="text-center p-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold">PEDIDO #{pedido.pedido_numero}</h1>
              <p className="text-lg text-gray-700 mb-4">Obrigado, {pedido.nome_cliente}!</p>
              <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-md">
                Seu pedido foi Confirmado
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-1">Informações de contato</h3>
                  <p>E-mail: {pedido.email_cliente}</p>
                  <p>Telefone: {pedido.telefone_cliente || "Não informado"}</p>
                  {pedido.cpf_cliente && <p>CPF: {pedido.cpf_cliente}</p>}
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-1">Endereço de envio</h3>
                  <p>
                    {pedido.endereco_cliente}, {pedido.numero_residencia_cliente}{" "}
                    {pedido.complemento_cliente && `- ${pedido.complemento_cliente}`}
                  </p>
                  <p>
                    {pedido.bairro_cliente} - {pedido.cidade_cliente}, {pedido.estado_cliente}
                  </p>
                  <p>CEP: {pedido.cep_cliente}</p>
                  <p>Brasil</p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-1">Método de envio</h3>
                  <p>Frete Padrão - Prazo de 4 a 12 dias</p> {/* Placeholder */}
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-1">Método de pagamento</h3>
                  <p>
                    {pedido.metodo_pagamento} - {formatPrice(pedido.total_pago)}
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-1">Número do pedido</h3>
                  <p>#{pedido.pedido_numero}</p>
                </div>
              </CardContent>
            </Card>

            <Button asChild size="lg" className="w-full bg-[#10B981] hover:bg-[#0d9269] text-white text-base">
              <Link href="/">Continue a comprar &rarr;</Link>
            </Button>
          </div>
        </div>
      </ThankYouClientLogic>
    </Suspense>
  )
}

function ThankYouPageLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#10B981] mb-6"></div>
      <p className="text-lg text-gray-700">Carregando informações do pedido...</p>
    </div>
  )
}
