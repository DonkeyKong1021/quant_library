import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import SpeedIcon from '@mui/icons-material/Speed'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import BarChartIcon from '@mui/icons-material/BarChart'
import DataFetcher from '../components/DataFetcher'
import DataExplorerChart from '../components/DataExplorerChart'
import DataStatistics from '../components/DataStatistics'
import IndicatorStatistics from '../components/IndicatorStatistics'
import ChartLibrarySelector from '../components/ChartLibrarySelector'

export default function DataExplorer() {
  const [data, setData] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const [chartType, setChartType] = useState('candlestick')
  const [showVolume, setShowVolume] = useState(true)
  const [indicators, setIndicators] = useState({
    // Trend indicators
    sma: null,
    ema: null,
    macd: null,
    adx: null,
    ichimoku: null,
    vwap: null,
    // Momentum indicators
    rsi: null,
    stochastic: null,
    williamsR: null,
    cci: null,
    roc: null,
    // Volatility indicators
    bollingerBands: null,
    keltnerChannels: null,
    donchianChannels: null,
    atr: null,
    // Volume indicators
    obv: null,
    volumeSma: null,
    volumeProfile: null,
  })
  const [tabValue, setTabValue] = useState(0)
  const [indicatorTabValue, setIndicatorTabValue] = useState(0)
  
  // Filtering state
  const [filteredData, setFilteredData] = useState(null)
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: null, end: null })
  const [priceRangeFilter, setPriceRangeFilter] = useState({ min: null, max: null })
  const [volumeFilter, setVolumeFilter] = useState({ min: null })

  const handleDataFetched = (fetchedData, symbol) => {
    setData(fetchedData)
    setSelectedSymbol(symbol)
  }

  const handleIndicatorChange = (indicatorType, enabled, params = {}) => {
    setIndicators((prev) => ({
      ...prev,
      [indicatorType]: enabled ? { ...prev[indicatorType], ...params } : null,
    }))
  }

  const handleExportCSV = () => {
    if (!data) return

    const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        [
          new Date(row.Date).toISOString().split('T')[0],
          row.Open,
          row.High,
          row.Low,
          row.Close,
          row.Volume || '',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedSymbol || 'data'}_${new Date(data[0].Date).toISOString().split('T')[0]}_to_${new Date(data[data.length - 1].Date).toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
          Data Explorer
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.0625rem' }}>
          Visualize market data and analyze technical indicators
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <DataFetcher onDataFetched={handleDataFetched} />
      </Box>

      {data && (
        <>
          {/* Chart Configuration */}
          <Box sx={{ mb: 1.5 }}>
            <Paper sx={{ p: 1.5, elevation: 1 }}>
                <Grid container spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <Grid item xs="auto">
                    <Typography variant="h6" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      Chart Configuration
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3} md={2}>
                    <TextField
                      select
                      label="Chart Type"
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value)}
                      fullWidth
                      SelectProps={{ native: true }}
                      size="small"
                    >
                      <option value="line">Line Chart</option>
                      <option value="area">Area Chart</option>
                      <option value="candlestick">Candlestick Chart</option>
                      <option value="heikinashi">Heikin Ashi</option>
                      <option value="ohlc">OHLC Bars</option>
                    </TextField>
                  </Grid>
                  <Grid item xs="auto">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showVolume}
                          onChange={(e) => setShowVolume(e.target.checked)}
                          size="small"
                        />
                      }
                      label="Show Volume"
                    />
                  </Grid>
                  <Grid item xs="auto" sx={{ ml: { xs: 0, sm: 'auto' } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', mt: 0.5 }}>
                      Technical Indicators:
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Preset Combinations</InputLabel>
                      <Select
                        value=""
                        label="Preset Combinations"
                        onChange={(e) => {
                          const preset = e.target.value
                          if (preset === '') return
                          
                          // Reset all indicators
                          setIndicators({
                            sma: null, ema: null, macd: null, adx: null, ichimoku: null, vwap: null,
                            rsi: null, stochastic: null, williamsR: null, cci: null, roc: null,
                            bollingerBands: null, keltnerChannels: null, donchianChannels: null, atr: null,
                            obv: null, volumeSma: null, volumeProfile: null,
                          })
                          
                          if (preset === 'trend_following') {
                            setIndicators({
                              sma: { window: 50 }, ema: { window: 20 }, macd: { fast: 12, slow: 26, signal: 9 },
                              adx: { window: 14 },
                            })
                          } else if (preset === 'mean_reversion') {
                            setIndicators({
                              bollingerBands: { window: 20, numStd: 2.0 }, rsi: { window: 14 },
                              stochastic: { k_window: 14, d_window: 3 },
                            })
                          } else if (preset === 'momentum') {
                            setIndicators({
                              rsi: { window: 14 }, macd: { fast: 12, slow: 26, signal: 9 },
                              roc: { window: 12 }, williamsR: { window: 14 },
                            })
                          } else if (preset === 'volatility') {
                            setIndicators({
                              bollingerBands: { window: 20, numStd: 2.0 },
                              keltnerChannels: { window: 20, multiplier: 2.0 },
                              atr: { window: 14 },
                            })
                          } else if (preset === 'volume_analysis') {
                            setIndicators({
                              vwap: {}, obv: {}, volumeSma: { window: 20 },
                            })
                          } else if (preset === 'complete') {
                            setIndicators({
                              sma: { window: 50 }, ema: { window: 20 }, macd: { fast: 12, slow: 26, signal: 9 },
                              adx: { window: 14 }, rsi: { window: 14 }, stochastic: { k_window: 14, d_window: 3 },
                              bollingerBands: { window: 20, numStd: 2.0 }, atr: { window: 14 },
                              obv: {}, volumeSma: { window: 20 },
                            })
                          }
                        }}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        <MenuItem value="trend_following">Trend Following</MenuItem>
                        <MenuItem value="mean_reversion">Mean Reversion</MenuItem>
                        <MenuItem value="momentum">Momentum</MenuItem>
                        <MenuItem value="volatility">Volatility</MenuItem>
                        <MenuItem value="volume_analysis">Volume Analysis</MenuItem>
                        <MenuItem value="complete">Complete Analysis</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Indicators Tabs */}
                <Tabs 
                  value={indicatorTabValue} 
                  onChange={(e, newValue) => setIndicatorTabValue(newValue)}
                  sx={{ borderBottom: 1, borderColor: 'divider', mb: 1, minHeight: 36 }}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab 
                    icon={<TrendingUpIcon fontSize="small" />} 
                    iconPosition="start"
                    label="Trend" 
                    sx={{ minHeight: 36, textTransform: 'none', fontSize: '0.875rem', py: 0.5 }}
                  />
                  <Tab 
                    icon={<ShowChartIcon fontSize="small" />} 
                    iconPosition="start"
                    label="Volatility" 
                    sx={{ minHeight: 36, textTransform: 'none', fontSize: '0.875rem', py: 0.5 }}
                  />
                  <Tab 
                    icon={<SpeedIcon fontSize="small" />} 
                    iconPosition="start"
                    label="Momentum" 
                    sx={{ minHeight: 36, textTransform: 'none', fontSize: '0.875rem', py: 0.5 }}
                  />
                </Tabs>

                {indicatorTabValue === 0 && (
                  <Box sx={{ pt: 1 }}>
                    <Grid container spacing={1}>
                      {/* SMA */}
                      <Grid item xs={6} sm={4} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.sma}
                              onChange={(e) =>
                                handleIndicatorChange('sma', e.target.checked, { window: 20 })
                              }
                              size="small"
                            />
                          }
                          label="SMA"
                          sx={{ mb: indicators.sma ? 0.5 : 0 }}
                        />
                        {indicators.sma && (
                          <TextField
                            type="number"
                            label="Window"
                            value={indicators.sma.window || 20}
                            onChange={(e) =>
                              handleIndicatorChange('sma', true, {
                                window: parseInt(e.target.value) || 20,
                              })
                            }
                            size="small"
                            fullWidth
                            inputProps={{ min: 5, max: 200 }}
                          />
                        )}
                      </Grid>

                      {/* EMA */}
                      <Grid item xs={6} sm={4} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.ema}
                              onChange={(e) =>
                                handleIndicatorChange('ema', e.target.checked, { window: 20 })
                              }
                              size="small"
                            />
                          }
                          label="EMA"
                          sx={{ mb: indicators.ema ? 0.5 : 0 }}
                        />
                        {indicators.ema && (
                          <TextField
                            type="number"
                            label="Window"
                            value={indicators.ema.window || 20}
                            onChange={(e) =>
                              handleIndicatorChange('ema', true, {
                                window: parseInt(e.target.value) || 20,
                              })
                            }
                            size="small"
                            fullWidth
                            inputProps={{ min: 5, max: 200 }}
                          />
                        )}
                      </Grid>

                      {/* RSI */}
                      <Grid item xs={6} sm={4} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.rsi}
                              onChange={(e) =>
                                handleIndicatorChange('rsi', e.target.checked, { window: 14 })
                              }
                              size="small"
                            />
                          }
                          label="RSI"
                          sx={{ mb: indicators.rsi ? 0.5 : 0 }}
                        />
                        {indicators.rsi && (
                          <TextField
                            type="number"
                            label="Window"
                            value={indicators.rsi.window || 14}
                            onChange={(e) =>
                              handleIndicatorChange('rsi', true, {
                                window: parseInt(e.target.value) || 14,
                              })
                            }
                            size="small"
                            fullWidth
                            inputProps={{ min: 5, max: 50 }}
                          />
                        )}
                      </Grid>
                      {/* Bollinger Bands */}
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.bollingerBands}
                              onChange={(e) =>
                                handleIndicatorChange('bollingerBands', e.target.checked, {
                                  window: 20,
                                  numStd: 2.0,
                                })
                              }
                              size="small"
                            />
                          }
                          label="Bollinger Bands"
                          sx={{ mb: indicators.bollingerBands ? 0.5 : 0 }}
                        />
                        {indicators.bollingerBands && (
                          <Grid container spacing={0.5}>
                            <Grid item xs={6}>
                              <TextField
                                type="number"
                                label="Window"
                                value={indicators.bollingerBands.window || 20}
                                onChange={(e) =>
                                  handleIndicatorChange('bollingerBands', true, {
                                    ...indicators.bollingerBands,
                                    window: parseInt(e.target.value) || 20,
                                  })
                                }
                                size="small"
                                fullWidth
                                inputProps={{ min: 5, max: 200 }}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                type="number"
                                label="Std Dev"
                                value={indicators.bollingerBands.numStd || 2.0}
                                onChange={(e) =>
                                  handleIndicatorChange('bollingerBands', true, {
                                    ...indicators.bollingerBands,
                                    numStd: parseFloat(e.target.value) || 2.0,
                                  })
                                }
                                size="small"
                                fullWidth
                                inputProps={{ min: 1.0, max: 5.0, step: 0.1 }}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Grid>

                      {/* MACD */}
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.macd}
                              onChange={(e) =>
                                handleIndicatorChange('macd', e.target.checked, {
                                  fast: 12,
                                  slow: 26,
                                  signal: 9,
                                })
                              }
                              size="small"
                            />
                          }
                          label="MACD"
                          sx={{ mb: indicators.macd ? 0.5 : 0 }}
                        />
                        {indicators.macd && (
                          <Grid container spacing={0.5}>
                            <Grid item xs={4}>
                              <TextField
                                type="number"
                                label="Fast"
                                value={indicators.macd.fast || 12}
                                onChange={(e) =>
                                  handleIndicatorChange('macd', true, {
                                    ...indicators.macd,
                                    fast: parseInt(e.target.value) || 12,
                                  })
                                }
                                size="small"
                                fullWidth
                                inputProps={{ min: 5, max: 50 }}
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <TextField
                                type="number"
                                label="Slow"
                                value={indicators.macd.slow || 26}
                                onChange={(e) =>
                                  handleIndicatorChange('macd', true, {
                                    ...indicators.macd,
                                    slow: parseInt(e.target.value) || 26,
                                  })
                                }
                                size="small"
                                fullWidth
                                inputProps={{ min: 10, max: 100 }}
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <TextField
                                type="number"
                                label="Signal"
                                value={indicators.macd.signal || 9}
                                onChange={(e) =>
                                  handleIndicatorChange('macd', true, {
                                    ...indicators.macd,
                                    signal: parseInt(e.target.value) || 9,
                                  })
                                }
                                size="small"
                                fullWidth
                                inputProps={{ min: 5, max: 50 }}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Grid>

                      {/* Stochastic */}
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.stochastic}
                              onChange={(e) =>
                                handleIndicatorChange('stochastic', e.target.checked, {
                                  k_window: 14,
                                  d_window: 3,
                                })
                              }
                              size="small"
                            />
                          }
                          label="Stochastic"
                          sx={{ mb: indicators.stochastic ? 0.5 : 0 }}
                        />
                        {indicators.stochastic && (
                          <Grid container spacing={0.5}>
                            <Grid item xs={6}>
                              <TextField
                                type="number"
                                label="%K Window"
                                value={indicators.stochastic.k_window || 14}
                                onChange={(e) =>
                                  handleIndicatorChange('stochastic', true, {
                                    ...indicators.stochastic,
                                    k_window: parseInt(e.target.value) || 14,
                                  })
                                }
                                size="small"
                                fullWidth
                                inputProps={{ min: 5, max: 50 }}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                type="number"
                                label="%D Window"
                                value={indicators.stochastic.d_window || 3}
                                onChange={(e) =>
                                  handleIndicatorChange('stochastic', true, {
                                    ...indicators.stochastic,
                                    d_window: parseInt(e.target.value) || 3,
                                  })
                                }
                                size="small"
                                fullWidth
                                inputProps={{ min: 1, max: 20 }}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Grid>

                      {/* Williams %R */}
                      <Grid item xs={6} sm={4} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.williamsR}
                              onChange={(e) =>
                                handleIndicatorChange('williamsR', e.target.checked, { window: 14 })
                              }
                              size="small"
                            />
                          }
                          label="Williams %R"
                          sx={{ mb: indicators.williamsR ? 0.5 : 0 }}
                        />
                        {indicators.williamsR && (
                          <TextField
                            type="number"
                            label="Window"
                            value={indicators.williamsR.window || 14}
                            onChange={(e) =>
                              handleIndicatorChange('williamsR', true, {
                                window: parseInt(e.target.value) || 14,
                              })
                            }
                            size="small"
                            fullWidth
                            inputProps={{ min: 5, max: 50 }}
                          />
                        )}
                      </Grid>

                      {/* CCI */}
                      <Grid item xs={6} sm={4} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.cci}
                              onChange={(e) =>
                                handleIndicatorChange('cci', e.target.checked, { window: 20 })
                              }
                              size="small"
                            />
                          }
                          label="CCI"
                          sx={{ mb: indicators.cci ? 0.5 : 0 }}
                        />
                        {indicators.cci && (
                          <TextField
                            type="number"
                            label="Window"
                            value={indicators.cci.window || 20}
                            onChange={(e) =>
                              handleIndicatorChange('cci', true, {
                                window: parseInt(e.target.value) || 20,
                              })
                            }
                            size="small"
                            fullWidth
                            inputProps={{ min: 5, max: 100 }}
                          />
                        )}
                      </Grid>

                      {/* ROC */}
                      <Grid item xs={6} sm={4} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.roc}
                              onChange={(e) =>
                                handleIndicatorChange('roc', e.target.checked, { window: 12 })
                              }
                              size="small"
                            />
                          }
                          label="ROC"
                          sx={{ mb: indicators.roc ? 0.5 : 0 }}
                        />
                        {indicators.roc && (
                          <TextField
                            type="number"
                            label="Window"
                            value={indicators.roc.window || 12}
                            onChange={(e) =>
                              handleIndicatorChange('roc', true, {
                                window: parseInt(e.target.value) || 12,
                              })
                            }
                            size="small"
                            fullWidth
                            inputProps={{ min: 1, max: 50 }}
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {indicatorTabValue === 1 && (
                  <Box sx={{ pt: 1 }}>
                    <Grid container spacing={1}>
                      {/* ADX */}
                      <Grid item xs={6} sm={4} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.adx}
                              onChange={(e) =>
                                handleIndicatorChange('adx', e.target.checked, { window: 14 })
                              }
                              size="small"
                            />
                          }
                          label="ADX"
                          sx={{ mb: indicators.adx ? 0.5 : 0 }}
                        />
                        {indicators.adx && (
                          <TextField
                            type="number"
                            label="Window"
                            value={indicators.adx.window || 14}
                            onChange={(e) =>
                              handleIndicatorChange('adx', true, {
                                window: parseInt(e.target.value) || 14,
                              })
                            }
                            size="small"
                            fullWidth
                            inputProps={{ min: 5, max: 50 }}
                          />
                        )}
                      </Grid>

                      {/* Ichimoku */}
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.ichimoku}
                              onChange={(e) =>
                                handleIndicatorChange('ichimoku', e.target.checked, {
                                  tenkan: 9,
                                  kijun: 26,
                                  senkou: 52,
                                })
                              }
                              size="small"
                            />
                          }
                          label="Ichimoku Cloud"
                          sx={{ mb: indicators.ichimoku ? 0.5 : 0 }}
                        />
                        {indicators.ichimoku && (
                          <Grid container spacing={0.5}>
                            <Grid item xs={4}>
                              <TextField
                                type="number"
                                label="Tenkan"
                                value={indicators.ichimoku.tenkan || 9}
                                onChange={(e) =>
                                  handleIndicatorChange('ichimoku', true, {
                                    ...indicators.ichimoku,
                                    tenkan: parseInt(e.target.value) || 9,
                                  })
                                }
                                size="small"
                                fullWidth
                                inputProps={{ min: 1, max: 50 }}
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <TextField
                                type="number"
                                label="Kijun"
                                value={indicators.ichimoku.kijun || 26}
                                onChange={(e) =>
                                  handleIndicatorChange('ichimoku', true, {
                                    ...indicators.ichimoku,
                                    kijun: parseInt(e.target.value) || 26,
                                  })
                                }
                                size="small"
                                fullWidth
                                inputProps={{ min: 1, max: 100 }}
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <TextField
                                type="number"
                                label="Senkou"
                                value={indicators.ichimoku.senkou || 52}
                                onChange={(e) =>
                                  handleIndicatorChange('ichimoku', true, {
                                    ...indicators.ichimoku,
                                    senkou: parseInt(e.target.value) || 52,
                                  })
                                }
                                size="small"
                                fullWidth
                                inputProps={{ min: 1, max: 200 }}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Grid>

                      {/* VWAP */}
                      <Grid item xs={6} sm={4} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.vwap}
                              onChange={(e) => handleIndicatorChange('vwap', e.target.checked)}
                              size="small"
                            />
                          }
                          label="VWAP"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {indicatorTabValue === 2 && (
                  <Box sx={{ pt: 1 }}>
                    <Grid container spacing={1}>
                      {/* ATR */}
                      <Grid item xs={6} sm={4} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.atr}
                              onChange={(e) =>
                                handleIndicatorChange('atr', e.target.checked, { window: 14 })
                              }
                              size="small"
                            />
                          }
                          label="ATR"
                          sx={{ mb: indicators.atr ? 0.5 : 0 }}
                        />
                        {indicators.atr && (
                          <TextField
                            type="number"
                            label="Window"
                            value={indicators.atr.window || 14}
                            onChange={(e) =>
                              handleIndicatorChange('atr', true, {
                                window: parseInt(e.target.value) || 14,
                              })
                            }
                            size="small"
                            fullWidth
                            inputProps={{ min: 5, max: 50 }}
                          />
                        )}
                      </Grid>

                      {/* OBV */}
                      <Grid item xs={6} sm={4} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.obv}
                              onChange={(e) => handleIndicatorChange('obv', e.target.checked)}
                              size="small"
                            />
                          }
                          label="OBV"
                        />
                      </Grid>

                      {/* Volume SMA */}
                      <Grid item xs={6} sm={4} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.volumeSma}
                              onChange={(e) =>
                                handleIndicatorChange('volumeSma', e.target.checked, { window: 20 })
                              }
                              size="small"
                            />
                          }
                          label="Volume SMA"
                          sx={{ mb: indicators.volumeSma ? 0.5 : 0 }}
                        />
                        {indicators.volumeSma && (
                          <TextField
                            type="number"
                            label="Window"
                            value={indicators.volumeSma.window || 20}
                            onChange={(e) =>
                              handleIndicatorChange('volumeSma', true, {
                                window: parseInt(e.target.value) || 20,
                              })
                            }
                            size="small"
                            fullWidth
                            inputProps={{ min: 5, max: 200 }}
                          />
                        )}
                      </Grid>

                      {/* Volume Profile */}
                      <Grid item xs={6} sm={4} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.volumeProfile}
                              onChange={(e) =>
                                handleIndicatorChange('volumeProfile', e.target.checked, {
                                  bins: 20,
                                })
                              }
                              size="small"
                            />
                          }
                          label="Volume Profile"
                          sx={{ mb: indicators.volumeProfile ? 0.5 : 0 }}
                        />
                        {indicators.volumeProfile && (
                          <TextField
                            type="number"
                            label="Bins"
                            value={indicators.volumeProfile.bins || 20}
                            onChange={(e) =>
                              handleIndicatorChange('volumeProfile', true, {
                                bins: parseInt(e.target.value) || 20,
                              })
                            }
                            size="small"
                            fullWidth
                            inputProps={{ min: 5, max: 100 }}
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                )}
            </Paper>
          </Box>

          {/* Chart */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Price Chart
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <ChartLibrarySelector />
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={handleExportCSV}
                      size="small"
                    >
                      Export CSV
                    </Button>
                  </Box>
                </Box>
                <DataExplorerChart
                  data={filteredData || data}
                  chartType={chartType}
                  indicators={indicators}
                  showVolume={showVolume}
                />
              </Paper>
            </Grid>
          </Grid>

          {/* Tabs for Statistics and Analysis */}
          <Box sx={{ mt: 3 }}>
            <Paper sx={{ elevation: 1 }}>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="Statistics" />
                <Tab label="Data Preview" />
              </Tabs>

              {tabValue === 0 && (
                <Box sx={{ p: 3 }}>
                  <DataStatistics data={data} />
                </Box>
              )}

              {tabValue === 2 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Data Preview
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 400,
                      overflow: 'auto',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                        <tr>
                          <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                            Date
                          </th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                            Open
                          </th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                            High
                          </th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                            Low
                          </th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                            Close
                          </th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                            Volume
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.slice(0, 100).map((row, index) => (
                          <tr key={index}>
                            <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                              {new Date(row.Date).toISOString().split('T')[0]}
                            </td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                              {row.Open.toFixed(2)}
                            </td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                              {row.High.toFixed(2)}
                            </td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                              {row.Low.toFixed(2)}
                            </td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                              {row.Close.toFixed(2)}
                            </td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                              {row.Volume ? row.Volume.toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(filteredData || data).length > 100 && (
                      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                        Showing first 100 rows of {(filteredData || data).length} total rows
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Paper>
          </Box>
        </>
      )}

      {!data && (
        <Paper sx={{ p: 6, textAlign: 'center', elevation: 1, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Please fetch data above to continue
          </Typography>
        </Paper>
      )}
    </Container>
  )
}
