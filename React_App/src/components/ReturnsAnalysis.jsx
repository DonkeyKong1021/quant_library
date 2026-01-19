import { useMemo } from 'react'
import Plot from 'react-plotly.js'
import { Box, Grid, Typography } from '@mui/material'
import { useThemeMode } from '../contexts/ThemeContext'
import { getChartLayout, getChartColors, getChartConfig } from '../theme/chartTheme'

export default function ReturnsAnalysis({ results }) {
  const { mode, isDark } = useThemeMode()
  const colors = getChartColors(mode)

  // Extract returns data - calculate from equity curve if not available
  const returnsData = useMemo(() => {
    if (!results) return null
    
    // Try to get returns directly
    if (results.returns && Array.isArray(results.returns) && results.returns.length > 0) {
      return results.returns.map((r, index) => ({
        date: r.Date || r.date || r.timestamp || index,
        return: typeof r === 'number' ? r : (r.return || r.value || r.returns || 0),
      }))
    }
    
    // Calculate returns from equity curve if available
    if (results.equity_curve && Array.isArray(results.equity_curve) && results.equity_curve.length > 1) {
      const equityData = results.equity_curve
      const returnsArray = []
      
      for (let i = 1; i < equityData.length; i++) {
        const prevEquity = equityData[i - 1].equity || equityData[i - 1].Equity || equityData[i - 1].value
        const currEquity = equityData[i].equity || equityData[i].Equity || equityData[i].value
        const date = equityData[i].Date || equityData[i].timestamp || equityData[i].date || i
        
        if (prevEquity && currEquity && prevEquity > 0) {
          const dailyReturn = (currEquity - prevEquity) / prevEquity
          returnsArray.push({
            date: date,
            return: dailyReturn,
          })
        }
      }
      
      return returnsArray.length > 0 ? returnsArray : null
    }
    
    return null
  }, [results])

  // Calculate cumulative returns
  const cumulativeReturnsData = useMemo(() => {
    if (!returnsData || returnsData.length === 0) return null

    let cumulative = 0
    return returnsData.map((point) => {
      cumulative = cumulative + point.return
      return {
        date: point.date,
        cumulative: cumulative,
      }
    })
  }, [returnsData])

  // Returns distribution histogram data
  const distributionData = useMemo(() => {
    if (!returnsData || returnsData.length === 0) return null

    // Extract return values as percentages
    const returnValues = returnsData.map((r) => r.return * 100)
    const meanReturn = returnValues.reduce((a, b) => a + b, 0) / returnValues.length

    return {
      values: returnValues,
      mean: meanReturn,
    }
  }, [returnsData])

  const distributionLayout = useMemo(() => {
    return getChartLayout(mode, {
      title: 'Returns Distribution',
      xAxisTitle: 'Daily Return (%)',
      yAxisTitle: 'Frequency',
      height: 400,
    })
  }, [mode])

  const cumulativeLayout = useMemo(() => {
    return getChartLayout(mode, {
      title: 'Cumulative Returns',
      xAxisTitle: 'Date',
      yAxisTitle: 'Cumulative Return (%)',
      height: 400,
    })
  }, [mode])

  const chartConfig = useMemo(() => getChartConfig(), [])

  if (!returnsData || returnsData.length === 0) {
    return (
      <Box
        sx={{
          p: 6,
          textAlign: 'center',
          backgroundColor: 'action.hover',
          borderRadius: 3,
          border: '1px dashed',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          No returns data available
        </Typography>
      </Box>
    )
  }

  return (
    <Grid container spacing={3}>
      {/* Returns Distribution */}
      <Grid item xs={12} md={6}>
        <Box sx={{ position: 'relative' }}>
          <Plot
            data={[
              {
                x: distributionData.values,
                type: 'histogram',
                nbinsx: 50,
                name: 'Returns',
                marker: {
                  color: colors.equity,
                  line: {
                    color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    width: 1,
                  },
                },
                hovertemplate: 'Return: %{x:.2f}%<br>Frequency: %{y}<extra></extra>',
              },
            ]}
            layout={{
              ...distributionLayout,
              shapes: [
                {
                  type: 'line',
                  xref: 'x',
                  yref: 'paper',
                  x0: distributionData.mean,
                  y0: 0,
                  x1: distributionData.mean,
                  y1: 1,
                  line: {
                    color: colors.drawdown || '#ef4444',
                    width: 2,
                    dash: 'dash',
                  },
                },
              ],
              annotations: [
                {
                  x: distributionData.mean,
                  y: 0.95,
                  xref: 'x',
                  yref: 'paper',
                  text: `Mean: ${distributionData.mean.toFixed(2)}%`,
                  showarrow: false,
                  font: {
                    color: colors.drawdown || '#ef4444',
                    size: 12,
                  },
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  bordercolor: colors.drawdown || '#ef4444',
                  borderwidth: 1,
                },
              ],
            }}
            config={chartConfig}
            style={{ width: '100%', height: '400px' }}
          />
        </Box>
      </Grid>

      {/* Cumulative Returns */}
      <Grid item xs={12} md={6}>
        <Box sx={{ position: 'relative' }}>
          <Plot
            data={[
              {
                x: cumulativeReturnsData.map((d) => new Date(d.date)),
                y: cumulativeReturnsData.map((d) => d.cumulative * 100),
                type: 'scatter',
                mode: 'lines',
                name: 'Cumulative Returns',
                line: {
                  color: colors.equity,
                  width: 2.5,
                  shape: 'spline',
                  smoothing: 0.3,
                },
                fill: 'tozeroy',
                fillcolor: isDark
                  ? 'rgba(59, 130, 246, 0.15)'
                  : 'rgba(37, 99, 235, 0.1)',
                hovertemplate: '<b>Cumulative Returns</b><br>Date: %{x}<br>Return: %{y:.2f}%<extra></extra>',
              },
            ]}
            layout={cumulativeLayout}
            config={chartConfig}
            style={{ width: '100%', height: '400px' }}
          />
        </Box>
      </Grid>
    </Grid>
  )
}
