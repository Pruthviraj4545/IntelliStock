import axios from 'axios'
import { API_URL } from '../config'

const api = axios.create({
  baseURL: API_URL
})

api.defaults.headers.common['Content-Type'] = 'application/json'

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // If data is FormData, ensure we don't set Content-Type (browser will auto-set with boundary)
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = undefined
      delete config.headers['Content-Type']
    } else if (!config.headers['Content-Type']) {
      // Set JSON content type if not already set
      config.headers['Content-Type'] = 'application/json'
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
