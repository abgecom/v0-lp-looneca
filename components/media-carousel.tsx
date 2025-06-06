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
  const [isMobile, setIsMobile] = useState(false)

  // Use external index if provided, otherwise use internal state
  const currentIndex = externalIndex !== undefined ? externalIndex : internalIndex

  useEffect(() => {
    // If external index changes, update internal state
    if (externalIndex !== undefined) {
      setInternalIndex(externalIndex)
    }
  }, [externalIndex])

  useEffect(() => {
    // Check if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

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
        {/* Main slide container - responsive sizing */}
        <div className={`${isMobile ? "w-full" : "w-[90%]"} relative`}>
          <div className={`${isMobile ? "aspect-[4/5]" : "aspect-square"} relative`}>
            {items.map((item, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                {item.type === "image" ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                    <Image
                      src={item.src || "/placeholder.svg"}
                      alt={item.alt || `Slide ${index + 1}`}
                      width={1000}
                      height={1000}
                      className={`${isMobile ? "w-full h-full object-cover" : "max-w-full max-h-full object-contain"}`}
                      priority={index === 0}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                    <video
                      ref={(el) => (videoRefs.current[index] = el)}
                      src={item.src}
                      muted
                      loop
                      playsInline
                      controls
                      className={`${isMobile ? "w-full h-full object-cover" : "max-w-full max-h-full object-contain"}`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview of next slide - hide on mobile */}
        {!isMobile && (
          <div className="w-[10%] overflow-hidden ml-2">
            <div className="aspect-square relative">
              {items[nextIndex].type === "image" ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                  <Image
                    src={items[nextIndex].src || "/placeholder.svg"}
                    alt={items[nextIndex].alt || `Next slide`}
                    width={400}
                    height={400}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
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
        )}
      </div>

      {/* Thumbnails for mobile - more compact */}
      {isMobile && items.length > 1 && (
        <div className="flex overflow-x-auto gap-2 mt-3 pb-2 px-1">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setInternalIndex(index)
                if (onIndexChange) onIndexChange(index)
              }}
              className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                index === currentIndex ? "border-blue-500 scale-105" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {item.type === "image" ? (
                <Image
                  src={item.src || "/placeholder.svg"}
                  alt={item.alt || `Thumbnail ${index + 1}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-600">▶</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Navigation Arrows - more subtle */}
      <button
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full z-20 w-9 h-9 flex items-center justify-center shadow-lg transition-all hover:scale-105"
        onClick={goToPrevious}
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} />
      </button>

      <button
        className={`absolute ${isMobile ? "right-3" : "right-[12%]"} top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full z-20 w-9 h-9 flex items-center justify-center shadow-lg transition-all hover:scale-105`}
        onClick={goToNext}
        aria-label="Next slide"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dots indicator for mobile */}
      {isMobile && items.length > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setInternalIndex(index)
                if (onIndexChange) onIndexChange(index)
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? "bg-blue-500 w-4" : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
