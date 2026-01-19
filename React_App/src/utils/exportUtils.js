/**
 * Export utility functions for backtest results
 */

export const exportMetricsToCSV = (metrics, symbol, strategyName) => {
  const headers = ['Metric', 'Value']
  const rows = Object.entries(metrics).map(([key, value]) => [
    key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    typeof value === 'number' ? value.toFixed(4) : value,
  ])
  
  const csvContent = [
    `Symbol: ${symbol}`,
    `Strategy: ${strategyName || 'Unknown'}`,
    `Date: ${new Date().toISOString().split('T')[0]}`,
    '',
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')
  
  return csvContent
}

export const exportTradesToCSV = (trades, symbol) => {
  if (!trades || trades.length === 0) {
    return 'No trades to export'
  }
  
  const headers = ['Timestamp', 'Symbol', 'Quantity', 'Direction', 'Price', 'Commission']
  const rows = trades.map((trade) => [
    new Date(trade.timestamp || trade.Date).toISOString().split('T')[0],
    trade.symbol || symbol,
    trade.quantity || trade.Quantity || '',
    trade.direction || trade.Direction || '',
    typeof trade.price === 'number' ? trade.price.toFixed(2) : trade.Price || '',
    typeof trade.commission === 'number' ? trade.commission.toFixed(2) : trade.Commission || '',
  ])
  
  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
  return csvContent
}

export const exportEquityCurveToCSV = (equityCurve, symbol) => {
  if (!equityCurve || equityCurve.length === 0) {
    return 'No equity curve data to export'
  }
  
  const headers = ['Date', 'Equity', 'Returns', 'Cumulative Returns']
  const rows = equityCurve.map((point, index) => {
    const date = new Date(point.timestamp || point.Date || point.Date).toISOString().split('T')[0]
    const equity = typeof point.equity === 'number' ? point.equity.toFixed(2) : (point.Equity || point.equity || '')
    let returns = ''
    let cumulativeReturns = ''
    
    if (index > 0) {
      const prevEquity = typeof equityCurve[index - 1].equity === 'number' 
        ? equityCurve[index - 1].equity 
        : (equityCurve[index - 1].Equity || equityCurve[index - 1].equity)
      const currEquity = typeof point.equity === 'number' ? point.equity : (point.Equity || point.equity)
      if (prevEquity && currEquity && prevEquity > 0) {
        returns = ((currEquity - prevEquity) / prevEquity * 100).toFixed(4)
      }
    }
    
    const firstEquity = typeof equityCurve[0].equity === 'number'
      ? equityCurve[0].equity
      : (equityCurve[0].Equity || equityCurve[0].equity)
    const currEquity = typeof point.equity === 'number' ? point.equity : (point.Equity || point.equity)
    if (firstEquity && currEquity && firstEquity > 0) {
      cumulativeReturns = (((currEquity - firstEquity) / firstEquity) * 100).toFixed(4)
    }
    
    return [date, equity, returns, cumulativeReturns]
  })
  
  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
  return csvContent
}

export const exportResultsToJSON = (results, symbol, strategyName) => {
  const exportData = {
    symbol,
    strategy: strategyName || 'Unknown',
    exportDate: new Date().toISOString(),
    metrics: results.metrics || {},
    trades: results.trades || [],
    equityCurve: results.equity_curve || [],
  }
  
  return JSON.stringify(exportData, null, 2)
}

export const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
