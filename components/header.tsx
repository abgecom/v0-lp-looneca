"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"

export default function Header() {
  const cart = useCart() // Moved useCart hook to the top level
  const [isClient, setIsClient] = useState(false)
  const [totalCartItems, setTotalCartItems] = useState(0)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Atualizar o estado local quando o carrinho mudar
  useEffect(() => {
    if (isClient) {
      setTotalCartItems(cart.totalItems)
    }
  }, [isClient, cart.totalItems])

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 shadow-md">
      <div className="flex justify-between items-center py-3 px-4 max-w-6xl mx-auto">
        <Link href="/" className="h-12">
          <Image src="/images/petloo-logo-new.png" alt="Petloo Logo" width={96} height={48} className="h-full w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/#order"
            className="bg-[#F1542E] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e04020] transition-colors hidden md:block"
          >
            Pedir agora
          </Link>
          <Link href="/carrinho" className="relative">
            <ShoppingCart className="w-6 h-6" />
            {totalCartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#F1542E] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalCartItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
