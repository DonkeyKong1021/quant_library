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
        line: { width: 1.5, color: 'blue' },
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
        line: { width: 1.5, color: 'orange' },
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
          line: { width: 1.5, color: 'blue' },
        },
        {
          x: dates,
          y: macdResult.signal,
          type: 'scatter',
          mode: 'lines',
          name: 'Signal',
          line: { width: 1.5, color: 'red' },
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
