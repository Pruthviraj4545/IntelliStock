import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, AlertCircle, Upload, Download, AlertTriangle,
  RefreshCw, Package, SlidersHorizontal, Grid, List, Eye, Edit, Trash2, Check, Zap, X
} from 'lucide-react'
import { Table } from '../components/Table'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { getProducts, createProduct, updateProduct, deleteProduct, filterProducts, uploadProductsCSV, getProductMetadata } from '../api/productService'
import { ModernAdvancedFilter } from '../components/ModernAdvancedFilter'
import ModernProductCard from '../components/ModernProductCard'
import { ProductCardGridSkeleton } from '../components/ProductCardSkeleton'
import { API_URL } from '../config'

function Products() {
  const toast = useToast()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    cost_price: '',
    selling_price: '',
    stock_quantity: '',
    expiry_date: ''
  })

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const [searchFilters, setSearchFilters] = useState({
    query: '',
    categories: [],
    brands: [],
    minPrice: '',
    maxPrice: '',
    stockStatus: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  // View mode: 'cards' (default) or 'table'
  const [viewMode, setViewMode] = useState('cards')

  // Image upload state
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [existingImage, setExistingImage] = useState('')
  const [deleteImage, setDeleteImage] = useState(false)

  // CSV Upload state
  const [showCSVUpload, setShowCSVUpload] = useState(false)
  const [csvFile, setCsvFile] = useState(null)
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvResult, setCsvResult] = useState(null)
  const [csvError, setCsvError] = useState(null)

  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)

  // Bulk operations state
  const [selectedProducts, setSelectedProducts] = useState(new Set())

  // Cache for all categories and brands (never cleared, only added to)
  const [allCategories, setAllCategories] = useState([])
  const [allBrands, setAllBrands] = useState([])

  // Error debouncing - prevent multiple toasts
  const [lastErrorTime, setLastErrorTime] = useState(0)
  const [lastErrorMessage, setLastErrorMessage] = useState('')

  const handleErrorToast = (message) => {
    const now = Date.now()
    // Only show error if it's different or 2+ seconds have passed
    if (message !== lastErrorMessage || (now - lastErrorTime) > 2000) {
      toast.error(message)
      setLastErrorTime(now)
      setLastErrorMessage(message)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [page])

  // Fetch distinct categories and brands once on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const data = await getProductMetadata()
        if (data.success) {
          setAllCategories(data.categories || [])
          setAllBrands(data.brands || [])
        }
      } catch (err) {
        console.error('Failed to fetch metadata:', err)
        // Fallback: will be populated from products if needed
      }
    }
    fetchMetadata()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching products for page:', page)
      const data = await getProducts(page, 10)
      console.log('Products response:', data)
      const prods = data.products || []
      setProducts(prods)
      setTotalPages(Math.ceil((data.total || 0) / 10))
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err.message || 'Failed to load products')
      handleErrorToast('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchApply = async (filtersToApply = null) => {
    try {
      setLoading(true)
      // Use provided filters or current state
      const filtersToUse = filtersToApply || searchFilters
      
      console.log('[FILTER] Applying filters:', filtersToUse)
      
      const data = await filterProducts(filtersToUse)
      
      console.log('[FILTER] Response:', data)
      
      if (!data) {
        handleErrorToast('No response from server')
        return
      }

      const prods = data.products || []
      setProducts(prods)
      setTotalPages(Math.ceil((data.total || 0) / (data.limit || 10)))
      setPage(1)
      
      // Update searchFilters if different
      if (filtersToApply) {
        setSearchFilters(filtersToApply)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Search failed'
      handleErrorToast(errorMsg)
      console.error('[FILTER ERROR]', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        category: product.category || '',
        brand: product.brand || '',
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        stock_quantity: product.stock_quantity,
        expiry_date: product.expiry_date || ''
      })
      setExistingImage(product.image_url || '')
      setImagePreview('')
      setImageFile(null)
      setDeleteImage(false)
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        category: '',
        brand: '',
        cost_price: '',
        selling_price: '',
        stock_quantity: '',
        expiry_date: ''
      })
      setExistingImage('')
      setImagePreview('')
      setImageFile(null)
      setDeleteImage(false)
    }
    setShowModal(true)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }
      setImageFile(file)
      setDeleteImage(false)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    setDeleteImage(true)
    if (editingProduct?.image_url) {
      setExistingImage(editingProduct.image_url)
    }
  }

  const handleSaveProduct = async () => {
    try {
      if (!formData.name || !formData.cost_price || !formData.selling_price || !formData.stock_quantity) {
        toast.error('Please fill all required fields')
        return
      }

      setLoading(true)

      // Prepare data with image if exists
      const submitData = new FormData()
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key])
        }
      })

      if (imageFile) {
        submitData.append('image', imageFile)
      }

      if (deleteImage) {
        submitData.append('delete_existing_image', 'true')
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, submitData)
        toast.success('Product updated successfully')
      } else {
        await createProduct(submitData)
        toast.success('Product added successfully')
      }

      setShowModal(false)
      resetForm()
      fetchProducts()
    } catch (err) {
      toast.error(editingProduct ? 'Failed to update product' : 'Failed to add product')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      brand: '',
      cost_price: '',
      selling_price: '',
      stock_quantity: '',
      expiry_date: ''
    })
    setImageFile(null)
    setImagePreview('')
    setExistingImage('')
    setDeleteImage(false)
  }

  const handleDeleteProduct = async (id) => {
    try {
      setLoading(true)
      await deleteProduct(id)
      toast.success('Product deleted successfully')
      setShowDeleteConfirm(false)
      setDeleteId(null)
      fetchProducts()
    } catch (err) {
      toast.error('Failed to delete product')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Bulk operations handlers
  const toggleSelectProduct = (id) => {
    const newSelection = new Set(selectedProducts)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedProducts(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedProducts.size} products? This cannot be undone.`)) return

    try {
      setLoading(true)
      const deletePromises = Array.from(selectedProducts).map(id => deleteProduct(id).catch(err => ({ error: err, id })))
      const results = await Promise.all(deletePromises)

      const successful = results.filter(r => !r.error).length
      const failed = results.filter(r => r.error).length

      if (failed === 0) {
        toast.success(`${successful} products deleted successfully`)
      } else if (successful === 0) {
        toast.error(`All ${failed} deletions failed`)
      } else {
        toast.success(`${successful} deleted, ${failed} failed`)
      }

      setSelectedProducts(new Set())
      fetchProducts()
    } catch (err) {
      toast.error('Bulk delete encountered an error')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCSVFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setCsvError('Please select a valid CSV file')
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setCsvError('File size must be less than 5MB')
        return
      }
      setCsvFile(file)
      setCsvError(null)
    }
  }

  const handleCSVUpload = async () => {
    if (!csvFile) {
      setCsvError('Please select a file first')
      return
    }

    const formData = new FormData()
    formData.append('csvFile', csvFile)

    try {
      setCsvLoading(true)
      setCsvError(null)
      const result = await uploadProductsCSV(formData)
      setCsvResult(result)
      setCsvFile(null)
      toast.success(`Successfully processed CSV: ${result.inserted} products inserted`)
      
      // Small delay to ensure database transaction is complete
      setTimeout(() => {
        setPage(1) // Reset to page 1 to see new products
        fetchProducts()
      }, 500)
    } catch (err) {
      setCsvError(err.response?.data?.message || 'Failed to upload CSV')
      toast.error('CSV upload failed')
      console.error(err)
    } finally {
      setCsvLoading(false)
    }
  }

  const downloadCSVTemplate = () => {
    // Detailed template matching the data structure including SKU
    const header = 'name,sku,category,cost_price,selling_price,stock_quantity,brand,expiry_date\n'
    const example = 'Sample Product,SKU123,Electronics,100.00,149.99,50,Sony,\n'
    const csv = header + example
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'products_template.csv'
    link.click()
  }

  // Compute unique categories and brands for filter
  // Compute current view categories and brands, but fall back to cached values
  const uniqueCategories = allCategories.length > 0 ? allCategories : [...new Set(products.map(p => p.category).filter(Boolean))]
  const uniqueBrands = allBrands.length > 0 ? allBrands : [...new Set(products.map(p => p.brand).filter(Boolean))]

  // Table columns definition (for table view)
  const productColumns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedProducts.size === products.length && products.length > 0}
          onChange={toggleSelectAll}
          className="w-4 h-4 cursor-pointer"
        />
      ),
      render: (value, row) => (
        <input
          type="checkbox"
          checked={selectedProducts.has(row.id)}
          onChange={() => toggleSelectProduct(row.id)}
          className="w-4 h-4 cursor-pointer"
        />
      ),
      style: { width: '50px' }
    },
    {
      key: 'image_url',
      label: 'Image',
      render: (value) => {
        const imageUrl = value && value.startsWith('http')
          ? value
          : value
            ? `${API_URL}${value}`
            : null
        return (
          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Package className="w-6 h-6 text-gray-400" />
            )}
          </div>
        )
      }
    },
    { key: 'name', label: 'Product Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'sku', label: 'SKU' },
    { key: 'brand', label: 'Brand' },
    {
      key: 'cost_price',
      label: 'Cost',
      render: (value) => `$${parseFloat(value).toFixed(2)}`
    },
    {
      key: 'selling_price',
      label: 'Price',
      render: (value) => `$${parseFloat(value).toFixed(2)}`
    },
    {
      key: 'stock_quantity',
      label: 'Stock',
      render: (value) => (
        <span className={`badge ${value > 50 ? 'badge-success' : value > 10 ? 'badge-warning' : 'badge-danger'}`}>
          {value} units
        </span>
      )
    },
    { key: 'expiry_date', label: 'Expires' }
  ]

  // Handlers wrapped in useCallback for performance
  const handleEdit = useCallback((product) => {
    handleOpenModal(product)
  }, [])

  const handleDelete = useCallback((product) => {
    setDeleteId(product.id)
    setShowDeleteConfirm(true)
  }, [])

  const handleViewDetails = useCallback((product) => {
    // Could open a modal or navigate to details page
    alert(`Product Details:\n\nName: ${product.name}\nSKU: ${product.sku}\nCategory: ${product.category}\nBrand: ${product.brand}\nPrice: $${product.selling_price}\nStock: ${product.stock_quantity}\nExpiry: ${product.expiry_date || 'N/A'}`)
  }, [])

  // Debug: Log component mount
  console.log('[PRODUCTS PAGE] Rendering with loading:', loading, 'products:', products.length, 'error:', error)

  return (
    <>
      <div className="space-y-6 p-6 lg:p-8 min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-4xl font-display font-bold text-slate-900 flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-glow-primary">
                <Package className="w-6 h-6" />
              </div>
              Products Management
            </h1>
            <p className="text-slate-600">Manage your inventory with real-time updates</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setPage(1)
                fetchProducts()
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all font-medium"
              title="Refresh products list"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </motion.button>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCSVUpload(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-100 text-primary-700 hover:bg-primary-200 transition-all font-medium"
              >
                <Upload className="w-4 h-4" /> Bulk Upload
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:shadow-lg transition-all font-medium"
            >
              <Plus className="w-4 h-4" /> Add Product
            </motion.button>
          </div>
        </motion.div>

        {/* Search Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-900 flex gap-2 items-center">
            <Search className="w-5 h-5" /> Search & Filter
          </h2>

          {/* Simple search */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search products..."
              className="input"
              value={searchFilters.query}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, query: e.target.value }))}
            />
            <input
              type="number"
              placeholder="Min Price"
              className="input"
              value={searchFilters.minPrice}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, minPrice: e.target.value }))}
            />
            <input
              type="number"
              placeholder="Max Price"
              className="input"
              value={searchFilters.maxPrice}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
            />
            <select
              className="input"
              value={searchFilters.stockStatus}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, stockStatus: e.target.value }))}
            >
              <option value="">All Stock Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>

          <div className="flex gap-2 justify-between">
            <button
              onClick={() => setShowAdvancedFilter(true)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" /> Advanced Filters
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSearchFilters({
                    query: '',
                    categories: [],
                    brands: [],
                    minPrice: '',
                    maxPrice: '',
                    stockStatus: '',
                    dateFrom: '',
                    dateTo: '',
                    sortBy: 'created_at',
                    sortOrder: 'desc'
                  })
                  setPage(1)
                  setSelectedProducts(new Set())
                  fetchProducts()
                }}
                className="btn btn-secondary"
              >
                Clear All
              </button>
              <button
                onClick={handleSearchApply}
                className="btn btn-primary"
                disabled={loading}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </motion.div>

        {/* Products Card Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 relative"
        >
          {/* View Mode Toggle & Results Count */}
          <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-slate-600">
              {products.length > 0 ? (
                <>Showing <span className="font-semibold text-slate-900">{products.length}</span> products</>
              ) : (
                'No products found'
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="Card View"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="Table View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedProducts.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-600 to-accent-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50"
            >
              <span className="font-medium">{selectedProducts.size} selected</span>
              <button
                onClick={handleBulkDelete}
                className="text-red-200 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors"
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button
                onClick={() => setSelectedProducts(new Set())}
                className="text-white/70 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {loading ? (
            <ProductCardGridSkeleton count={12} />
          ) : error ? (
            <div className="alert alert-error flex gap-3 py-8">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          ) : products.length > 0 ? (
            <>
              {viewMode === 'cards' ? (
                // Card Grid Layout
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  <AnimatePresence mode="popLayout">
                    {products.map((product, index) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <ModernProductCard
                          product={product}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onViewDetails={handleViewDetails}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                // Table View (original table)
                <div className="overflow-x-auto">
                  <Table
                    columns={productColumns}
                    data={products}
                    actions={[
                      {
                        label: 'Edit',
                        handler: (row) => handleOpenModal(row),
                        icon: Edit
                      },
                      {
                        label: 'Delete',
                        handler: (row) => {
                          setDeleteId(row.id)
                          setShowDeleteConfirm(true)
                        },
                        icon: Trash2,
                        danger: true
                      }
                    ]}
                  />
                </div>
              )}

              {/* Pagination */}
              {viewMode === 'cards' ? (
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
                  <p className="text-sm text-slate-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1 || loading}
                      className="btn btn-secondary disabled:opacity-50 px-6"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={page === totalPages || loading}
                      className="btn btn-secondary disabled:opacity-50 px-6"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center mt-6">
                  <p className="text-sm text-slate-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1 || loading}
                      className="btn btn-secondary disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={page === totalPages || loading}
                      className="btn btn-secondary disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-gray-400 text-sm mt-1">
                {Object.values(searchFilters).some(v => v && v !== '') || searchFilters.categories.length > 0 || searchFilters.brands.length > 0
                  ? 'Try adjusting your filters'
                  : 'Add your first product to get started'}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Product Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Product Name *</label>
              <input
                type="text"
                name="name"
                className="input"
                placeholder="Enter product name"
                value={formData.name}
                onChange={handleFormChange}
              />
            </div>
            <div>
              <label className="label">Category</label>
              <input
                type="text"
                name="category"
                className="input"
                placeholder="e.g., Electronics"
                value={formData.category}
                onChange={handleFormChange}
              />
            </div>
            <div>
              <label className="label">Brand</label>
              <input
                type="text"
                name="brand"
                className="input"
                placeholder="e.g., Dell"
                value={formData.brand}
                onChange={handleFormChange}
              />
            </div>

            {/* Image Upload */}
            <div className="md:col-span-2">
              <label className="label">Product Image</label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-4">
                {imagePreview || existingImage ? (
                  <div className="relative">
                    <img
                      src={imagePreview || `${API_URL}${existingImage}`}
                      alt="Product preview"
                      className="max-h-48 mx-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Click to upload or drag & drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="block mt-2 text-center text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  {imagePreview || existingImage ? 'Change Image' : 'Select Image'}
                </label>
              </div>
            </div>

            <div>
              <label className="label">Cost Price *</label>
              <input
                type="number"
                name="cost_price"
                className="input"
                placeholder="0.00"
                step="0.01"
                value={formData.cost_price}
                onChange={handleFormChange}
              />
            </div>
            <div>
              <label className="label">Selling Price *</label>
              <input
                type="number"
                name="selling_price"
                className="input"
                placeholder="0.00"
                step="0.01"
                value={formData.selling_price}
                onChange={handleFormChange}
              />
            </div>
            <div>
              <label className="label">Stock Quantity *</label>
              <input
                type="number"
                name="stock_quantity"
                className="input"
                placeholder="0"
                value={formData.stock_quantity}
                onChange={handleFormChange}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Expiry Date</label>
              <input
                type="date"
                name="expiry_date"
                className="input"
                value={formData.expiry_date}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <button
              onClick={() => setShowModal(false)}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProduct}
              disabled={loading}
              className="btn btn-primary flex-1 flex gap-2 items-center justify-center"
            >
              <Check className="w-4 h-4" />
              {editingProduct ? 'Update' : 'Create'} Product
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600">Are you sure you want to delete this product? This action cannot be undone.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteProduct(deleteId)}
              className="btn btn-danger flex-1"
              disabled={loading}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* CSV Upload Modal */}
      <Modal
        isOpen={showCSVUpload}
        onClose={() => {
          setShowCSVUpload(false)
          setCsvFile(null)
          setCsvResult(null)
          setCsvError(null)
        }}
        title="Bulk Upload Products from CSV"
        size="lg"
      >
        <div className="space-y-4">
          {/* CSV Format Help */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-primary-700 mb-2">Supported CSV Formats</h3>
            <p className="text-xs text-slate-600 mb-3">Your CSV can use either of these formats:</p>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-600 mb-1"><strong>Format 1 (Simple):</strong></p>
                <code className="text-xs bg-slate-100 text-slate-700 p-2 rounded block overflow-x-auto">
                  name,sku,stock_quantity,price
                </code>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1"><strong>Format 2 (Detailed - like your data):</strong></p>
                <code className="text-xs bg-slate-100 text-slate-700 p-2 rounded block overflow-x-auto">
                  name,category,cost_price,selling_price,stock_quantity,brand,expiry_date
                </code>
                <p className="text-xs text-slate-500 mt-1">SKU will be auto-generated if not provided</p>
              </div>
            </div>
            
            <button
              onClick={downloadCSVTemplate}
              className="btn btn-sm btn-outline flex gap-2 items-center mt-3"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>

          {/* File Upload */}
          <div>
            <label className="label">Select CSV File</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-slate-50/50">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVFileSelect}
                className="hidden"
                id="csv-input"
                disabled={csvLoading}
              />
              <label
                htmlFor="csv-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-sm text-slate-700">
                  {csvFile ? csvFile.name : 'Click to browse or drag & drop'}
                </span>
                {!csvFile && (
                  <span className="text-xs text-slate-500">CSV files up to 5MB</span>
                )}
              </label>
            </div>
            {csvError && (
              <div className="alert alert-error mt-3 flex gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p>{csvError}</p>
              </div>
            )}
          </div>

          {/* Upload Result */}
          {csvResult && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-700 mb-2">Upload Result</h3>
                <div className="space-y-1 text-sm text-slate-700">
                  <p>Total Rows: <span className="font-semibold">{csvResult.total_rows}</span></p>
                  <p>Inserted: <span className="font-semibold text-green-400">{csvResult.inserted}</span></p>
                  <p>Skipped: <span className="font-semibold text-yellow-400">{csvResult.skipped}</span></p>
                </div>
              </div>

              {/* Errors Display */}
              {csvResult.errors && csvResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-red-700 mb-2">Errors & Issues</h3>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {csvResult.errors.map((error, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-red-400">Row {error.row}:</span>
                        <span>{error.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <button
              onClick={() => {
                setShowCSVUpload(false)
                setCsvFile(null)
                setCsvResult(null)
                setCsvError(null)
              }}
              className="btn btn-secondary flex-1"
              disabled={csvLoading}
            >
              {csvResult ? 'Done' : 'Cancel'}
            </button>
            {!csvResult && (
              <button
                onClick={handleCSVUpload}
                disabled={!csvFile || csvLoading}
                className="btn btn-primary flex-1 flex gap-2 items-center justify-center"
              >
                {csvLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload CSV
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Advanced Filter Modal */}
      <AnimatePresence>
        {showAdvancedFilter && (
          <ModernAdvancedFilter
            isOpen={showAdvancedFilter}
            onClose={() => setShowAdvancedFilter(false)}
            onApply={(filters) => {
              console.log('[ADVANCED FILTER] Applying:', filters)
              handleSearchApply(filters)
              setShowAdvancedFilter(false)
            }}
            availableCategories={uniqueCategories}
            availableBrands={uniqueBrands}
            initialFilters={searchFilters}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default Products
