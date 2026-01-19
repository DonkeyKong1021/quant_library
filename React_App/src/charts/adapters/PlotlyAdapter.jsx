import { useMemo, useRef, useEffect } from 'react'
import Plot from 'react-plotly.js'
import Plotly from 'plotly.js'
import { Box } from '@mui/material'
import { prepareChartData, getOptimalChartType } from '../../utils/chartUtils'
import { getChartLayout, getChartColors, getChartConfig } from '../../theme/chartTheme'

/**
 * Plotly Chart Adapter
 * Wraps existing Plotly chart implementations into the adapter interface
 */
export class PlotlyAdapter {
  /**
   * Render equity curve chart
   */
  renderEquityCurve(data, benchmarkData, options = {}) {
    const { mode = 'light', title, height = 400, onChartReady } = options
    const colors = getChartColors(mode)
    const isDark = mode === 'dark'

    // Internal component that uses Plotly
    const EquityChart = () => {
      const plotDivRef = useRef(null)
      
      const plotData = useMemo(() => {
        if (!data || data.length === 0) return null

        const strategyData = prepareChartData(data, 2000, true)
        const chartType = getOptimalChartType('scatter', strategyData.x.length)

        const traces = [
          {
            x: strategyData.x,
            y: strategyData.y,
            type: chartType,
            mode: 'lines',
            name: 'Strategy',
            line: {
              color: colors.equity,
              width: 2.5,
              shape: 'spline',
              smoothing: 0.3,
            },
            hovertemplate: '<b>Strategy</b><br>Date: %{x}<br>Equity: $%{y:,.2f}<extra></extra>',
          },
        ]

        if (benchmarkData && benchmarkData.length > 0) {
          const benchmarkDataPrepared = prepareChartData(benchmarkData, 2000, true)
          const benchmarkChartType = getOptimalChartType('scatter', benchmarkDataPrepared.x.length)

          traces.push({
            x: benchmarkDataPrepared.x,
            y: benchmarkDataPrepared.y,
            type: benchmarkChartType,
            mode: 'lines',
            name: 'Benchmark (SPY)',
            line: {
              color: colors.benchmark,
              width: 2,
              dash: 'dot',
            },
            hovertemplate: '<b>Benchmark (SPY)</b><br>Date: %{x}<br>Value: $%{y:,.2f}<extra></extra>',
          })
        }

        return traces
      }, [data, benchmarkData, colors])

      const plotlyLayout = useMemo(() => {
        const layout = getChartLayout(mode, {
          title: title || 'Equity Curve',
          xAxisTitle: 'Date',
          yAxisTitle: 'Value ($)',
          height,
        })

        return {
          ...layout,
          showlegend: !!benchmarkData,
          legend: {
            ...layout.legend,
            x: 0,
            y: 1,
            xanchor: 'left',
            yanchor: 'top',
            orientation: 'h',
          },
        }
      }, [mode, benchmarkData, title, height])

      const plotlyConfig = useMemo(() => getChartConfig(), [])

      useEffect(() => {
        if (onChartReady && plotDivRef.current) {
          const timer = setTimeout(() => {
            const plotElement = plotDivRef.current?.querySelector('.js-plotly-plot')
            if (plotElement) {
              const handleExportImage = async (format = 'png') => {
                try {
                  return await Plotly.toImage(plotElement, {
                    format: format,
                    width: 1200,
                    height: 600,
                    scale: 2,
                  })
                } catch (error) {
                  console.error('Error exporting chart:', error)
                  return null
                }
              }
              onChartReady({ exportImage: handleExportImage })
            }
          }, 1000)
          return () => clearTimeout(timer)
        }
      }, [plotData, onChartReady])

      if (!plotData) {
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height,
              color: 'text.secondary',
              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            No data available for chart
          </Box>
        )
      }

      return (
        <Box
          ref={plotDivRef}
          sx={{
            '& .js-plotly-plot': {
              borderRadius: 2,
            },
            '& .modebar': {
              backgroundColor: 'transparent !important',
            },
            '& .modebar-btn': {
              color: isDark ? 'rgba(255,255,255,0.6) !important' : 'rgba(0,0,0,0.5) !important',
              '&:hover': {
                color: isDark ? 'rgba(255,255,255,0.9) !important' : 'rgba(0,0,0,0.8) !important',
              },
            },
          }}
        >
          <Plot
            data={plotData}
            layout={plotlyLayout}
            config={plotlyConfig}
            style={{ width: '100%', height: `${height}px` }}
            useResizeHandler={true}
          />
        </Box>
      )
    }

    return <EquityChart />
  }

  /**
   * Render drawdown chart
   */
  renderDrawdown(data, options = {}) {
    const { mode = 'light', title, height = 400 } = options
    const colors = getChartColors(mode)
    const isDark = mode === 'dark'

    const DrawdownChart = () => {
      const chartData = useMemo(() => prepareChartData(data, 2000, true), [data])
      
      const plotData = useMemo(() => {
        if (!chartData || chartData.x.length === 0) return null
        return [
          {
            x: chartData.x,
            y: chartData.y.map((v) => v * 100),
            type: 'scatter',
            mode: 'lines',
            name: 'Drawdown',
            fill: 'tozeroy',
            fillcolor: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)',
            line: {
              color: colors.drawdown,
              width: 1.5,
            },
            hovertemplate: '<b>Drawdown</b><br>Date: %{x}<br>Drawdown: %{y:.2f}%<extra></extra>',
          },
        ]
      }, [chartData, colors, isDark])

      const plotlyLayout = useMemo(() => {
        return getChartLayout(mode, {
          title: title || 'Drawdown',
          xAxisTitle: 'Date',
          yAxisTitle: 'Drawdown (%)',
          height,
        })
      }, [mode, title, height])

      const plotlyConfig = useMemo(() => getChartConfig(), [])

      if (!plotData) {
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height,
              color: 'text.secondary',
              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            No data available for chart
          </Box>
        )
      }

      return (
        <Box
          sx={{
            '& .js-plotly-plot': {
              borderRadius: 2,
            },
            '& .modebar': {
              backgroundColor: 'transparent !important',
            },
            '& .modebar-btn': {
              color: isDark ? 'rgba(255,255,255,0.6) !important' : 'rgba(0,0,0,0.5) !important',
            },
          }}
        >
          <Plot
            data={plotData}
            layout={plotlyLayout}
            config={plotlyConfig}
            style={{ width: '100%', height: `${height}px` }}
            useResizeHandler={true}
          />
        </Box>
      )
    }

    return <DrawdownChart />
  }

  /**
   * Render candlestick/OHLC chart
   * Note: This is a simplified version - full implementation should handle indicators
   */
  renderCandlestick(data, chartType = 'candlestick', options = {}) {
    const { mode = 'light', title, height = 400 } = options
    const isDark = mode === 'dark'

    const CandlestickChart = () => {
      const plotData = useMemo(() => {
        if (!data || data.length === 0) return null

        const dates = data.map((d) => new Date(d.date || d.Date))
        const opens = data.map((d) => d.open || d.Open)
        const highs = data.map((d) => d.high || d.High)
        const lows = data.map((d) => d.low || d.Low)
        const closes = data.map((d) => d.close || d.Close)

        const traces = []

        if (chartType === 'candlestick' || chartType === 'heikinashi') {
          traces.push({
            x: dates,
            open: opens,
            high: highs,
            low: lows,
            close: closes,
            type: 'candlestick',
            name: chartType === 'heikinashi' ? 'Heikin Ashi' : 'Price',
            increasing: { line: { color: '#26a69a' } },
            decreasing: { line: { color: '#ef5350' } },
          })
        } else if (chartType === 'ohlc') {
          traces.push({
            x: dates,
            open: opens,
            high: highs,
            low: lows,
            close: closes,
            type: 'ohlc',
            name: 'Price',
            increasing: { line: { color: '#26a69a' } },
            decreasing: { line: { color: '#ef5350' } },
          })
        } else if (chartType === 'line') {
          traces.push({
            x: dates,
            y: closes,
            type: 'scatter',
            mode: 'lines',
            name: 'Close',
            line: { width: 2, color: isDark ? '#f1f5f9' : '#0f172a' },
          })
        } else if (chartType === 'area') {
          traces.push({
            x: dates,
            y: closes,
            type: 'scatter',
            mode: 'lines',
            name: 'Close',
            fill: 'tozeroy',
            fillcolor: 'rgba(25, 118, 210, 0.2)',
            line: { width: 2, color: '#1976d2' },
          })
        }

        return traces
      }, [data, chartType, isDark])

      const plotlyLayout = useMemo(() => {
        return getChartLayout(mode, {
          title: title || 'Price Chart',
          xAxisTitle: 'Date',
          yAxisTitle: 'Price ($)',
          height,
        })
      }, [mode, title, height])

      const plotlyConfig = useMemo(() => getChartConfig(), [])

      if (!plotData) {
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height,
              color: 'text.secondary',
              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            No data available for chart
          </Box>
        )
      }

      return (
        <Box
          sx={{
            '& .js-plotly-plot': {
              borderRadius: 2,
            },
          }}
        >
          <Plot
            data={plotData}
            layout={plotlyLayout}
            config={plotlyConfig}
            style={{ width: '100%', height: `${height}px` }}
            useResizeHandler={true}
          />
        </Box>
      )
    }

    return <CandlestickChart />
  }

  /**
   * Render line series chart
   */
  renderLineSeries(data, options = {}) {
    return this.renderEquityCurve(data, null, options)
  }

  /**
   * Render area series chart
   */
  renderAreaSeries(data, options = {}) {
    const { mode = 'light', title, height = 400 } = options
    const colors = getChartColors(mode)

    const AreaChart = () => {
      const chartData = useMemo(() => prepareChartData(data, 2000, true), [data])
      
      const plotData = useMemo(() => {
        if (!chartData || chartData.x.length === 0) return null
        return [
          {
            x: chartData.x,
            y: chartData.y,
            type: 'scatter',
            mode: 'lines',
            name: 'Value',
            fill: 'tozeroy',
            fillcolor: `${colors.equity}33`,
            line: {
              color: colors.equity,
              width: 2,
            },
          },
        ]
      }, [chartData, colors])

      const plotlyLayout = useMemo(() => {
        return getChartLayout(mode, {
          title: title || 'Area Chart',
          xAxisTitle: 'Date',
          yAxisTitle: 'Value',
          height,
        })
      }, [mode, title, height])

      const plotlyConfig = useMemo(() => getChartConfig(), [])

      if (!plotData) {
        return <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No data available
        </Box>
      }

      return (
        <Box>
          <Plot
            data={plotData}
            layout={plotlyLayout}
            config={plotlyConfig}
            style={{ width: '100%', height: `${height}px` }}
            useResizeHandler={true}
          />
        </Box>
      )
    }

    return <AreaChart />
  }

  /**
   * Render indicators (returns empty array for now - handled by parent component)
   */
  renderIndicators(indicators, dates, options = {}) {
    // Indicators are typically rendered as part of the main chart in Plotly
    // This method exists for interface compliance but returns empty
    return []
  }

  /**
   * Render heatmap chart
   */
  renderHeatmap(data, options = {}) {
    const { mode = 'light', title, height = 400 } = options

    const HeatmapChart = () => {
      const plotData = useMemo(() => {
        if (!data) return null
        return [
          {
            z: data.z || data,
            type: 'heatmap',
            colorscale: 'RdYlGn',
            zmid: 0,
          },
        ]
      }, [data])

      const plotlyLayout = useMemo(() => {
        return getChartLayout(mode, {
          title: title || 'Heatmap',
          height,
        })
      }, [mode, title, height])

      const plotlyConfig = useMemo(() => getChartConfig(), [])

      if (!plotData) {
        return <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No data available
        </Box>
      }

      return (
        <Box>
          <Plot
            data={plotData}
            layout={plotlyLayout}
            config={plotlyConfig}
            style={{ width: '100%', height: `${height}px` }}
            useResizeHandler={true}
          />
        </Box>
      )
    }

    return <HeatmapChart />
  }

  /**
   * Render histogram chart
   */
  renderHistogram(data, options = {}) {
    const { mode = 'light', title, height = 400 } = options

    const HistogramChart = () => {
      const plotData = useMemo(() => {
        if (!data || data.length === 0) return null
        return [
          {
            x: data,
            type: 'histogram',
            nbinsx: 50,
            marker: {
              color: mode === 'dark' ? '#60a5fa' : '#2563eb',
            },
          },
        ]
      }, [data, mode])

      const plotlyLayout = useMemo(() => {
        return getChartLayout(mode, {
          title: title || 'Distribution',
          xAxisTitle: 'Value',
          yAxisTitle: 'Frequency',
          height,
        })
      }, [mode, title, height])

      const plotlyConfig = useMemo(() => getChartConfig(), [])

      if (!plotData) {
        return <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No data available
        </Box>
      }

      return (
        <Box>
          <Plot
            data={plotData}
            layout={plotlyLayout}
            config={plotlyConfig}
            style={{ width: '100%', height: `${height}px` }}
            useResizeHandler={true}
          />
        </Box>
      )
    }

    return <HistogramChart />
  }
}
