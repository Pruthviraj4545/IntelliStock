import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Package, Heart, DollarSign, Star } from 'lucide-react'
import api from '../api/axios'

function ClientDashboard() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products').catch(() => ({ data: { products: [] } }))
      setProducts(res.data?.products || [])
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    setCart([...cart, product])
  }

  const stats = [
    { title: 'Products Available', value: products.length, icon: Package, color: 'blue' },
    { title: 'Cart Items', value: cart.length, icon: ShoppingCart, color: 'green' },
    { title: 'Total Value', value: `$${(cart.reduce((sum, item) => sum + item.selling_price, 0)).toFixed(2)}`, icon: DollarSign },
    { title: 'In Stock Items', value: products.filter((product) => Number(product.stock_quantity) > 0).length, icon: Heart, color: 'red' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
        <p className="text-gray-600 mt-2">Browse and purchase products</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-auto-fit-lg">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="stat-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</h3>
              </div>
              <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Product Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Products</h2>
        {!loading && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.slice(0, 12).map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="card overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Product Image Placeholder */}
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 h-48 flex items-center justify-center">
                  <Package className="w-12 h-12 text-indigo-600" />
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{product.category}</p>

                  {/* Price and Stock */}
                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <p className="text-xs text-gray-600">Price</p>
                      <p className="text-lg font-bold text-indigo-600">${product.selling_price}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Stock</p>
                      <span className={`text-sm font-medium ${
                        product.stock_quantity > 10
                          ? 'text-green-600'
                          : product.stock_quantity > 0
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}>
                        {product.stock_quantity > 0 ? product.stock_quantity : 'Out'}
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-xs text-gray-600 ml-2">Stock-based display</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock_quantity === 0}
                      className="flex-1 btn btn-primary py-2 text-sm disabled:opacity-50"
                    >
                      Add to Cart
                    </button>
                    <button className="btn-icon btn-icon-primary">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No products available</p>
          </div>
        )}
      </div>

      {/* Shopping Cart Sidebar Info */}
      {cart.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-r from-indigo-50 to-purple-50"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Shopping Cart</h3>
              <p className="text-gray-600 mt-1">{cart.length} item(s) in your cart</p>
            </div>
            <button className="btn btn-primary">Proceed to Checkout</button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default ClientDashboard
