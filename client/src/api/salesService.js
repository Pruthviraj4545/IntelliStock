import api from './axios'

export const getSales = async (page = 1, limit = 20, options = {}) => {
  const { grouped = false } = options
  const response = await api.get('/sales', {
    params: { page, limit, grouped }
  })
  return response.data
}

export const createSale = async (productId, quantity) => {
  const response = await api.post('/sales', {
    product_id: parseInt(productId),
    quantity: parseInt(quantity)
  })
  return response.data
}
