import { useRef, useEffect, useMemo } from 'react'
import { createChart, ColorType } from 'lightweight-charts'
import { Box } from '@mui/material'
import { getChartColors } from '../../theme/chartTheme'

/**
 * Convert date to TradingView time format
 * TradingView accepts Unix timestamp (number) or YYYY-MM-DD (string) for daily data
 */
function formatTime(date) {
  if (!date) {
    return null // Return null for invalid dates, will be filtered out
  }
  
  if (typeof date === 'string') {
    // If it's already a string in YYYY-MM-DD format, return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }
    // If it's an ISO datetime string, extract just the date part
    if (/^\d{4}-\d{2}-\d{2}T/.test(date)) {
      return date.split('T')[0] // Extract YYYY-MM-DD from ISO string
    }
    // Otherwise parse it
    try {
      const parsedDate = new Date(date)
      if (isNaN(parsedDate.getTime())) {
        return null // Invalid date
      }
      return parsedDate.toISOString().split('T')[0] // YYYY-MM-DD format
    } catch (e) {
      return null // Error parsing date
    }
  }
  
  if (date instanceof Date) {
    if (isNaN(date.getTime())) {
      return null // Invalid date
    }
    return date.toISOString().split('T')[0] // YYYY-MM-DD format
  }
  
  // If it's a number (Unix timestamp in seconds), return as-is for intraday
  // But for daily data, we should convert to YYYY-MM-DD string
  if (typeof date === 'number') {
    // For daily charts, convert timestamp to date string
    // Assume timestamps are in seconds (if in milliseconds, divide by 1000)
    const dateObj = date > 1e12 ? new Date(date) : new Date(date * 1000)
    if (isNaN(dateObj.getTime())) {
      return null
    }
    return dateObj.toISOString().split('T')[0] // Convert to YYYY-MM-DD
  }
  
  return null // Unknown format
}

/**
 * TradingView Chart Adapter
 * Uses TradingView Lightweight Charts library for financial charting
 */
export class TradingViewAdapter {
  /**
   * Render equity curve chart
   */
  renderEquityCurve(data, benchmarkData, options = {}) {
    const { mode = 'light', title, height = 400 } = options
    const colors = getChartColors(mode)
    const isDark = mode === 'dark'

    const EquityChart = () => {
      const chartContainerRef = useRef(null)
      const chartRef = useRef(null)
      const seriesRefs = useRef([])

      // Memoize colors to avoid recreating on every render
      const chartColors = useMemo(() => colors, [mode])

      // Prepare data for TradingView format
      const strategyData = useMemo(() => {
        if (!data || data.length === 0) return []
        return data
          .map((d) => {
            // Try multiple date field names (timestamp, Date, date)
            const time = formatTime(d.timestamp || d.Date || d.date)
            const value = d.equity !== undefined ? d.equity : d.value || d.Equity
            if (time === null || value === null || value === undefined || isNaN(value)) {
              return null
            }
            return { time, value }
          })
          .filter((d) => d !== null && d !== undefined) // Filter out invalid entries
          .filter((d) => d.time !== null && d.time !== undefined) // Double-check time is valid
      }, [data])

      const benchmarkDataFormatted = useMemo(() => {
        if (!benchmarkData || benchmarkData.length === 0) return null
        const formatted = benchmarkData
          .map((d) => {
            // Try multiple date field names (timestamp, Date, date)
            const time = formatTime(d.timestamp || d.Date || d.date)
            const value = d.equity !== undefined ? d.equity : d.value || d.Equity
            if (time === null || value === null || value === undefined || isNaN(value)) {
              return null
            }
            return { time, value }
          })
          .filter((d) => d !== null && d !== undefined) // Filter out invalid entries
          .filter((d) => d.time !== null && d.time !== undefined) // Double-check time is valid
        return formatted.length > 0 ? formatted : null
      }, [benchmarkData])

      // Create chart once on mount
      useEffect(() => {
        if (!chartContainerRef.current) return

        const container = chartContainerRef.current
        const chart = createChart(container, {
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: isDark ? '#94a3b8' : '#475569',
          },
          grid: {
            vertLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            horzLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          },
          width: container.clientWidth || 800,
          height: height,
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
          },
        })

        chartRef.current = chart
        seriesRefs.current = []

        // Handle resize
        const handleResize = () => {
          if (container && chartRef.current) {
            chartRef.current.applyOptions({
              width: container.clientWidth,
            })
          }
        }
        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
          if (chartRef.current) {
            chartRef.current.remove()
            chartRef.current = null
          }
          seriesRefs.current = []
        }
      }, [isDark, height]) // Only recreate chart when theme or height changes

      // Update data when data changes
      useEffect(() => {
        if (!chartRef.current) return
        
        // Validate data before proceeding
        if (!strategyData || strategyData.length === 0) return

        // Remove old series
        seriesRefs.current.forEach(series => {
          if (chartRef.current && series) {
            try {
              chartRef.current.removeSeries(series)
            } catch (e) {
              console.warn('Error removing series:', e)
            }
          }
        })
        seriesRefs.current = []

        // Add main equity series
        try {
          const lineSeries = chartRef.current.addLineSeries({
            color: chartColors.equity,
            lineWidth: 2,
            title: 'Strategy',
          })
          lineSeries.setData(strategyData)
          seriesRefs.current.push(lineSeries)
        } catch (e) {
          console.error('Error setting strategy data:', e, strategyData.slice(0, 3))
          return
        }

        // Add benchmark if provided
        if (benchmarkDataFormatted && benchmarkDataFormatted.length > 0) {
          try {
            const benchmarkSeries = chartRef.current.addLineSeries({
              color: chartColors.benchmark,
              lineWidth: 2,
              lineStyle: 2, // Dashed
              title: 'Benchmark',
            })
            benchmarkSeries.setData(benchmarkDataFormatted)
            seriesRefs.current.push(benchmarkSeries)
          } catch (e) {
            console.error('Error setting benchmark data:', e, benchmarkDataFormatted.slice(0, 3))
          }
        }
      }, [strategyData, benchmarkDataFormatted, chartColors])

      if (!data || data.length === 0) {
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
          ref={chartContainerRef}
          sx={{
            height: `${height}px`,
            width: '100%',
            borderRadius: 2,
          }}
        />
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
      const chartContainerRef = useRef(null)
      const chartRef = useRef(null)
      const seriesRef = useRef(null)

      // Memoize colors
      const chartColors = useMemo(() => colors, [mode])

      // Prepare drawdown data
      const drawdownData = useMemo(() => {
        if (!data || data.length === 0) return []
        return data
          .map((d) => {
            // Try multiple date field names (timestamp, Date, date)
            const time = formatTime(d.timestamp || d.Date || d.date)
            const value = d.drawdown !== undefined ? d.drawdown : d.value
            if (time === null || value === null || value === undefined || isNaN(value)) {
              return null
            }
            return { time, value: value * 100 }
          })
          .filter((d) => d !== null && d !== undefined) // Filter out invalid entries
          .filter((d) => d.time !== null && d.time !== undefined) // Double-check time is valid
      }, [data])

      // Create chart once on mount
      useEffect(() => {
        if (!chartContainerRef.current) return

        const container = chartContainerRef.current
        const chart = createChart(container, {
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: isDark ? '#94a3b8' : '#475569',
          },
          grid: {
            vertLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            horzLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          },
          width: container.clientWidth || 800,
          height: height,
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
          },
        })

        chartRef.current = chart

        const handleResize = () => {
          if (container && chartRef.current) {
            chartRef.current.applyOptions({
              width: container.clientWidth,
            })
          }
        }
        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
          if (chartRef.current) {
            chartRef.current.remove()
            chartRef.current = null
          }
          seriesRef.current = null
        }
      }, [isDark, height])

      // Update data when data changes
      useEffect(() => {
        if (!chartRef.current || drawdownData.length === 0) return

        // Remove old series if exists
        if (seriesRef.current && chartRef.current) {
          chartRef.current.removeSeries(seriesRef.current)
        }

        // Add area series for drawdown
        const areaSeries = chartRef.current.addAreaSeries({
          lineColor: chartColors.drawdown,
          topColor: chartColors.drawdown,
          bottomColor: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)',
          lineWidth: 2,
          title: 'Drawdown',
        })
        areaSeries.setData(drawdownData)
        seriesRef.current = areaSeries
      }, [drawdownData, chartColors, isDark])

      if (!data || data.length === 0) {
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
          ref={chartContainerRef}
          sx={{
            height: `${height}px`,
            width: '100%',
            borderRadius: 2,
          }}
        />
      )
    }

    return <DrawdownChart />
  }

  /**
   * Render candlestick/OHLC chart
   */
  renderCandlestick(data, chartType = 'candlestick', options = {}) {
    const { mode = 'light', title, height = 400, indicators } = options
    const isDark = mode === 'dark'

    const CandlestickChart = () => {
      const chartContainerRef = useRef(null)
      const chartRef = useRef(null)
      const seriesRefs = useRef([])

      // Prepare OHLC data
      const ohlcData = useMemo(() => {
        if (!data || data.length === 0) return []
        return data
          .map((d) => {
            // Try multiple date field names (timestamp, Date, date)
            const time = formatTime(d.timestamp || d.Date || d.date)
            const open = d.open || d.Open
            const high = d.high || d.High
            const low = d.low || d.Low
            const close = d.close || d.Close
            if (
              time === null ||
              open === null ||
              open === undefined ||
              isNaN(open) ||
              high === null ||
              high === undefined ||
              isNaN(high) ||
              low === null ||
              low === undefined ||
              isNaN(low) ||
              close === null ||
              close === undefined ||
              isNaN(close)
            ) {
              return null
            }
            return { time, open, high, low, close }
          })
          .filter((d) => d !== null && d !== undefined) // Filter out invalid entries
          .filter((d) => d.time !== null && d.time !== undefined) // Double-check time is valid
      }, [data])

      // Create chart once on mount
      useEffect(() => {
        if (!chartContainerRef.current) return

        const container = chartContainerRef.current
        const chart = createChart(container, {
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: isDark ? '#94a3b8' : '#475569',
          },
          grid: {
            vertLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            horzLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          },
          width: container.clientWidth || 800,
          height: height,
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
          },
        })

        chartRef.current = chart
        seriesRefs.current = []

        const handleResize = () => {
          if (container && chartRef.current) {
            chartRef.current.applyOptions({
              width: container.clientWidth,
            })
          }
        }
        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
          if (chartRef.current) {
            chartRef.current.remove()
            chartRef.current = null
          }
          seriesRefs.current = []
        }
      }, [isDark, height])

      // Update chart data and indicators
      useEffect(() => {
        if (!chartRef.current || ohlcData.length === 0) return

        // Remove old series
        seriesRefs.current.forEach(series => {
          if (chartRef.current) {
            chartRef.current.removeSeries(series)
          }
        })
        seriesRefs.current = []

        // Add price series based on chart type
        if (chartType === 'candlestick' || chartType === 'heikinashi') {
          const candlestickSeries = chartRef.current.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
          })
          candlestickSeries.setData(ohlcData)
          seriesRefs.current.push(candlestickSeries)
        } else if (chartType === 'ohlc') {
          // TradingView doesn't have OHLC bars, use candlestick
          const ohlcSeries = chartRef.current.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
          })
          ohlcSeries.setData(ohlcData)
          seriesRefs.current.push(ohlcSeries)
        } else if (chartType === 'line') {
          const lineData = ohlcData.map((d) => ({ time: d.time, value: d.close }))
          const lineSeries = chartRef.current.addLineSeries({
            color: isDark ? '#f1f5f9' : '#0f172a',
            lineWidth: 2,
          })
          lineSeries.setData(lineData)
          seriesRefs.current.push(lineSeries)
        } else if (chartType === 'area') {
          const areaData = ohlcData.map((d) => ({ time: d.time, value: d.close }))
          const areaSeries = chartRef.current.addAreaSeries({
            lineColor: '#1976d2',
            topColor: '#1976d2',
            bottomColor: 'rgba(25, 118, 210, 0.2)',
            lineWidth: 2,
          })
          areaSeries.setData(areaData)
          seriesRefs.current.push(areaSeries)
        }

        // Add indicators if provided
        if (indicators && ohlcData.length > 0) {
          const dates = ohlcData.map(d => d.time)

          if (indicators.sma && indicators.sma.values) {
            const smaData = dates.map((time, i) => ({
              time,
              value: indicators.sma.values[i],
            })).filter((d) => d.value !== null && d.value !== undefined)
            if (smaData.length > 0) {
              const smaSeries = chartRef.current.addLineSeries({
                color: '#2196f3',
                lineWidth: 2,
                title: `SMA(${indicators.sma.window})`,
              })
              smaSeries.setData(smaData)
              seriesRefs.current.push(smaSeries)
            }
          }

          if (indicators.ema && indicators.ema.values) {
            const emaData = dates.map((time, i) => ({
              time,
              value: indicators.ema.values[i],
            })).filter((d) => d.value !== null && d.value !== undefined)
            if (emaData.length > 0) {
              const emaSeries = chartRef.current.addLineSeries({
                color: '#ff9800',
                lineWidth: 2,
                title: `EMA(${indicators.ema.window})`,
              })
              emaSeries.setData(emaData)
              seriesRefs.current.push(emaSeries)
            }
          }

          if (indicators.bollingerBands) {
            const bb = indicators.bollingerBands
            if (bb.upper && bb.middle && bb.lower) {
              const upperData = dates.map((time, i) => ({
                time,
                value: bb.upper[i],
              })).filter((d) => d.value !== null && d.value !== undefined)
              
              const middleData = dates.map((time, i) => ({
                time,
                value: bb.middle[i],
              })).filter((d) => d.value !== null && d.value !== undefined)
              
              const lowerData = dates.map((time, i) => ({
                time,
                value: bb.lower[i],
              })).filter((d) => d.value !== null && d.value !== undefined)

              if (upperData.length > 0) {
                const upperSeries = chartRef.current.addLineSeries({
                  color: '#808080',
                  lineWidth: 1,
                  lineStyle: 2, // Dashed
                  title: 'BB Upper',
                })
                upperSeries.setData(upperData)
                seriesRefs.current.push(upperSeries)
              }
              
              if (middleData.length > 0) {
                const middleSeries = chartRef.current.addLineSeries({
                  color: '#808080',
                  lineWidth: 1,
                  lineStyle: 3, // Dotted
                  title: 'BB Middle',
                })
                middleSeries.setData(middleData)
                seriesRefs.current.push(middleSeries)
              }
              
              if (lowerData.length > 0) {
                const lowerSeries = chartRef.current.addLineSeries({
                  color: '#808080',
                  lineWidth: 1,
                  lineStyle: 2, // Dashed
                  title: 'BB Lower',
                })
                lowerSeries.setData(lowerData)
                seriesRefs.current.push(lowerSeries)
              }
            }
          }
        }
      }, [ohlcData, chartType, indicators, isDark])

      if (!data || data.length === 0) {
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
          ref={chartContainerRef}
          sx={{
            height: `${height}px`,
            width: '100%',
            borderRadius: 2,
          }}
        />
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
    const isDark = mode === 'dark'

    const AreaChart = () => {
      const chartContainerRef = useRef(null)
      const chartRef = useRef(null)
      const seriesRef = useRef(null)

      // Memoize colors
      const chartColors = useMemo(() => colors, [mode])

      // Prepare area data
      const areaData = useMemo(() => {
        if (!data || data.length === 0) return []
        return data
          .map((d) => {
            // Try multiple date field names (timestamp, Date, date)
            const time = formatTime(d.timestamp || d.Date || d.date)
            const value = d.equity !== undefined ? d.equity : d.value || d.Equity
            if (time === null || value === null || value === undefined || isNaN(value)) {
              return null
            }
            return { time, value }
          })
          .filter((d) => d !== null && d !== undefined) // Filter out invalid entries
          .filter((d) => d.time !== null && d.time !== undefined) // Double-check time is valid
      }, [data])

      // Create chart once on mount
      useEffect(() => {
        if (!chartContainerRef.current) return

        const container = chartContainerRef.current
        const chart = createChart(container, {
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: isDark ? '#94a3b8' : '#475569',
          },
          grid: {
            vertLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            horzLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          },
          width: container.clientWidth || 800,
          height: height,
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
          },
        })

        chartRef.current = chart

        const handleResize = () => {
          if (container && chartRef.current) {
            chartRef.current.applyOptions({
              width: container.clientWidth,
            })
          }
        }
        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
          if (chartRef.current) {
            chartRef.current.remove()
            chartRef.current = null
          }
          seriesRef.current = null
        }
      }, [isDark, height])

      // Update data when data changes
      useEffect(() => {
        if (!chartRef.current || areaData.length === 0) return

        // Remove old series if exists
        if (seriesRef.current && chartRef.current) {
          chartRef.current.removeSeries(seriesRef.current)
        }

        const areaSeries = chartRef.current.addAreaSeries({
          lineColor: chartColors.equity,
          topColor: chartColors.equity,
          bottomColor: `${chartColors.equity}33`,
          lineWidth: 2,
        })
        areaSeries.setData(areaData)
        seriesRef.current = areaSeries
      }, [areaData, chartColors])

      if (!data || data.length === 0) {
        return <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No data available
        </Box>
      }

      return (
        <Box
          ref={chartContainerRef}
          sx={{
            height: `${height}px`,
            width: '100%',
            borderRadius: 2,
          }}
        />
      )
    }

    return <AreaChart />
  }

  /**
   * Render indicators (handled within renderCandlestick for TradingView)
   */
  renderIndicators(indicators, dates, options = {}) {
    // Indicators are rendered as part of the main chart in TradingView
    return []
  }

  /**
   * Render heatmap chart (TradingView doesn't have native heatmap, return placeholder)
   */
  renderHeatmap(data, options = {}) {
    const { height = 400 } = options
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        Heatmap charts are not available in TradingView Lightweight Charts.
        Please use Plotly for heatmap charts.
      </Box>
    )
  }

  /**
   * Render histogram chart (TradingView doesn't have native histogram, return placeholder)
   */
  renderHistogram(data, options = {}) {
    const { height = 400 } = options
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        Histogram charts are not available in TradingView Lightweight Charts.
        Please use Plotly for histogram charts.
      </Box>
    )
  }
}
