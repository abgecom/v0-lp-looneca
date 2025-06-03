"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Search, Menu, X, ChevronDown, Instagram } from "lucide-react"
import { useCart } from "@/contexts/cart-context"

export default function Header() {
  const cart = useCart()
  const [isClient, setIsClient] = useState(false)
  const [totalCartItems, setTotalCartItems] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      setTotalCartItems(cart.totalItems)
    }
  }, [isClient, cart.totalItems])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleCategories = () => {
    setIsCategoriesOpen(!isCategoriesOpen)
  }

  return (
    <>
      {/* Top Bar Vermelha */}
      <div className="bg-[#FF4444] text-white py-2 overflow-hidden relative">
        <div className="animate-marquee whitespace-nowrap">
          <span className="mx-8">Frete Grátis Todo Brasil: Compras Acima de R$249,90</span>
          <span className="mx-8">Frete Grátis Todo Brasil: Compras Acima de R$249,90</span>
          <span className="mx-8">Frete Grátis Todo Brasil: Compras Acima de R$249,90</span>
          <span className="mx-8">Frete Grátis Todo Brasil: Compras Acima de R$249,90</span>
          <span className="mx-8">Frete Grátis Todo Brasil: Compras Acima de R$249,90</span>
        </div>
      </div>

      {/* Header Principal */}
      <header className="bg-white shadow-sm relative z-50">
        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-4">
            {/* Navigation */}
            <nav className="flex items-center justify-between py-4 border-t border-gray-200">
              <div className="flex items-center space-x-8">
                {/* Logo à esquerda */}
                <Link href="/" className="mr-4">
                  <Image
                    src="/images/petloo-logo-new.png"
                    alt="Petloo Logo"
                    width={120}
                    height={60}
                    className="h-10 w-auto"
                  />
                </Link>

                <Link href="/" className="text-gray-700 hover:text-[#FF4444] font-medium">
                  Home
                </Link>

                <div className="relative group">
                  <button className="flex items-center text-gray-700 hover:text-[#FF4444] font-medium">
                    Categorias
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <a
                        href="https://petloo.com.br/collections/personalizados"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#FF4444] transition-colors"
                      >
                        Personalizados
                      </a>
                      <a
                        href="https://petloo.com.br/collections/higiene"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#FF4444] transition-colors"
                      >
                        Higiene
                      </a>
                      <a
                        href="https://petloo.com.br/collections/cuidados"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#FF4444] transition-colors"
                      >
                        Cuidados
                      </a>
                      <a
                        href="https://petloo.com.br/collections/all"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#FF4444] transition-colors"
                      >
                        Todos os produtos
                      </a>
                    </div>
                  </div>
                </div>

                <a
                  href="https://petloosupport.zendesk.com/hc/pt-br/requests/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-[#FF4444] font-medium"
                >
                  Contato
                </a>

                <Link href="/account" className="text-gray-700 hover:text-[#FF4444] font-medium">
                  Minha Conta
                </Link>

                <a
                  href="https://petloo.com.br/pages/rastreio-1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-[#FF4444] font-medium"
                >
                  Rastrear pedido
                </a>

                <a
                  href="https://petloo.com.br/blogs/news"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-[#FF4444] font-medium"
                >
                  Blog
                </a>
              </div>

              <div className="flex items-center space-x-4">
                <button className="text-gray-700 hover:text-[#FF4444]">
                  <Search className="h-5 w-5" />
                </button>

                <Link href="/carrinho" className="relative text-gray-700 hover:text-[#FF4444]">
                  <ShoppingCart className="h-5 w-5" />
                  {totalCartItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#FF4444] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {totalCartItems}
                    </span>
                  )}
                </Link>
              </div>
            </nav>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={toggleMobileMenu} className="text-gray-700">
              <Menu className="h-6 w-6" />
            </button>

            <Link href="/">
              <Image
                src="/images/petloo-logo-new.png"
                alt="Petloo Logo"
                width={96}
                height={48}
                className="h-10 w-auto"
              />
            </Link>

            <Link href="/carrinho" className="relative text-gray-700">
              <ShoppingCart className="h-6 w-6" />
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FF4444] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalCartItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={toggleMobileMenu}></div>

          <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <Image
                src="/images/petloo-logo-new.png"
                alt="Petloo Logo"
                width={96}
                height={48}
                className="h-10 w-auto"
              />
              <button onClick={toggleMobileMenu} className="text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 py-4">
              <Link href="/" className="block px-6 py-3 text-gray-700 hover:bg-gray-100" onClick={toggleMobileMenu}>
                Home
              </Link>

              <div>
                <button
                  onClick={toggleCategories}
                  className="flex items-center justify-between w-full px-6 py-3 text-gray-700 hover:bg-gray-100"
                >
                  Categorias
                  <ChevronDown className={`h-4 w-4 transition-transform ${isCategoriesOpen ? "rotate-180" : ""}`} />
                </button>

                {isCategoriesOpen && (
                  <div className="bg-gray-50">
                    <a
                      href="https://petloo.com.br/collections/personalizados"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-10 py-2 text-gray-600 hover:bg-gray-100"
                      onClick={toggleMobileMenu}
                    >
                      Personalizados
                    </a>
                    <a
                      href="https://petloo.com.br/collections/higiene"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-10 py-2 text-gray-600 hover:bg-gray-100"
                      onClick={toggleMobileMenu}
                    >
                      Higiene
                    </a>
                    <a
                      href="https://petloo.com.br/collections/cuidados"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-10 py-2 text-gray-600 hover:bg-gray-100"
                      onClick={toggleMobileMenu}
                    >
                      Cuidados
                    </a>
                    <a
                      href="https://petloo.com.br/collections/all"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-10 py-2 text-gray-600 hover:bg-gray-100"
                      onClick={toggleMobileMenu}
                    >
                      Todos os produtos
                    </a>
                  </div>
                )}
              </div>

              <a
                href="https://petloosupport.zendesk.com/hc/pt-br/requests/new"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-6 py-3 text-gray-700 hover:bg-gray-100"
                onClick={toggleMobileMenu}
              >
                Contato
              </a>

              <Link
                href="/account"
                className="block px-6 py-3 text-gray-700 hover:bg-gray-100"
                onClick={toggleMobileMenu}
              >
                Minha Conta
              </Link>

              <a
                href="https://petloo.com.br/pages/rastreio-1"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-6 py-3 text-gray-700 hover:bg-gray-100"
                onClick={toggleMobileMenu}
              >
                Rastrear pedido
              </a>

              <a
                href="https://petloo.com.br/blogs/news"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-6 py-3 text-gray-700 hover:bg-gray-100"
                onClick={toggleMobileMenu}
              >
                Blog
              </a>
            </nav>

            {/* Social Icons */}
            <div className="border-t p-6">
              <div className="flex space-x-4">
                <a
                  href="https://instagram.com/petloooficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#FF4444]"
                >
                  <Instagram className="h-6 w-6" />
                </a>
                <a
                  href="https://www.tiktok.com/@petloooficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-[#FF4444]"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
      `}</style>
    </>
  )
}
