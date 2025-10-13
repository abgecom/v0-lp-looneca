"use client"

import { useState, useEffect } from "react"

interface Accessory {
  id: string
  name: string
  icon: string
  starred?: boolean
  visible?: boolean
}

const ACCESSORIES: Accessory[] = [
  { id: "bone", name: "Osso ao lado do pet", icon: "🦴", starred: true, visible: true },
  { id: "id-tag", name: "Plaquinha no pescoço", icon: "🏷️", starred: true, visible: false },
  { id: "bandana-yellow", name: "Bandana Amarela", icon: "🎗️", starred: true, visible: false },
  { id: "collar-red", name: "Coleira Vermelha", icon: "⭕", starred: false, visible: false },
  { id: "bow-tie", name: "Gravata Borboleta", icon: "🎀", starred: false, visible: false },
  { id: "angel-wings", name: "Asas de Anjo", icon: "👼", starred: true, visible: true },
  { id: "tennis-ball", name: "Bola de Tênis", icon: "🎾", starred: false, visible: false },
  { id: "carrot", name: "Cenoura", icon: "🥕", starred: false, visible: false },
  { id: "scarf-red", name: "Cachecol Vermelho", icon: "🧣", starred: false, visible: false },
  { id: "bell", name: "Sino", icon: "🔔", starred: false, visible: false },
  { id: "pumpkin", name: "Abóbora", icon: "🎃", starred: false, visible: false },
  { id: "worm", name: "Minhoca", icon: "🪱", starred: false, visible: false },
  { id: "snail", name: "Caracol", icon: "🐌", starred: false, visible: false },
  { id: "soccer-ball", name: "Bola de Futebol", icon: "⚽", starred: false, visible: true },
  { id: "basketball", name: "Bola de Basquete", icon: "🏀", starred: false, visible: true },
  { id: "love-text", name: "I love my pet", icon: "❤️", starred: true, visible: false },
]

export const ACCESSORY_PRICE = 15

interface AccessoriesSectionProps {
  onSelectionChange?: (selectedIds: string[]) => void
  petCount?: number // Added petCount prop
}

function isAccessoryAvailable(accessoryId: string, petCount: number): boolean {
  // 1 pet: all accessories available
  if (petCount === 1) return true

  // 2 pets: only angel wings available
  if (petCount === 2) {
    return accessoryId === "angel-wings"
  }

  // 3 pets: no accessories available
  if (petCount === 3) return false

  return true
}

export default function AccessoriesSection({ onSelectionChange, petCount = 1 }: AccessoriesSectionProps) {
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([])

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedAccessories)
    }
  }, [selectedAccessories, onSelectionChange])

  useEffect(() => {
    setSelectedAccessories((prev) => prev.filter((id) => isAccessoryAvailable(id, petCount)))
  }, [petCount])

  const toggleAccessory = (id: string) => {
    if (!isAccessoryAvailable(id, petCount)) return

    setSelectedAccessories((prev) =>
      prev.includes(id) ? prev.filter((accessoryId) => accessoryId !== id) : [...prev, id],
    )
  }

  const isSelected = (id: string) => selectedAccessories.includes(id)

  const visibleAccessories = ACCESSORIES.filter((acc) => acc.visible !== false)

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      {/* Title and Instructions */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3">Adicionar Acessórios (Opcional)</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          <span className="font-medium">Opções marcadas com ⭐️:</span> Faça o upload das fotos acima ou deixe que nosso
          artista crie. Por favor, adicione detalhes específicos 🎨, como cores.
        </p>
      </div>

      {petCount >= 2 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            {petCount === 3
              ? "Acessório não disponível para quantidade de pets selecionada"
              : "Apenas Asas de Anjo disponível para 2 pets"}
          </p>
        </div>
      )}

      {/* Selected accessories display here - above the grid, below the description */}
      {selectedAccessories.length > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-100 space-y-1">
          {selectedAccessories.map((accessoryId) => {
            const accessory = ACCESSORIES.find((acc) => acc.id === accessoryId)
            if (!accessory) return null
            return (
              <p key={accessoryId} className="text-sm text-gray-700">
                {accessory.name} | R$ {ACCESSORY_PRICE.toFixed(2).replace(".", ",")}
              </p>
            )
          })}
        </div>
      )}

      {/* Accessories Grid - Applied mobile layout (4 columns) to desktop as well */}
      <div className="grid grid-cols-4 gap-3">
        {visibleAccessories.map((accessory) => {
          const isAvailable = isAccessoryAvailable(accessory.id, petCount)
          const selected = isSelected(accessory.id)

          return (
            <button
              key={accessory.id}
              onClick={() => toggleAccessory(accessory.id)}
              type="button"
              disabled={!isAvailable}
              className={`
              relative bg-white rounded-lg p-3
              flex flex-col items-center justify-center gap-2
              transition-all duration-200
              min-h-[110px]
              ${
                !isAvailable
                  ? "opacity-40 cursor-not-allowed border border-gray-200"
                  : selected
                    ? "border-2 border-[#F1542E] shadow-md ring-2 ring-[#F1542E] ring-opacity-30 hover:scale-105"
                    : "border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow hover:scale-105"
              }
            `}
              aria-label={`${selected ? "Remover" : "Adicionar"} ${accessory.name}`}
              aria-pressed={selected}
              aria-disabled={!isAvailable}
            >
              {/* Starred indicator */}
              {accessory.starred && (
                <div className="absolute top-1 right-1 text-xs">
                  <span role="img" aria-label="Opção destacada">
                    ⭐️
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className="text-3xl flex-shrink-0">{accessory.icon}</div>

              {/* Name */}
              <span className="text-[10px] text-gray-700 text-center leading-tight px-1 w-full">{accessory.name}</span>

              {/* Selection indicator */}
              {selected && isAvailable && (
                <div className="absolute -top-1.5 -right-1.5 bg-[#F1542E] rounded-full p-0.5 shadow-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function getAccessoryName(id: string): string {
  return ACCESSORIES.find((acc) => acc.id === id)?.name || id
}
