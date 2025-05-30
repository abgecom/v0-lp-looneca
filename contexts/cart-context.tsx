"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

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
  // Propriedades para fotos e raça do pet
  petPhotos: string[]
  petTypeBreed: string
  petNotes: string
  setPetData: (photos: string[], typeBreed: string, notes: string) => void
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
  petPhotos: [],
  petTypeBreed: "",
  petNotes: "",
  setPetData: () => {},
}

const CartContext = createContext<CartContextType>(initialCartContext)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [recurringProducts, setRecurringProducts] = useState({
    appPetloo: true,
    loobook: true,
  })
  // Estados para fotos e raça do pet
  const [petPhotos, setPetPhotos] = useState<string[]>([])
  const [petTypeBreed, setPetTypeBreed] = useState("")
  const [petNotes, setPetNotes] = useState("")

  // Carregar itens e configurações do localStorage quando o componente montar
  useEffect(() => {
    try {
      // Verificar se estamos no cliente
      if (typeof window !== "undefined") {
        console.log("Inicializando carrinho do localStorage...")
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

        // Carregar dados do pet
        const savedPetData = localStorage.getItem("looneca-pet-data")
        if (savedPetData) {
          try {
            const parsedPetData = JSON.parse(savedPetData)
            setPetPhotos(parsedPetData.photos || [])
            setPetTypeBreed(parsedPetData.typeBreed || "")
            setPetNotes(parsedPetData.notes || "")
            console.log("Dados do pet carregados do localStorage:", parsedPetData)
          } catch (e) {
            console.error("Erro ao carregar dados do pet:", e)
          }
        }

        // Carregar dados do cookie também
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop()?.split(";").shift()
        }

        const cookiePetData = getCookie("looneca-pet-data")
        if (cookiePetData) {
          try {
            const parsedCookieData = JSON.parse(decodeURIComponent(cookiePetData))
            console.log("Dados do pet carregados do cookie:", parsedCookieData)
            // Se não temos dados no localStorage, usar os do cookie
            if (!savedPetData) {
              setPetPhotos(parsedCookieData.photos || [])
              setPetTypeBreed(parsedCookieData.typeBreed || "")
              setPetNotes(parsedCookieData.notes || "")
            }
          } catch (e) {
            console.error("Erro ao carregar dados do cookie:", e)
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
    // Salvar sempre que os itens mudarem, independente de isInitialized
    if (typeof window !== "undefined") {
      localStorage.setItem("looneca-cart", JSON.stringify(items))
      console.log("Carrinho salvo no localStorage:", items)
    }
  }, [items])

  // Salvar configurações de produtos recorrentes quando mudarem
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem("looneca-recurring-products", JSON.stringify(recurringProducts))
      console.log("Produtos recorrentes salvos:", recurringProducts)
    }
  }, [recurringProducts, isInitialized])

  // Salvar dados do pet quando mudarem
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      const petData = {
        photos: petPhotos,
        typeBreed: petTypeBreed,
        notes: petNotes,
      }
      localStorage.setItem("looneca-pet-data", JSON.stringify(petData))

      // Também salvar no cookie
      document.cookie = `looneca-pet-data=${encodeURIComponent(JSON.stringify(petData))}; path=/; max-age=${7 * 24 * 60 * 60}`

      console.log("Dados do pet salvos:", petData)
    }
  }, [petPhotos, petTypeBreed, petNotes, isInitialized])

  // Função para alternar produtos recorrentes
  const toggleRecurringProduct = useCallback(
    (product: "appPetloo" | "loobook") => {
      setRecurringProducts((prev) => ({
        ...prev,
        [product]: !prev[product],
      }))
    },
    [setRecurringProducts],
  )

  // Função para definir os dados do pet
  const setPetData = useCallback(
    (photos: string[], typeBreed: string, notes: string) => {
      console.log("=== DEBUG CART CONTEXT setPetData ===")
      console.log("Recebendo dados:", { photos, typeBreed, notes })

      setPetPhotos(photos)
      setPetTypeBreed(typeBreed)
      setPetNotes(notes)
    },
    [setPetPhotos, setPetTypeBreed, setPetNotes],
  )

  const addItem = useCallback(
    (newItem: CartItem) => {
      setItems((prevItems) => {
        const existingItemIndex = prevItems.findIndex(
          (item) => item.id === newItem.id && item.color === newItem.color && item.petCount === newItem.petCount,
        )

        if (existingItemIndex >= 0) {
          const updatedItems = [...prevItems]
          updatedItems[existingItemIndex].quantity += newItem.quantity
          return updatedItems
        } else {
          return [...prevItems, newItem]
        }
      })
    },
    [setItems],
  )

  const removeItem = useCallback(
    (itemId: string) => {
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
    },
    [setItems],
  )

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(itemId) // removeItem é estável devido ao seu próprio useCallback
        return
      }

      setItems((prevItems) => prevItems.map((item) => (item.id === itemId ? { ...item, quantity } : item)))
    },
    [setItems, removeItem],
  )

  const clearCart = useCallback(() => {
    setItems([])
    if (typeof window !== "undefined") {
      localStorage.removeItem("looneca-cart")
    }
  }, [setItems])

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
        petPhotos,
        petTypeBreed,
        petNotes,
        setPetData,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  return useContext(CartContext)
}
