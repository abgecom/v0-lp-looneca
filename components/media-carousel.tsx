"use client"

import { useState, useRef, useEffect, type UIEvent } from "react"
import Image from "next/image"

type MediaItem = {
  type: "image" | "video"
  src: string
  alt?: string
}

interface MediaCarouselProps {
  items: MediaItem[]
}

export default function MediaCarousel({ items }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Efeito para pausar vídeos não visíveis e tocar o atual (se for vídeo)
  useEffect(() => {
    videoRefs.current.forEach((videoEl, index) => {
      if (videoEl) {
        if (index === currentIndex && items[index].type === "video") {
          // Opcional: videoEl.play(); // Descomente se quiser autoplay ao swipar para um vídeo
        } else {
          videoEl.pause()
        }
      }
    })
  }, [currentIndex, items])

  // Atualiza o currentIndex baseado na posição do scroll
  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const scrollLeft = event.currentTarget.scrollLeft
    const itemWidth = event.currentTarget.offsetWidth // Largura de cada item (w-full do container)
    const newIndex = Math.round(scrollLeft / itemWidth)
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex)
    }
  }

  if (!items || items.length === 0) {
    return <div className="w-full text-center py-10">Nenhuma mídia para exibir.</div>
  }

  return (
    // Container pai para evitar scroll horizontal na página e centralizar o carrossel
    <div className="w-full overflow-x-hidden flex flex-col items-center py-4">
      {/* Slide principal arrastável */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth w-full max-w-md aspect-square scrollbar-hide relative"
      >
        {items.map((item, index) => (
          <div
            key={`slide-${index}`}
            className="snap-center flex-shrink-0 w-full h-full flex items-center justify-center p-1" // Adicionado p-1 para pequeno respiro
            aria-roledescription="slide"
            aria-label={`Slide ${index + 1} de ${items.length}`}
          >
            {item.type === "image" ? (
              <Image
                src={item.src || "/placeholder.svg"}
                alt={item.alt || `Slide ${index + 1}`}
                width={1000}
                height={1000}
                className="w-full h-full object-contain rounded-lg"
                priority={index === 0} // Priorizar a primeira imagem
                draggable={false} // Evitar conflito com swipe
              />
            ) : (
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={item.src}
                muted // Muted por padrão, usuário pode desmutar
                loop
                playsInline
                controls // Controles para o usuário interagir
                className="w-full h-full object-contain rounded-lg"
                preload="metadata" // Carregar metadados para dimensões e primeiro frame
              />
            )}
          </div>
        ))}
      </div>

      {/* Miniaturas (apenas como referência visual, sem clique para navegação) */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scroll-smooth mt-4 px-4 w-full max-w-md scrollbar-hide">
          {items.map((item, index) => (
            <div
              key={`thumb-${index}`}
              className={`w-14 h-14 flex-shrink-0 rounded-md border-2 p-0.5 ${
                index === currentIndex ? "border-black" : "border-transparent"
              } pointer-events-none`} // pointer-events-none para desabilitar cliques
              aria-hidden="true" // Esconder de leitores de tela, pois a navegação é pelo swipe
            >
              {item.type === "image" ? (
                <Image
                  src={item.src || "/placeholder.svg"}
                  alt="" // Alt vazio pois é decorativo/referência
                  width={64}
                  height={64}
                  className="w-full h-full object-cover rounded-[3px]"
                  loading="lazy" // Lazy load para miniaturas
                />
              ) : (
                <div className="w-full h-full relative bg-black rounded-[3px] overflow-hidden">
                  <video
                    src={item.src}
                    muted
                    playsInline
                    onLoadedMetadata={(e) => (e.currentTarget.currentTime = 0)}
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Indicador de pontos (opcional, mas útil para swipe) */}
      {items.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {items.map((_, index) => (
            <button
              key={`dot-${index}`}
              onClick={() => {
                if (scrollContainerRef.current) {
                  const itemWidth = scrollContainerRef.current.offsetWidth
                  scrollContainerRef.current.scrollTo({ left: itemWidth * index, behavior: "smooth" })
                }
                setCurrentIndex(index) // Atualiza o estado imediatamente
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ease-in-out ${
                index === currentIndex ? "bg-black scale-125" : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Ir para o slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
