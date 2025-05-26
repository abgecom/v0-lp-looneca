"use client"

import type React from "react"

import { CreditCard, QrCode } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PaymentMethodProps {
  id: string
  title: string
  icon: React.ReactNode
  selected: boolean
  onSelect: () => void
}

export const PaymentMethods = [
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "pix", label: "PIX" },
]

export const PaymentMethodsIcons: Record<string, React.ReactNode> = {
  credit_card: <CreditCard className="h-5 w-5" />,
  pix: <QrCode className="h-5 w-5" />,
}

export function PaymentMethod({ id, title, icon, selected, onSelect }: PaymentMethodProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
        selected
          ? "border-[#F1542E] bg-[#F1542E]/5 text-[#F1542E]"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
      )}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="font-medium">{title}</div>
    </div>
  )
}
