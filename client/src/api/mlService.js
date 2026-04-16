import api from './axios'

export const getSalesAnalytics = async (timeframe = 'monthly') => {
  const response = await api.get('/ml/sales-analytics', {
    params: { timeframe }
  })
  return response.data?.analytics || {}
}

export const predictDemand = async (productId) => {
  const response = await api.post('/ml/predict-demand', { productId })
  return response.data?.prediction || null
}

export const getInventoryOptimization = async () => {
  const response = await api.get('/ml/inventory-optimization')
  return response.data?.optimization || {}
}

export const getAnomalies = async () => {
  const response = await api.get('/ml/anomaly-detection')
  return response.data?.anomalies || {}
}

export const getBestSellers = async (limit = 10) => {
  const response = await api.get('/ml/best-sellers', {
    params: { limit }
  })
  return response.data?.best_sellers || []
}

export const getTrendAnalysis = async () => {
  const response = await api.get('/ml/trend-analysis')
  return response.data?.trend_analysis || {}
}
