/**
 * localStorage utilities for storing API keys
 */

const API_KEYS_STORAGE_KEY = 'quantlib_api_keys'

const DEFAULT_API_KEYS = {
  alpha_vantage: '',
  polygon: '',
  openai: '',
  anthropic: '',
}

export const apiKeyStorage = {
  /**
   * Get all API keys
   */
  getAll() {
    try {
      const stored = localStorage.getItem(API_KEYS_STORAGE_KEY)
      return stored ? { ...DEFAULT_API_KEYS, ...JSON.parse(stored) } : DEFAULT_API_KEYS
    } catch (error) {
      console.error('Error reading API keys from localStorage:', error)
      return DEFAULT_API_KEYS
    }
  },

  /**
   * Get a specific API key
   */
  get(key) {
    const allKeys = this.getAll()
    return allKeys[key] || ''
  },

  /**
   * Set a specific API key
   */
  set(key, value) {
    try {
      const allKeys = this.getAll()
      allKeys[key] = value
      localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(allKeys))
      return allKeys
    } catch (error) {
      console.error('Error saving API key to localStorage:', error)
      throw error
    }
  },

  /**
   * Set all API keys at once
   */
  setAll(keys) {
    try {
      const merged = { ...DEFAULT_API_KEYS, ...keys }
      localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(merged))
      return merged
    } catch (error) {
      console.error('Error saving API keys to localStorage:', error)
      throw error
    }
  },

  /**
   * Clear all API keys
   */
  clear() {
    try {
      localStorage.removeItem(API_KEYS_STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing API keys from localStorage:', error)
    }
  },
}
