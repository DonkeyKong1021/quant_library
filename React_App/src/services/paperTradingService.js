import api from './api'

export const paperTradingService = {
  async startSession(config) {
    const response = await api.post('/api/paper-trading/start', config)
    return response.data
  },

  async getSession(sessionId) {
    const response = await api.get(`/api/paper-trading/sessions/${sessionId}`)
    return response.data
  },

  async stopSession(sessionId) {
    const response = await api.post(`/api/paper-trading/sessions/${sessionId}/stop`)
    return response.data
  },

  async listSessions() {
    const response = await api.get('/api/paper-trading/sessions')
    return response.data
  },
}
