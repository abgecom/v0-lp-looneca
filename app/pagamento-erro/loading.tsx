import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="h-12 w-12 text-[#00B8D4] animate-spin mb-4" />
      <p className="text-gray-700 text-lg">Carregando informações...</p>
    </div>
  )
}
