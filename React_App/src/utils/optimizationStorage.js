/**
 * Storage utility for optimization preferences
 */

const MAX_COMBINATIONS_KEY = 'quantlib_max_combinations'
const MAX_ITERATIONS_KEY = 'quantlib_max_iterations'
const DEFAULT_MAX_COMBINATIONS = 100
const DEFAULT_MAX_ITERATIONS = 100

export const optimizationStorage = {
  /**
   * Get the stored max combinations preference
   * @returns {number} Max combinations (default: 100)
   */
  getMaxCombinations() {
    try {
      const stored = localStorage.getItem(MAX_COMBINATIONS_KEY)
      return stored ? parseInt(stored, 10) : DEFAULT_MAX_COMBINATIONS
    } catch (error) {
      console.error('Error reading max combinations from localStorage:', error)
      return DEFAULT_MAX_COMBINATIONS
    }
  },

  /**
   * Set the max combinations preference
   * @param {number} value - Max combinations value
   */
  setMaxCombinations(value) {
    try {
      localStorage.setItem(MAX_COMBINATIONS_KEY, value.toString())
    } catch (error) {
      console.error('Error saving max combinations to localStorage:', error)
    }
  },

  /**
   * Get the stored max iterations preference
   * @returns {number} Max iterations (default: 100)
   */
  getMaxIterations() {
    try {
      const stored = localStorage.getItem(MAX_ITERATIONS_KEY)
      return stored ? parseInt(stored, 10) : DEFAULT_MAX_ITERATIONS
    } catch (error) {
      console.error('Error reading max iterations from localStorage:', error)
      return DEFAULT_MAX_ITERATIONS
    }
  },

  /**
   * Set the max iterations preference
   * @param {number} value - Max iterations value
   */
  setMaxIterations(value) {
    try {
      localStorage.setItem(MAX_ITERATIONS_KEY, value.toString())
    } catch (error) {
      console.error('Error saving max iterations to localStorage:', error)
    }
  },
}
