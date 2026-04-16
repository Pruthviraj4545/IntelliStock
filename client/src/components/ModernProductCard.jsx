import { memo } from 'react'
import { motion } from 'framer-motion'
import { Package, Calendar, AlertTriangle, Eye, Edit, Trash2, Heart } from 'lucide-react'
import { API_URL } from '../config'

const ModernProductCard = memo(function ModernProductCard({
  product,
  onEdit,
  onDelete,
  onViewDetails,
  loading = false
}) {
  const getStockStatus = (quantity) => {
    if (quantity === 0) {
      return {
        label: 'Out of Stock',
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-400',
        icon: 'text-red-500',
        dot: 'bg-red-500'
      }
    }
    if (quantity <= 10) {
      return {
        label: 'Low Stock',
        bg: 'bg-amber-100 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-400',
        icon: 'text-amber-500',
        dot: 'bg-amber-500'
      }
    }
    return {
      label: 'In Stock',
      bg: 'bg-emerald-100 dark:bg-emerald-900/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      icon: 'text-emerald-500',
      dot: 'bg-emerald-500'
    }
  }

  const stockStatus = getStockStatus(product.stock_quantity)

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    return imagePath.startsWith('http') ? imagePath : `${API_URL}${imagePath}`
  }

  const imageUrl = getImageUrl(product.image_url)

  const formatDate = (dateString) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateString
    }
  }

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

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl animate-pulse overflow-hidden">
        <div className="w-full h-48 bg-gray-200 dark:bg-slate-700" />
        <div className="p-5 space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded-lg w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-lg w-1/2" />
          <div className="flex gap-2 pt-3">
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-lg flex-1" />
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-lg flex-1" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group relative h-full"
    >
      {/* Blur effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 rounded-2xl blur-lg transition-all duration-300" />

      {/* Card */}
      <div className="relative h-full bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm group-hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
        {/* Image Container */}
        <div className="relative w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-gray-300 dark:text-slate-500" />
            </div>
          )}

          {/* Stock Status Badge */}
          <div className={`absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${stockStatus.bg} ${stockStatus.text} backdrop-blur-sm`}>
            <span className={`w-2 h-2 rounded-full ${stockStatus.dot}`} />
            {stockStatus.label}
          </div>

          {/* Expiry Warning */}
          {expiringSoon && product.expiry_date && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100/90 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold backdrop-blur-sm">
              <AlertTriangle className="w-3 h-3" />
              Expiring
            </div>
          )}

          {/* Action Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onViewDetails?.(product)}
              className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
              title="View"
            >
              <Eye className="w-5 h-5 text-gray-700" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit?.(product)}
              className="p-3 bg-indigo-600/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
              title="Edit"
            >
              <Edit className="w-5 h-5 text-white" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete?.(product)}
              className="p-3 bg-red-500/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>

        {/* Card Content */}
        <div className="relative flex-1 p-5 space-y-4 flex flex-col justify-between">
          {/* Meta */}
          <div>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{product.category || 'Uncategorized'}</span>
              <span className="text-gray-400 dark:text-gray-500">•</span>
              <span className="text-gray-500 dark:text-gray-400">{product.brand || 'No brand'}</span>
            </div>

            {/* Product Name */}
            <h3 className="text-sm lg:text-base font-bold text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {product.name}
            </h3>

            {/* SKU */}
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">SKU: {product.sku || 'N/A'}</p>
          </div>

          {/* Price & Stock Grid */}
          <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-gray-100 dark:border-slate-700">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price</p>
              <p className="font-bold text-indigo-600 dark:text-indigo-400">
                ${parseFloat(product.selling_price).toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stock</p>
              <p className="font-bold text-gray-900 dark:text-white">{product.stock_quantity} units</p>
            </div>
          </div>

          {/* Expiry Date */}
          {product.expiry_date && (
            <div className={`flex items-center gap-2 text-xs ${expiringSoon ? 'text-amber-600' : 'text-gray-500'}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>Expires: {formatDate(product.expiry_date)}</span>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onViewDetails?.(product)}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              View
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onEdit?.(product)}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <Edit className="w-3.5 h-3.5 inline mr-1" />
              Edit
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

export default ModernProductCard
