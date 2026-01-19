import api from './api'

export const indicatorsService = {
  async calculateIndicators({ data, indicators }) {
    const response = await api.post('/api/indicators/calculate', {
      data,
      indicators,
    })
    return response.data
  },
}