import { useMemo, useRef, useEffect, memo } from 'react'
import Plot from 'react-plotly.js'
import Plotly from 'plotly.js'
import { prepareChartData, getOptimalChartType } from '../utils/chartUtils'

const Chart = memo(function Chart({ data, type = 'equity', onChartReady, benchmarkData }) {
  const plotDivRef = useRef(null)

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
          line: { color: '#1976d2', width: 2 },
          hovertemplate: 'Date: %{x}<br>Equity: $%{y:,.2f}<extra></extra>',
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
          line: { color: '#ff9800', width: 2, dash: 'dash' },
          hovertemplate: 'Date: %{x}<br>Benchmark: $%{y:,.2f}<extra></extra>',
        })
      }
      
      return traces
    }

    return null
  }, [data, type, benchmarkData])

  useEffect(() => {
    if (onChartReady && plotDivRef.current) {
      // Wait for Plot to render, then find the graph div
      const timer = setTimeout(() => {
        // react-plotly.js creates a div with class 'js-plotly-plot' inside our ref
        const plotElement = plotDivRef.current?.querySelector('.js-plotly-plot')
        if (plotElement) {
          const handleExportImage = async (format = 'png') => {
            try {
              // Use the plotly graph div element for export
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
      }, 1000) // Increased timeout to ensure plot is fully rendered
      return () => clearTimeout(timer)
    }
  }, [plotData, onChartReady])

  if (!plotData) {
    return <div>No data available for chart</div>
  }

  const plotlyConfig = useMemo(() => ({
    responsive: true,
    doubleClick: 'reset+autosize',
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    toImageButtonOptions: {
      format: 'png',
      width: 1200,
      height: 600,
      scale: 2,
    },
  }), [])

  const plotlyLayout = useMemo(() => ({
    title: type === 'equity' ? 'Equity Curve' : 'Chart',
    xaxis: { title: 'Date' },
    yaxis: { title: 'Value' },
    autosize: true,
    height: 400,
    hovermode: 'x unified',
    template: 'plotly_white',
  }), [type])

  return (
    <div ref={plotDivRef}>
      <Plot
        data={plotData}
        layout={plotlyLayout}
        config={plotlyConfig}
        style={{ width: '100%', height: '400px' }}
        useResizeHandler={true}
      />
    </div>
  )
})

export default Chart