import { designTokens } from './index'

/**
 * Get Plotly layout configuration based on theme mode
 */
export const getChartLayout = (mode, options = {}) => {
  const isDark = mode === 'dark'
  const { title, xAxisTitle, yAxisTitle, height = 400 } = options

  return {
    title: title
      ? {
          text: title,
          font: {
            family: 'Inter, Roboto, sans-serif',
            size: 16,
            color: isDark ? '#f1f5f9' : '#0f172a',
            weight: 600,
          },
        }
      : undefined,
    autosize: true,
    height,
    margin: { l: 60, r: 40, t: title ? 60 : 40, b: 60 },
    hovermode: 'x unified',
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      family: 'Inter, Roboto, sans-serif',
      color: isDark ? '#94a3b8' : '#475569',
    },
    xaxis: {
      title: xAxisTitle
        ? {
            text: xAxisTitle,
            font: { size: 12, color: isDark ? '#94a3b8' : '#64748b' },
          }
        : undefined,
      gridcolor: isDark
        ? designTokens.colors.chart.grid.dark
        : designTokens.colors.chart.grid.light,
      gridwidth: 1,
      linecolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      tickfont: { size: 11, color: isDark ? '#94a3b8' : '#64748b' },
      zerolinecolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
    },
    yaxis: {
      title: yAxisTitle
        ? {
            text: yAxisTitle,
            font: { size: 12, color: isDark ? '#94a3b8' : '#64748b' },
          }
        : undefined,
      gridcolor: isDark
        ? designTokens.colors.chart.grid.dark
        : designTokens.colors.chart.grid.light,
      gridwidth: 1,
      linecolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      tickfont: { size: 11, color: isDark ? '#94a3b8' : '#64748b' },
      zerolinecolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
    },
    legend: {
      font: { size: 12, color: isDark ? '#cbd5e1' : '#334155' },
      bgcolor: 'transparent',
      bordercolor: 'transparent',
    },
    hoverlabel: {
      bgcolor: isDark ? '#334155' : '#1e293b',
      bordercolor: isDark ? '#475569' : '#334155',
      font: {
        family: 'Inter, Roboto, sans-serif',
        size: 12,
        color: '#f1f5f9',
      },
    },
  }
}

/**
 * Get chart color scheme based on theme mode
 */
export const getChartColors = (mode) => {
  const isDark = mode === 'dark'
  return {
    equity: isDark
      ? designTokens.colors.chart.equity.dark
      : designTokens.colors.chart.equity.light,
    benchmark: isDark
      ? designTokens.colors.chart.benchmark.dark
      : designTokens.colors.chart.benchmark.light,
    drawdown: isDark
      ? designTokens.colors.chart.drawdown.dark
      : designTokens.colors.chart.drawdown.light,
    positive: isDark
      ? designTokens.colors.chart.positive.dark
      : designTokens.colors.chart.positive.light,
    negative: isDark
      ? designTokens.colors.chart.negative.dark
      : designTokens.colors.chart.negative.light,
    // Additional colors for multi-series charts
    series: isDark
      ? ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#22d3ee']
      : ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'],
  }
}

/**
 * Get Plotly config options
 */
export const getChartConfig = () => ({
  responsive: true,
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
  toImageButtonOptions: {
    format: 'png',
    width: 1200,
    height: 600,
    scale: 2,
  },
})

/**
 * Create equity curve trace
 */
export const createEquityTrace = (data, mode, name = 'Strategy') => {
  const colors = getChartColors(mode)
  return {
    x: data.map((d) => d.date || d.Date),
    y: data.map((d) => d.equity || d.value),
    type: 'scatter',
    mode: 'lines',
    name,
    line: {
      color: colors.equity,
      width: 2,
      shape: 'spline',
      smoothing: 0.3,
    },
    hovertemplate: `<b>${name}</b><br>Date: %{x}<br>Value: $%{y:,.2f}<extra></extra>`,
  }
}

/**
 * Create benchmark trace
 */
export const createBenchmarkTrace = (data, mode, name = 'Benchmark (SPY)') => {
  const colors = getChartColors(mode)
  return {
    x: data.map((d) => d.date || d.Date),
    y: data.map((d) => d.equity || d.value),
    type: 'scatter',
    mode: 'lines',
    name,
    line: {
      color: colors.benchmark,
      width: 2,
      dash: 'dot',
    },
    hovertemplate: `<b>${name}</b><br>Date: %{x}<br>Value: $%{y:,.2f}<extra></extra>`,
  }
}

/**
 * Create drawdown trace
 */
export const createDrawdownTrace = (data, mode) => {
  const colors = getChartColors(mode)
  return {
    x: data.map((d) => d.date || d.Date),
    y: data.map((d) => (d.drawdown || d.value) * 100),
    type: 'scatter',
    mode: 'lines',
    name: 'Drawdown',
    fill: 'tozeroy',
    fillcolor: `${colors.drawdown}20`,
    line: {
      color: colors.drawdown,
      width: 1.5,
    },
    hovertemplate: '<b>Drawdown</b><br>Date: %{x}<br>Drawdown: %{y:.2f}%<extra></extra>',
  }
}

export default {
  getChartLayout,
  getChartColors,
  getChartConfig,
  createEquityTrace,
  createBenchmarkTrace,
  createDrawdownTrace,
}
