import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  ShoppingCart,
  Package,
  X,
  TrendingUp
} from 'lucide-react'
import { ModernCard } from '../components/ModernDashboardLayout'
import { useToast } from '../components/Toast'
import api from '../api/axios'
import { getShopDetails } from '../api/shopService'
import { API_URL } from '../config'

function ModernBilling() {
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
  const [shopDetails, setShopDetails] = useState(null)

  const [invoiceForm, setInvoiceForm] = useState({
    billToName: '',
    billToPhone: '',
    billToEmail: '',
    notes: 'Thank you for your business.'
  })

  useEffect(() => {
    fetchProducts()
    fetchShopProfile()
  }, [])

  const generateTransactionId = () => `BILL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  const fetchShopProfile = async () => {
    try {
      const details = await getShopDetails()
      if (details) {
        setShopDetails({
          ...details,
          owner_name: localStorage.getItem('companyProfileOwnerName') || '',
          logo_url: localStorage.getItem('companyProfileLogoData') || details.logo_url || ''
        })
      }
    } catch (error) {
      console.error('Error loading shop profile:', error)
    }
  }

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setProducts(allProducts.filter(p => p.stock_quantity > 0))
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
      const response = await api.get('/products', { params: { page: 1, limit: 500 } })
      const allProds = response.data.products || []
      setAllProducts(allProds)
      setProducts(allProds.filter(p => p.stock_quantity > 0))
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        updateQuantity(product.id, existingItem.quantity + 1)
      } else {
        toast.warning('Maximum stock reached')
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
      toast.success(`${product.name} added to cart`)
    }
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    const product = products.find(p => p.id === productId)
    if (newQuantity > product.stock_quantity) {
      toast.warning(`Only ${product.stock_quantity} available in stock`)
      return
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ))
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const cartSubtotal = useMemo(() =>
    cart.reduce((total, item) => total + (parseFloat(item.selling_price) * item.quantity), 0),
    [cart]
  )

  const applyDiscountCode = () => {
    if (!discountCode.trim()) return

    const codes = {
      'SAVE10': 10,
      'SAVE20': 20,
      'FLAT50': 50,
      'WELCOME': 15
    }

    const code = discountCode.toUpperCase().trim()
    if (codes[code]) {
      if (codes[code] <= 100) {
        setDiscountAmount(cartSubtotal * (codes[code] / 100))
      } else {
        setDiscountAmount(codes[code])
      }
      setAppliedDiscount(code)
      toast.success(`Discount applied: ${codes[code]}${codes[code] <= 100 ? '%' : '₹'} off`)
    } else {
      toast.error('Invalid discount code')
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

  const updateInvoiceForm = (key, value) => {
    setInvoiceForm(prev => ({ ...prev, [key]: value }))
  }

  const fetchTransactions = async () => {
    try {
      setHistoryLoading(true)
      const response = await api.get('/sales', { params: { limit: 50, grouped: true } })
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
    if (cart.length === 0) {
      toast.warning('Cart is empty')
      return
    }

    try {
      const transactionId = generateTransactionId()

      for (const item of cart) {
        await api.post('/sales', {
          product_id: item.id,
          quantity: item.quantity,
          payment_method: paymentMethod,
          transaction_id: transactionId
        })
      }

      await fetchProducts()

      const transaction = {
        id: transactionId,
        invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        notes: invoiceForm.notes,
        items: cart,
        subtotal: amountAfterDiscount,
        discount: discountAmount,
        tax: tax,
        total: grandTotal,
        paymentMethod: paymentMethod,
        discountCode: appliedDiscount,
        billTo: {
          name: invoiceForm.billToName || 'Walk-in Customer',
          phone: invoiceForm.billToPhone,
          email: invoiceForm.billToEmail
        }
      }

      setLastTransaction(transaction)
      setCart([])
      setShowReceipt(true)

      setDiscountCode('')
      setDiscountAmount(0)
      setAppliedDiscount(null)

      setTimeout(() => setShowReceipt(false), 10000)
    } catch (error) {
      console.error('Checkout failed:', error)
      toast.error('Error processing sale. Please try again.')
    }
  }

  const handlePrintReceipt = () => {
    if (!lastTransaction) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const itemRows = lastTransaction.items.map((item) => {
      const baseAmount = parseFloat(item.selling_price) * item.quantity
      const gstAmount = baseAmount * 0.18
      return `
        <tr>
          <td>${item.name}</td>
          <td>${item.category || item.brand || 'Product item'}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">₹${parseFloat(item.selling_price).toFixed(2)}</td>
          <td class="num">₹${gstAmount.toFixed(2)}</td>
          <td class="num total-cell">₹${(baseAmount + gstAmount).toFixed(2)}</td>
        </tr>
      `
    }).join('')

    const billToLines = [
      lastTransaction.billTo?.name || 'Walk-in Customer',
      lastTransaction.billTo?.phone || '',
      lastTransaction.billTo?.email || ''
    ].filter(Boolean).join('<br/>')

    const companyName = shopDetails?.name || 'Your Company'
    const ownerName = shopDetails?.owner_name || localStorage.getItem('companyProfileOwnerName') || ''
    const companyPhone = shopDetails?.contact_number || 'N/A'
    const companyEmail = shopDetails?.email || 'N/A'
    const companyWebsite = shopDetails?.website || ''
    const companyGst = shopDetails?.gst_number || 'N/A'
    const logoHtml = shopDetails?.logo_url
      ? `<img src="${shopDetails.logo_url}" alt="Company Logo" style="width:100%;height:100%;object-fit:contain;"/>`
      : '<span style="font-size:12px;color:#94a3b8;">Logo</span>'

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${lastTransaction.invoiceNumber}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Roboto, Inter, Arial, sans-serif; background: #fff; color: #0f172a; }
            .invoice-a4 {
              width: 210mm;
              min-height: 276mm;
              background: #fff;
              border: 1px solid #dbe3ee;
              margin: 0 auto;
              padding: 18mm 14mm;
            }
            .header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 16px; border-bottom: 1px solid #dbe3ee; }
            .logo-box { width: 70px; height: 70px; border: 1px solid #dbe3ee; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #f8fafc; }
            .company-name { margin: 0; font-size: 22px; font-weight: 700; }
            .company-line { margin: 4px 0 0; font-size: 12px; color: #475569; }
            .invoice-title { margin: 0; font-size: 38px; font-weight: 700; letter-spacing: -0.5px; }
            .blocks { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; margin-bottom: 18px; }
            .block { border: 1px solid #dbe3ee; border-radius: 8px; padding: 12px; }
            .label { margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; }
            .text { margin: 0; font-size: 14px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #dbe3ee; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 11px; font-size: 12px; }
            th { text-align: left; background: #f8fafc; font-weight: 700; }
            .num { text-align: right; }
            .total-cell { font-weight: 700; color: #111827; }
            .footer-grid { display: grid; grid-template-columns: 1fr 320px; gap: 22px; margin-top: 18px; }
            .note-box { border: 1px solid #dbe3ee; border-radius: 8px; padding: 12px; min-height: 110px; }
            .totals-box { border: 1px solid #dbe3ee; border-radius: 8px; padding: 12px; }
            .row { display: flex; justify-content: space-between; margin: 7px 0; font-size: 13px; }
            .grand { margin-top: 10px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 20px; font-weight: 700; }
            @media print {
              body { margin: 0; }
              .invoice-a4 { border: none; padding: 0; min-height: auto; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-a4">
            <div class="header">
              <div style="display:flex;gap:14px;">
                <div class="logo-box">${logoHtml}</div>
                <div>
                  <p class="company-name">${companyName}</p>
                  ${ownerName ? `<p class="company-line">Owner: ${ownerName}</p>` : ''}
                  <p class="company-line">Phone: ${companyPhone} | Email: ${companyEmail}</p>
                  ${companyWebsite ? `<p class="company-line">Website: ${companyWebsite}</p>` : ''}
                  <p class="company-line">GSTIN: ${companyGst}</p>
                </div>
              </div>
              <h1 class="invoice-title">Invoice</h1>
            </div>

            <div class="blocks">
              <div class="block">
                <p class="label">Bill To</p>
                <p class="text">${billToLines}</p>
              </div>
              <div class="block">
                <p class="label">Invoice Details</p>
                <p class="text">Invoice No: ${lastTransaction.invoiceNumber}<br/>Date: ${new Date(lastTransaction.date).toLocaleDateString()}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Product/Service</th>
                  <th>Description</th>
                  <th class="num">Quantity/hrs</th>
                  <th class="num">Rate</th>
                  <th class="num">GST</th>
                  <th class="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>

            <div class="footer-grid">
              <div class="note-box">
                <p class="label">Customer Message / Notes</p>
                <p class="text">${lastTransaction.notes || 'Thank you for shopping with us.'}</p>
              </div>
              <div class="totals-box">
                <div class="row"><span>Subtotal</span><strong>₹${lastTransaction.subtotal.toFixed(2)}</strong></div>
                <div class="row"><span>GST Total</span><strong>₹${lastTransaction.tax.toFixed(2)}</strong></div>
                <div class="row grand"><span>Grand Total</span><span>₹${lastTransaction.total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-primary-900/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Loading Point of Sale...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Point of Sale</h1>
              <p className="text-gray-600 dark:text-slate-400 text-sm">Quick and efficient checkout</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowTransactionHistory(true); fetchTransactions() }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-dark-card border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm font-medium text-gray-700 dark:text-slate-200"
          >
            <Clock className="w-4 h-4" />
            <span>History</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-dark-card border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm font-medium text-gray-700 dark:text-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400 dark:text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="🔍 Search products by name, SKU, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-dark-card border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300" />
              </button>
            )}
          </motion.div>

          {/* Products Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ModernCard padding="none" className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 dark:from-slate-800/60 to-primary-50/30 dark:to-primary-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">Available Products</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{products.length} items in stock</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-sm text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)} in cart
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    {products.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-slate-700/60 hover:bg-gradient-to-r hover:from-primary-50/30 dark:hover:from-primary-950/20 hover:to-accent-50/30 dark:hover:to-accent-950/10 transition-all cursor-pointer group"
                        onClick={() => addToCart(product)}
                      >
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-50 dark:from-slate-800 to-gray-100 dark:to-slate-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200 dark:border-slate-600 group-hover:border-primary-200 dark:group-hover:border-primary-700 transition-colors">
                          {product.image_url ? (
                            <img
                              src={`${API_URL}${product.image_url}`}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                            />
                          ) : null}
                          {!product.image_url && (
                            <Package className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-slate-100 text-sm truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">SKU: {product.sku}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                              ₹{parseFloat(product.selling_price).toFixed(2)}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${product.stock_quantity > 20
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : product.stock_quantity > 5
                                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                              {product.stock_quantity} in stock
                            </span>
                          </div>
                        </div>

                        {/* Add Button */}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-600 rounded-xl flex items-center justify-center text-white shadow-lg hover:shadow-glow transition-shadow"
                        >
                          <Plus className="w-5 h-5" />
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium">No products found</p>
                    <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                      {searchTerm ? 'Try a different search term' : 'Add products to get started'}
                    </p>
                  </div>
                )}
              </div>
            </ModernCard>
          </motion.div>
        </div>

        {/* Cart Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <ModernCard className="sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Current Order</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </p>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 dark:from-slate-800 to-gray-50 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                </div>
                <p className="text-gray-500 dark:text-slate-400 font-medium">Your cart is empty</p>
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Click on products to add them</p>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-3 mb-6 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                  {cart.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 dark:from-slate-800/60 to-gray-50/50 dark:to-slate-800/30 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-primary-100 dark:hover:border-primary-800 transition-all group"
                    >
                      <img
                        src={item.image_url ? `${API_URL}${item.image_url}` : undefined}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-slate-100 text-sm truncate">{item.name}</h4>
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-0.5">
                          ₹{parseFloat(item.selling_price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 p-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-sm text-gray-900 dark:text-slate-100">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded text-green-600 dark:text-green-400 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 dark:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Pricing Summary */}
                <div className="space-y-4 border-t border-gray-200 dark:border-slate-700 pt-6">
                  <div className="bg-gradient-to-r from-primary-50 dark:from-primary-950/30 to-accent-50 dark:to-accent-950/20 rounded-xl p-4 border border-primary-100 dark:border-primary-800/50">
                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 text-sm">Order Summary</h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-slate-400">Subtotal</span>
                        <span className="font-medium text-gray-900 dark:text-slate-100">₹{cartSubtotal.toFixed(2)}</span>
                      </div>

                      {discountAmount > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-between text-sm text-green-600 dark:text-green-400"
                        >
                          <span>Discount {appliedDiscount && `(${appliedDiscount})`}</span>
                          <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
                        </motion.div>
                      )}

                      {discountAmount === 0 && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Code"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={applyDiscountCode}
                            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            <Ticket className="w-4 h-4" />
                          </motion.button>
                        </div>
                      )}

                      <div className="flex justify-between text-sm text-gray-600 dark:text-slate-400">
                        <span>Tax (18% GST)</span>
                        <span className="font-medium">₹{tax.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-primary-100 dark:border-primary-800/50">
                        <span className="text-gray-900 dark:text-slate-100">Total</span>
                        <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                          ₹{grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl p-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Invoice Details</p>
                    <input
                      type="text"
                      placeholder="Bill To Name"
                      value={invoiceForm.billToName}
                      onChange={(e) => updateInvoiceForm('billToName', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Bill To Phone"
                      value={invoiceForm.billToPhone}
                      onChange={(e) => updateInvoiceForm('billToPhone', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="email"
                      placeholder="Bill To Email"
                      value={invoiceForm.billToEmail}
                      onChange={(e) => updateInvoiceForm('billToEmail', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <textarea
                      placeholder="Customer note"
                      rows={2}
                      value={invoiceForm.notes}
                      onChange={(e) => updateInvoiceForm('notes', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['cash', 'card', 'upi', 'wallet'].map((method) => (
                        <motion.button
                          key={method}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setPaymentMethod(method)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${paymentMethod === method
                              ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                              : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                        >
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    className="w-full py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Complete Sale</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </motion.button>
                </div>
              </>
            )}
          </ModernCard>
        </motion.div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && lastTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-6xl w-full overflow-hidden border border-gray-200 dark:border-slate-700"
            >
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between no-print bg-gray-50 dark:bg-slate-800/60">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Invoice Preview</h2>
                  <p className="text-sm text-gray-600 dark:text-slate-400">A4 print layout with company profile data</p>
                </div>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Invoice preview area — kept with white/light bg since this is a print preview */}
              <div className="max-h-[80vh] overflow-auto bg-gray-100 dark:bg-slate-900/50 p-6">
                <div id="invoice-print-root" className="invoice-a4 mx-auto bg-white border border-slate-200 shadow-sm" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Roboto, Inter, Arial, sans-serif' }}>
                  <div className="p-8">
                    <div className="flex justify-between items-start gap-8 pb-6 border-b border-slate-200">
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
                          {shopDetails?.logo_url ? (
                            <img src={shopDetails.logo_url} alt="Company logo" className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-xs text-slate-400">Logo</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{shopDetails?.name || 'Your Company'}</h3>
                          <p className="text-sm text-slate-600">Owner: {shopDetails?.owner_name || localStorage.getItem('companyProfileOwnerName') || 'Not Provided'}</p>
                          <p className="text-sm text-slate-600">Phone: {shopDetails?.contact_number || 'N/A'} | Email: {shopDetails?.email || 'N/A'}</p>
                          {shopDetails?.website && <p className="text-sm text-slate-600">Website: {shopDetails.website}</p>}
                          <p className="text-sm text-slate-600">GSTIN: {shopDetails?.gst_number || 'N/A'}</p>
                        </div>
                      </div>
                      <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Invoice</h1>
                    </div>

                    <div className="grid grid-cols-2 gap-5 mt-6 mb-6 text-sm">
                      <div className="border border-slate-200 rounded-lg p-4">
                        <p className="uppercase text-[11px] tracking-wide font-semibold text-slate-500 mb-2">Bill To</p>
                        <p className="font-semibold text-slate-900">{lastTransaction.billTo?.name || 'Walk-in Customer'}</p>
                        {lastTransaction.billTo?.phone && <p className="text-slate-600">{lastTransaction.billTo.phone}</p>}
                        {lastTransaction.billTo?.email && <p className="text-slate-600">{lastTransaction.billTo.email}</p>}
                      </div>

                      <div className="border border-slate-200 rounded-lg p-4">
                        <p className="uppercase text-[11px] tracking-wide font-semibold text-slate-500 mb-2">Invoice Details</p>
                        <p className="text-slate-700">Invoice No: <span className="font-semibold text-slate-900">{lastTransaction.invoiceNumber}</span></p>
                        <p className="text-slate-700">Date: <span className="font-semibold text-slate-900">{new Date(lastTransaction.date).toLocaleDateString()}</span></p>
                      </div>
                    </div>

                    <table className="w-full border border-slate-200 text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="py-2.5 px-3 text-left">Product/Service</th>
                          <th className="py-2.5 px-3 text-left">Description</th>
                          <th className="py-2.5 px-3 text-right">Quantity/hrs</th>
                          <th className="py-2.5 px-3 text-right">Rate</th>
                          <th className="py-2.5 px-3 text-right">GST</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastTransaction.items.map((item) => {
                          const baseAmount = parseFloat(item.selling_price) * item.quantity
                          const gstAmount = baseAmount * 0.18
                          return (
                            <tr key={item.id} className="border-b border-slate-100">
                              <td className="py-2.5 px-3 text-slate-900 font-medium">{item.name}</td>
                              <td className="py-2.5 px-3 text-slate-600">{item.category || item.brand || 'Product item'}</td>
                              <td className="py-2.5 px-3 text-right text-slate-700">{item.quantity}</td>
                              <td className="py-2.5 px-3 text-right text-slate-700">₹{parseFloat(item.selling_price).toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-right text-slate-700">₹{gstAmount.toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-right font-semibold text-slate-900">₹{(baseAmount + gstAmount).toFixed(2)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    <div className="grid grid-cols-2 gap-8 mt-6">
                      <div className="border border-slate-200 rounded-lg p-4">
                        <p className="uppercase text-[11px] tracking-wide font-semibold text-slate-500 mb-2">Customer Message / Notes</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{lastTransaction.notes || 'Thank you for shopping with us.'}</p>
                      </div>

                      <div className="border border-slate-200 rounded-lg p-4">
                        <div className="flex justify-between py-1.5 text-sm">
                          <span className="text-slate-600">Subtotal</span>
                          <span className="font-semibold text-slate-900">₹{lastTransaction.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 text-sm">
                          <span className="text-slate-600">GST Total</span>
                          <span className="font-semibold text-slate-900">₹{lastTransaction.tax.toFixed(2)}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-300 flex justify-between items-center">
                          <span className="text-base font-bold text-slate-900">Grand Total</span>
                          <span className="text-xl font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1">₹{lastTransaction.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-3 no-print">
                  <button
                    onClick={() => setShowReceipt(false)}
                    className="px-6 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-600"
                  >
                    Close
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePrintReceipt}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-medium shadow-lg flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print Invoice
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction History Modal */}
      <AnimatePresence>
        {showTransactionHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-slate-700"
            >
              <div className="p-6 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50 dark:from-slate-800/60 to-primary-50/30 dark:to-primary-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Recent Transactions</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Complete sales history</p>
                  </div>
                  <button
                    onClick={() => setShowTransactionHistory(false)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {historyLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-gray-500 dark:text-slate-400">Loading transactions...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium">No transactions yet</p>
                    <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Complete your first sale to see history</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((sale, idx) => (
                      <motion.div
                        key={sale.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 bg-gradient-to-r from-gray-50 dark:from-slate-800/60 to-gray-50/50 dark:to-slate-800/30 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-primary-100 dark:hover:border-primary-800 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-slate-100">{sale.product_name}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-slate-400">
                              <span>{new Date(sale.sale_date).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>Qty: {sale.quantity}</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 capitalize">
                                {sale.payment_method || 'Cash'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                              ₹{parseFloat(sale.total_amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Sale #{sale.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ModernBilling
