import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Filter, Grid, List, Eye, Edit2, Trash2,
  Package, AlertTriangle, Check, X, Upload, Download
} from 'lucide-react'
import {
  PremiumButton, PremiumCard, PremiumInput, PremiumBadge,
  CardSkeleton, containerVariants, itemVariants
} from '../components/Premium'
import { useToast } from '../components/Toast'
import { getProducts, deleteProduct } from '../api/productService'
import { API_URL } from '../config'

function PremiumProducts() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchProducts()
  }, [page])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await getProducts(page)
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'in_stock' && product.stock_quantity > 0) ||
      (filterStatus === 'low_stock' && product.stock_quantity > 0 && product.stock_quantity <= 10) ||
      (filterStatus === 'out_of_stock' && product.stock_quantity === 0)
    
    return matchesSearch && matchesFilter
  })

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id)
        fetchProducts()
        toast.success('Product deleted successfully')
      } catch (error) {
        toast.error('Failed to delete product')
      }
    }
  }

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'red', icon: X }
    if (quantity <= 10) return { label: 'Low Stock', color: 'amber', icon: AlertTriangle }
    return { label: 'In Stock', color: 'green', icon: Check }
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
                Products
              </h1>
              <p className="text-slate-400">Manage your inventory efficiently</p>
            </div>
            <div className="flex gap-3">
              <PremiumButton
                variant="secondary"
                size="md"
                startIcon={<Upload className="w-4 h-4" />}
              >
                Import
              </PremiumButton>
              <PremiumButton
                variant="primary"
                size="md"
                startIcon={<Plus className="w-4 h-4" />}
              >
                Add Product
              </PremiumButton>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <PremiumInput
                placeholder="Search products by name or category..."
                startIcon={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-100 border border-slate-600 hover:border-indigo-400 focus:border-indigo-400 transition-colors"
            >
              <option value="all">All Products</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-indigo-500/20 text-slate-100 transition-colors"
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Grid View */}
        <AnimatePresence mode="wait">
          {!loading && viewMode === 'grid' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => {
                  const stockStatus = getStockStatus(product.stock_quantity)
                  return (
                    <motion.div
                      key={product.id}
                      variants={itemVariants}
                      layout
                      className="group"
                    >
                      <PremiumCard
                        variant="glass"
                        glow={stockStatus.color}
                        className="h-full flex flex-col"
                      >
                        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/20 to-purple-500/20 h-48">
                          {product.image_url ? (
                            <img
                              src={`${API_URL}${product.image_url}`}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-16 h-16 text-slate-400/50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </motion.button>
                          </div>
                        </div>

                        <div className="flex-1 p-6 flex flex-col">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-slate-100 mb-1 line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-sm text-slate-400">{product.category}</p>
                          </div>

                          <div className="space-y-3 mb-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-400">Price</span>
                              <span className="text-lg font-bold text-indigo-300">
                                ${Number(product.selling_price).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-400">Stock</span>
                              <span className="text-lg font-bold text-slate-100">
                                {product.stock_quantity} units
                              </span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <PremiumBadge
                              color={stockStatus.color}
                              icon={stockStatus.icon}
                            >
                              {stockStatus.label}
                            </PremiumBadge>
                          </div>

                          <div className="flex gap-2 mt-auto">
                            <button
                              className="flex-1 px-3 py-2 bg-slate-700 hover:bg-indigo-500/20 text-slate-100 rounded-lg transition-colors text-sm font-medium"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </PremiumCard>
                    </motion.div>
                  )
                })
              ) : (
                <motion.div
                  variants={itemVariants}
                  className="col-span-full"
                >
                  <PremiumCard variant="subtle" className="py-16 text-center">
                    <Package className="w-16 h-16 text-slate-400/50 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No products found</p>
                    <p className="text-slate-500 text-sm mt-1">
                      Try adjusting your search or filters
                    </p>
                  </PremiumCard>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* List View */}
          {!loading && viewMode === 'list' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-4"
            >
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock_quantity)
                  return (
                    <motion.div
                      key={product.id}
                      variants={itemVariants}
                      layout
                    >
                      <PremiumCard variant="glass" glow={stockStatus.color}>
                        <div className="p-6 flex items-center gap-6">
                          <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                            {product.image_url ? (
                              <img
                                src={`${API_URL}${product.image_url}`}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="w-8 h-8 text-slate-400/50" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-slate-100 mb-1">
                              {product.name}
                            </h3>
                            <p className="text-sm text-slate-400 mb-3">
                              {product.category} • Brand: {product.brand}
                            </p>
                            <PremiumBadge color={stockStatus.color} icon={stockStatus.icon}>
                              {stockStatus.label}
                            </PremiumBadge>
                          </div>

                          <div className="text-right hidden sm:block">
                            <p className="text-sm text-slate-400 mb-1">Price</p>
                            <p className="text-2xl font-bold text-indigo-300 mb-3">
                              ${Number(product.selling_price).toFixed(2)}
                            </p>
                            <p className="text-sm text-slate-400">
                              {product.stock_quantity} in stock
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button className="p-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </PremiumCard>
                    </motion.div>
                  )
                })
              ) : (
                <PremiumCard variant="subtle" className="py-16 text-center">
                  <Package className="w-16 h-16 text-slate-400/50 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No products found</p>
                </PremiumCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default PremiumProducts
