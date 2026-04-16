import api from './axios'

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  localStorage.setItem('token', response.data.token)
  localStorage.setItem('user', JSON.stringify(response.data.user))
  return response.data
}

export const logout = async () => {
  await api.post('/auth/logout')
}

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData)
  return response.data
}

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me')
  return response.data
}
