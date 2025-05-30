"use client"

import { useState, useEffect, type ReactNode } from "react"
import { useCart } from "@/contexts/cart-context"

interface ThankYouClientLogicProps {
  children: ReactNode
}

export default function ThankYouClientLogic({ children }: ThankYouClientLogicProps) {
  const { clearCart } = useCart()
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(true) // Começa aberto por padrão

  useEffect(() => {
    // Limpa o carrinho uma vez quando o componente é montado
    // Idealmente, isso seria acionado por um evento específico de "pedido concluído"
    // para evitar limpar o carrinho se o usuário apenas revisitar a página.
    // Por simplicidade e seguindo o fluxo anterior, limpamos aqui.
    console.log("ThankYouClientLogic: Limpando o carrinho.")
    clearCart()
  }, [clearCart])

  // O children aqui será o conteúdo da página renderizado no servidor.
  // Precisamos encontrar uma forma de injetar o OrderSummaryCard ou modificar o CardHeader
  // para adicionar o botão de toggle.
  // Por simplicidade, vamos assumir que o primeiro Card é o OrderSummary.
  // Uma abordagem mais robusta usaria IDs ou refs.

  // Esta é uma simplificação. O ideal seria que o Server Component passasse
  // explicitamente o OrderSummaryCard para este Client Component.
  // Ou que o Server Component renderizasse o CardHeader e o Client Component
  // apenas o conteúdo colapsável.

  // Para este exemplo, vamos assumir que o children já contém o Card de Resumo do Pedido
  // e vamos apenas adicionar a lógica de toggle se pudermos identificar o CardHeader.
  // A estrutura atual do Server Component já renderiza o OrderSummaryContent diretamente.
  // O toggle do CardHeader precisa ser adicionado.

  // Vamos modificar o CardHeader no Server Component para incluir um placeholder
  // e aqui nós o substituímos ou adicionamos o botão.
  // No entanto, a forma mais limpa é o Server Component renderizar o Card
  // e o Client Component controlar o estado de abertura e renderizar o conteúdo condicionalmente.

  // Dado que o Server Component já renderiza o OrderSummaryContent,
  // o toggle precisa ser feito no CardHeader que também é renderizado pelo Server Component.
  // Isso significa que o Card de Resumo do Pedido inteiro precisa ser um Client Component.

  // Vamos ajustar: O Server Component passa os dados do pedido para este Client Component,
  // e este Client Component renderiza o Card de Resumo do Pedido com a lógica de toggle.

  // A estrutura atual do Server Component já renderiza o OrderSummaryContent.
  // O ThankYouClientLogic pode ser usado para envolver a página e lidar com o clearCart.
  // O toggle do resumo do pedido pode ser um componente separado ou integrado aqui se
  // o Card de Resumo for passado como children específico.

  // Para manter a simplicidade e focar no clearCart, este componente fará apenas isso.
  // O toggle do resumo do pedido pode ser implementado diretamente no Server Component
  // se não precisar de estado client-side para o toggle (ex: usando <details> e <summary> HTML).
  // Ou, o Card de Resumo do Pedido precisa ser um Client Component separado.

  // Para o toggle, vamos criar um componente cliente separado para o OrderSummaryCard.
  // Este ThankYouClientLogic será apenas para o clearCart.

  return <>{children}</>
}
