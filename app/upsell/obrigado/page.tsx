import Header from "@/components/header"
import Footer from "@/components/footer"
import { CheckCircle, Smartphone } from "lucide-react"

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

          {/* Petloo App Download CTA */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6 border border-[#F1542E]/20">
            <div className="bg-[#FFF3F0] px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F1542E] flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm leading-tight">Sua tag Petloo vai chegar junto com a Looneca!</h3>
                <p className="text-xs text-gray-600 mt-0.5">Baixe o app agora para ativar o rastreamento quando ela chegar.</p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                Para ativar a tag de rastreamento, o <strong>app Petloo</strong> precisa estar instalado no seu celular.
                Baixe agora e deixe tudo pronto!
              </p>

              <div className="flex gap-3">
                <a
                  href="https://apps.apple.com/br/app/petloo/id6747433542"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gray-900 text-white text-center text-sm font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Baixar para iPhone
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=br.com.petloo.petloo_app&pcampaignid=web_share"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#F1542E] text-white text-center text-sm font-semibold py-3 rounded-lg hover:bg-[#e04020] transition-colors"
                >
                  Baixar para Android
                </a>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Enquanto a tag nao chega, o app ja tem:</p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#F1542E] mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600"><strong>Cartao de vacina digital</strong> — com lembrete de vencimento</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#F1542E] mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600"><strong>Perfil completo do pet</strong> — todas as informacoes do seu companheiro</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#F1542E] mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600"><strong>E muito mais</strong> — sempre adicionando funcionalidades novas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
