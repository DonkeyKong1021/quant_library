import { useMemo } from 'react'
import { Grid, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material'

export default function DataStatistics({ data }) {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null

    const closes = data.map((d) => d.Close)
    const opens = data.map((d) => d.Open)
    const highs = data.map((d) => d.High)
    const lows = data.map((d) => d.Low)
    const volumes = data.map((d) => d.Volume || 0)

    // Price statistics
    const priceStats = {
      current: closes[closes.length - 1],
      min: Math.min(...closes),
      max: Math.max(...closes),
      mean: closes.reduce((a, b) => a + b, 0) / closes.length,
      median: [...closes].sort((a, b) => a - b)[Math.floor(closes.length / 2)],
    }

    // Calculate returns
    const returns = []
    for (let i = 1; i < closes.length; i++) {
      returns.push((closes[i] - closes[i - 1]) / closes[i - 1])
    }

    const returnStats = returns.length > 0 ? {
      mean: returns.reduce((a, b) => a + b, 0) / returns.length,
      std: Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - (returns.reduce((a, b) => a + b, 0) / returns.length), 2), 0) / returns.length),
      min: Math.min(...returns),
      max: Math.max(...returns),
      positive: returns.filter((r) => r > 0).length,
      negative: returns.filter((r) => r < 0).length,
    } : null

    // Volume statistics
    const volumeStats = volumes.some((v) => v > 0) ? {
      mean: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      min: Math.min(...volumes),
      max: Math.max(...volumes),
      total: volumes.reduce((a, b) => a + b, 0),
    } : null

    // Performance metrics
    const totalReturn = (closes[closes.length - 1] / closes[0]) - 1
    const annualReturn = returnStats ? returnStats.mean * 252 * 100 : 0
    const volatility = returnStats ? returnStats.std * Math.sqrt(252) * 100 : 0
    const sharpe = returnStats && returnStats.std > 0 ? (returnStats.mean / returnStats.std) * Math.sqrt(252) : 0

    // Drawdown
    let maxDrawdown = 0
    let peak = closes[0]
    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > peak) peak = closes[i]
      const drawdown = (closes[i] / peak) - 1
      if (drawdown < maxDrawdown) maxDrawdown = drawdown
    }
    maxDrawdown *= 100

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
      dateRange: data.length > 0 ? {
        start: new Date(data[0].Date),
        end: new Date(data[data.length - 1].Date),
      } : null,
    }
  }, [data])

  if (!stats) {
    return <Typography>No statistics available</Typography>
  }

  const dateRangeDays = stats.dateRange
    ? Math.floor((stats.dateRange.end - stats.dateRange.start) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <Grid container spacing={3}>
      {/* Quick Overview */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Quick Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography variant="caption" color="text.secondary">
                Current Price
              </Typography>
              <Typography variant="h6">${stats.priceStats.current.toFixed(2)}</Typography>
              <Typography variant="caption" color="text.secondary">
                Total Change: {stats.totalReturn >= 0 ? '+' : ''}{stats.totalReturn.toFixed(2)}%
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography variant="caption" color="text.secondary">
                52W High
              </Typography>
              <Typography variant="h6">${stats.priceStats.max.toFixed(2)}</Typography>
              <Typography variant="caption" color="text.secondary">
                52W Low: ${stats.priceStats.min.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography variant="caption" color="text.secondary">
                Volatility (Annual)
              </Typography>
              <Typography variant="h6">{stats.volatility.toFixed(2)}%</Typography>
              <Typography variant="caption" color="text.secondary">
                Annual Return: {stats.annualReturn.toFixed(2)}%
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography variant="caption" color="text.secondary">
                Data Points
              </Typography>
              <Typography variant="h6">{stats.dataPoints.toLocaleString()}</Typography>
              <Typography variant="caption" color="text.secondary">
                Time Span: {dateRangeDays} days
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography variant="caption" color="text.secondary">
                Sharpe Ratio
              </Typography>
              <Typography variant="h6">{stats.sharpe.toFixed(2)}</Typography>
              <Typography variant="caption" color="text.secondary">
                Max Drawdown: {stats.maxDrawdown.toFixed(2)}%
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Price Statistics */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            Price Statistics
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Current Price</TableCell>
                  <TableCell align="right">${stats.priceStats.current.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Price Range</TableCell>
                  <TableCell align="right">
                    ${stats.priceStats.min.toFixed(2)} - ${stats.priceStats.max.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Average Price</TableCell>
                  <TableCell align="right">${stats.priceStats.mean.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Median Price</TableCell>
                  <TableCell align="right">${stats.priceStats.median.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* Returns Statistics */}
      {stats.returnStats && (
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Returns Statistics
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Mean</TableCell>
                    <TableCell align="right">{(stats.returnStats.mean * 100).toFixed(4)}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Std Dev</TableCell>
                    <TableCell align="right">{(stats.returnStats.std * 100).toFixed(4)}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Min</TableCell>
                    <TableCell align="right">{(stats.returnStats.min * 100).toFixed(2)}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Max</TableCell>
                    <TableCell align="right">{(stats.returnStats.max * 100).toFixed(2)}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Positive Days</TableCell>
                    <TableCell align="right">
                      {stats.returnStats.positive} ({stats.returnStats.positive + stats.returnStats.negative > 0 ? ((stats.returnStats.positive / (stats.returnStats.positive + stats.returnStats.negative)) * 100).toFixed(1) : 0}%)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Negative Days</TableCell>
                    <TableCell align="right">
                      {stats.returnStats.negative} ({stats.returnStats.positive + stats.returnStats.negative > 0 ? ((stats.returnStats.negative / (stats.returnStats.positive + stats.returnStats.negative)) * 100).toFixed(1) : 0}%)
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      )}

      {/* Volume Statistics */}
      {stats.volumeStats && (
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Volume Statistics
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Average Volume</TableCell>
                    <TableCell align="right">{Math.round(stats.volumeStats.mean).toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Max Volume</TableCell>
                    <TableCell align="right">{Math.round(stats.volumeStats.max).toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Min Volume</TableCell>
                    <TableCell align="right">{Math.round(stats.volumeStats.min).toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Volume</TableCell>
                    <TableCell align="right">{Math.round(stats.volumeStats.total).toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      )}
    </Grid>
  )
}
