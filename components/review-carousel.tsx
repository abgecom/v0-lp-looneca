"use client"

import { useState } from "react"
import Image from "next/image"
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"

interface Review {
  author: string
  verified: boolean
  rating: number
  comment: string
  imageSrc?: string
}

interface ReviewCarouselProps {
  reviews: Review[]
  title?: string
}

export default function ReviewCarousel({ reviews = [], title }: ReviewCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Add a safety check to ensure reviews is an array
  const safeReviews = Array.isArray(reviews) ? reviews : []

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % safeReviews.length)
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + safeReviews.length) % safeReviews.length)
  }

  return (
    <div className="relative w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100 min-h-[420px]">
        {safeReviews.map((review, index) => (
          <div
            key={index}
            className={`transition-opacity duration-300 absolute inset-0 p-4 flex flex-col ${
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <div className="flex items-center mb-2">
              <div className="font-semibold">{review.author}</div>
              {review.verified && (
                <div className="flex items-center ml-2 text-green-600 text-xs">
                  <span className="mr-1">Verified</span>
                  <CheckCircle size={12} />
                </div>
              )}
            </div>
            <div className="flex mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < review.rating ? "text-[#C1436D]" : "text-gray-300"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm mb-3">{review.comment}</p>
            {review.imageSrc && (
              <div className="flex-grow flex items-center justify-center">
                <div className="max-w-full max-h-[280px] rounded-md overflow-hidden">
                  <Image
                    src={review.imageSrc || "/placeholder.svg"}
                    alt={`Avaliação de ${review.author}`}
                    width={300}
                    height={300}
                    className="w-auto h-auto max-h-[280px] object-contain mx-auto"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Navigation Arrows */}
        {safeReviews.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full z-20 w-8 h-8 flex items-center justify-center"
              onClick={goToPrevious}
              aria-label="Previous review"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full z-20 w-8 h-8 flex items-center justify-center"
              onClick={goToNext}
              aria-label="Next review"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Dots indicator */}
        {safeReviews.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {safeReviews.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full ${index === currentIndex ? "bg-[#C1436D]" : "bg-gray-300"}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
