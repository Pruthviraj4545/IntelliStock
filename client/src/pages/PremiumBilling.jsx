import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart, Plus, Trash2, DollarSign, Percent, CreditCard,
  Package, User, Calendar, Search, RefreshCw, Check, X
} from 'lucide-react'
import {
  PremiumCard, PremiumButton, PremiumInput, PremiumBadge,
  DashboardSkeleton, containerVariants, itemVariants
} from '../components/Premium'
import { useToast } from '../components/Toast'
import { getProducts } from '../api/productService'

function PremiumBilling() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [discount, setDiscount] = useState(0)
  const [payment, setPayment] = useState({
    method: 'cash',
    amount: 0
  })
  const [showPayment, setShowPayment] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await getProducts(1)
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(
    p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) && p.stock_quantity > 0
  )

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      if (existing.quantity < product.stock_quantity) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ))
      } else {
        toast.warning('Not enough stock available')
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id)
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ))
    }
  }

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0)
  const discountAmount = (subtotal * discount) / 100
  const total = subtotal - discountAmount
  const tax = total * 0.1 // 10% tax
  const grandTotal = total + tax

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }
    setPayment({ ...payment, amount: grandTotal })
    setShowPayment(true)
  }

  const completePayment = () => {
    toast.success('Payment successful! Order placed.')
    setCart([])
    setDiscount(0)
    setShowPayment(false)
    setPayment({ method: 'cash', amount: 0 })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <motion.div
        className="max-w-7xl mx-auto px-6 lg:px-8 py-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
                Point of Sale
              </h1>
              <p className="text-slate-400">Process sales and manage billing</p>
            </div>
            {cart.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 text-sm font-medium"
              >
                {cart.length} items in cart
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <PremiumCard variant="glass" className="h-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Available Products</h3>
                <PremiumInput
                  placeholder="Search products..."
                  startIcon={<Search className="w-4 h-4" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-6"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <motion.button
                      key={product.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addToCart(product)}
                      disabled={product.stock_quantity === 0}
                      className="text-left p-4 rounded-lg bg-slate-700/50 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                            {product.name}
                          </p>
                          <p className="text-xs text-slate-400">{product.category}</p>
                        </div>
                        <span className="text-indigo-300 font-bold">
                          ${Number(product.selling_price).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{product.stock_quantity} in stock</span>
                        <Plus className="w-4 h-4 text-indigo-400" />
                      </div>
                    </motion.button>
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-slate-400/50 mx-auto mb-3" />
                    <p className="text-slate-400">No products available</p>
                  </div>
                )}
              </div>
            </PremiumCard>
          </motion.div>

          {/* Cart & Checkout Section */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Cart */}
            <PremiumCard variant="gradient" glow="purple" className="h-full flex flex-col">
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart Summary
                </h3>

                {cart.length > 0 ? (
                  <>
                    <div className="flex-1 space-y-3 mb-6 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="p-3 rounded-lg bg-slate-700/50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-100">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                ${Number(item.selling_price).toFixed(2)} each
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-1 rounded bg-slate-600 hover:bg-slate-500 text-xs text-slate-100"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                              className="w-12 px-2 py-1 rounded bg-slate-600 text-center text-xs text-slate-100 border-none"
                              min="1"
                            />
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-1 rounded bg-slate-600 hover:bg-slate-500 text-xs text-slate-100"
                            >
                              +
                            </button>
                            <span className="ml-auto text-sm font-semibold text-indigo-300">
                              ${(item.selling_price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-600/50">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Subtotal:</span>
                        <span className="text-slate-100">${subtotal.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          value={discount}
                          onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="flex-1 px-2 py-1 rounded bg-slate-700 text-slate-100 text-sm border border-slate-600"
                          placeholder="Discount %"
                          max="100"
                          min="0"
                        />
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-400">Discount:</span>
                          <span className="text-green-300">-${discountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Tax (10%):</span>
                        <span className="text-slate-100">${tax.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-600/50">
                        <span className="text-slate-100">Total:</span>
                        <span className="text-indigo-300">${grandTotal.toFixed(2)}</span>
                      </div>

                      <PremiumButton
                        variant="primary"
                        size="lg"
                        onClick={handleCheckout}
                        className="w-full mt-4"
                      >
                        <CreditCard className="w-4 h-4" />
                        Proceed to Payment
                      </PremiumButton>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <ShoppingCart className="w-12 h-12 text-slate-400/50 mb-3" />
                    <p className="text-slate-400 text-sm">Cart is empty</p>
                    <p className="text-slate-500 text-xs mt-1">Add products to begin</p>
                  </div>
                )}
              </div>
            </PremiumCard>
          </motion.div>
        </div>

        {/* Payment Modal */}
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700"
            >
              <h2 className="text-2xl font-bold text-slate-100 mb-6">Complete Payment</h2>

              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-lg bg-slate-700/50">
                  <p className="text-sm text-slate-400 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-indigo-300">
                    ${payment.amount.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-100 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={payment.method}
                    onChange={(e) => setPayment({ ...payment, method: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 text-slate-100 border border-slate-600"
                  >
                    <option value="cash">Cash</option>
                    <option value="credit">Credit Card</option>
                    <option value="debit">Debit Card</option>
                    <option value="digital">Digital Payment</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={completePayment}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all"
                >
                  <Check className="w-4 h-4 inline mr-2" />
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default PremiumBilling
