/**
 * Strategy Library API service
 */

import api from './api'

/**
 * Get list of strategies from library
 */
export const getLibraryStrategies = async (category = null, search = null, tags = null) => {
  const params = new URLSearchParams()
  if (category) params.append('category', category)
  if (search) params.append('search', search)
  if (tags) params.append('tags', tags)
  
  const queryString = params.toString()
  const url = `/api/strategies/library${queryString ? `?${queryString}` : ''}`
  
  const response = await api.get(url)
  return response.data
}

/**
 * Get strategy details from library
 */
export const getLibraryStrategy = async (strategyId) => {
  const response = await api.get(`/api/strategies/library/${strategyId}`)
  return response.data
}

/**
 * Get strategy code from library
 */
export const getLibraryStrategyCode = async (strategyId) => {
  const response = await api.get(`/api/strategies/library/${strategyId}/code`)
  return response.data
}

/**
 * Get strategy library categories
 */
export const getLibraryCategories = async () => {
  const response = await api.get('/api/strategies/library/categories')
  return response.data
}
