import api from './api'

export const dataService = {
  // Database endpoints
  async getDatabaseStatus() {
    const response = await api.get('/api/database/status')
    return response.data
  },

  async getDatabaseSymbols() {
    const response = await api.get('/api/database/symbols')
    return response.data
  },

  async getDatabaseStatistics(source = null) {
    const params = source ? { source } : {}
    const response = await api.get('/api/database/statistics', { params })
    return response.data
  },

  async updateAllTickers() {
    const response = await api.post('/api/database/update-all')
    return response.data
  },

  // Enhanced symbol endpoints
  async getAllSymbols() {
    const response = await api.get('/api/data/symbols/all')
    return response.data
  },

  async getSymbolsBySectors() {
    const response = await api.get('/api/data/symbols/sectors')
    return response.data
  },

  async getSymbolMetadata(symbol) {
    const response = await api.get(`/api/data/metadata/${symbol}`)
    return response.data
  },

  async updateRecentSymbols(symbols) {
    const response = await api.post('/api/data/symbols/recent', { symbols })
    return response.data
  },

  // Data fetching endpoints
  async fetchData({ symbol, startDate, endDate, useCache = true, forceRefresh = false, dataSource = null, interval = '1d' }) {
    const requestBody = {
      symbol,
      start_date: startDate,
      end_date: endDate,
      use_cache: useCache,
      force_refresh: forceRefresh,
      interval: interval,
    }
    
    // Only include data_source if it's provided
    if (dataSource) {
      requestBody.data_source = dataSource
    }
    
    const response = await api.post('/api/data/fetch', requestBody)
    return response.data
  },

  async getDataPreview(symbol) {
    const response = await api.get(`/api/data/preview/${symbol}`)
    return response.data
  },
}