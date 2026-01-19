/**
 * Utility functions for estimating optimization time
 */

/**
 * Estimate time for grid search optimization
 * @param {number} totalCombinations - Total number of parameter combinations
 * @param {number} completedCombinations - Number of completed combinations
 * @param {number} elapsedSeconds - Time elapsed so far
 * @returns {number|null} Estimated seconds remaining, or null if not enough data
 */
export function estimateGridSearchTime(totalCombinations, completedCombinations, elapsedSeconds) {
  if (completedCombinations === 0 || totalCombinations === 0) {
    return null
  }
  
  if (completedCombinations >= totalCombinations) {
    return 0
  }
  
  // Calculate average time per combination
  const avgTimePerCombination = elapsedSeconds / completedCombinations
  const remainingCombinations = totalCombinations - completedCombinations
  const estimatedSeconds = avgTimePerCombination * remainingCombinations
  
  return Math.max(0, estimatedSeconds)
}

/**
 * Estimate time for workflow optimization
 * @param {number} maxIterations - Maximum number of iterations
 * @param {number} completedIterations - Number of completed iterations (from status)
 * @param {number} elapsedSeconds - Time elapsed so far
 * @returns {number|null} Estimated seconds remaining, or null if not enough data
 */
export function estimateWorkflowTime(maxIterations, completedIterations, elapsedSeconds) {
  if (completedIterations === 0 || maxIterations === 0) {
    return null
  }
  
  if (completedIterations >= maxIterations) {
    return 0
  }
  
  // Calculate average time per iteration
  const avgTimePerIteration = elapsedSeconds / completedIterations
  const remainingIterations = maxIterations - completedIterations
  const estimatedSeconds = avgTimePerIteration * remainingIterations
  
  return Math.max(0, estimatedSeconds)
}

/**
 * Format seconds into human-readable time string
 * @param {number} seconds - Seconds to format
 * @returns {string} Formatted time string (e.g., "2m 30s", "1h 15m", "45s")
 */
export function formatTimeRemaining(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return 'Calculating...'
  }
  
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  
  if (minutes < 60) {
    if (remainingSeconds === 0) {
      return `${minutes}m`
    }
    return `${minutes}m ${remainingSeconds}s`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Calculate progress percentage
 * @param {number} completed - Completed items
 * @param {number} total - Total items
 * @returns {number} Progress percentage (0-100)
 */
export function calculateProgress(completed, total) {
  if (total === 0) return 0
  return Math.min(100, Math.round((completed / total) * 100))
}
