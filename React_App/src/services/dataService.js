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

  async getDatabaseStatistics() {
    const response = await api.get('/api/database/statistics')
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
  async fetchData({ symbol, startDate, endDate, useCache = true, forceRefresh = false }) {
    const response = await api.post('/api/data/fetch', {
      symbol,
      start_date: startDate,
      end_date: endDate,
      use_cache: useCache,
      force_refresh: forceRefresh,
    })
    return response.data
  },

  async getDataPreview(symbol) {
    const response = await api.get(`/api/data/preview/${symbol}`)
    return response.data
  },
}