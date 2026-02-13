"use client"

import { useState } from "react"
import { X } from "lucide-react"

export type AngelWingsPet = "pet1" | "pet2"

interface AngelWingsModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedPets: AngelWingsPet[]) => void
  initialSelection?: AngelWingsPet[]
}

export default function AngelWingsModal({
  isOpen,
  onClose,
  onConfirm,
  initialSelection = [],
}: AngelWingsModalProps) {
  const [selected, setSelected] = useState<AngelWingsPet[]>(initialSelection)

  const togglePet = (pet: AngelWingsPet) => {
    setSelected((prev) =>
      prev.includes(pet) ? prev.filter((p) => p !== pet) : [...prev, pet]
    )
  }

  const handleConfirm = () => {
    if (selected.length === 0) return
    onConfirm(selected)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl" role="img" aria-label="Asas de anjo">
              {'👼'}
            </span>
            <h2 className="text-lg font-semibold text-gray-900">
              Asas de Anjo
            </h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Qual pet vai receber as asas de anjo? Selecione um ou ambos.
          </p>
        </div>

        {/* Pet selection */}
        <div className="flex flex-col gap-3 mb-6">
          <button
            type="button"
            onClick={() => togglePet("pet1")}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-150 ${
              selected.includes("pet1")
                ? "border-[#F1542E] bg-[#F1542E]/5 shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                selected.includes("pet1")
                  ? "border-[#F1542E] bg-[#F1542E]"
                  : "border-gray-300"
              }`}
            >
              {selected.includes("pet1") && (
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
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="font-medium text-gray-800">Pet 1</span>
          </button>

          <button
            type="button"
            onClick={() => togglePet("pet2")}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-150 ${
              selected.includes("pet2")
                ? "border-[#F1542E] bg-[#F1542E]/5 shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                selected.includes("pet2")
                  ? "border-[#F1542E] bg-[#F1542E]"
                  : "border-gray-300"
              }`}
            >
              {selected.includes("pet2") && (
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
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="font-medium text-gray-800">Pet 2</span>
          </button>
        </div>

        {/* Info text */}
        {selected.length === 2 && (
          <p className="text-xs text-gray-500 mb-4 text-center">
            Ambos os pets vao receber asas de anjo.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selected.length === 0}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#F1542E] rounded-lg hover:bg-[#e04020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
