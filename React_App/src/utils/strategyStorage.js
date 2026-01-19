/**
 * localStorage utilities for saving/loading strategies
 */

const STORAGE_KEY = 'quantlib_strategies'

export const strategyStorage = {
  /**
   * Get all saved strategies
   */
  getAll() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading strategies:', error)
      return []
    }
  },

  /**
   * Save a strategy
   */
  save(strategy) {
    try {
      const strategies = this.getAll()
      const existingIndex = strategies.findIndex((s) => s.id === strategy.id)
      
      const strategyToSave = {
        ...strategy,
        updatedAt: new Date().toISOString(),
      }
      
      if (existingIndex >= 0) {
        // Update existing
        strategies[existingIndex] = strategyToSave
      } else {
        // Add new
        strategyToSave.id = strategy.id || `strategy_${Date.now()}`
        strategyToSave.createdAt = strategy.createdAt || new Date().toISOString()
        strategies.push(strategyToSave)
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies))
      return strategyToSave
    } catch (error) {
      console.error('Error saving strategy:', error)
      throw error
    }
  },

  /**
   * Get a strategy by ID
   */
  get(id) {
    const strategies = this.getAll()
    return strategies.find((s) => s.id === id)
  },

  /**
   * Delete a strategy
   */
  delete(id) {
    try {
      const strategies = this.getAll()
      const filtered = strategies.filter((s) => s.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('Error deleting strategy:', error)
      return false
    }
  },

  /**
   * Clear all strategies
   */
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
      return true
    } catch (error) {
      console.error('Error clearing strategies:', error)
      return false
    }
  },
}
