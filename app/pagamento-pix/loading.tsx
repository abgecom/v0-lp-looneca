import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex justify-center items-center bg-white">
      <div className="flex flex-col items-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#00B8D4] mb-4" />
        <p className="text-gray-600">Carregando informações do pagamento...</p>
      </div>
    </div>
  )
}
