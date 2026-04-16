import api from './axios'

const toISODate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const buildFilterParams = (filters = {}) => {
  const params = {}

  if (filters.range) params.range = filters.range

  const startDate = toISODate(filters.startDate)
  const endDate = toISODate(filters.endDate)

  if (startDate && endDate) {
    params.start_date = startDate
    params.end_date = endDate
  }

  return params
}

export const getMonthlySalesReport = async (filters = {}) => {
  const response = await api.get('/reports/monthly-sales', {
    params: buildFilterParams(filters)
  })

  return {
    range: response.data?.range,
    granularity: response.data?.granularity,
    empty: Boolean(response.data?.empty),
    monthly_sales: Array.isArray(response.data?.monthly_sales)
      ? response.data.monthly_sales
      : []
  }
}

export const getSalesSummary = async (filters = {}) => {
  const response = await api.get('/analytics/sales-summary', {
    params: buildFilterParams(filters)
  })

  return {
    empty: Boolean(response.data?.empty),
    summary: response.data?.summary || {
      total_revenue: 0,
      total_sales: 0,
      average_order_value: 0,
      total_items_sold: 0
    }
  }
}

export const getTopProducts = async (filters = {}) => {
  const response = await api.get('/analytics/top-products', {
    params: buildFilterParams(filters)
  })

  return {
    empty: Boolean(response.data?.empty),
    top_products: Array.isArray(response.data?.top_products)
      ? response.data.top_products
      : []
  }
}

export const getAdvancedSalesReport = async () => {
  const response = await api.get('/reports/advanced-sales')
  return response.data || {}
}
