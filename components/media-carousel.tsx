"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

type MediaItem = {
  type: "image" | "video"
  src: string
  alt?: string
  variant?: string
}

interface MediaCarouselProps {
  items: MediaItem[]
  className?: string
  currentIndex?: number
  onIndexChange?: (index: number) => void
}

export default function MediaCarousel({
  items,
  className = "",
  currentIndex: externalIndex,
  onIndexChange,
}: MediaCarouselProps) {
  const [internalIndex, setInternalIndex] = useState(0)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  // Use external index if provided, otherwise use internal state
  const currentIndex = externalIndex !== undefined ? externalIndex : internalIndex

  useEffect(() => {
    // If external index changes, update internal state
    if (externalIndex !== undefined) {
      setInternalIndex(externalIndex)
    }
  }, [externalIndex])

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % items.length
    setInternalIndex(newIndex)
    if (onIndexChange) onIndexChange(newIndex)
  }

  const goToPrevious = () => {
    const newIndex = (currentIndex - 1 + items.length) % items.length
    setInternalIndex(newIndex)
    if (onIndexChange) onIndexChange(newIndex)
  }

  // Calculate next index with wrapping
  const nextIndex = (currentIndex + 1) % items.length

  return (
    <div className={`relative overflow-hidden max-w-full ${className}`}>
      <div className="flex items-center">
        {/* Main slide container */}
        <div className="w-[85%] border border-gray-300 relative">
          <div className="aspect-square relative">
            {items.map((item, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                {item.type === "image" ? (
                  <div className="w-full h-full flex items-center justify-center bg-white p-2">
                    <Image
                      src={item.src || "/placeholder.svg"}
                      alt={item.alt || `Slide ${index + 1}`}
                      width={1000}
                      height={1000}
                      className="max-w-full max-h-full object-contain"
                      priority={index === 0}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white p-2">
                    <video
                      ref={(el) => (videoRefs.current[index] = el)}
                      src={item.src}
                      muted
                      loop
                      playsInline
                      controls
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview of next slide */}
        <div className="w-[15%] overflow-hidden">
          <div className="aspect-square relative">
            {items[nextIndex].type === "image" ? (
              <div className="w-full h-full flex items-center justify-center bg-white p-1">
                <Image
                  src={items[nextIndex].src || "/placeholder.svg"}
                  alt={items[nextIndex].alt || `Next slide`}
                  width={400}
                  height={400}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white p-1">
                <video
                  src={items[nextIndex].src}
                  muted
                  loop
                  playsInline
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full z-20 w-10 h-10 flex items-center justify-center"
        onClick={goToPrevious}
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        className="absolute right-[17%] top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full z-20 w-10 h-10 flex items-center justify-center"
        onClick={goToNext}
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
