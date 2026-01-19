import { PlotlyAdapter } from './adapters/PlotlyAdapter'
import { TradingViewAdapter } from './adapters/TradingViewAdapter'
import { chartLibraryStorage } from '../utils/chartLibraryStorage'

/**
 * Chart Factory
 * Creates and returns the appropriate chart adapter based on user settings
 */
class ChartFactory {
  constructor() {
    this.adapters = {
      plotly: new PlotlyAdapter(),
      tradingview: new TradingViewAdapter(),
    }
  }

  /**
   * Get the current chart adapter based on user settings
   * @returns {PlotlyAdapter|TradingViewAdapter} The active adapter
   */
  getAdapter() {
    const library = chartLibraryStorage.get()
    return this.adapters[library] || this.adapters.plotly
  }

  /**
   * Get a specific adapter by library name
   * @param {string} library - Library name ('plotly' or 'tradingview')
   * @returns {PlotlyAdapter|TradingViewAdapter} The requested adapter
   */
  getAdapterByLibrary(library) {
    return this.adapters[library] || this.adapters.plotly
  }

  /**
   * Render equity curve chart using the current adapter
   */
  renderEquityCurve(data, benchmarkData, options = {}) {
    return this.getAdapter().renderEquityCurve(data, benchmarkData, options)
  }

  /**
   * Render drawdown chart using the current adapter
   */
  renderDrawdown(data, options = {}) {
    return this.getAdapter().renderDrawdown(data, options)
  }

  /**
   * Render candlestick/OHLC chart using the current adapter
   */
  renderCandlestick(data, chartType, options = {}) {
    return this.getAdapter().renderCandlestick(data, chartType, options)
  }

  /**
   * Render line series chart using the current adapter
   */
  renderLineSeries(data, options = {}) {
    return this.getAdapter().renderLineSeries(data, options)
  }

  /**
   * Render area series chart using the current adapter
   */
  renderAreaSeries(data, options = {}) {
    return this.getAdapter().renderAreaSeries(data, options)
  }

  /**
   * Render indicators using the current adapter
   */
  renderIndicators(indicators, dates, options = {}) {
    return this.getAdapter().renderIndicators(indicators, dates, options)
  }

  /**
   * Render heatmap chart using the current adapter
   */
  renderHeatmap(data, options = {}) {
    return this.getAdapter().renderHeatmap(data, options)
  }

  /**
   * Render histogram chart using the current adapter
   */
  renderHistogram(data, options = {}) {
    return this.getAdapter().renderHistogram(data, options)
  }
}

// Export singleton instance
export const chartFactory = new ChartFactory()

// Export class for testing
export { ChartFactory }
