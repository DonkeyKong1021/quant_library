import { useMemo } from 'react'
import { Box, Typography, Paper, Grid, Chip } from '@mui/material'

/**
 * Component to display current indicator values and signal interpretations
 */
export default function IndicatorStatistics({ data, indicators }) {
  const statistics = useMemo(() => {
    if (!data || data.length === 0) return null

    const lastIndex = data.length - 1
    const closes = data.map((d) => d.Close)
    const highs = data.map((d) => d.High)
    const lows = data.map((d) => d.Low)
    const volumes = data.map((d) => d.Volume || 0)
    const lastClose = closes[lastIndex]

    const stats = []

    // Helper functions (simplified calculations for current values)
    const calculateSMA = (prices, window) => {
      if (prices.length < window) return null
      const slice = prices.slice(-window)
      return slice.reduce((a, b) => a + b, 0) / window
    }

    const calculateRSI = (prices, window) => {
      if (prices.length < window + 1) return null
      const deltas = []
      for (let i = prices.length - window; i < prices.length; i++) {
        deltas.push(prices[i] - prices[i - 1])
      }
      const gains = deltas.filter(d => d > 0).reduce((a, b) => a + b, 0) / window
      const losses = -deltas.filter(d => d < 0).reduce((a, b) => a + b, 0) / window
      if (losses === 0) return 100
      const rs = gains / losses
      return 100 - (100 / (1 + rs))
    }

    if (indicators.sma) {
      const smaValue = calculateSMA(closes, indicators.sma.window)
      if (smaValue !== null) {
        const signal = lastClose > smaValue ? 'Bullish' : 'Bearish'
        stats.push({
          name: `SMA(${indicators.sma.window})`,
          value: smaValue.toFixed(2),
          signal,
          color: lastClose > smaValue ? 'success' : 'error',
        })
      }
    }

    if (indicators.rsi) {
      const rsiValue = calculateRSI(closes, indicators.rsi.window)
      if (rsiValue !== null) {
        let signal = 'Neutral'
        let color = 'default'
        if (rsiValue > 70) {
          signal = 'Overbought'
          color = 'error'
        } else if (rsiValue < 30) {
          signal = 'Oversold'
          color = 'success'
        }
        stats.push({
          name: `RSI(${indicators.rsi.window})`,
          value: rsiValue.toFixed(2),
          signal,
          color,
        })
      }
    }

    if (indicators.macd) {
      // Simplified MACD calculation for current value
      const fast = indicators.macd.fast || 12
      const slow = indicators.macd.slow || 26
      const emaFast = calculateSMA(closes, fast)
      const emaSlow = calculateSMA(closes, slow)
      if (emaFast !== null && emaSlow !== null) {
        const macdValue = emaFast - emaSlow
        const signal = macdValue > 0 ? 'Bullish' : 'Bearish'
        stats.push({
          name: 'MACD',
          value: macdValue.toFixed(4),
          signal,
          color: macdValue > 0 ? 'success' : 'error',
        })
      }
    }

    if (indicators.adx) {
      // Simplified ADX - would need full calculation for accurate value
      stats.push({
        name: `ADX(${indicators.adx.window})`,
        value: 'N/A',
        signal: 'Trend Strength',
        color: 'info',
      })
    }

    if (indicators.bollingerBands) {
      const window = indicators.bollingerBands.window || 20
      const numStd = indicators.bollingerBands.numStd || 2.0
      const sma = calculateSMA(closes, window)
      if (sma !== null) {
        const slice = closes.slice(-window)
        const mean = sma
        const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / window
        const stdDev = Math.sqrt(variance)
        const upper = mean + numStd * stdDev
        const lower = mean - numStd * stdDev
        
        let signal = 'Neutral'
        let color = 'default'
        if (lastClose > upper) {
          signal = 'Above Upper Band'
          color = 'error'
        } else if (lastClose < lower) {
          signal = 'Below Lower Band'
          color = 'success'
        }
        stats.push({
          name: 'Bollinger Bands',
          value: `${lastClose.toFixed(2)} (Upper: ${upper.toFixed(2)}, Lower: ${lower.toFixed(2)})`,
          signal,
          color,
        })
      }
    }

    if (indicators.vwap) {
      // VWAP calculation for current value
      let cumulativeTPV = 0
      let cumulativeVolume = 0
      for (let i = 0; i <= lastIndex; i++) {
        const tp = (highs[i] + lows[i] + closes[i]) / 3
        cumulativeTPV += tp * volumes[i]
        cumulativeVolume += volumes[i]
      }
      if (cumulativeVolume > 0) {
        const vwapValue = cumulativeTPV / cumulativeVolume
        const signal = lastClose > vwapValue ? 'Above VWAP' : 'Below VWAP'
        stats.push({
          name: 'VWAP',
          value: vwapValue.toFixed(2),
          signal,
          color: lastClose > vwapValue ? 'success' : 'error',
        })
      }
    }

    return stats
  }, [data, indicators])

  if (!statistics || statistics.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Enable indicators to see statistics
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Indicator Statistics
      </Typography>
      <Grid container spacing={2}>
        {statistics.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Box
              sx={{
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                backgroundColor: 'background.paper',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {stat.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {stat.value}
              </Typography>
              <Chip
                label={stat.signal}
                color={stat.color}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  )
}
