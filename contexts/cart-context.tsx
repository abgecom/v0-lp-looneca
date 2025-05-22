"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export interface CartItem {
  id: string
  name: string
  color: string
  petCount: number
  quantity: number
  price: number
  imageSrc: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isEmpty: boolean
  isInitialized: boolean
  recurringProducts: {
    appPetloo: boolean
    loobook: boolean
  }
  toggleRecurringProduct: (product: "appPetloo" | "loobook") => void
}

// Valor inicial do contexto
const initialCartContext: CartContextType = {
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
  isEmpty: true,
  isInitialized: false,
  recurringProducts: {
    appPetloo: true,
    loobook: true,
  },
  toggleRecurringProduct: () => {},
}

const CartContext = createContext<CartContextType>(initialCartContext)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [recurringProducts, setRecurringProducts] = useState({
    appPetloo: true,
    loobook: true,
  })

  // Carregar itens e configurações do localStorage quando o componente montar
  useEffect(() => {
    try {
      // Verificar se estamos no cliente
      if (typeof window !== "undefined") {
        const savedItems = localStorage.getItem("looneca-cart")
        if (savedItems) {
          const parsedItems = JSON.parse(savedItems)
          if (Array.isArray(parsedItems)) {
            setItems(parsedItems)
            console.log("Carrinho carregado do localStorage:", parsedItems)
          }
        }

        // Carregar configurações de produtos recorrentes
        const savedRecurringProducts = localStorage.getItem("looneca-recurring-products")
        if (savedRecurringProducts) {
          try {
            const parsedRecurringProducts = JSON.parse(savedRecurringProducts)
            setRecurringProducts(parsedRecurringProducts)
            console.log("Produtos recorrentes carregados:", parsedRecurringProducts)
          } catch (e) {
            console.error("Erro ao carregar produtos recorrentes:", e)
          }
        }

        // Marcar como inicializado mesmo se não houver itens
        setIsInitialized(true)
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error)
      localStorage.removeItem("looneca-cart")
      setIsInitialized(true) // Marcar como inicializado mesmo em caso de erro
    }
  }, [])

  // Salvar itens no localStorage quando mudar
  useEffect(() => {
    // Só salvar se já estiver inicializado para evitar sobrescrever dados
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem("looneca-cart", JSON.stringify(items))
      console.log("Carrinho salvo no localStorage:", items)
    }
  }, [items, isInitialized])

  // Salvar configurações de produtos recorrentes quando mudarem
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem("looneca-recurring-products", JSON.stringify(recurringProducts))
      console.log("Produtos recorrentes salvos:", recurringProducts)
    }
  }, [recurringProducts, isInitialized])

  // Função para alternar produtos recorrentes
  const toggleRecurringProduct = (product: "appPetloo" | "loobook") => {
    setRecurringProducts((prev) => ({
      ...prev,
      [product]: !prev[product],
    }))
  }

  const addItem = (newItem: CartItem) => {
    setItems((prevItems) => {
      // Verificar se o item já existe no carrinho (mesma cor e quantidade de pets)
      const existingItemIndex = prevItems.findIndex(
        (item) => item.id === newItem.id && item.color === newItem.color && item.petCount === newItem.petCount,
      )

      if (existingItemIndex >= 0) {
        // Se o item já existe, atualizar a quantidade
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex].quantity += newItem.quantity
        return updatedItems
      } else {
        // Se o item não existe, adicionar ao carrinho
        return [...prevItems, newItem]
      }
    })
  }

  const removeItem = (itemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }

    setItems((prevItems) => prevItems.map((item) => (item.id === itemId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
    if (typeof window !== "undefined") {
      localStorage.removeItem("looneca-cart")
    }
  }

  // Calcular totais
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)
  const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0)

  // Verificar se o carrinho está vazio
  const isEmpty = items.length === 0

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isEmpty,
        isInitialized,
        recurringProducts,
        toggleRecurringProduct,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  return useContext(CartContext)
}
