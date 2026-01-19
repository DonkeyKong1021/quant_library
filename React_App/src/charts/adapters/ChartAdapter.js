/**
 * Base Chart Adapter Interface
 * 
 * All chart adapters must implement these methods to provide
 * a consistent API across different charting libraries.
 * 
 * This is a documentation/contract file - adapters should
 * implement these methods as React components or functions.
 */

/**
 * Chart adapter options common to all chart types
 * @typedef {Object} ChartOptions
 * @property {string} theme - 'light' or 'dark'
 * @property {string} title - Chart title
 * @property {string} xAxisTitle - X-axis title
 * @property {string} yAxisTitle - Y-axis title
 * @property {number} height - Chart height in pixels
 * @property {Object} colors - Color scheme object
 */

/**
 * Equity curve data format
 * @typedef {Object} EquityDataPoint
 * @property {string|Date} date - Date or timestamp
 * @property {number} equity - Equity value
 */

/**
 * OHLC data point format
 * @typedef {Object} OHLCDataPoint
 * @property {string|Date} date - Date or timestamp
 * @property {number} open - Open price
 * @property {number} high - High price
 * @property {number} low - Low price
 * @property {number} close - Close price
 * @property {number} [volume] - Volume (optional)
 */

/**
 * Chart Adapter Interface
 * 
 * All adapters must provide these rendering methods.
 * Methods return React components or JSX elements.
 */
export class ChartAdapter {
  /**
   * Render an equity curve chart with optional benchmark
   * @param {EquityDataPoint[]} data - Equity curve data
   * @param {EquityDataPoint[]} [benchmarkData] - Optional benchmark data
   * @param {ChartOptions} options - Chart options
   * @returns {JSX.Element} React component
   */
  renderEquityCurve(data, benchmarkData, options) {
    throw new Error('renderEquityCurve must be implemented')
  }

  /**
   * Render a drawdown chart
   * @param {EquityDataPoint[]} data - Drawdown data (values should be percentages 0-1)
   * @param {ChartOptions} options - Chart options
   * @returns {JSX.Element} React component
   */
  renderDrawdown(data, options) {
    throw new Error('renderDrawdown must be implemented')
  }

  /**
   * Render a candlestick/OHLC chart
   * @param {OHLCDataPoint[]} data - OHLC data
   * @param {string} chartType - 'candlestick', 'ohlc', 'line', 'area', 'heikinashi'
   * @param {ChartOptions} options - Chart options
   * @returns {JSX.Element} React component
   */
  renderCandlestick(data, chartType, options) {
    throw new Error('renderCandlestick must be implemented')
  }

  /**
   * Render line series chart
   * @param {EquityDataPoint[]} data - Data points
   * @param {ChartOptions} options - Chart options
   * @returns {JSX.Element} React component
   */
  renderLineSeries(data, options) {
    throw new Error('renderLineSeries must be implemented')
  }

  /**
   * Render area series chart
   * @param {EquityDataPoint[]} data - Data points
   * @param {ChartOptions} options - Chart options
   * @returns {JSX.Element} React component
   */
  renderAreaSeries(data, options) {
    throw new Error('renderAreaSeries must be implemented')
  }

  /**
   * Render indicators overlay on a chart
   * @param {Object} indicators - Indicator configuration
   * @param {Object} indicators.sma - SMA config { window: number, values: number[] }
   * @param {Object} indicators.ema - EMA config { window: number, values: number[] }
   * @param {Object} indicators.bollingerBands - BB config { window: number, numStd: number, upper: number[], middle: number[], lower: number[] }
   * @param {Date[]} dates - Date array matching indicator values
   * @param {ChartOptions} options - Chart options
   * @returns {JSX.Element[]} Array of React components for each indicator
   */
  renderIndicators(indicators, dates, options) {
    throw new Error('renderIndicators must be implemented')
  }

  /**
   * Render heatmap chart
   * @param {Array} data - Heatmap data
   * @param {ChartOptions} options - Chart options
   * @returns {JSX.Element} React component
   */
  renderHeatmap(data, options) {
    throw new Error('renderHeatmap must be implemented')
  }

  /**
   * Render histogram/distribution chart
   * @param {number[]} data - Data values
   * @param {ChartOptions} options - Chart options
   * @returns {JSX.Element} React component
   */
  renderHistogram(data, options) {
    throw new Error('renderHistogram must be implemented')
  }
}
