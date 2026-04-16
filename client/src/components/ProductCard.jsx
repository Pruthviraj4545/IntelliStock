import { motion } from 'framer-motion'
import { ShoppingCart, Package } from 'lucide-react'

function ProductCard({ product, onAddToCart, showAddToCart = true }) {
  const getStockStatus = (quantity) => {
    if (quantity === 0) return { color: 'text-red-600', bg: 'bg-red-50', text: 'Out of Stock' }
    if (quantity <= 10) return { color: 'text-yellow-600', bg: 'bg-yellow-50', text: 'Low Stock' }
    return { color: 'text-green-600', bg: 'bg-green-50', text: 'In Stock' }
  }

  const stockStatus = getStockStatus(product.quantity)

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.95 }}
      className="card p-6 cursor-pointer group"
    >
      {/* Product Image Placeholder */}
      <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
        <Package className="w-16 h-16 text-primary-400" />
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500">SKU: {product.sku}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary-600">
            ${product.price?.toFixed(2)}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
            {stockStatus.text}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Stock: {product.quantity}</span>
          <span className="text-gray-400">•</span>
          <span>{product.category || 'General'}</span>
        </div>

        {/* Add to Cart Button */}
        {showAddToCart && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAddToCart(product)}
            disabled={product.quantity === 0}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

export default ProductCard