import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, SlidersHorizontal, Save, RotateCcw, Search, Calendar, Tag, Filter } from 'lucide-react'
import { ModernCard } from './ModernDashboardLayout'

export function ModernAdvancedFilter({
  isOpen,
  onClose,
  onApply,
  availableCategories = [],
  availableBrands = [],
  initialFilters = {}
}) {
  const [filters, setFilters] = useState({
    query: initialFilters.query || '',
    categories: initialFilters.categories || [],
    brands: initialFilters.brands || [],
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    stockStatus: initialFilters.stockStatus || '',
    dateFrom: initialFilters.dateFrom || '',
    dateTo: initialFilters.dateTo || '',
    sortBy: initialFilters.sortBy || 'created_at',
    sortOrder: initialFilters.sortOrder || 'desc'
  })

  const [presetName, setPresetName] = useState('')
  const [showSavePreset, setShowSavePreset] = useState(false)

  // Sync with initialFilters when modal opens
  useEffect(() => {
    if (isOpen && initialFilters) {
      setFilters({
        query: initialFilters.query || '',
        categories: initialFilters.categories || [],
        brands: initialFilters.brands || [],
        minPrice: initialFilters.minPrice || '',
        maxPrice: initialFilters.maxPrice || '',
        stockStatus: initialFilters.stockStatus || '',
        dateFrom: initialFilters.dateFrom || '',
        dateTo: initialFilters.dateTo || '',
        sortBy: initialFilters.sortBy || 'created_at',
        sortOrder: initialFilters.sortOrder || 'desc'
      })
    }
  }, [isOpen, initialFilters])

  const handleCategoryChange = (category) => {
    if (filters.categories.includes(category)) {
      setFilters({
        ...filters,
        categories: filters.categories.filter(c => c !== category)
      })
    } else {
      setFilters({
        ...filters,
        categories: [...filters.categories, category]
      })
    }
  }

  const handleBrandChange = (brand) => {
    if (filters.brands.includes(brand)) {
      setFilters({
        ...filters,
        brands: filters.brands.filter(b => b !== brand)
      })
    } else {
      setFilters({
        ...filters,
        brands: [...filters.brands, brand]
      })
    }
  }

  const handleClearAll = () => {
    setFilters({
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
  }

  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0
    return value && value !== ''
  })

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.query) count++
    if (filters.categories.length > 0) count += filters.categories.length
    if (filters.brands.length > 0) count += filters.brands.length
    if (filters.minPrice) count++
    if (filters.maxPrice) count++
    if (filters.stockStatus) count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    if (filters.sortBy !== 'created_at' || filters.sortOrder !== 'desc') count++
    return count
  }

  if (!isOpen) return null

  return (
    <ModernCard hover={false} className="fixed inset-4 md:inset-8 z-50 overflow-auto max-h-[90vh] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-600 rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Advanced Filters</h2>
              <p className="text-sm text-gray-600">Refine your search with detailed filters</p>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
              </span>
            </div>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </motion.button>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Search */}
        <div className="lg:col-span-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Search className="w-4 h-4 inline mr-2" />
            Search Products
          </label>
          <input
            type="text"
            placeholder="Search in name, SKU, category..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Tag className="w-4 h-4 inline mr-2" />
            Categories
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar border border-gray-200 rounded-xl p-3 bg-white">
            {availableCategories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No categories</p>
            ) : (
              availableCategories.map(cat => (
                <label
                  key={cat}
                  className="flex items-center gap-3 text-sm cursor-pointer hover:bg-primary-50 p-2 rounded-lg transition-colors group"
                >
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(cat)}
                    onChange={() => handleCategoryChange(cat)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-gray-700 group-hover:text-primary-700">{cat}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Brands */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Filter className="w-4 h-4 inline mr-2" />
            Brands
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar border border-gray-200 rounded-xl p-3 bg-white">
            {availableBrands.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No brands</p>
            ) : (
              availableBrands.map(brand => (
                <label
                  key={brand}
                  className="flex items-center gap-3 text-sm cursor-pointer hover:bg-primary-50 p-2 rounded-lg transition-colors group"
                >
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(brand)}
                    onChange={() => handleBrandChange(brand)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-gray-700 group-hover:text-primary-700">{brand}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Stock Status */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Status</label>
          <select
            value={filters.stockStatus}
            onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          >
            <option value="">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <span className="text-gray-400">→</span>
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date Range
          </label>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
          <div className="flex gap-3">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            >
              <option value="created_at">Date Created</option>
              <option value="name">Name</option>
              <option value="selling_price">Price</option>
              <option value="stock_quantity">Stock</option>
            </select>
            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Tags */}
      {hasActiveFilters && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Active Filters</h4>
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.query && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm">
                Search: "{filters.query}"
                <button onClick={() => setFilters({ ...filters, query: '' })}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {filters.categories.map(cat => (
              <span key={cat} className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                {cat}
                <button onClick={() => handleCategoryChange(cat)}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {filters.brands.map(brand => (
              <span key={brand} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                {brand}
                <button onClick={() => handleBrandChange(brand)}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {filters.minPrice && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">
                Min: ₹{filters.minPrice}
                <button onClick={() => setFilters({ ...filters, minPrice: '' })}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {filters.maxPrice && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">
                Max: ₹{filters.maxPrice}
                <button onClick={() => setFilters({ ...filters, maxPrice: '' })}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {filters.stockStatus && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm capitalize">
                {filters.stockStatus.replace('-', ' ')}
                <button onClick={() => setFilters({ ...filters, stockStatus: '' })}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm">
                {filters.dateFrom} → {filters.dateTo || '...'}
                <button onClick={() => setFilters({ ...filters, dateFrom: '', dateTo: '' })}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Save Preset */}
      {showSavePreset && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-8 p-6 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-100"
        >
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Save Filter Preset</h4>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                localStorage.setItem(`filter-preset-${presetName}`, JSON.stringify(filters))
                setShowSavePreset(false)
                setPresetName('')
                toast?.success('Preset saved')
              }}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!presetName.trim()}
            >
              Save
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setShowSavePreset(!showSavePreset)}
          className="flex items-center gap-2 px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          {showSavePreset ? 'Cancel Save' : 'Save as Preset'}
        </button>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleClearAll}
            className="flex-1 md:flex-none px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => {
              onApply(filters)
              onClose()
            }}
            className="flex-1 md:flex-none px-8 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-medium shadow-lg hover:shadow-glow transition-all flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Apply Filters
          </motion.button>
        </div>
      </div>
    </ModernCard>
  )
}

export default ModernAdvancedFilter
