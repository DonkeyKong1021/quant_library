import { useMemo } from 'react'
import { Grid, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableRow, Box } from '@mui/material'
import { useThemeMode } from '../contexts/ThemeContext'

export default function DataStatistics({ data }) {
  const { isDark } = useThemeMode()
  
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null

    const closes = data.map((d) => d.Close)
    const volumes = data.map((d) => d.Volume || 0)

    // Price statistics (single pass)
    const priceSum = closes.reduce((a, b) => a + b, 0)
    const sortedCloses = [...closes].sort((a, b) => a - b)
    const priceStats = {
      current: closes[closes.length - 1],
      min: sortedCloses[0],
      max: sortedCloses[sortedCloses.length - 1],
      mean: priceSum / closes.length,
      median: sortedCloses[Math.floor(closes.length / 2)],
    }

    // Calculate returns (single pass)
    const returns = []
    for (let i = 1; i < closes.length; i++) {
      returns.push((closes[i] - closes[i - 1]) / closes[i - 1])
    }

    // Optimized return statistics (single pass)
    let returnStats = null
    if (returns.length > 0) {
      const returnMean = returns.reduce((a, b) => a + b, 0) / returns.length
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - returnMean, 2), 0) / returns.length
      const positiveCount = returns.filter((r) => r > 0).length
      
      returnStats = {
        mean: returnMean,
        std: Math.sqrt(variance),
        min: Math.min(...returns),
        max: Math.max(...returns),
        positive: positiveCount,
        negative: returns.length - positiveCount,
      }
    }

    // Volume statistics (single pass)
    const volumeSum = volumes.reduce((a, b) => a + b, 0)
    const volumeStats = volumeSum > 0 ? {
      mean: volumeSum / volumes.length,
      min: Math.min(...volumes),
      max: Math.max(...volumes),
      total: volumeSum,
    } : null

    // Performance metrics
    const totalReturn = (closes[closes.length - 1] / closes[0]) - 1
    const annualReturn = returnStats ? returnStats.mean * 252 * 100 : 0
    const volatility = returnStats ? returnStats.std * Math.sqrt(252) * 100 : 0
    const sharpe = returnStats && returnStats.std > 0 ? (returnStats.mean / returnStats.std) * Math.sqrt(252) : 0

    // Drawdown (single pass)
    let maxDrawdown = 0
    let peak = closes[0]
    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > peak) peak = closes[i]
      const drawdown = (closes[i] / peak) - 1
      if (drawdown < maxDrawdown) maxDrawdown = drawdown
    }
    maxDrawdown *= 100

    // Date range
    const dateRange = data.length > 0 ? {
      start: new Date(data[0].Date),
      end: new Date(data[data.length - 1].Date),
    } : null

    return {
      priceStats,
      returnStats,
      volumeStats,
      totalReturn: totalReturn * 100,
      annualReturn,
      volatility,
      sharpe,
      maxDrawdown,
      dataPoints: data.length,
      dateRange,
      dateRangeDays: dateRange ? Math.floor((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24)) : 0,
    }
  }, [data])

  if (!stats) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No statistics available</Typography>
      </Box>
    )
  }

  return (
    <Grid container spacing={2}>
      {/* Quick Overview */}
      <Grid item xs={12}>
        <Paper 
          sx={{ 
            p: 2.5, 
            borderRadius: 2,
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            backgroundImage: 'none',
          }}
          elevation={0}
        >
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2.5 }}>
            Quick Overview
          </Typography>
          <Grid container spacing={3}>
            {[
              { label: 'Current Price', value: `$${stats.priceStats.current.toFixed(2)}`, sublabel: `Total Change: ${stats.totalReturn >= 0 ? '+' : ''}${stats.totalReturn.toFixed(2)}%`, highlight: true },
              { label: '52W High', value: `$${stats.priceStats.max.toFixed(2)}`, sublabel: `52W Low: $${stats.priceStats.min.toFixed(2)}` },
              { label: 'Volatility (Annual)', value: `${stats.volatility.toFixed(2)}%`, sublabel: `Annual Return: ${stats.annualReturn.toFixed(2)}%` },
              { label: 'Data Points', value: stats.dataPoints.toLocaleString(), sublabel: `Time Span: ${stats.dateRangeDays} days` },
              { label: 'Sharpe Ratio', value: stats.sharpe.toFixed(2), sublabel: `Max Drawdown: ${stats.maxDrawdown.toFixed(2)}%` },
            ].map((item, index) => (
              <Grid item xs={12} sm={6} md={2.4} key={index}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block', mb: 0.5 }}>
                    {item.label}
                  </Typography>
                  <Typography 
                    variant={item.highlight ? 'h6' : 'h6'} 
                    sx={{ 
                      fontWeight: item.highlight ? 700 : 600,
                      color: item.highlight ? 'primary.main' : 'text.primary',
                      mb: 0.5,
                    }}
                  >
                    {item.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {item.sublabel}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>

      {/* Detailed Statistics */}
      <Grid item xs={12} md={4}>
        <Paper 
          sx={{ 
            p: 2.5, 
            borderRadius: 2,
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            backgroundImage: 'none',
            height: '100%',
          }}
          elevation={0}
        >
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Price Statistics
          </Typography>
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, py: 1.25 } }}>
              <TableBody>
                {[
                  { label: 'Current Price', value: `$${stats.priceStats.current.toFixed(2)}` },
                  { label: 'Price Range', value: `$${stats.priceStats.min.toFixed(2)} - $${stats.priceStats.max.toFixed(2)}` },
                  { label: 'Average Price', value: `$${stats.priceStats.mean.toFixed(2)}` },
                  { label: 'Median Price', value: `$${stats.priceStats.median.toFixed(2)}` },
                ].map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontWeight: 500 }}>{row.label}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{row.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* Returns Statistics */}
      {stats.returnStats && (
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 2.5, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              backgroundImage: 'none',
              height: '100%',
            }}
            elevation={0}
          >
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Returns Statistics
            </Typography>
            <TableContainer>
              <Table size="small" sx={{ '& .MuiTableCell-root': { borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, py: 1.25 } }}>
                <TableBody>
                  {[
                    { label: 'Mean', value: `${(stats.returnStats.mean * 100).toFixed(4)}%` },
                    { label: 'Std Dev', value: `${(stats.returnStats.std * 100).toFixed(4)}%` },
                    { label: 'Min', value: `${(stats.returnStats.min * 100).toFixed(2)}%` },
                    { label: 'Max', value: `${(stats.returnStats.max * 100).toFixed(2)}%` },
                    { 
                      label: 'Positive Days', 
                      value: `${stats.returnStats.positive} (${((stats.returnStats.positive / (stats.returnStats.positive + stats.returnStats.negative)) * 100).toFixed(1)}%)` 
                    },
                    { 
                      label: 'Negative Days', 
                      value: `${stats.returnStats.negative} (${((stats.returnStats.negative / (stats.returnStats.positive + stats.returnStats.negative)) * 100).toFixed(1)}%)` 
                    },
                  ].map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 500 }}>{row.label}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{row.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      )}

      {/* Volume Statistics */}
      {stats.volumeStats && (
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 2.5, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              backgroundImage: 'none',
              height: '100%',
            }}
            elevation={0}
          >
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Volume Statistics
            </Typography>
            <TableContainer>
              <Table size="small" sx={{ '& .MuiTableCell-root': { borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, py: 1.25 } }}>
                <TableBody>
                  {[
                    { label: 'Average Volume', value: Math.round(stats.volumeStats.mean).toLocaleString() },
                    { label: 'Max Volume', value: Math.round(stats.volumeStats.max).toLocaleString() },
                    { label: 'Min Volume', value: Math.round(stats.volumeStats.min).toLocaleString() },
                    { label: 'Total Volume', value: Math.round(stats.volumeStats.total).toLocaleString() },
                  ].map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 500 }}>{row.label}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{row.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      )}
    </Grid>
  )
}
