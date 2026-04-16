import api from './axios'

export const getProducts = async (page = 1, limit = 20) => {
  const response = await api.get('/products', {
    params: { page, limit }
  })
  return response.data
}

export const filterProducts = async (filters = {}) => {
  const params = new URLSearchParams()

  // Text search
  if (filters.query && filters.query.trim()) params.append('query', filters.query)

  // Multi-select categories (append multiple)
  if (filters.categories && Array.isArray(filters.categories)) {
    filters.categories.forEach(cat => {
      if (cat && cat.trim()) params.append('category', cat)
    })
  } else if (filters.category) {
    params.append('category', filters.category)
  }

  // Multi-select brands (append multiple)
  if (filters.brands && Array.isArray(filters.brands)) {
    filters.brands.forEach(brand => {
      if (brand && brand.trim()) params.append('brand', brand)
    })
  } else if (filters.brand) {
    params.append('brand', filters.brand)
  }

  // Price range
  if (filters.minPrice !== null && filters.minPrice !== undefined && filters.minPrice !== '') params.append('minPrice', filters.minPrice)
  if (filters.maxPrice !== null && filters.maxPrice !== undefined && filters.maxPrice !== '') params.append('maxPrice', filters.maxPrice)

  // Stock status
  if (filters.stockStatus && filters.stockStatus !== '') params.append('stockStatus', filters.stockStatus)

  // Date range
  if (filters.dateFrom && filters.dateFrom !== '') params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo && filters.dateTo !== '') params.append('dateTo', filters.dateTo)

  // Expiry date
  if (filters.expiryBefore) params.append('expiryBefore', filters.expiryBefore)

  // Sorting
  if (filters.sortBy) params.append('sortBy', filters.sortBy)
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

  // Pagination - always include with defaults
  params.append('page', filters.page || 1)
  params.append('limit', filters.limit || 10)

  const url = `/products/filter?${params.toString()}`
  console.log('[API] Filter request URL:', url)
  
  const response = await api.get(url)
  console.log('[API] Filter response:', response.data)
  
  return response.data
}

const buildFormData = (data) => {
  if (data instanceof FormData) {
    return data
  }

  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (value === '' && key !== 'expiry_date') return

    if (key === 'image' && value instanceof File) {
      formData.append('image', value)
    } else {
      formData.append(key, value)
    }
  })
  return formData
}

export const createProduct = async (productData) => {
  const formData = buildFormData(productData)
  const response = await api.post('/products', formData)
  return response.data
}

export const updateProduct = async (id, productData) => {
  const formData = buildFormData(productData)
  const response = await api.put(`/products/${id}`, formData)
  return response.data
}

export const deleteProduct = async (id) => {
  await api.delete(`/products/${id}`)
}

export const deleteProductImage = async (id) => {
  await api.delete(`/products/${id}/image`)
}

export const getLowStockProducts = async () => {
  const response = await api.get('/products/low-stock')
  return response.data
}

export const applyDiscount = async (discount_percentage) => {
  const response = await api.put('/products/apply-discount', {
    discount_percentage: parseFloat(discount_percentage)
  })
  return response.data
}

export const uploadProductsCSV = async (formData) => {
  const response = await api.post('/products/upload-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const getProductMetadata = async () => {
  const response = await api.get('/products/metadata')
  return response.data
}
