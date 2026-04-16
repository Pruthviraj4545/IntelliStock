import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Receipt,
  RefreshCw,
  Ticket,
  Printer,
  Clock,
  ChevronDown
} from 'lucide-react'
import api from '../api/axios'
import { useToast } from '../components/Toast'

function Billing() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  // Payment & Discount
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discountCode, setDiscountCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [appliedDiscount, setAppliedDiscount] = useState(null)

  // Receipt & History
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastTransaction, setLastTransaction] = useState(null)
  const [showTransactionHistory, setShowTransactionHistory] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const generateTransactionId = () => `BILL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  useEffect(() => {
    fetchProducts()
  }, [])

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setProducts(allProducts)
      return
    }

    const searchTimeout = setTimeout(async () => {
      try {
        const response = await api.get('/products/search/query', {
          params: { q: searchTerm, limit: 500 }
        })
        const filtered = (response.data.products || []).filter(p => p.stock_quantity > 0)
        setProducts(filtered)
      } catch (error) {
        console.error('Search error:', error)
        // Fallback to client-side filtering
        const clientFiltered = allProducts.filter(product => {
          const searchLower = searchTerm.toLowerCase().trim()
          const matchesName = product.name.toLowerCase().includes(searchLower)
          const matchesSKU = product.sku && product.sku.toLowerCase().includes(searchLower)
          const matchesCategory = product.category && product.category.toLowerCase().includes(searchLower)
          const matchesBrand = product.brand && product.brand.toLowerCase().includes(searchLower)
          
          return (matchesName || matchesSKU || matchesCategory || matchesBrand) && product.stock_quantity > 0
        })
        setProducts(clientFiltered)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [searchTerm, allProducts])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      // Fetch all products with higher limit
      const response = await api.get('/products', {
        params: { page: 1, limit: 500 }
      })
      const allProds = response.data.products || []
      setAllProducts(allProds)
      setProducts(allProds.filter(p => p.stock_quantity > 0))
    } catch (error) {
      console.error('Error fetching products:', error)
      alert('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        updateQuantity(product.id, existingItem.quantity + 1)
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    const product = products.find(p => p.id === productId)
    if (newQuantity > product.stock_quantity) return

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ))
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const cartSubtotal = cart.reduce((total, item) => total + (item.selling_price * item.quantity), 0)

  const applyDiscountCode = () => {
    if (!discountCode.trim()) return

    // Simple discount codes (in real app, validate from backend)
    const codes = {
      'SAVE10': 10, // 10% off
      'SAVE20': 20,
      'FLAT50': 50, // ₹50 off
      'WELCOME': 15
    }

    const code = discountCode.toUpperCase().trim()
    if (codes[code]) {
      if (codes[code] <= 100) {
        // Percentage
        setDiscountAmount(cartSubtotal * (codes[code] / 100))
      } else {
        // Fixed amount
        setDiscountAmount(codes[code])
      }
      setAppliedDiscount(code)
      toast?.success(`Discount applied: ${codes[code]}${codes[code] <= 100 ? '%' : '₹'} off`)
    } else {
      toast?.error('Invalid discount code')
    }
  }

  const removeDiscount = () => {
    setDiscountCode('')
    setDiscountAmount(0)
    setAppliedDiscount(null)
  }

  const amountAfterDiscount = Math.max(0, cartSubtotal - discountAmount)
  const tax = amountAfterDiscount * 0.18
  const grandTotal = amountAfterDiscount + tax

  const fetchTransactions = async () => {
    try {
      setHistoryLoading(true)
      const response = await api.get('/sales?limit=50&grouped=true')
      const sales = response.data.sales || []
      setTransactions(sales)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      toast.error('Failed to load transaction history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return

    try {
      const transactionId = generateTransactionId()

      // Record each sale in the system with payment method
      for (const item of cart) {
        await api.post('/sales', {
          product_id: item.id,
          quantity: item.quantity,
          payment_method: paymentMethod,
          transaction_id: transactionId
        })
      }

      // Refresh products to get updated stock
      await fetchProducts()

      // Create transaction record
      const transaction = {
        id: transactionId,
        date: new Date().toISOString(),
        items: cart,
        subtotal: amountAfterDiscount,
        discount: discountAmount,
        tax: tax,
        total: grandTotal,
        paymentMethod: paymentMethod,
        discountCode: appliedDiscount
      }

      setLastTransaction(transaction)
      setCart([])
      setShowReceipt(true)

      // Reset discount
      setDiscountCode('')
      setDiscountAmount(0)
      setAppliedDiscount(null)

      // Auto-hide receipt after 5 seconds
      setTimeout(() => setShowReceipt(false), 5000)

    } catch (error) {
      console.error('Checkout failed:', error)
      toast.error('Error processing sale. Please try again.')
    }
  }

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank')
    if (!lastTransaction) return

    const date = new Date(lastTransaction.date).toLocaleString()

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${lastTransaction.id}</title>
          <style>
            body { font-family: 'Courier New', monospace; max-width: 400px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>IntelliStock POS</h2>
            <p>Receipt #${lastTransaction.id}</p>
            <p>${date}</p>
          </div>
          <div class="items">
            ${lastTransaction.items.map(item => `
              <div class="item">
                <span>${item.name} x${item.quantity}</span>
                <span>₹${(item.selling_price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <div class="item"><span>Subtotal:</span><span>₹${lastTransaction.subtotal.toFixed(2)}</span></div>
            ${lastTransaction.discount ? `<div class="item" style="color: green;"><span>Discount:</span><span>-₹${lastTransaction.discount.toFixed(2)}</span></div>` : ''}
            <div class="item"><span>Tax (18%):</span><span>₹${lastTransaction.tax.toFixed(2)}</span></div>
            <div class="item"><span>Total:</span><span>₹${lastTransaction.total.toFixed(2)}</span></div>
            <div class="item"><span>Payment:</span><span>${lastTransaction.paymentMethod}</span></div>
          </div>
          <div class="footer">
            <p>Thank you for your purchase!</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Point of Sale</h1>
          <p className="text-slate-600 mt-1">Select products and complete billing</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowTransactionHistory(true)
              fetchTransactions()
            }}
            className="btn btn-secondary flex gap-2 items-center"
            title="View transaction history"
          >
            <Clock className="w-5 h-5" /> History
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchProducts}
            disabled={loading}
            className="btn btn-secondary flex gap-2 items-center"
            title="Refresh product list"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* Receipt Modal */}
      {showReceipt && lastTransaction && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-slate-200"
          >
            <div className="text-center mb-6">
              <Receipt className="w-12 h-12 text-primary-600 mx-auto mb-3" />
              <h2 className="text-2xl font-display font-bold text-slate-900">Transaction Complete</h2>
            </div>

            <div className="space-y-4 mb-6 border-t border-b border-slate-200 py-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Transaction ID:</span>
                <span className="font-medium">{lastTransaction.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Items:</span>
                <span className="font-medium">{lastTransaction.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium">₹{lastTransaction.subtotal.toFixed(2)}</span>
              </div>
              {lastTransaction.discount && lastTransaction.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span className="font-medium">-₹{lastTransaction.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax (18%):</span>
                <span className="font-medium">₹{lastTransaction.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-primary-600">
                <span>Total:</span>
                <span>₹{lastTransaction.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Payment Method:</span>
                <span className="font-medium capitalize">{lastTransaction.paymentMethod}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 btn btn-secondary"
              >
                Close
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex-1 btn btn-primary flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Transaction History Modal */}
      {showTransactionHistory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 max-h-[80vh] overflow-y-auto border border-slate-200"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold text-slate-900">Sales History</h2>
              <button
                onClick={() => setShowTransactionHistory(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                &times;
              </button>
            </div>

            {historyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading sales...</p>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No sales found</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((sale) => (
                  <div key={sale.id} className="card p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-slate-900">{sale.product_name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(sale.sale_date).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-sm font-medium">x{sale.quantity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Total:</span>
                      <span className="font-bold text-primary-600">₹{parseFloat(sale.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Payment:</span>
                      <span className="capitalize">{sale.payment_method || 'Cash'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Selection */}
        <div className="lg:col-span-2">
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </motion.div>

          {/* Products Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {products.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.image_url && (
                            <img className="w-10 h-10 rounded-lg mr-3 object-cover" src={`http://localhost:5000${product.image_url}`} alt={product.name} />
                          )}
                          <div>
                            <div className="font-medium text-slate-900">{product.name}</div>
                            <div className="text-xs text-slate-500">{product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {product.stock_quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        ₹{product.selling_price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => addToCart(product)}
                          className="btn btn-primary text-sm py-2"
                        >
                          Add
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {products.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No products match your search' : 'No products available'}
              </div>
            )}
          </motion.div>
        </div>

        {/* Cart Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="card sticky top-6 p-6">
            <h2 className="text-xl font-display font-bold text-slate-900 mb-4">Shopping Cart</h2>

            {cart.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Cart is empty</p>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto border-b border-slate-200 pb-6">
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                        <p className="text-xs text-slate-600">₹{item.selling_price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          <Minus className="w-4 h-4 text-slate-600" />
                        </motion.button>
                        <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          <Plus className="w-4 h-4 text-slate-600" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 hover:bg-red-100 rounded ml-2"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Cart Summary */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-medium">₹{cartSubtotal.toFixed(2)}</span>
                  </div>

                  {/* Discount */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount {appliedDiscount && `(${appliedDiscount})`}:</span>
                      <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Discount Code Input */}
                  {discountAmount === 0 && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Discount code"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="input text-sm"
                      />
                      <button
                        onClick={applyDiscountCode}
                        className="btn btn-sm btn-secondary"
                      >
                        <Ticket className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tax (18%):</span>
                    <span className="font-medium">₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                    <span>Total:</span>
                    <span className="text-primary-600">₹{grandTotal.toFixed(2)}</span>
                  </div>

                  {/* Payment Method */}
                  <div className="mt-4">
                    <label className="label text-sm">Payment Method</label>
                    <select
                      className="input text-sm"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="wallet">Wallet</option>
                    </select>
                  </div>
                </div>

                {/* Checkout Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Complete Billing
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Billing