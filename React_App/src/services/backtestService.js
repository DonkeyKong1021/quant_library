import api from './api'

export const backtestService = {
  async runBacktest({ data, strategy, config, symbol, name }) {
    const response = await api.post('/api/backtest/run', {
      name,
      data,
      strategy,
      config,
      symbol,
    })
    return response.data
  },

  async getBacktestResults(resultId) {
    const response = await api.get(`/api/backtest/results/${resultId}`)
    return response.data
  },

  async listBacktestResults(filterParams = {}) {
    const {
      limit = 100,
      offset = 0,
      symbol,
      strategy_name,
      start_date,
      end_date,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = filterParams

    const params = new URLSearchParams()
    params.append('limit', limit.toString())
    params.append('offset', offset.toString())
    params.append('sort_by', sort_by)
    params.append('sort_order', sort_order)
    
    if (symbol) params.append('symbol', symbol)
    if (strategy_name) params.append('strategy_name', strategy_name)
    if (start_date) params.append('start_date', start_date)
    if (end_date) params.append('end_date', end_date)

    const response = await api.get(`/api/backtest/results?${params.toString()}`)
    return response.data
  },

  async updateBacktestResult(resultId, updates) {
    const response = await api.patch(`/api/backtest/results/${resultId}`, updates)
    return response.data
  },

  async deleteBacktestResult(resultId) {
    const response = await api.delete(`/api/backtest/results/${resultId}`)
    return response.data
  },

  async compareBacktests(resultIds) {
    const response = await api.post('/api/backtest/compare', {
      result_ids: resultIds,
    })
    return response.data
  },

  async optimizeParameters({ data, strategy, config, symbol, parameterRanges, objective = 'sharpe_ratio', optimizationType = 'grid', maxCombinations = 100 }) {
    const response = await api.post('/api/backtest/optimize', {
      data,
      strategy,
      config,
      symbol,
      parameter_ranges: parameterRanges,
      objective,
      optimization_type: optimizationType,
      max_combinations: maxCombinations,
    })
    return response.data
  },

  async generateInsights({ metrics, strategyName, symbol, tradesSummary }) {
    const response = await api.post('/api/backtest/insights', {
      metrics,
      strategy_name: strategyName,
      symbol,
      trades_summary: tradesSummary,
    })
    return response.data
  },
}

export const strategyService = {
  async listStrategies() {
    const response = await api.get('/api/strategies/list')
    return response.data
  },

  async getStrategyParams(strategyName) {
    const response = await api.get(`/api/strategies/${strategyName}/params`)
    return response.data
  },
}