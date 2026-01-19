import api from './api'

export const versioningService = {
  async createVersion(algorithmId, versionData) {
    const response = await api.post(`/api/versioning/algorithms/${algorithmId}/versions`, versionData)
    return response.data
  },

  async listVersions(algorithmId) {
    const response = await api.get(`/api/versioning/algorithms/${algorithmId}/versions`)
    return response.data
  },

  async getVersion(algorithmId, versionNumber) {
    const response = await api.get(`/api/versioning/algorithms/${algorithmId}/versions/${versionNumber}`)
    return response.data
  },

  async activateVersion(algorithmId, versionNumber) {
    const response = await api.post(`/api/versioning/algorithms/${algorithmId}/versions/${versionNumber}/activate`)
    return response.data
  },

  async compareVersions(algorithmId, version1, version2) {
    const response = await api.get(`/api/versioning/algorithms/${algorithmId}/versions/compare`, {
      params: { version1, version2 }
    })
    return response.data
  },
}
