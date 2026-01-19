/**
 * Chart performance utilities for data decimation and sampling
 * Optimizes large datasets for visualization performance
 */

/**
 * Largest-Triangle-Three-Buckets (LTTB) downsampling algorithm
 * Preserves visual accuracy while reducing data points
 * 
 * @param {Array} data - Array of {x, y} objects
 * @param {number} threshold - Target number of data points
 * @returns {Array} Downsampled array of {x, y} objects
 */
export function lttbDownsample(data, threshold) {
  if (!data || data.length <= threshold || threshold < 3) {
    return data
  }

  const dataLength = data.length
  if (dataLength <= 2) return data

  // Bucket size. Leave room for start and end data points
  const every = (dataLength - 2) / (threshold - 2)

  // Always add the first point
  const sampled = [data[0]]
  let a = 0

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate point range for current bucket
    const rangeStart = Math.floor((i + 0) * every) + 1
    const rangeEnd = Math.floor((i + 1) * every) + 1
    const rangeEndNext = Math.floor((i + 2) * every) + 1

    // Calculate point average for next bucket (for visualization)
    let avgX = 0
    let avgY = 0
    let avgRangeStart = rangeEnd
    let avgRangeEnd = Math.min(rangeEndNext, dataLength)

    const avgRangeLength = avgRangeEnd - avgRangeStart
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += data[j].x
      avgY += data[j].y
    }
    avgX /= avgRangeLength
    avgY /= avgRangeLength

    // Get the range for current bucket
    const rangeLength = rangeEnd - rangeStart

    // Calculate point for this bucket
    let maxArea = -1
    let maxAreaPoint = rangeStart

    for (let j = rangeStart; j < rangeEnd; j++) {
      // Calculate triangle area over three buckets
      const area = Math.abs(
        (data[a].x - avgX) * (data[j].y - data[a].y) -
        (data[a].x - data[j].x) * (avgY - data[a].y)
      ) * 0.5

      if (area > maxArea) {
        maxArea = area
        maxAreaPoint = j
      }
    }

    sampled.push(data[maxAreaPoint])
    a = maxAreaPoint
  }

  // Always add the last point
  sampled.push(data[dataLength - 1])

  return sampled
}

/**
 * Simple time-based decimation
 * Aggregates data points by time intervals
 * 
 * @param {Array} data - Array of {x, y} objects where x is Date/timestamp
 * @param {number} maxPoints - Maximum number of points to return
 * @returns {Array} Decimated array of {x, y} objects
 */
export function timeBasedDecimate(data, maxPoints) {
  if (!data || data.length <= maxPoints) {
    return data
  }

  const step = Math.ceil(data.length / maxPoints)
  const decimated = []

  for (let i = 0; i < data.length; i += step) {
    decimated.push(data[i])
  }

  // Always include the last point
  if (decimated[decimated.length - 1] !== data[data.length - 1]) {
    decimated.push(data[data.length - 1])
  }

  return decimated
}

/**
 * Adaptive sampling based on data size
 * Uses LTTB for time series, simple sampling for others
 * 
 * @param {Array} data - Array of {x, y} objects
 * @param {number} maxPoints - Maximum number of points (default: 2000)
 * @param {boolean} useLTTB - Whether to use LTTB algorithm (default: true)
 * @returns {Array} Sampled data array
 */
export function adaptiveSample(data, maxPoints = 2000, useLTTB = true) {
  if (!data || data.length <= maxPoints) {
    return data
  }

  if (useLTTB) {
    return lttbDownsample(data, maxPoints)
  } else {
    return timeBasedDecimate(data, maxPoints)
  }
}

/**
 * Prepare data for Plotly charts with optional decimation
 * Converts data format and applies sampling if needed
 * 
 * @param {Array} rawData - Raw data array (format: [{Date/timestamp, value}, ...])
 * @param {number} maxPoints - Maximum points before decimation (default: 2000)
 * @param {boolean} enableSampling - Whether to enable sampling (default: true)
 * @returns {Object} {x: Array, y: Array} format for Plotly
 */
export function prepareChartData(rawData, maxPoints = 2000, enableSampling = true) {
  if (!rawData || rawData.length === 0) {
    return { x: [], y: [] }
  }

  // Extract x and y values
  const dataPoints = rawData.map((d, index) => ({
    x: d.Date || d.timestamp || d.x || index,
    y: d.equity !== undefined ? d.equity : (d.Equity !== undefined ? d.Equity : (d.y !== undefined ? d.y : d.value))
  }))

  // Apply sampling if enabled and data exceeds threshold
  const sampledData = enableSampling && dataPoints.length > maxPoints
    ? adaptiveSample(dataPoints, maxPoints, true)
    : dataPoints

  // Convert to Plotly format
  const x = sampledData.map(d => {
    const xVal = d.x
    return xVal instanceof Date ? xVal : new Date(xVal)
  })
  const y = sampledData.map(d => d.y)

  return { x, y, originalLength: rawData.length, sampledLength: sampledData.length }
}

/**
 * Determine if WebGL should be used based on data size
 * 
 * @param {number} dataLength - Number of data points
 * @param {number} threshold - Threshold for WebGL (default: 500)
 * @returns {boolean} Whether to use WebGL (scattergl)
 */
export function shouldUseWebGL(dataLength, threshold = 500) {
  return dataLength > threshold
}

/**
 * Get optimal chart type based on data size and type
 * 
 * @param {string} baseType - Base chart type ('scatter', 'bar', etc.)
 * @param {number} dataLength - Number of data points
 * @returns {string} Chart type to use (e.g., 'scattergl' for large datasets)
 */
export function getOptimalChartType(baseType, dataLength) {
  if (baseType === 'scatter' && shouldUseWebGL(dataLength)) {
    return 'scattergl'
  }
  return baseType
}
