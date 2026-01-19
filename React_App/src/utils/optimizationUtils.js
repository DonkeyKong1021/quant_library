/**
 * Utility functions for optimization data processing
 */

/**
 * Calculate estimated combinations for parameter ranges
 */
export const calculateCombinations = (parameterRanges) => {
  if (!parameterRanges || Object.keys(parameterRanges).length === 0) {
    return 0
  }

  let combinations = 1
  Object.values(parameterRanges).forEach((range) => {
    if (range.type === 'int') {
      const steps = Math.floor((range.max - range.min) / range.step) + 1
      combinations *= steps
    } else {
      const steps = Math.floor((range.max - range.min) / range.step) + 1
      combinations *= steps
    }
  })

  return combinations
}

/**
 * Format parameter ranges for API request
 */
export const formatParameterRanges = (parameterRanges) => {
  const formatted = {}
  Object.keys(parameterRanges).forEach((paramName) => {
    const range = parameterRanges[paramName]
    formatted[paramName] = {
      min: range.min,
      max: range.max,
      step: range.step,
      type: range.type || 'float',
    }
  })
  return formatted
}

/**
 * Extract parameter values from optimization result
 */
export const extractParameters = (result) => {
  return result.parameters || {}
}

/**
 * Get objective value from result
 */
export const getObjectiveValue = (result, objective) => {
  if (!result.metrics) return null
  return result.metrics[objective] || null
}

/**
 * Sort results by objective value
 */
export const sortResultsByObjective = (results, objective, ascending = false) => {
  return [...results].sort((a, b) => {
    const aValue = getObjectiveValue(a, objective) || -Infinity
    const bValue = getObjectiveValue(b, objective) || -Infinity
    return ascending ? aValue - bValue : bValue - aValue
  })
}

/**
 * Filter results by parameter values
 */
export const filterResultsByParameters = (results, filters) => {
  return results.filter((result) => {
    return Object.keys(filters).every((paramName) => {
      const filterValue = filters[paramName]
      const resultValue = result.parameters[paramName]
      if (typeof filterValue === 'object' && filterValue.min !== undefined) {
        return resultValue >= filterValue.min && resultValue <= filterValue.max
      }
      return resultValue === filterValue
    })
  })
}

/**
 * Prepare data for 2D heatmap
 */
export const prepareHeatmapData = (results, param1Name, param2Name, objective) => {
  if (!results || results.length === 0) return null

  // Get unique parameter values
  const param1Values = [...new Set(results.map((r) => r.parameters[param1Name]))].sort(
    (a, b) => a - b
  )
  const param2Values = [...new Set(results.map((r) => r.parameters[param2Name]))].sort(
    (a, b) => a - b
  )

  // Create matrix
  const matrix = param2Values.map((p2) =>
    param1Values.map((p1) => {
      const result = results.find(
        (r) => r.parameters[param1Name] === p1 && r.parameters[param2Name] === p2
      )
      return result ? getObjectiveValue(result, objective) : null
    })
  )

  return {
    x: param1Values,
    y: param2Values,
    z: matrix,
  }
}

/**
 * Prepare data for sensitivity chart (1D)
 */
export const prepareSensitivityData = (results, paramName, objective, fixedParams = {}) => {
  if (!results || results.length === 0) return null

  // Filter results that match fixed parameters
  let filtered = results
  Object.keys(fixedParams).forEach((key) => {
    if (key !== paramName) {
      filtered = filtered.filter((r) => r.parameters[key] === fixedParams[key])
    }
  })

  // Sort by parameter value
  filtered.sort((a, b) => a.parameters[paramName] - b.parameters[paramName])

  return {
    x: filtered.map((r) => r.parameters[paramName]),
    y: filtered.map((r) => getObjectiveValue(r, objective)),
  }
}

/**
 * Format metric value for display
 */
export const formatMetricValue = (value, metricName) => {
  if (value === null || value === undefined) return '—'

  if (metricName.includes('pct') || metricName.includes('return')) {
    return `${(value * 100).toFixed(2)}%`
  } else if (typeof value === 'number') {
    return value.toFixed(4)
  }
  return value
}

/**
 * Get metric label
 */
export const getMetricLabel = (metricName) => {
  const labels = {
    total_return: 'Total Return',
    sharpe_ratio: 'Sharpe Ratio',
    sortino_ratio: 'Sortino Ratio',
    calmar_ratio: 'Calmar Ratio',
    information_ratio: 'Information Ratio',
    max_drawdown: 'Max Drawdown',
    max_drawdown_pct: 'Max Drawdown %',
    win_rate: 'Win Rate',
    num_trades: 'Number of Trades',
  }
  return (
    labels[metricName] ||
    metricName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  )
}
