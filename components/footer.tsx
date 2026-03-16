import Link from "next/link"
import { Instagram, ArrowRight } from "lucide-react"

interface FooterProps {
  topDisclaimer?: string
}

export default function Footer({ topDisclaimer }: FooterProps) {
  const paymentMethods = [
    { name: "American Express", image: "/images/payment/amex.png" },
    { name: "Diners Club", image: "/images/payment/diners.png" },
    { name: "Discover", image: "/images/payment/discover.png" },
    { name: "Elo", image: "/images/payment/elo.png" },
    { name: "Hipercard", image: "/images/payment/hipercard.png" },
    { name: "JCB", image: "/images/payment/jcb.png" },
    { name: "Mastercard", image: "/images/payment/mastercard.png" },
    { name: "Visa", image: "/images/payment/visa.png" },
  ]

  return (
    <footer className="bg-white pt-12 pb-6 border-t border-gray-200">
      {topDisclaimer && (
        <div className="lg:hidden max-w-6xl mx-auto px-4 pb-6">
          <p className="text-[10px] leading-tight text-gray-400 text-center">
            {topDisclaimer}
          </p>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Coluna 1 - Central de Atendimento */}
          <div>
            <h3 className="font-bold text-sm mb-4">CENTRAL DE ATENDIMENTO</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="https://petloosupport.zendesk.com/hc/pt-br/requests/new"
                  className="text-gray-600 hover:text-[#F1542E]"
                >
                  Contato
                </Link>
              </li>
              <li className="text-gray-600">
                Horário de Atendimento:
                <br />
                Seg. a Sex. 9:00h às 17:00h através{" "}
                <Link
                  href="https://petloosupport.zendesk.com/hc/pt-br/requests/new"
                  className="text-gray-600 hover:text-[#F1542E] underline"
                >
                  deste formulário
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 2 - Informações ao Cliente */}
          <div>
            <h3 className="font-bold text-sm mb-4">INFORMAÇÕES AO CLIENTE</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="https://petloo.com.br/pages/sobre-nos" className="text-gray-600 hover:text-[#F1542E]">
                  Sobre nós
                </Link>
              </li>
              <li>
                <Link
                  href="https://petloo.com.br/pages/politicas-de-privacidade"
                  className="text-gray-600 hover:text-[#F1542E]"
                >
                  Políticas de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  href="https://petloo.com.br/pages/politicas-de-devolucao-e-troca"
                  className="text-gray-600 hover:text-[#F1542E]"
                >
                  Políticas de trocas, devoluções e Reembolsos
                </Link>
              </li>
              <li>
                <Link
                  href="https://petloo.com.br/pages/entrega-e-prazos"
                  className="text-gray-600 hover:text-[#F1542E]"
                >
                  Políticas de entrega e prazos
                </Link>
              </li>
              <li>
                <Link href="https://petloo.com.br/pages/aviso-legal" className="text-gray-600 hover:text-[#F1542E]">
                  Aviso legal
                </Link>
              </li>
              <li>
                <Link
                  href="https://petloo.com.br/pages/termos-de-servico"
                  className="text-gray-600 hover:text-[#F1542E]"
                >
                  Termos de serviço e uso
                </Link>
              </li>
              <li>
                <Link
                  href="https://petloosupport.zendesk.com/hc/pt-br/requests/new"
                  className="text-gray-600 hover:text-[#F1542E]"
                >
                  Contato
                </Link>
              </li>
              <li>
                <Link href="https://petloo.com.br/pages/rastreio-1" className="text-gray-600 hover:text-[#F1542E]">
                  Rastrear pedido
                </Link>
              </li>
              <li>
                <Link
                  href="https://petloo.com.br/account/login?return_url=%2Faccount"
                  className="text-gray-600 hover:text-[#F1542E]"
                >
                  Acompanhe o seu pedido
                </Link>
              </li>
              <li>
                <Link
                  href="https://petloo.com.br/account/login?return_url=%2Faccount"
                  className="text-gray-600 hover:text-[#F1542E]"
                >
                  Editar Cadastro
                </Link>
              </li>
              <li>
                <Link
                  href="https://petloo.com.br/pages/politicas-de-assinatura"
                  className="text-gray-600 hover:text-[#F1542E]"
                >
                  Políticas de Assinatura
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3 - Newsletter */}
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Receba novidades sobre lançamentos e dicas sobre seus produtos preferidos.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="E-mail"
                className="flex-grow border border-gray-300 rounded-l px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F1542E]"
              />
              <button
                type="button"
                className="bg-white border border-l-0 border-gray-300 rounded-r px-3 py-2 hover:bg-gray-50"
              >
                <ArrowRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Coluna 4 - Informações da Empresa */}
          <div>
            <h3 className="font-bold text-sm mb-4">INFORMAÇÕES DA EMPRESA</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <span className="font-medium">Endereço:</span> Av. Jerônimo Monteiro
              </li>
              <li>
                <span className="font-medium">Município:</span> Vitória
              </li>
              <li>
                <span className="font-medium">UF:</span> ES
              </li>
            </ul>
          </div>
        </div>

        {/* Redes Sociais */}
        <div className="mt-12 flex space-x-4">
          <Link href="#" className="text-gray-600 hover:text-[#F1542E]" aria-label="Instagram">
            <Instagram size={24} />
          </Link>
        </div>
      </div>
    </footer>
  )
}
