/**
 * Settings API service for managing API keys and settings
 */

import api from './api'

export const settingsService = {
  /**
   * Get API keys status (whether keys are set, not the actual values)
   */
  async getAPIKeys() {
    const response = await api.get('/api/settings/api-keys')
    return response.data
  },

  /**
   * Save API keys (keys are encrypted on the backend)
   */
  async saveAPIKeys(keys) {
    const response = await api.post('/api/settings/api-keys', keys)
    return response.data
  },
}
