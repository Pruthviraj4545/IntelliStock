import { motion } from 'framer-motion'

export function ProductCardSkeleton() {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Image placeholder */}
      <div className="w-full h-48 bg-gray-200 animate-pulse"></div>

      {/* Content skeleton */}
      <div className="p-5 space-y-3">
        {/* Category & Brand */}
        <div className="flex items-center justify-between">
          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="w-1 h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
        </div>

        {/* Product Name */}
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>

        {/* SKU */}
        <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>

        {/* Price & Stock */}
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-1">
            <div className="h-3 bg-gray-200 rounded w-10 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
          </div>
          <div className="text-right space-y-1">
            <div className="h-3 bg-gray-200 rounded w-10 ml-auto animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded-full w-16 ml-auto animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-12 ml-auto animate-pulse"></div>
          </div>
        </div>

        {/* Expiry Date */}
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <div className="flex-1 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex-1 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </motion.div>
  )
}

export function ProductCardGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={`skeleton-${i}`} />
      ))}
    </div>
  )
}
