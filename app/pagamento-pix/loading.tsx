import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1E9DB]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[#F1542E] animate-spin mx-auto mb-4" />
        <p className="text-lg font-medium">Carregando informações do pagamento...</p>
      </div>
    </div>
  )
}
