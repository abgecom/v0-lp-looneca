import Header from "@/components/header"
import Footer from "@/components/footer"
import { CheckCircle } from "lucide-react"

export default function UpsellObrigadoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFCF6]">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center mt-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />

            <h1 className="text-2xl font-bold mt-4">Informações Recebidas com Sucesso!</h1>

            <p className="mt-4 text-gray-700">
              Obrigado! Já recebemos os dados de personalização da sua Looneca adicional e o processo de produção será
              iniciado em breve.
            </p>

            <p className="mt-4 text-gray-700">
              Qualquer dúvida sobre o seu pedido, entre em contato conosco pelo e-mail:
            </p>

            <p className="font-semibold text-[#F1542E] mt-2">contato@petloo.com.br</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
