import { memo } from 'react'
import { motion } from 'framer-motion'
import { Package, Calendar, AlertTriangle, Eye, Edit, Trash2 } from 'lucide-react'
import { API_URL } from '../config'

// Memoized ProductCard to prevent unnecessary re-renders
const InventoryProductCard = memo(function InventoryProductCard({
  product,
  onEdit,
  onDelete,
  onViewDetails,
  loading = false
}) {
  const getStockStatus = (quantity) => {
    if (quantity === 0) {
      return {
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: 'text-red-500',
        text: 'Out of Stock',
        badge: 'badge-danger'
      }
    }
    if (quantity <= 10) {
      return {
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: 'text-amber-500',
        text: 'Low Stock',
        badge: 'badge-warning'
      }
    }
    return {
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: 'text-green-500',
      text: 'In Stock',
      badge: 'badge-success'
    }
  }

  const stockStatus = getStockStatus(product.stock_quantity)

  // Construct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    return imagePath.startsWith('http') ? imagePath : `${API_URL}${imagePath}`
  }

  const imageUrl = getImageUrl(product.image_url)

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Check if product is expiring soon (within 30 days)
  const isExpiringSoon = (dateString) => {
    if (!dateString) return false
    try {
      const expiryDate = new Date(dateString)
      const today = new Date()
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0
    } catch {
      return false
    }
  }

  const expiringSoon = isExpiringSoon(product.expiry_date)

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
        {/* Image placeholder */}
        <div className="w-full h-48 bg-gray-200"></div>

        {/* Content placeholder */}
        <div className="p-5 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="flex justify-between items-center pt-2">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-5 bg-gray-200 rounded-full w-16"></div>
          </div>
          <div className="flex gap-2 pt-2">
            <div className="h-9 bg-gray-200 rounded flex-1"></div>
            <div className="h-9 bg-gray-200 rounded flex-1"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 overflow-hidden transition-all duration-300"
    >
      {/* Product Image */}
      <div className="relative w-full h-48 bg-gradient-to-br from-gray-50 dark:from-slate-700 to-gray-100 dark:to-slate-600 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}

        {/* Fallback placeholder */}
        {!imageUrl && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Package className="w-16 h-16 text-gray-300 dark:text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-slate-400">No image</p>
            </div>
          </div>
        )}

        {/* Expiry Warning Badge */}
        {expiringSoon && product.expiry_date && (
          <div className="absolute top-2 right-2 bg-amber-100 border border-amber-200 text-amber-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Expiring
          </div>
        )}

        {/* Quick Action Overlay (visible on hover) */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onViewDetails?.(product)}
            className="bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:bg-white transition-colors"
            title="View Details"
          >
            <Eye className="w-5 h-5 text-gray-700" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit?.(product)}
            className="bg-indigo-600/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            title="Edit"
          >
            <Edit className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete?.(product)}
            className="bg-red-500/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 space-y-4">
        {/* Category & Brand */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-slate-400 font-medium">{product.category || 'Uncategorized'}</span>
          <span className="text-gray-400 dark:text-slate-500">•</span>
          <span className="text-gray-500 dark:text-slate-400">{product.brand || 'No brand'}</span>
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {product.name}
        </h3>

        {/* SKU */}
        <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">SKU: {product.sku || 'N/A'}</p>

        {/* Price & Stock */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Price</p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              ${parseFloat(product.selling_price).toFixed(2)}
            </p>
            {product.cost_price && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                Cost: ${parseFloat(product.cost_price).toFixed(2)}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Stock</p>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${stockStatus.badge}`}>
              {stockStatus.text}
            </span>
            <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 font-medium">
              {product.stock_quantity} units
            </p>
          </div>
        </div>

        {/* Expiry Date */}
        {product.expiry_date && (
          <div className={`flex items-center gap-2 text-xs ${expiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-slate-400'}`}>
            <Calendar className="w-3.5 h-3.5" />
            <span>Expires: {formatDate(product.expiry_date)}</span>
            {expiringSoon && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">(Soon)</span>
            )}
          </div>
        )}

        {/* Action Buttons (always visible on desktop, hover on mobile) */}
        <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
          <button
            onClick={() => onViewDetails?.(product)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>
          <button
            onClick={() => onEdit?.(product)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete?.(product)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
})

InventoryProductCard.displayName = 'InventoryProductCard'

export { InventoryProductCard }
export default InventoryProductCard
