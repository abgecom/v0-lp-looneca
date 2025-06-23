"use client"

import type React from "react"

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

  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  // Use external index if provided, otherwise use internal state
  const currentIndex = externalIndex !== undefined ? externalIndex : internalIndex

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

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < items.length) {
        setInternalIndex(newIndex)
        if (onIndexChange) {
          onIndexChange(newIndex)
        }
      }
    }, 50)
  }

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = scrollContainerRef.current
    if (!container) return

    setIsDragging(true)
    setStartX(e.pageX - container.offsetLeft)
    setScrollLeft(container.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const container = scrollContainerRef.current
    if (!isDragging || !container) return

    e.preventDefault()
    const x = e.pageX - container.offsetLeft
    const walk = (x - startX) * 2
    container.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`flex overflow-x-auto snap-x snap-mandatory scroll-smooth w-full max-w-md aspect-square scrollbar-hide relative ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
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

      {/* Miniaturas (apenas como referência visual) */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scroll-smooth mt-4 px-4 w-full max-w-md scrollbar-hide">
          {items.map((item, index) => (
            <div
              key={`thumb-${index}`}
              className={`w-14 h-14 flex-shrink-0 rounded-md border-2 p-0.5 ${
                index === currentIndex ? "border-black" : "border-transparent"
              } pointer-events-none`}
              aria-hidden="true"
              onClick={() => {
                const container = scrollContainerRef.current
                if (!container) return

                const itemWidth = container.offsetWidth
                if (itemWidth === 0) return

                container.scrollTo({ left: itemWidth * index, behavior: "smooth" })
              }}
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
