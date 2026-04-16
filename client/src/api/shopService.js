import api from './axios'

// ============================================================================
// SHOP DETAILS API
// ============================================================================

export const getShopDetails = async () => {
  try {
    const response = await api.get('/shop/shop-details')
    return response.data?.shopDetails || null
  } catch (error) {
    console.error('Error fetching shop details:', error)
    return null
  }
}

export const createOrUpdateShopDetails = async (shopData) => {
  try {
    const response = await api.post('/shop/shop-details', shopData)
    return response.data?.shopDetails
  } catch (error) {
    console.error('Error saving shop details:', error)
    throw error
  }
}

// ============================================================================
// CUSTOMER API
// ============================================================================

export const getCustomers = async (page = 1, limit = 20, search = '') => {
  try {
    const response = await api.get('/shop/customers', {
      params: { page, limit, search }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching customers:', error)
    throw error
  }
}

export const getOrCreateCustomer = async (mobileNumber, customerData) => {
  try {
    const response = await api.post('/shop/customers/get-or-create', {
      mobile_number: mobileNumber,
      ...customerData
    })
    return response.data?.customer
  } catch (error) {
    console.error('Error getting or creating customer:', error)
    throw error
  }
}

export const updateCustomer = async (customerId, customerData) => {
  try {
    const response = await api.put(`/shop/customers/${customerId}`, customerData)
    return response.data?.customer
  } catch (error) {
    console.error('Error updating customer:', error)
    throw error
  }
}

export const getFrequentCustomers = async (limit = 10) => {
  try {
    const response = await api.get('/shop/customers/frequent', {
      params: { limit }
    })
    return response.data?.frequentCustomers || []
  } catch (error) {
    console.error('Error fetching frequent customers:', error)
    return []
  }
}

export const getCustomerDetails = async (customerId) => {
  try {
    const response = await api.get(`/shop/customers/${customerId}/details`)
    return response.data
  } catch (error) {
    console.error('Error fetching customer details:', error)
    throw error
  }
}

// ============================================================================
// INVOICE API
// ============================================================================

export const createInvoice = async (invoiceData) => {
  try {
    const response = await api.post('/invoices', invoiceData)
    return response.data?.invoice
  } catch (error) {
    console.error('Error creating invoice:', error)
    throw error
  }
}

export const getInvoice = async (invoiceId) => {
  try {
    const response = await api.get(`/invoices/${invoiceId}`)
    return response.data?.invoice
  } catch (error) {
    console.error('Error fetching invoice:', error)
    throw error
  }
}

export const getInvoices = async (page = 1, limit = 20, customerId = null) => {
  try {
    const response = await api.get('/invoices', {
      params: { page, limit, customerId }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching invoices:', error)
    throw error
  }
}

// ============================================================================
// LOW STOCK ALERTS API
// ============================================================================

export const getLowStockAlerts = async (status = 'pending') => {
  try {
    const response = await api.get('/invoices/alerts/low-stock', {
      params: { status }
    })
    return response.data?.alerts || []
  } catch (error) {
    console.error('Error fetching low stock alerts:', error)
    return []
  }
}

export const acknowledgeAlert = async (alertId) => {
  try {
    const response = await api.patch(`/invoices/alerts/${alertId}/acknowledge`)
    return response.data?.alert
  } catch (error) {
    console.error('Error acknowledging alert:', error)
    throw error
  }
}
