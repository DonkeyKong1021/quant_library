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

  /**
   * Export strategies to JSON
   */
  export(strategyIds = null) {
    try {
      const strategies = this.getAll()
      const toExport = strategyIds
        ? strategies.filter((s) => strategyIds.includes(s.id))
        : strategies

      return JSON.stringify(toExport, null, 2)
    } catch (error) {
      console.error('Error exporting strategies:', error)
      throw error
    }
  },

  /**
   * Import strategies from JSON
   */
  import(jsonString, options = { overwrite: false, skipDuplicates: true }) {
    try {
      const importedStrategies = JSON.parse(jsonString)
      if (!Array.isArray(importedStrategies)) {
        throw new Error('Imported data must be an array of strategies')
      }

      const existing = this.getAll()
      const results = {
        imported: 0,
        skipped: 0,
        errors: [],
      }

      importedStrategies.forEach((strategy) => {
        try {
          // Validate required fields
          if (!strategy.name || !strategy.code) {
            results.errors.push(`Strategy missing required fields: ${strategy.name || 'Unknown'}`)
            return
          }

          const existingIndex = existing.findIndex((s) => s.id === strategy.id || s.name === strategy.name)

          if (existingIndex >= 0) {
            if (options.overwrite) {
              // Update existing
              strategy.id = existing[existingIndex].id
              existing[existingIndex] = {
                ...strategy,
                updatedAt: new Date().toISOString(),
              }
              results.imported++
            } else if (options.skipDuplicates) {
              results.skipped++
            } else {
              // Create new with modified name
              strategy.id = `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              strategy.createdAt = strategy.createdAt || new Date().toISOString()
              existing.push(strategy)
              results.imported++
            }
          } else {
            // New strategy
            strategy.id = strategy.id || `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            strategy.createdAt = strategy.createdAt || new Date().toISOString()
            existing.push(strategy)
            results.imported++
          }
        } catch (err) {
          results.errors.push(`Error importing strategy: ${err.message}`)
        }
      })

      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
      return results
    } catch (error) {
      console.error('Error importing strategies:', error)
      throw error
    }
  },
}
