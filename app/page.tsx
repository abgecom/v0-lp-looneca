"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useRef } from "react"
import MediaCarousel from "@/components/media-carousel"
import FAQSection from "@/components/faq-section"
import ReviewsSection from "@/components/reviews-section"
import Footer from "@/components/footer"
import LoonecaFormInline from "@/components/looneca-form-inline"
import { Loader2 } from "lucide-react"
import Header from "@/components/header"
import { useCart } from "@/contexts/cart-context"
import { useRouter } from "next/navigation"

// Define a animação de flutuação
const floatingAnimation = `
  @keyframes float {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
    100% {
      transform: translateY(0px);
    }
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`

export default function Home() {
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState("Branco Prisma")
  const [selectedPetCount, setSelectedPetCount] = useState(1)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [isFormValid, setIsFormValid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const router = useRouter()
  const { addItem } = useCart()

  // Preços base por quantidade de pets
  const PRECOS = {
    1: 169.9,
    2: 197.8,
    3: 225.7,
  }

  // Preços originais (riscados) por quantidade de pets
  const PRECOS_ORIGINAIS = {
    1: 229.0,
    2: 267.0,
    3: 305.0,
  }

  const formRef = useRef<{ handleSubmit: () => Promise<boolean> } | null>(null)

  // Define carousel items with variant information
  const carouselItems = [
    {
      type: "image" as const,
      src: "/images/carousel/featured-catalog-image.webp",
      alt: "Caneca Looneca Branco Prisma",
      variant: "Branco Prisma",
    },
    {
      type: "image" as const,
      src: "/images/carousel/new-catalog-image.webp",
      alt: "Caneca Looneca Rosa Prisma",
      variant: "Rosa Prisma",
    },
    {
      type: "image" as const,
      src: "/images/carousel/purple-prisma.webp",
      alt: "Caneca Looneca Roxo Prisma",
      variant: "Roxo Prisma",
    },
    {
      type: "image" as const,
      src: "/images/carousel/blue-prisma.webp",
      alt: "Caneca Looneca Azul Prisma",
      variant: "Azul Prisma",
    },
    { type: "image" as const, src: "/images/carousel/cat3.webp", alt: "Caneca Looneca personalizada" },
    { type: "image" as const, src: "/images/carousel/cat4.webp", alt: "Caneca Looneca personalizada" },
    {
      type: "video" as const,
      src: "https://5txjuxzqkryxsbyq.public.blob.vercel-storage.com/LP%20looneca/Fotos%20de%20cat%C3%A1logo/a567599a638944649101a6b83817c05a.HD-1080p-7.2Mbps-37410711-r66K6zltHXhHuT2VvnMeIQIDSTLT4E.mp4",
    },
    { type: "image" as const, src: "/images/carousel/cat6.webp", alt: "Caneca Looneca personalizada" },
    { type: "image" as const, src: "/images/carousel/cat7.webp", alt: "Caneca Looneca personalizada" },
    { type: "image" as const, src: "/images/carousel/cat8.webp", alt: "Caneca Looneca personalizada" },
    { type: "image" as const, src: "/images/carousel/cat9.webp", alt: "Caneca Looneca personalizada" },
    { type: "image" as const, src: "/images/carousel/cat10.webp", alt: "Caneca Looneca personalizada" },
    { type: "image" as const, src: "/images/carousel/cat11.webp", alt: "Caneca Looneca personalizada" },
    { type: "image" as const, src: "/images/carousel/cat12.webp", alt: "Caneca Looneca personalizada" },
    { type: "video" as const, src: "/images/carousel/cat13.mp4" },
    { type: "video" as const, src: "/images/carousel/cat14.mp4" },
    { type: "video" as const, src: "/images/carousel/cat15.mp4" },
  ]

  // Function to handle color selection
  const handleColorSelect = (color: string) => {
    setSelectedColor(color)

    // Find the index of the image that matches the selected color
    const colorIndex = carouselItems.findIndex((item) => item.variant === color)
    if (colorIndex !== -1) {
      setCarouselIndex(colorIndex)
    }
  }

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1)
  }

  const decrementQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1))
  }

  // When the carousel index changes, update the selected color if it's a variant image
  const handleCarouselIndexChange = (index: number) => {
    setCarouselIndex(index)
    const item = carouselItems[index]
    if (item.variant) {
      setSelectedColor(item.variant)
    }
  }

  const handleFormValidityChange = (isValid: boolean) => {
    setIsFormValid(isValid)
  }

  const handleAddToCart = async () => {
    if (!formRef.current) return

    setIsSubmitting(true)

    try {
      const success = await formRef.current.handleSubmit()
      if (success) {
        // Adicionar ao carrinho
        const currentItem = carouselItems.find((item) => item.variant === selectedColor) || carouselItems[0]

        const newItem = {
          id: `looneca-${Date.now()}`,
          name: "Caneca Personalizada Looneca Prisma",
          color: selectedColor,
          petCount: selectedPetCount,
          quantity: quantity,
          price: PRECOS[selectedPetCount as keyof typeof PRECOS],
          imageSrc: currentItem.src,
        }

        console.log("Adicionando item ao carrinho:", newItem)
        addItem(newItem)

        // Aguardar um momento para garantir que o estado foi atualizado
        setTimeout(() => {
          // Redirecionar para o carrinho
          router.push("/carrinho")
        }, 100)
      }
    } catch (error) {
      console.error("Erro ao processar pedido:", error)
      setOrderSuccess(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#FFFCF6] font-anek">
      <style jsx global>
        {floatingAnimation}
      </style>

      <Header />

      <div className="pt-16"></div>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col md:flex-row items-start justify-between gap-4 mt-2 pb-8">
        {/* Carrossel à esquerda */}
        <div className="md:w-3/5 order-1 md:order-1">
          <MediaCarousel
            items={carouselItems}
            className="w-full"
            currentIndex={carouselIndex}
            onIndexChange={handleCarouselIndexChange}
          />
          <p className="text-sm text-gray-600 mt-2 text-center italic">
            Arraste para o lado e veja algumas loonecas já entregues
          </p>
        </div>

        {/* Informações do produto à direita */}
        <div className="md:w-2/5 order-2 md:order-2 bg-[#FFFCF6] font-anek">
          {orderSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-2">Pedido enviado com sucesso!</h3>
              <p className="text-green-700 mb-6">
                Recebemos seu pedido e entraremos em contato em breve para os próximos passos.
              </p>
              <button
                type="button"
                onClick={() => setOrderSuccess(false)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Fazer outro pedido
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-bold mb-4">Caneca Personalizada Looneca Prisma</h1>

              {/* Avaliações */}
              <div className="flex items-center mb-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${star <= 5 ? "text-[#F1542E]" : "text-gray-300"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-.181h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm">4.8 (319 reviews)</span>
              </div>

              {/* Descrição */}
              <p className="text-base mb-6">Toda Looneca é única, esculpimos o seu pet de forma 100% personalizada</p>

              {/* Preço */}
              <div className="mb-4">
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-[#F1542E]">
                    R$ {PRECOS[selectedPetCount as keyof typeof PRECOS].toFixed(2).replace(".", ",")}
                  </span>
                  <span className="ml-2 text-sm line-through text-gray-500">
                    R${" "}
                    {PRECOS_ORIGINAIS[selectedPetCount as keyof typeof PRECOS_ORIGINAIS].toFixed(2).replace(".", ",")}
                  </span>
                  <span className="ml-2 text-xs bg-[#F1542E] text-white px-2 py-1 rounded">
                    Economize R${" "}
                    {(
                      PRECOS_ORIGINAIS[selectedPetCount as keyof typeof PRECOS_ORIGINAIS] -
                      PRECOS[selectedPetCount as keyof typeof PRECOS]
                    )
                      .toFixed(2)
                      .replace(".", ",")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Em até 12x de R$ {(PRECOS[selectedPetCount as keyof typeof PRECOS] / 12).toFixed(2).replace(".", ",")}
                  *
                </p>
              </div>

              {/* Seleção de cor */}
              <div className="mb-6">
                <p className="text-sm mb-2">
                  Selecione a cor da caneca: <span className="font-medium">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Branco Prisma", "Rosa Prisma", "Roxo Prisma", "Azul Prisma"].map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className={`px-4 py-2 rounded-full border ${
                        selectedColor === color
                          ? "border-[#F1542E] bg-white"
                          : "border-gray-300 bg-white hover:border-gray-400"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantidade de pets */}
              <div className="mb-6">
                <p className="text-sm mb-2">
                  Quantidade de Pets em cada caneca: <span className="font-medium">{selectedPetCount}</span>
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3].map((count) => (
                    <button
                      key={count}
                      onClick={() => setSelectedPetCount(count)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedPetCount === count
                          ? "border-2 border-[#F1542E] bg-white"
                          : "border border-gray-300 bg-white hover:border-gray-400"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantidade */}
              <div className="mb-6">
                <p className="text-sm mb-2">Quantidade:</p>
                <div className="flex items-center">
                  <button
                    onClick={decrementQuantity}
                    className="w-10 h-10 rounded-l-full border border-gray-300 flex items-center justify-center bg-white"
                  >
                    −
                  </button>
                  <div className="w-12 h-10 border-t border-b border-gray-300 flex items-center justify-center bg-white">
                    {quantity}
                  </div>
                  <button
                    onClick={incrementQuantity}
                    className="w-10 h-10 rounded-r-full border border-gray-300 flex items-center justify-center bg-white"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Formulário de Pedido Inline */}
              <LoonecaFormInline
                petCount={selectedPetCount}
                onFormValidityChange={handleFormValidityChange}
                ref={formRef}
              />

              {/* Botão de compra */}
              <div className="mt-6">
                <button
                  onClick={handleAddToCart}
                  disabled={!isFormValid || isSubmitting}
                  className="w-full bg-[#F1542E] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e04020] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Adicionar ao carrinho"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* What is Looneca Section */}
      <section className="bg-[#FFFCF6] py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Eternize seu pet em uma caneca</h2>
          <p className="text-lg mb-6">
            A caneca Looneca é fialmente personalizada para que seu pet fique eternizado com você.
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="shadow-xl rounded-lg overflow-hidden border border-gray-200 transform translate-y-0 hover:translate-y-[-2px] transition-all duration-300">
              <Image
                src="/images/carousel/cat1.png"
                alt="Caneca Looneca personalizada"
                width={800}
                height={800}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Nova Seção: O que é a caneca Looneca? */}
      <section className="bg-[#FFFCF6] py-10 px-4 border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">O que é a caneca Looneca?</h2>
          <p className="text-lg text-center max-w-3xl mx-auto mb-10">
            É um produto personalizado Petloo, recebemos fotos do seu pet e modelamos uma miniatura com todas as
            características especiais dele. No final, você receberá uma obra de arte como essas para uso, decoração ou
            guardar como lembrança.
          </p>

          <div className="flex justify-center">
            <div className="max-w-4xl w-full">
              <Image
                src="/images/looneca-group-image.png"
                alt="Canecas Looneca personalizadas"
                width={1200}
                height={600}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
          <p className="text-lg text-center mt-6 mb-0">
            No final, você receberá uma obra de arte como essas para uso, decoração ou guardar como lembrança.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section id="order" className="py-8 px-4 bg-[#FFFCF6]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Passo a passo para pedir sua Looneca</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Image
                  src="/images/icons/mug-icon-new.png"
                  alt="Ícone de caneca"
                  width={64}
                  height={64}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-[#4a154b] mb-2">Passo 1</h3>
              <p>Escolha o modelo da sua caneca</p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Image
                  src="/images/icons/photo-icon-new.png"
                  alt="Ícone de foto"
                  width={64}
                  height={64}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-[#4a154b] mb-2">Passo 2</h3>
              <p>Envie a foto do seu pet</p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Image
                  src="/images/icons/check-icon-new.png"
                  alt="Ícone de processo"
                  width={64}
                  height={64}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-[#4a154b] mb-2">Passo 3</h3>
              <p>Acompanhe o processo de construção</p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Image
                  src="/images/icons/truck-icon-new.png"
                  alt="Ícone de entrega"
                  width={64}
                  height={64}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-[#4a154b] mb-2">Passo 4</h3>
              <p>Receba em sua casa o seu pedido</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="#"
              className="bg-[#F1542E] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e04020] transition-colors inline-block"
            >
              Encomendar agora
            </Link>
          </div>
        </div>
      </section>

      {/* Unique Service Section */}
      <section className="py-12 px-4 bg-[#FFFCF6] border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Tratamos cada Looneca de forma única e personalizada
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Left Column */}
            <div className="text-center order-1 md:order-1">
              <div className="flex justify-center mb-4">
                <div className="bg-[#F1542E] rounded-full p-2 inline-flex">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
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
              </div>
              <h3 className="text-xl font-bold mb-3">Temos um time profissional de artistas</h3>
              <p className="text-sm">
                Nossa equipe de design é composta por pintores, ceramistas e desenvolvedores de modelos 3D. Manteremos
                contato com você durante o processo para que o projeto seja perfeito.
              </p>
            </div>

            {/* Center Column - Image */}
            <div className="flex justify-center order-4 md:order-2 my-8 md:my-0">
              <div className="relative w-80 h-80 md:w-96 md:h-96 animate-float">
                <Image
                  src="/images/puppy-in-teacup.png"
                  alt="Caneca Looneca com cachorro"
                  width={500}
                  height={500}
                  className="object-contain"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="text-center order-2 md:order-3">
              <div className="flex justify-center mb-4">
                <div className="bg-[#F1542E] rounded-full p-2 inline-flex">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
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
              </div>
              <h3 className="text-xl font-bold mb-3">Acompanhe o processo de produção</h3>
              <p className="text-sm">
                Estaremos sempre em contato um com o outro para que você veja o processo de produção e acompanhe o
                andamento da confecção da sua Looneca
              </p>
            </div>
          </div>

          {/* Bottom Feature */}
          <div className="mt-12 text-center max-w-md mx-auto order-3 md:order-4">
            <div className="flex justify-center mb-4">
              <div className="bg-[#F1542E] rounded-full p-2 inline-flex">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
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
            </div>
            <h3 className="text-xl font-bold mb-3">Serviço de garantia pós-venda</h3>
            <p className="text-sm">
              Estamos atentos a todas as mensagens e observações para que sua Looneca seja o mais fiel possível. Além
              disso, se seu pedido chegar com alguma avaria, repararemos sem custo algum
            </p>
          </div>
        </div>
      </section>
      {/* FAQ Section */}
      <FAQSection
        title="Perguntas Frequentes"
        faqs={[
          {
            question: "Vocês possuem modelos de todas as raças e tamanhos?",
            answer:
              "Não trabalhamos com modelos prontos, fazemos todas as miniaturas 100% a mão para que a sua looneca fique perfeita e idêntica ao seu pet.",
          },
          {
            question: "Em quanto tempo vou receber a minha encomenda?",
            answer:
              "Nosso prazo de produção é de 2 semanas. Após esse período, seu pedido será postado. O prazo de entrega será o estipulado pela transportadora, de acordo com a opção escolhida no momento da finalização do pedido.\n\nPrecisamos de um tempo maior do que o habitual para para o processo de personalização da sua encomenda. Vale ressaltar que períodos de feriados prolongados e datas comemorativas afetam a nossa produção e o prazo pode se estender em no máximo uma semana.",
          },
          {
            question: "Minha foto é boa o suficiente?",
            answer: (
              <>
                <p>
                  A maioria das fotos são boas referências para o nosso trabalho. Não se preocupe, sempre checamos as
                  fotos para melhores resultados.
                </p>
                <p className="mt-2">Recomendamos:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Envie fotos com a maior resolução possível</li>
                  <li>Envie fotos com boa iluminação (preferencialmente durante o dia)</li>
                </ul>
              </>
            ),
          },
          {
            question: "O pedido terá código de rastreamento?",
            answer:
              "Sim, o pedido terá código para rastreamento. Além do mais, você receberá atualizações do status do seu pedido no seu e-mail frequentemente.",
          },
          {
            question: "Vou poder ver meu pedido equanto ele está sendo feito?",
            answer: "Sim, você deverá solicitar uma foto através de nosso Whatsapp.",
          },
          {
            question: "Vocês fazem todos os tipos de animais de estimação?",
            answer:
              "Simmm!! ja fizemos: cavalos, aves, répteis, anfíbios e muitos outros animais diferentes. Sem contar os mais comuns: cachorro e gato. Para nós, todos os pets são da familia.",
          },
          {
            question: "Quantos ML tem a caneca?",
            answer: "Caneca grande com 200ml",
          },
        ]}
      />

      {/* Reviews Section */}
      <ReviewsSection
        averageRating={4.8}
        totalReviews={319}
        distribution={[
          { stars: 5, count: 281 },
          { stars: 4, count: 24 },
          { stars: 3, count: 10 },
          { stars: 2, count: 4 },
          { stars: 1, count: 0 },
        ]}
        reviews={[
          {
            author: "Milena Pessatto",
            verified: true,
            rating: 5,
            comment: "A coisa mais lindaa!!",
            imageSrc: "/images/reviews/review1.jpg",
          },
          {
            author: "Telma Lima",
            verified: true,
            rating: 5,
            comment: "Agora a Nina está sempre com a mamãããããae",
            imageSrc: "/images/reviews/review2.jpg",
          },
          {
            author: "Cecille",
            verified: true,
            rating: 5,
            comment: "Apaixonada na caneca do meu filhote. Muito especial ter sempre comigo",
            imageSrc: "/images/reviews/review3.jpg",
          },
          {
            author: "Luiza Granzotto",
            verified: true,
            rating: 5,
            comment:
              "Nenhuma observação específica, só queria dizer que amei conhecer o trabalho de vocês. Vou dar de presente de aniversário para uma amiga muito especial",
            imageSrc: "/images/reviews/review4.jpg",
          },
          {
            author: "Fernando Costa",
            verified: true,
            rating: 5,
            comment:
              "Presenteei minha namorada com a caneca do nosso cachorro. Ela adorou! Ficou idêntico ao nosso neném, com todos os detalhes. Uma lembrança maravilhosa.",
            imageSrc: "/images/reviews/review5.jpg",
          },
          {
            author: "Luna Maia",
            verified: true,
            rating: 5,
            comment: "Acabei de receber minha caneca!!! A coisa mais linda do mundo!!!!!! Obrigada Petloo",
            imageSrc: "/images/reviews/review6.jpg",
          },
          {
            author: "Bruna Bottura",
            verified: true,
            rating: 5,
            comment: "Encantada com a caneca da Moet. Lindo trabalho de vocês.",
            imageSrc: "/images/reviews/review7.jpg",
          },
          {
            author: "Gabriel Zoppi",
            verified: true,
            rating: 5,
            comment: "Ficou lindaaa 🍓🍓🍓🍓🍓 Adorei!!!! Trabalho incrível 🍓🍓 Tô felizzz!!",
            imageSrc: "/images/reviews/review8.jpg",
          },
          {
            author: "Lilian Cescon",
            verified: true,
            rating: 5,
            comment: "Amei demais! Ficou igualzinho ao meu bebê!",
            imageSrc: "/images/reviews/review9.jpg",
          },
        ]}
         additionalReviews1={[
          {
            author: "Laís Dórea",
            verified: true,
            rating: 5,
            comment: "Amei!!",
            imageSrc: "/images/reviews/review10.jpg",
          },
          {
            author: "Leilaine Assis",
            verified: true,
            rating: 5,
            comment: "Amei poder eternizar a imagem do Theo. Obrigada Petloo por me proporcionar isso.",
            imageSrc: "/images/reviews/review11.jpg",
          },
          {
            author: "Ana",
            verified: true,
            rating: 5,
            comment: "Meu Deus eu to apaixonada, muito obrigada por cada detalhe! ta perfeito",
            imageSrc: "/images/reviews/review12.jpg",
          },
        ]}
        additionalReviews2={[
          {
            author: "Jessica Mayer",
            verified: true,
            rating: 5,
            comment: "Chegou. É linda! Valeu a espera.",
            imageSrc: "/images/reviews/review13.jpg",
          },
          {
            author: "Nicole Scheva",
            verified: true,
            rating: 5,
            comment: "Gostaria muito de agradecer a vocês, deu certo o presente! Muito obrigada! de coração ❤️",
            imageSrc: "/images/reviews/review14.jpg",
          },
          {
            author: "Tânia Almeida",
            verified: true,
            rating: 5,
            comment: "Meu frajola ficou perfeitooo",
            imageSrc: "/images/reviews/review15.jpg",
          },
        ]}
      />

      {/* Footer Section */}
      <Footer />
    </main>
  )
}
