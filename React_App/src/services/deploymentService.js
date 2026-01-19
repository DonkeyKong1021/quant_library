import api from './api'

export const deploymentService = {
  async deployAlgorithm(deploymentConfig) {
    const response = await api.post('/api/deployment/deploy', deploymentConfig)
    return response.data
  },

  async getDeployment(deploymentId) {
    const response = await api.get(`/api/deployment/deployments/${deploymentId}`)
    return response.data
  },

  async stopDeployment(deploymentId) {
    const response = await api.post(`/api/deployment/deployments/${deploymentId}/stop`)
    return response.data
  },

  async listDeployments() {
    const response = await api.get('/api/deployment/deployments')
    return response.data
  },

  async getMetrics(deploymentId) {
    const response = await api.get(`/api/deployment/deployments/${deploymentId}/metrics`)
    return response.data
  },

  async getLogs(deploymentId, limit = 100) {
    const response = await api.get(`/api/deployment/deployments/${deploymentId}/logs`, {
      params: { limit }
    })
    return response.data
  },
}
