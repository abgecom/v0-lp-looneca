"use client"

import { useState, useRef, useEffect, type UIEvent } from "react"
import Image from "next/image"

type MediaItem = {
  type: "image" | "video"
  src: string
  alt?: string
  variant?: string
}

interface MediaCarouselProps {
  items: MediaItem[]
  currentIndex?: number
  onIndexChange?: (index: number) => void
}

export default function MediaCarousel({ items, currentIndex: externalIndex, onIndexChange }: MediaCarouselProps) {
  const [internalIndex, setInternalIndex] = useState(0)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Use external index if provided, otherwise use internal state
  const currentIndex = externalIndex !== undefined ? externalIndex : internalIndex

  // Function to update index and notify parent
  const updateIndex = (newIndex: number) => {
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < items.length) {
      setInternalIndex(newIndex)
      if (onIndexChange) {
        onIndexChange(newIndex)
      }
    }
  }

  // Sync external index changes to scroll position
  useEffect(() => {
    if (externalIndex !== undefined && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const targetScrollLeft = container.offsetWidth * externalIndex

      // Only scroll if not already at (or very close to) the target position
      if (Math.abs(container.scrollLeft - targetScrollLeft) > 1) {
        container.scrollTo({
          left: targetScrollLeft,
          behavior: "smooth",
        })
      }
    }
  }, [externalIndex])

  // Efeito para pausar vídeos não visíveis
  useEffect(() => {
    videoRefs.current.forEach((videoEl, index) => {
      if (videoEl && index !== currentIndex) {
        videoEl.pause()
      }
    })
  }, [currentIndex])

  // Atualiza o currentIndex baseado na posição do scroll
  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    // Clear any existing timeout to avoid premature state updates
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Set a timeout to run after scrolling has likely stopped
    scrollTimeoutRef.current = setTimeout(() => {
      const container = event.currentTarget
      if (!container) return

      const itemWidth = container.offsetWidth
      if (itemWidth === 0) return

      const newIndex = Math.round(container.scrollLeft / itemWidth)
      updateIndex(newIndex)
    }, 100) // Reduced timeout for faster response
  }

  // Function to scroll to specific index
  const scrollToIndex = (index: number) => {
    const container = scrollContainerRef.current
    if (!container) return

    const itemWidth = container.offsetWidth
    if (itemWidth === 0) return

    container.scrollTo({
      left: itemWidth * index,
      behavior: "smooth",
    })

    // Update index immediately for better UX
    updateIndex(index)
  }

  if (!items || items.length === 0) {
    return <div className="w-full text-center py-10">Nenhuma mídia para exibir.</div>
  }

  return (
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
            className="snap-center flex-shrink-0 w-full h-full flex items-center justify-center p-1"
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
                priority={index === 0}
                draggable={false}
              />
            ) : (
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={item.src}
                muted
                loop
                playsInline
                controls
                className="w-full h-full object-contain rounded-lg"
                preload="metadata"
              />
            )}
          </div>
        ))}
      </div>

      {/* Miniaturas (clicáveis) */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scroll-smooth mt-4 px-4 w-full max-w-md scrollbar-hide">
          {items.map((item, index) => (
            <div
              key={`thumb-${index}`}
              className={`w-14 h-14 flex-shrink-0 rounded-md border-2 p-0.5 cursor-pointer transition-all duration-200 hover:scale-105 ${
                index === currentIndex ? "border-black" : "border-transparent hover:border-gray-300"
              }`}
              role="button"
              aria-label={`Ver ${item.type === "image" ? "imagem" : "vídeo"} ${index + 1}`}
              onClick={() => scrollToIndex(index)}
            >
              {item.type === "image" ? (
                <Image
                  src={item.src || "/placeholder.svg"}
                  alt=""
                  width={64}
                  height={64}
                  className="w-full h-full object-cover rounded-[3px]"
                  loading="lazy"
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

      {/* Indicador de pontos */}
      {items.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {items.map((_, index) => (
            <button
              key={`dot-${index}`}
              onClick={() => scrollToIndex(index)}
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
