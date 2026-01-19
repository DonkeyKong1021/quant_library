import { useMemo, memo } from 'react'
import { Box } from '@mui/material'
import Plot from 'react-plotly.js'

// Simple client-side indicator calculations
const calculateSMA = (prices, window) => {
  const result = []
  for (let i = 0; i < prices.length; i++) {
    if (i < window - 1) {
      result.push(null)
    } else {
      const slice = prices.slice(i - window + 1, i + 1)
      const sum = slice.reduce((a, b) => a + b, 0)
      result.push(sum / window)
    }
  }
  return result
}

const calculateEMA = (prices, window) => {
  const result = []
  const multiplier = 2 / (window + 1)
  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      result.push(prices[i])
    } else {
      result.push((prices[i] - result[i - 1]) * multiplier + result[i - 1])
    }
  }
  return result
}

const calculateRSI = (prices, window) => {
  const deltas = prices.map((price, i) => (i > 0 ? price - prices[i - 1] : 0))
  const gains = deltas.map((d) => (d > 0 ? d : 0))
  const losses = deltas.map((d) => (d < 0 ? -d : 0))
  
  const result = []
  for (let i = 0; i < prices.length; i++) {
    if (i < window) {
      result.push(null)
    } else {
      const avgGain = gains.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0) / window
      const avgLoss = losses.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0) / window
      if (avgLoss === 0) {
        result.push(100)
      } else {
        const rs = avgGain / avgLoss
        result.push(100 - 100 / (1 + rs))
      }
    }
  }
  return result
}

const calculateBollingerBands = (prices, window, numStd) => {
  const sma = calculateSMA(prices, window)
  const result = { upper: [], middle: [], lower: [] }
  
  for (let i = 0; i < prices.length; i++) {
    if (i < window - 1) {
      result.upper.push(null)
      result.middle.push(null)
      result.lower.push(null)
    } else {
      const slice = prices.slice(i - window + 1, i + 1)
      const mean = sma[i]
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / window
      const stdDev = Math.sqrt(variance)
      result.middle.push(mean)
      result.upper.push(mean + numStd * stdDev)
      result.lower.push(mean - numStd * stdDev)
    }
  }
  return result
}

const calculateMACD = (prices, fast, slow, signal) => {
  const emaFast = calculateEMA(prices, fast)
  const emaSlow = calculateEMA(prices, slow)
  const macdLine = emaFast.map((fast, i) => fast - emaSlow[i])
  const signalLine = calculateEMA(macdLine, signal)
  const histogram = macdLine.map((macd, i) => macd - signalLine[i])
  
  return { macd: macdLine, signal: signalLine, histogram }
}

const calculateStochastic = (highs, lows, closes, kWindow, dWindow) => {
  const result = { k: [], d: [] }
  
  for (let i = 0; i < closes.length; i++) {
    if (i < kWindow - 1) {
      result.k.push(null)
      result.d.push(null)
    } else {
      const sliceHigh = highs.slice(i - kWindow + 1, i + 1)
      const sliceLow = lows.slice(i - kWindow + 1, i + 1)
      const highestHigh = Math.max(...sliceHigh)
      const lowestLow = Math.min(...sliceLow)
      
      if (highestHigh === lowestLow) {
        result.k.push(50) // Neutral when range is zero
      } else {
        const kPercent = 100 * ((closes[i] - lowestLow) / (highestHigh - lowestLow))
        result.k.push(kPercent)
      }
    }
  }
  
  // Calculate %D (smoothed %K)
  for (let i = 0; i < result.k.length; i++) {
    if (i < dWindow - 1 || result.k[i] === null) {
      result.d.push(result.k[i])
    } else {
      const slice = result.k.slice(i - dWindow + 1, i + 1).filter(v => v !== null)
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length
      result.d.push(avg)
    }
  }
  
  return result
}

const calculateATR = (highs, lows, closes, window) => {
  const trueRanges = []
  
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      trueRanges.push(highs[i] - lows[i])
    } else {
      const tr1 = highs[i] - lows[i]
      const tr2 = Math.abs(highs[i] - closes[i - 1])
      const tr3 = Math.abs(lows[i] - closes[i - 1])
      trueRanges.push(Math.max(tr1, tr2, tr3))
    }
  }
  
  // Calculate ATR as moving average of TR
  const result = []
  for (let i = 0; i < trueRanges.length; i++) {
    if (i < window - 1) {
      result.push(null)
    } else {
      const slice = trueRanges.slice(i - window + 1, i + 1)
      const avg = slice.reduce((a, b) => a + b, 0) / window
      result.push(avg)
    }
  }
  
  return result
}

const calculateADX = (highs, lows, closes, window) => {
  // Simplified ADX calculation
  // Calculate +DM and -DM
  const plusDM = []
  const minusDM = []
  
  for (let i = 1; i < highs.length; i++) {
    const upMove = highs[i] - highs[i - 1]
    const downMove = lows[i - 1] - lows[i]
    
    if (upMove > downMove && upMove > 0) {
      plusDM.push(upMove)
      minusDM.push(0)
    } else if (downMove > upMove && downMove > 0) {
      plusDM.push(0)
      minusDM.push(downMove)
    } else {
      plusDM.push(0)
      minusDM.push(0)
    }
  }
  
  // Calculate True Range
  const tr = calculateATR(highs, lows, closes, 1)
  const trValues = tr.filter(v => v !== null)
  
  // Calculate +DI and -DI
  const result = []
  for (let i = 0; i < closes.length; i++) {
    if (i < window) {
      result.push(null)
    } else {
      // Simplified ADX - full implementation would smooth DI values
      const atrVal = trValues.slice(i - window, i).reduce((a, b) => a + b, 0) / window
      const plusDIAvg = plusDM.slice(i - window, i).reduce((a, b) => a + b, 0) / window
      const minusDIAvg = minusDM.slice(i - window, i).reduce((a, b) => a + b, 0) / window
      
      if (atrVal > 0) {
        const plusDI = 100 * (plusDIAvg / atrVal)
        const minusDI = 100 * (minusDIAvg / atrVal)
        const dx = 100 * Math.abs(plusDI - minusDI) / (plusDI + minusDI)
        result.push(dx)
      } else {
        result.push(0)
      }
    }
  }
  
  return result
}

const calculateOBV = (closes, volumes) => {
  const result = []
  let obv = 0
  
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      obv = volumes[i]
    } else {
      const change = closes[i] - closes[i - 1]
      if (change > 0) {
        obv += volumes[i]
      } else if (change < 0) {
        obv -= volumes[i]
      }
      // If change is 0, OBV stays the same
    }
    result.push(obv)
  }
  
  return result
}

const calculateVolumeSMA = (volumes, window) => {
  return calculateSMA(volumes, window)
}

const calculateVWAP = (highs, lows, closes, volumes) => {
  const result = []
  let cumulativeTPV = 0
  let cumulativeVolume = 0
  
  for (let i = 0; i < closes.length; i++) {
    const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3
    cumulativeTPV += typicalPrice * volumes[i]
    cumulativeVolume += volumes[i]
    
    if (cumulativeVolume > 0) {
      result.push(cumulativeTPV / cumulativeVolume)
    } else {
      result.push(null)
    }
  }
  
  return result
}

const calculateIchimoku = (highs, lows, closes, tenkan = 9, kijun = 26, senkou = 52) => {
  const result = {
    tenkan: [],
    kijun: [],
    senkouA: [],
    senkouB: [],
    chikou: []
  }
  
  // Tenkan-sen
  for (let i = 0; i < closes.length; i++) {
    if (i < tenkan - 1) {
      result.tenkan.push(null)
    } else {
      const sliceHigh = highs.slice(i - tenkan + 1, i + 1)
      const sliceLow = lows.slice(i - tenkan + 1, i + 1)
      result.tenkan.push((Math.max(...sliceHigh) + Math.min(...sliceLow)) / 2)
    }
  }
  
  // Kijun-sen
  for (let i = 0; i < closes.length; i++) {
    if (i < kijun - 1) {
      result.kijun.push(null)
    } else {
      const sliceHigh = highs.slice(i - kijun + 1, i + 1)
      const sliceLow = lows.slice(i - kijun + 1, i + 1)
      result.kijun.push((Math.max(...sliceHigh) + Math.min(...sliceLow)) / 2)
    }
  }
  
  // Senkou Span A
  for (let i = 0; i < closes.length; i++) {
    if (i < kijun - 1 || result.tenkan[i] === null || result.kijun[i] === null) {
      result.senkouA.push(null)
    } else {
      const val = (result.tenkan[i] + result.kijun[i]) / 2
      // Shift forward 26 periods (fill with nulls at end)
      const futureIdx = i + 26
      if (futureIdx < closes.length) {
        result.senkouA.push(null)
      } else {
        result.senkouA.push(val)
      }
    }
  }
  
  // Adjust Senkou A by shifting
  const senkouATemp = []
  for (let i = 0; i < closes.length; i++) {
    if (i < kijun - 1) {
      senkouATemp.push(null)
    } else if (result.tenkan[i] === null || result.kijun[i] === null) {
      senkouATemp.push(null)
    } else {
      senkouATemp.push((result.tenkan[i] + result.kijun[i]) / 2)
    }
  }
  // Shift forward 26 periods
  for (let i = 0; i < closes.length; i++) {
    if (i < 26) {
      result.senkouA[i] = null
    } else if (i - 26 < senkouATemp.length) {
      result.senkouA[i] = senkouATemp[i - 26]
    } else {
      result.senkouA[i] = null
    }
  }
  
  // Senkou Span B
  const senkouBTemp = []
  for (let i = 0; i < closes.length; i++) {
    if (i < senkou - 1) {
      senkouBTemp.push(null)
    } else {
      const sliceHigh = highs.slice(i - senkou + 1, i + 1)
      const sliceLow = lows.slice(i - senkou + 1, i + 1)
      senkouBTemp.push((Math.max(...sliceHigh) + Math.min(...sliceLow)) / 2)
    }
  }
  // Shift forward 26 periods
  for (let i = 0; i < closes.length; i++) {
    if (i < 26) {
      result.senkouB[i] = null
    } else if (i - 26 < senkouBTemp.length) {
      result.senkouB[i] = senkouBTemp[i - 26]
    } else {
      result.senkouB[i] = null
    }
  }
  
  // Chikou Span (close shifted back 26 periods)
  for (let i = 0; i < closes.length; i++) {
    const backIdx = i - 26
    if (backIdx >= 0 && backIdx < closes.length) {
      result.chikou[i] = closes[backIdx]
    } else {
      result.chikou[i] = null
    }
  }
  
  return result
}

const calculateKeltnerChannels = (highs, lows, closes, window, multiplier) => {
  const atr = calculateATR(highs, lows, closes, window)
  const ema = calculateEMA(closes, window)
  
  const result = { upper: [], middle: [], lower: [] }
  for (let i = 0; i < closes.length; i++) {
    if (ema[i] === null || atr[i] === null) {
      result.upper.push(null)
      result.middle.push(null)
      result.lower.push(null)
    } else {
      result.middle.push(ema[i])
      result.upper.push(ema[i] + multiplier * atr[i])
      result.lower.push(ema[i] - multiplier * atr[i])
    }
  }
  return result
}

const calculateDonchianChannels = (highs, lows, window) => {
  const result = { upper: [], middle: [], lower: [] }
  
  for (let i = 0; i < highs.length; i++) {
    if (i < window - 1) {
      result.upper.push(null)
      result.middle.push(null)
      result.lower.push(null)
    } else {
      const sliceHigh = highs.slice(i - window + 1, i + 1)
      const sliceLow = lows.slice(i - window + 1, i + 1)
      const upper = Math.max(...sliceHigh)
      const lower = Math.min(...sliceLow)
      result.upper.push(upper)
      result.lower.push(lower)
      result.middle.push((upper + lower) / 2)
    }
  }
  
  return result
}

const calculateWilliamsR = (highs, lows, closes, window) => {
  const result = []
  
  for (let i = 0; i < closes.length; i++) {
    if (i < window - 1) {
      result.push(null)
    } else {
      const sliceHigh = highs.slice(i - window + 1, i + 1)
      const sliceLow = lows.slice(i - window + 1, i + 1)
      const highestHigh = Math.max(...sliceHigh)
      const lowestLow = Math.min(...sliceLow)
      
      if (highestHigh === lowestLow) {
        result.push(-50) // Neutral
      } else {
        const wr = -100 * ((highestHigh - closes[i]) / (highestHigh - lowestLow))
        result.push(wr)
      }
    }
  }
  
  return result
}

const calculateCCI = (highs, lows, closes, window) => {
  const result = []
  
  for (let i = 0; i < closes.length; i++) {
    if (i < window - 1) {
      result.push(null)
    } else {
      const slice = []
      for (let j = i - window + 1; j <= i; j++) {
        slice.push((highs[j] + lows[j] + closes[j]) / 3) // Typical Price
      }
      const sma = slice.reduce((a, b) => a + b, 0) / window
      const mad = slice.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / window
      
      const tp = (highs[i] + lows[i] + closes[i]) / 3
      if (mad > 0) {
        result.push((tp - sma) / (0.015 * mad))
      } else {
        result.push(0)
      }
    }
  }
  
  return result
}

const calculateROC = (prices, window) => {
  const result = []
  
  for (let i = 0; i < prices.length; i++) {
    if (i < window) {
      result.push(null)
    } else {
      const change = ((prices[i] - prices[i - window]) / prices[i - window]) * 100
      result.push(change)
    }
  }
  
  return result
}

const DataExplorerChart = memo(function DataExplorerChart({ data, chartType, indicators, showVolume }) {
  const plotData = useMemo(() => {
    if (!data || data.length === 0) return null

    const dates = data.map((d) => new Date(d.Date))
    const closes = data.map((d) => d.Close)
    const opens = data.map((d) => d.Open)
    const highs = data.map((d) => d.High)
    const lows = data.map((d) => d.Low)
    const volumes = data.map((d) => d.Volume || 0)

    const traces = []

    // Price chart
    if (chartType === 'line') {
      traces.push({
        x: dates,
        y: closes,
        type: 'scatter',
        mode: 'lines',
        name: 'Close',
        line: { width: 2, color: 'black' },
      })
    } else {
      traces.push({
        x: dates,
        open: opens,
        high: highs,
        low: lows,
        close: closes,
        type: 'candlestick',
        name: 'Price',
      })
    }

    // Indicators on price chart
    if (indicators.sma) {
      const smaValues = calculateSMA(closes, indicators.sma.window)
      traces.push({
        x: dates,
        y: smaValues,
        type: 'scatter',
        mode: 'lines',
        name: `SMA(${indicators.sma.window})`,
        line: { width: 2, color: '#2196f3' },
        hovertemplate: '<b>SMA(%{x}</b><br>Value: %{y:.2f}<extra></extra>',
      })
    }

    if (indicators.ema) {
      const emaValues = calculateEMA(closes, indicators.ema.window)
      traces.push({
        x: dates,
        y: emaValues,
        type: 'scatter',
        mode: 'lines',
        name: `EMA(${indicators.ema.window})`,
        line: { width: 2, color: '#ff9800' },
        hovertemplate: '<b>EMA(%{x}</b><br>Value: %{y:.2f}<extra></extra>',
      })
    }

    if (indicators.bollingerBands) {
      const bb = calculateBollingerBands(closes, indicators.bollingerBands.window, indicators.bollingerBands.numStd || 2.0)
      traces.push(
        {
          x: dates,
          y: bb.upper,
          type: 'scatter',
          mode: 'lines',
          name: 'BB Upper',
          line: { width: 1, color: 'gray', dash: 'dash' },
          showlegend: false,
        },
        {
          x: dates,
          y: bb.middle,
          type: 'scatter',
          mode: 'lines',
          name: 'BB Middle',
          line: { width: 1, color: 'gray', dash: 'dot' },
        },
        {
          x: dates,
          y: bb.lower,
          type: 'scatter',
          mode: 'lines',
          name: 'BB Lower',
          line: { width: 1, color: 'gray', dash: 'dash' },
          showlegend: false,
          fill: 'tonexty',
          fillcolor: 'rgba(128,128,128,0.1)',
        }
      )
    }

    if (indicators.macd) {
      const macdResult = calculateMACD(
        closes,
        indicators.macd.fast || 12,
        indicators.macd.slow || 26,
        indicators.macd.signal || 9
      )
      traces.push(
        {
          x: dates,
          y: macdResult.macd,
          type: 'scatter',
          mode: 'lines',
          name: 'MACD',
          line: { width: 2, color: '#2196f3' },
          hovertemplate: '<b>MACD</b><br>%{x}<br>Value: %{y:.4f}<extra></extra>',
        },
        {
          x: dates,
          y: macdResult.signal,
          type: 'scatter',
          mode: 'lines',
          name: 'Signal',
          line: { width: 2, color: '#ff9800' },
          hovertemplate: '<b>Signal</b><br>%{x}<br>Value: %{y:.4f}<extra></extra>',
        },
        {
          x: dates,
          y: macdResult.histogram,
          type: 'bar',
          name: 'Histogram',
          marker: {
            color: macdResult.histogram.map(h => h >= 0 ? '#26a69a' : '#ef5350'),
            line: { width: 0 },
          },
          opacity: 0.6,
        }
      )
    }

    if (indicators.vwap) {
      const vwapValues = calculateVWAP(highs, lows, closes, volumes)
      traces.push({
        x: dates,
        y: vwapValues,
        type: 'scatter',
        mode: 'lines',
        name: 'VWAP',
        line: { width: 2, color: '#7b1fa2', dash: 'dot' },
      })
    }

    if (indicators.keltnerChannels) {
      const keltner = calculateKeltnerChannels(
        highs,
        lows,
        closes,
        indicators.keltnerChannels.window || 20,
        indicators.keltnerChannels.multiplier || 2.0
      )
      traces.push(
        {
          x: dates,
          y: keltner.upper,
          type: 'scatter',
          mode: 'lines',
          name: 'KC Upper',
          line: { width: 1, color: '#e57373', dash: 'dash' },
          showlegend: false,
        },
        {
          x: dates,
          y: keltner.middle,
          type: 'scatter',
          mode: 'lines',
          name: 'KC Middle',
          line: { width: 1, color: '#e57373', dash: 'dot' },
        },
        {
          x: dates,
          y: keltner.lower,
          type: 'scatter',
          mode: 'lines',
          name: 'KC Lower',
          line: { width: 1, color: '#e57373', dash: 'dash' },
          showlegend: false,
          fill: 'tonexty',
          fillcolor: 'rgba(229,115,115,0.1)',
        }
      )
    }

    if (indicators.donchianChannels) {
      const donchian = calculateDonchianChannels(
        highs,
        lows,
        indicators.donchianChannels.window || 20
      )
      traces.push(
        {
          x: dates,
          y: donchian.upper,
          type: 'scatter',
          mode: 'lines',
          name: 'DC Upper',
          line: { width: 1, color: '#42a5f5', dash: 'dash' },
          showlegend: false,
        },
        {
          x: dates,
          y: donchian.middle,
          type: 'scatter',
          mode: 'lines',
          name: 'DC Middle',
          line: { width: 1, color: '#42a5f5', dash: 'dot' },
        },
        {
          x: dates,
          y: donchian.lower,
          type: 'scatter',
          mode: 'lines',
          name: 'DC Lower',
          line: { width: 1, color: '#42a5f5', dash: 'dash' },
          showlegend: false,
          fill: 'tonexty',
          fillcolor: 'rgba(66,165,245,0.1)',
        }
      )
    }

    if (indicators.ichimoku) {
      const ichimoku = calculateIchimoku(
        highs,
        lows,
        closes,
        indicators.ichimoku.tenkan || 9,
        indicators.ichimoku.kijun || 26,
        indicators.ichimoku.senkou || 52
      )
      // Add cloud fill area (Senkou A and B)
      traces.push(
        {
          x: dates,
          y: ichimoku.senkouA,
          type: 'scatter',
          mode: 'lines',
          name: 'Senkou A',
          line: { width: 1, color: '#26a69a' },
          showlegend: false,
          fill: 'tonexty',
          fillcolor: 'rgba(38,166,154,0.3)',
        },
        {
          x: dates,
          y: ichimoku.senkouB,
          type: 'scatter',
          mode: 'lines',
          name: 'Senkou B',
          line: { width: 1, color: '#ef5350' },
          showlegend: false,
          fill: 'tonexty',
          fillcolor: 'rgba(239,83,80,0.3)',
        },
        {
          x: dates,
          y: ichimoku.tenkan,
          type: 'scatter',
          mode: 'lines',
          name: 'Tenkan',
          line: { width: 1.5, color: '#26a69a' },
        },
        {
          x: dates,
          y: ichimoku.kijun,
          type: 'scatter',
          mode: 'lines',
          name: 'Kijun',
          line: { width: 1.5, color: '#ef5350' },
        },
        {
          x: dates,
          y: ichimoku.chikou,
          type: 'scatter',
          mode: 'lines',
          name: 'Chikou',
          line: { width: 1, color: '#42a5f5', dash: 'dot' },
        }
      )
    }

    if (indicators.atr) {
      const atrValues = calculateATR(highs, lows, closes, indicators.atr.window || 14)
      traces.push({
        x: dates,
        y: atrValues,
        type: 'scatter',
        mode: 'lines',
        name: `ATR(${indicators.atr.window || 14})`,
        line: { width: 1.5, color: 'purple' },
        yaxis: 'y2',
      })
    }

    return { priceTraces: traces, volumes, dates, closes, highs, lows }
  }, [data, chartType, indicators])

  const rsiData = useMemo(() => {
    if (!data || !indicators.rsi || data.length === 0) return null
    const dates = data.map((d) => new Date(d.Date))
    const closes = data.map((d) => d.Close)
    const rsiValues = calculateRSI(closes, indicators.rsi.window)
    return { dates, values: rsiValues }
  }, [data, indicators.rsi])

  const stochasticData = useMemo(() => {
    if (!data || !indicators.stochastic || data.length === 0) return null
    const dates = data.map((d) => new Date(d.Date))
    const highs = data.map((d) => d.High)
    const lows = data.map((d) => d.Low)
    const closes = data.map((d) => d.Close)
    const stochResult = calculateStochastic(
      highs,
      lows,
      closes,
      indicators.stochastic.k_window || 14,
      indicators.stochastic.d_window || 3
    )
    return { dates, k: stochResult.k, d: stochResult.d }
  }, [data, indicators.stochastic])

  const adxData = useMemo(() => {
    if (!data || !indicators.adx || data.length === 0) return null
    const dates = data.map((d) => new Date(d.Date))
    const highs = data.map((d) => d.High)
    const lows = data.map((d) => d.Low)
    const closes = data.map((d) => d.Close)
    const adxValues = calculateADX(highs, lows, closes, indicators.adx.window || 14)
    return { dates, values: adxValues }
  }, [data, indicators.adx])

  const obvData = useMemo(() => {
    if (!data || !indicators.obv || data.length === 0) return null
    const dates = data.map((d) => new Date(d.Date))
    const closes = data.map((d) => d.Close)
    const volumes = data.map((d) => d.Volume || 0)
    const obvValues = calculateOBV(closes, volumes)
    return { dates, values: obvValues }
  }, [data, indicators.obv])

  const volumeSmaData = useMemo(() => {
    if (!data || !indicators.volumeSma || data.length === 0) return null
    const dates = data.map((d) => new Date(d.Date))
    const volumes = data.map((d) => d.Volume || 0)
    const volumeSmaValues = calculateVolumeSMA(volumes, indicators.volumeSma.window || 20)
    return { dates, values: volumeSmaValues }
  }, [data, indicators.volumeSma])

  const volumeData = useMemo(() => {
    if (!data || !showVolume || data.length === 0) return null
    const dates = data.map((d) => new Date(d.Date))
    const volumes = data.map((d) => d.Volume || 0)
    return { dates, values: volumes }
  }, [data, showVolume])

  const priceLayout = useMemo(() => {
    const hasATR = indicators.atr
    return {
      title: 'Price Chart with Indicators',
      height: 400,
      hovermode: 'x unified',
      xaxis: { title: 'Date' },
      yaxis: { title: 'Price ($)', domain: hasATR ? [0, 0.75] : [0, 1] },
      ...(hasATR && {
        yaxis2: {
          title: 'ATR',
          overlaying: 'y',
          side: 'right',
          domain: [0.8, 1],
        },
      }),
    }
  }, [indicators.atr])

  const rsiLayout = useMemo(() => ({
    title: 'RSI',
    height: 200,
    hovermode: 'x unified',
    xaxis: { title: 'Date' },
    yaxis: { title: 'RSI', range: [0, 100] },
    shapes: [
      { type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: 70, y1: 70, line: { dash: 'dash', color: 'red', opacity: 0.5 } },
      { type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: 30, y1: 30, line: { dash: 'dash', color: 'green', opacity: 0.5 } },
    ],
  }), [])

  const volumeLayout = useMemo(() => ({
    title: 'Volume',
    height: 200,
    hovermode: 'x unified',
    xaxis: { title: 'Date' },
    yaxis: { title: 'Volume' },
  }), [])

  const stochasticLayout = useMemo(() => ({
    title: 'Stochastic Oscillator',
    height: 200,
    hovermode: 'x unified',
    xaxis: { title: 'Date' },
    yaxis: { title: 'Stochastic %', range: [0, 100] },
    shapes: [
      { type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: 80, y1: 80, line: { dash: 'dash', color: 'red', opacity: 0.5 } },
      { type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: 20, y1: 20, line: { dash: 'dash', color: 'green', opacity: 0.5 } },
    ],
  }), [])

  const adxLayout = useMemo(() => ({
    title: 'ADX (Average Directional Index)',
    height: 200,
    hovermode: 'x unified',
    xaxis: { title: 'Date' },
    yaxis: { title: 'ADX', range: [0, 100] },
    shapes: [
      { type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: 25, y1: 25, line: { dash: 'dash', color: 'orange', opacity: 0.5 } },
    ],
  }), [])

  const obvLayout = useMemo(() => ({
    title: 'On-Balance Volume (OBV)',
    height: 200,
    hovermode: 'x unified',
    xaxis: { title: 'Date' },
    yaxis: { title: 'OBV' },
  }), [])

  const williamsRData = useMemo(() => {
    if (!indicators.williamsR || !plotData) return null
    const wrValues = calculateWilliamsR(plotData.highs, plotData.lows, plotData.closes, indicators.williamsR.window || 14)
    return {
      dates: plotData.dates,
      values: wrValues,
    }
  }, [indicators.williamsR, plotData])

  const cciData = useMemo(() => {
    if (!indicators.cci || !plotData) return null
    const cciValues = calculateCCI(plotData.highs, plotData.lows, plotData.closes, indicators.cci.window || 20)
    return {
      dates: plotData.dates,
      values: cciValues,
    }
  }, [indicators.cci, plotData])

  const rocData = useMemo(() => {
    if (!indicators.roc || !plotData) return null
    const rocValues = calculateROC(plotData.closes, indicators.roc.window || 12)
    return {
      dates: plotData.dates,
      values: rocValues,
    }
  }, [indicators.roc, plotData])

  const williamsRLayout = useMemo(() => ({
    title: 'Williams %R',
    height: 200,
    hovermode: 'x unified',
    xaxis: { title: 'Date' },
    yaxis: { title: 'Williams %R', range: [-100, 0] },
    shapes: [
      { type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: -80, y1: -80, line: { dash: 'dash', color: 'red', opacity: 0.5 } },
      { type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: -20, y1: -20, line: { dash: 'dash', color: 'green', opacity: 0.5 } },
    ],
  }), [])

  const cciLayout = useMemo(() => ({
    title: 'Commodity Channel Index (CCI)',
    height: 200,
    hovermode: 'x unified',
    xaxis: { title: 'Date' },
    yaxis: { title: 'CCI' },
    shapes: [
      { type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: 100, y1: 100, line: { dash: 'dash', color: 'red', opacity: 0.5 } },
      { type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: -100, y1: -100, line: { dash: 'dash', color: 'green', opacity: 0.5 } },
      { type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: 0, y1: 0, line: { dash: 'dot', color: 'gray', opacity: 0.3 } },
    ],
  }), [])

  const rocLayout = useMemo(() => ({
    title: 'Rate of Change (ROC)',
    height: 200,
    hovermode: 'x unified',
    xaxis: { title: 'Date' },
    yaxis: { title: 'ROC (%)' },
    shapes: [
      { type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: 0, y1: 0, line: { dash: 'dot', color: 'gray', opacity: 0.3 } },
    ],
  }), [])

  if (!plotData || !plotData.priceTraces || plotData.priceTraces.length === 0) {
    return <div>No data available for chart</div>
  }

  return (
    <Box>
      <Plot
        data={plotData.priceTraces}
        layout={priceLayout}
        style={{ width: '100%', height: '400px' }}
        config={{
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToAdd: ['pan2d', 'zoom2d', 'select2d', 'lasso2d', 'autoScale2d', 'resetScale2d'],
          modeBarButtonsToRemove: [],
        }}
      />
      {rsiData && (
        <Box sx={{ mt: 2 }}>
          <Plot
            data={[{
              x: rsiData.dates,
              y: rsiData.values,
              type: 'scatter',
              mode: 'lines',
              name: `RSI(${indicators.rsi.window})`,
              line: { width: 2, color: 'purple' },
              hoverinfo: 'x+y',
            }]}
            layout={rsiLayout}
            style={{ width: '100%', height: '200px' }}
            config={{
              responsive: true,
              displayModeBar: true,
              modeBarButtonsToAdd: ['pan2d', 'zoom2d', 'autoScale2d', 'resetScale2d'],
            }}
          />
        </Box>
      )}
      {stochasticData && (
        <Box sx={{ mt: 2 }}>
          <Plot
            data={[
              {
                x: stochasticData.dates,
                y: stochasticData.k,
                type: 'scatter',
                mode: 'lines',
                name: '%K',
                line: { width: 2, color: 'blue' },
              },
              {
                x: stochasticData.dates,
                y: stochasticData.d,
                type: 'scatter',
                mode: 'lines',
                name: '%D',
                line: { width: 2, color: 'red' },
              },
            ]}
            layout={stochasticLayout}
            style={{ width: '100%', height: '200px' }}
            config={{
              responsive: true,
              displayModeBar: true,
              modeBarButtonsToAdd: ['pan2d', 'zoom2d', 'autoScale2d', 'resetScale2d'],
            }}
          />
        </Box>
      )}
      {adxData && (
        <Box sx={{ mt: 2 }}>
          <Plot
            data={[{
              x: adxData.dates,
              y: adxData.values,
              type: 'scatter',
              mode: 'lines',
              name: `ADX(${indicators.adx.window})`,
              line: { width: 2, color: 'orange' },
            }]}
            layout={adxLayout}
            style={{ width: '100%', height: '200px' }}
            config={{
              responsive: true,
              displayModeBar: true,
              modeBarButtonsToAdd: ['pan2d', 'zoom2d', 'autoScale2d', 'resetScale2d'],
            }}
          />
        </Box>
      )}
      {obvData && (
        <Box sx={{ mt: 2 }}>
          <Plot
            data={[{
              x: obvData.dates,
              y: obvData.values,
              type: 'scatter',
              mode: 'lines',
              name: 'OBV',
              line: { width: 2, color: 'green' },
            }]}
            layout={obvLayout}
            style={{ width: '100%', height: '200px' }}
            config={{
              responsive: true,
              displayModeBar: true,
              modeBarButtonsToAdd: ['pan2d', 'zoom2d', 'autoScale2d', 'resetScale2d'],
            }}
          />
        </Box>
      )}
      {williamsRData && (
        <Box sx={{ mt: 2 }}>
          <Plot
            data={[{
              x: williamsRData.dates,
              y: williamsRData.values,
              type: 'scatter',
              mode: 'lines',
              name: `Williams %R(${indicators.williamsR.window})`,
              line: { width: 2, color: '#ab47bc' },
              hoverinfo: 'x+y',
            }]}
            layout={williamsRLayout}
            style={{ width: '100%', height: '200px' }}
            config={{
              responsive: true,
              displayModeBar: true,
              modeBarButtonsToAdd: ['pan2d', 'zoom2d', 'autoScale2d', 'resetScale2d'],
            }}
          />
        </Box>
      )}
      {cciData && (
        <Box sx={{ mt: 2 }}>
          <Plot
            data={[{
              x: cciData.dates,
              y: cciData.values,
              type: 'scatter',
              mode: 'lines',
              name: `CCI(${indicators.cci.window})`,
              line: { width: 2, color: '#5c6bc0' },
            }]}
            layout={cciLayout}
            style={{ width: '100%', height: '200px' }}
            config={{
              responsive: true,
              displayModeBar: true,
              modeBarButtonsToAdd: ['pan2d', 'zoom2d', 'autoScale2d', 'resetScale2d'],
            }}
          />
        </Box>
      )}
      {rocData && (
        <Box sx={{ mt: 2 }}>
          <Plot
            data={[{
              x: rocData.dates,
              y: rocData.values,
              type: 'scatter',
              mode: 'lines',
              name: `ROC(${indicators.roc.window})`,
              line: { width: 2, color: '#66bb6a' },
            }]}
            layout={rocLayout}
            style={{ width: '100%', height: '200px' }}
            config={{
              responsive: true,
              displayModeBar: true,
              modeBarButtonsToAdd: ['pan2d', 'zoom2d', 'autoScale2d', 'resetScale2d'],
            }}
          />
        </Box>
      )}
      {volumeData && (
        <Box sx={{ mt: 2 }}>
          <Plot
            data={[
              {
                x: volumeData.dates,
                y: volumeData.values,
                type: 'bar',
                name: 'Volume',
                marker: { color: 'lightblue' },
              },
              ...(volumeSmaData ? [{
                x: volumeSmaData.dates,
                y: volumeSmaData.values,
                type: 'scatter',
                mode: 'lines',
                name: `Volume SMA(${indicators.volumeSma.window})`,
                line: { width: 2, color: 'red' },
              }] : []),
            ]}
            layout={volumeLayout}
            style={{ width: '100%', height: '200px' }}
            config={{ responsive: true }}
          />
        </Box>
      )}
    </Box>
  )
})

export default DataExplorerChart
