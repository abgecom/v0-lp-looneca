"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, X, Check } from "lucide-react"

interface PetAutocompleteProps {
  id: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  label: string
  placeholder?: string
}

// Lista de todas as raças de pets
const petOptions = [
  // Cães
  "Cachorro Sem Raça Definida",
  "Cachorro Akita",
  "Cachorro American Staffordshire Terrier",
  "Cachorro Basenji",
  "Cachorro Basset Hound",
  "Cachorro Beagle",
  "Cachorro Bernese/boiadeiro-bernês",
  "Cachorro Bichon Frisé",
  "Cachorro Biewer Yorkshire Terrier",
  "Cachorro Bloodhound",
  "Cachorro Boiadeiro Australiano/Blue Heeler",
  "Cachorro Border Collie",
  "Cachorro Border Terrier",
  "Cachorro Boston Terrier",
  "Cachorro Borzoi",
  "Cachorro Boxer",
  "Cachorro Bull Terrier",
  "Cachorro Bullmastiff",
  "Cachorro Bulldog Francês",
  "Cachorro Bulldog Inglês",
  "Cachorro Cairn Terrier",
  "Cachorro Cavalier King Charles Spaniel",
  "Cachorro Cão de Água Português",
  "Cachorro Cão de Crista Chinês",
  "Cachorro Chesapeake Bay Retriever",
  "Cachorro Chihuahua",
  "Cachorro Chow Chow",
  "Cachorro Cocker Spaniel",
  "Cachorro Dachshund (Salsicha)",
  "Cachorro Dálmata",
  "Cachorro Dogue Alemão",
  "Cachorro Fox paulistinha",
  "Cachorro Galgo italiano",
  "Cachorro Golden Retriever",
  "Cachorro Goldendoodle",
  "Cachorro Greyhound",
  "Cachorro Havanês",
  "Cachorro Husky Siberiano",
  "Cachorro Irish Setter",
  "Cachorro Jack Russell Terrier",
  "Cachorro Labrador Retriever",
  "Cachorro Lhasa Apso",
  "Cachorro Lulu da Pomerânia",
  "Cachorro Maltês",
  "Cachorro Papillon",
  "Cachorro Pastor Alemão",
  "Cachorro Pastor Australiano",
  "Cachorro Pastor Belga",
  "Cachorro Pastor Suíço",
  "Cachorro Pinscher",
  "Cachorro Pit Bull",
  "Cachorro Pomsky",
  "Cachorro Poodle",
  "Cachorro Poodle Toy",
  "Cachorro Pug",
  "Cachorro Rottweiler",
  "Cachorro Samoieda",
  "Cachorro São Bernardo",
  "Cachorro Sapsali",
  "Cachorro Schnauzer",
  "Cachorro Shar-Pei",
  "Cachorro Shetland Sheepdog (Sheltie)",
  "Cachorro Shiba Inu",
  "Cachorro Shih Tzu",
  "Cachorro Spitz alemão",
  "Cachorro Staffordshire Bull Terrier",
  "Cachorro Welsh Corgi (Cardigan e Pembroke)",
  "Cachorro West Highland White Terrier",
  "Cachorro Whippet",
  "Yorkshire Terrier",

  // Gatos
  "Gato Sem Raça Definida",
  "Gato Maine Coon",
  "Gato Sphynx",
  "Gato Persa",
  "Gato Ragdoll",
  "Gato Abyssinian",
  "Gato American Shorthair",
  "Gato Birman",
  "Gato British Shorthair",
  "Gato Burmese",
  "Gato Devon Rex",
  "Gato Egyptian Mau",
  "Gato Exotic Shorthair",
  "Gato Himalayan",
  "Gato Norwegian Forest Cat",
  "Gato Russian Blue",
  "Gato Scottish Fold",
  "Gato Siamese",
  "Gato Singapura",
  "Gato Somali",
  "Gato Turkish Angora",

  // Outros
  "Cavalo",
  "Porquinho da índia",
  "Hamster",
  "Lagarto",
  "Periquito",
  "Calopsita",
]

export default function PetAutocomplete({
  id,
  value,
  onChange,
  required = false,
  label,
  placeholder = "Selecione ou digite para buscar",
}: PetAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredOptions, setFilteredOptions] = useState<string[]>(petOptions)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Atualizar o termo de busca quando o valor mudar externamente
  useEffect(() => {
    if (value) {
      setSearchTerm(value)
    }
  }, [value])

  // Filtrar opções com base no termo de busca
  useEffect(() => {
    if (!searchTerm) {
      setFilteredOptions(petOptions)
    } else {
      const filtered = petOptions.filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredOptions(filtered)
    }
    setHighlightedIndex(-1)
  }, [searchTerm])

  // Fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Lidar com navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
      if (!isOpen) setIsOpen(true)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault()
      selectOption(filteredOptions[highlightedIndex])
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    if (!isOpen && value) {
      setIsOpen(true)
    }
  }

  const selectOption = (option: string) => {
    setSearchTerm(option)
    onChange(option)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const clearSelection = () => {
    setSearchTerm("")
    onChange("")
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#F1542E] focus:border-[#F1542E] pr-10"
          required={required}
          autoComplete="off"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {searchTerm ? (
            <button
              type="button"
              onClick={clearSelection}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Limpar seleção"
            >
              <X size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-gray-600"
              aria-label={isOpen ? "Fechar opções" : "Abrir opções"}
            >
              <ChevronDown size={18} />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-gray-200">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">Nenhuma opção encontrada</div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option}
                onClick={() => selectOption(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${
                  highlightedIndex === index ? "bg-[#F1542E] text-white" : "text-gray-900 hover:bg-gray-100"
                }`}
              >
                <span className="block truncate">{option}</span>
                {option === value && (
                  <span
                    className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                      highlightedIndex === index ? "text-white" : "text-[#F1542E]"
                    }`}
                  >
                    <Check size={16} />
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
