/**
 * Basic strategy validation utilities
 */

/**
 * Validate strategy code structure
 * Basic checks for required components
 */
export const validateStrategyCode = (code) => {
  const errors = []
  const warnings = []

  if (!code || code.trim().length === 0) {
    errors.push('Strategy code cannot be empty')
    return { valid: false, errors, warnings }
  }

  // Check for required imports
  if (!code.includes('from quantlib.strategies import Strategy')) {
    warnings.push("Missing import: 'from quantlib.strategies import Strategy'")
  }

  // Check for class definition
  if (!code.includes('class') || !code.includes('Strategy')) {
    errors.push("Strategy must define a class that inherits from 'Strategy'")
  }

  // Check for initialize method
  if (!code.includes('def initialize')) {
    warnings.push("Missing 'initialize' method (recommended)")
  }

  // Check for on_data method
  if (!code.includes('def on_data')) {
    errors.push("Missing required 'on_data' method")
  }

  // Basic syntax check (simple heuristic)
  const openParens = (code.match(/\(/g) || []).length
  const closeParens = (code.match(/\)/g) || []).length
  const openBraces = (code.match(/\{/g) || []).length
  const closeBraces = (code.match(/\}/g) || []).length
  const openBrackets = (code.match(/\[/g) || []).length
  const closeBrackets = (code.match(/\]/g) || []).length

  if (openParens !== closeParens) {
    warnings.push('Unmatched parentheses detected')
  }
  if (openBraces !== closeBraces) {
    warnings.push('Unmatched braces detected')
  }
  if (openBrackets !== closeBrackets) {
    warnings.push('Unmatched brackets detected')
  }

  const valid = errors.length === 0

  return {
    valid,
    errors,
    warnings,
  }
}

/**
 * Extract strategy class name from code
 */
export const extractClassName = (code) => {
  const classMatch = code.match(/class\s+(\w+)\s*\(/i)
  return classMatch ? classMatch[1] : null
}
