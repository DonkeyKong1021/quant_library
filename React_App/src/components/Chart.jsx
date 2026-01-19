import { useMemo, useRef, useEffect, memo } from 'react'
import Plot from 'react-plotly.js'
import Plotly from 'plotly.js'

const Chart = memo(function Chart({ data, type = 'equity', onChartReady, benchmarkData }) {
  const plotDivRef = useRef(null)

  const plotData = useMemo(() => {
    if (!data || data.length === 0) return null

    if (type === 'equity') {
      const dates = data.map((d) => new Date(d.Date || d.timestamp))
      const equity = data.map((d) => d.equity || d.Equity)

      const traces = [
        {
          x: dates,
          y: equity,
          type: 'scatter',
          mode: 'lines',
          name: 'Strategy',
          line: { color: '#1976d2', width: 2 },
        },
      ]
      
      // Add benchmark data if provided
      if (benchmarkData && benchmarkData.length > 0) {
        const benchmarkDates = benchmarkData.map((d) => new Date(d.Date || d.timestamp))
        const benchmarkEquity = benchmarkData.map((d) => d.equity || d.Equity)
        
        traces.push({
          x: benchmarkDates,
          y: benchmarkEquity,
          type: 'scatter',
          mode: 'lines',
          name: 'Benchmark (SPY)',
          line: { color: '#ff9800', width: 2, dash: 'dash' },
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

  return (
    <div ref={plotDivRef}>
      <Plot
        data={plotData}
        layout={{
          title: type === 'equity' ? 'Equity Curve' : 'Chart',
          xaxis: { title: 'Date' },
          yaxis: { title: 'Value' },
          autosize: true,
          height: 400,
        }}
        style={{ width: '100%', height: '400px' }}
        useResizeHandler={true}
      />
    </div>
  )
})

export default Chart