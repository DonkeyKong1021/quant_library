import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

// Request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const data = error.response.data

      // Handle specific error cases
      if (status === 404) {
        return Promise.reject({
          message: data.detail || 'Resource not found',
          code: 'NOT_FOUND',
        })
      } else if (status === 503) {
        return Promise.reject({
          message: data.detail || 'Service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE',
          retryable: true,
        })
      } else if (status === 400) {
        return Promise.reject({
          message: data.detail || 'Invalid request',
          code: 'BAD_REQUEST',
        })
      }

      console.error('API Error:', data)
      return Promise.reject({
        message: data.detail || data.message || 'An error occurred',
        code: 'API_ERROR',
        status: status,
      })
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.request)
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        retryable: true,
      })
    } else {
      // Something else happened
      console.error('Error:', error.message)
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      })
    }
  }
)

export default api