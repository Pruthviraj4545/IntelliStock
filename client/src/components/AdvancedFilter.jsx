import { useState, useEffect } from 'react'
import { X, SlidersHorizontal, Save } from 'lucide-react'
import { Modal } from './Modal'

export function AdvancedFilter({
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advanced Filters" size="lg">
      <div className="space-y-6">
        {/* Text Search */}
        <div>
          <label className="label">Search</label>
          <input
            type="text"
            className="input"
            placeholder="Search in name, SKU, category..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          />
        </div>

        {/* Multi-select Categories & Brands */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Categories</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-600 rounded p-3 bg-gray-900">
              {availableCategories.length === 0 ? (
                <p className="text-sm text-gray-400">No categories</p>
              ) : (
                availableCategories.map(cat => (
                  <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-800 px-2 py-1 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(cat)}
                      onChange={() => handleCategoryChange(cat)}
                      className="w-4 h-4 border border-gray-500 rounded"
                    />
                    <span className="text-gray-200">{cat}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="label">Brands</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-600 rounded p-3 bg-gray-900">
              {availableBrands.length === 0 ? (
                <p className="text-sm text-gray-400">No brands</p>
              ) : (
                availableBrands.map(brand => (
                  <label key={brand} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-800 px-2 py-1 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={() => handleBrandChange(brand)}
                      className="w-4 h-4 border border-gray-500 rounded"
                    />
                    <span className="text-gray-200">{brand}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Price Range & Stock Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Price Range</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                className="input"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                className="input"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Stock Status</label>
            <select
              className="input"
              value={filters.stockStatus}
              onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
            >
              <option value="">All</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date From</label>
            <input
              type="date"
              className="input"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Date To</label>
            <input
              type="date"
              className="input"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>

        {/* Sort */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Sort By</label>
            <select
              className="input"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            >
              <option value="created_at">Date Created</option>
              <option value="name">Name</option>
              <option value="selling_price">Price</option>
              <option value="stock_quantity">Stock</option>
            </select>
          </div>
          <div>
            <label className="label">Order</label>
            <select
              className="input"
              value={filters.sortOrder}
              onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {/* Save Preset */}
        {showSavePreset && (
          <div className="flex gap-2">
            <input
              type="text"
              className="input"
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
            />
            <button
              onClick={() => {
                localStorage.setItem(`filter-preset-${presetName}`, JSON.stringify(filters))
                setShowSavePreset(false)
                setPresetName('')
              }}
              className="btn btn-primary"
              disabled={!presetName.trim()}
            >
              Save
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={() => setShowSavePreset(!showSavePreset)}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Save as Preset
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
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
            }}
            className="btn btn-secondary"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => onApply(filters)}
            className="btn btn-primary flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" /> Apply Filters
          </button>
        </div>
      </div>
    </Modal>
  )
}
