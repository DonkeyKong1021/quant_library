import { useMemo, useRef, useEffect, memo } from 'react'
import Plot from 'react-plotly.js'
import Plotly from 'plotly.js'
import { Box } from '@mui/material'
import { prepareChartData, getOptimalChartType } from '../utils/chartUtils'
import { useThemeMode } from '../contexts/ThemeContext'
import { getChartLayout, getChartColors, getChartConfig } from '../theme/chartTheme'

const Chart = memo(function Chart({ data, type = 'equity', onChartReady, benchmarkData, title }) {
  const plotDivRef = useRef(null)
  const { mode, isDark } = useThemeMode()
  const colors = getChartColors(mode)

  const plotData = useMemo(() => {
    if (!data || data.length === 0) return null

    if (type === 'equity') {
      // Prepare and optimize data
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

      // Add benchmark data if provided
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
    }

    if (type === 'drawdown') {
      const chartData = prepareChartData(data, 2000, true)
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
    }

    return null
  }, [data, type, benchmarkData, colors, isDark])

  const plotlyLayout = useMemo(() => {
    const layout = getChartLayout(mode, {
      title: title || (type === 'equity' ? 'Equity Curve' : type === 'drawdown' ? 'Drawdown' : 'Chart'),
      xAxisTitle: 'Date',
      yAxisTitle: type === 'drawdown' ? 'Drawdown (%)' : 'Value ($)',
      height: 400,
    })

    return {
      ...layout,
      showlegend: type === 'equity' && benchmarkData,
      legend: {
        ...layout.legend,
        x: 0,
        y: 1,
        xanchor: 'left',
        yanchor: 'top',
        orientation: 'h',
      },
    }
  }, [mode, type, benchmarkData, title])

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
          height: 400,
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
        style={{ width: '100%', height: '400px' }}
        useResizeHandler={true}
      />
    </Box>
  )
})

export default Chart
