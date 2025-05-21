"use client"
import ReviewCarousel from "./review-carousel"

interface ReviewDistribution {
  stars: number
  count: number
}

interface Review {
  author: string
  verified: boolean
  rating: number
  comment: string
  imageSrc?: string
}

interface ReviewsSectionProps {
  averageRating: number
  totalReviews: number
  distribution: ReviewDistribution[]
  reviews: Review[]
  additionalReviews1: Review[]
  additionalReviews2: Review[]
}

export default function ReviewsSection({
  averageRating,
  totalReviews,
  distribution,
  reviews,
  additionalReviews1,
  additionalReviews2,
}: ReviewsSectionProps) {
  // Calcular o total de avaliações para as barras de progresso
  const totalDistributionReviews = distribution.reduce((acc, item) => acc + item.count, 0)

  // Dividir os reviews em 3 grupos para os carrosséis
  const reviewGroup1 = reviews.slice(0, 3)
  const reviewGroup2 = reviews.slice(3, 6)
  const reviewGroup3 = reviews.slice(6)

  return (
    <section className="py-12 px-4 bg-[#F1E9DB] border-t border-gray-200">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Avaliações</h2>
        <div className="border-t border-b border-gray-200 py-8">
          {/* Rating Summary */}
          <div className="flex flex-col md:flex-row">
            {/* Left: Average Rating */}
            <div className="md:w-1/4 flex flex-col items-center justify-center border-r border-gray-200 pr-6">
              <div className="text-[#C1436D] text-6xl font-bold">{averageRating.toFixed(1)}</div>
              <div className="text-gray-500 text-sm">/5</div>
              <div className="flex mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-5 h-5 text-[#C1436D]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div className="text-sm text-gray-500 mt-2">From {totalReviews} reviews</div>
            </div>

            {/* Middle: Distribution */}
            <div className="md:w-2/4 px-6 mt-8 md:mt-0">
              {distribution
                .sort((a, b) => b.stars - a.stars)
                .map((item) => (
                  <div key={item.stars} className="flex items-center mb-2">
                    <div className="w-8 text-right mr-2">{item.stars}</div>
                    <svg className="w-4 h-4 text-[#C1436D] mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-[#C1436D] h-2.5 rounded-full"
                        style={{
                          width: `${(item.count / totalDistributionReviews) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="w-8 text-right ml-2">{item.count}</div>
                  </div>
                ))}
            </div>

            {/* Right: Classification */}
            <div className="md:w-1/4 flex items-center justify-center mt-8 md:mt-0">
              <div className="bg-[#333333] text-white px-6 py-3 rounded">Classificação</div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Carousels - First Row */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <ReviewCarousel reviews={reviewGroup1} />
          <ReviewCarousel reviews={reviewGroup2} />
          <ReviewCarousel reviews={reviewGroup3} />
        </div>

        {/* Customer Reviews Carousels - Second Row */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <ReviewCarousel reviews={additionalReviews1} />
          <ReviewCarousel reviews={additionalReviews2} />
          <div className="hidden md:block"></div> {/* Placeholder para manter o grid alinhado */}
        </div>
      </div>
    </section>
  )
}
