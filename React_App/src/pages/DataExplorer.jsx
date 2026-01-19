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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DownloadIcon from '@mui/icons-material/Download'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import SpeedIcon from '@mui/icons-material/Speed'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import BarChartIcon from '@mui/icons-material/BarChart'
import DataFetcher from '../components/DataFetcher'
import DataExplorerChart from '../components/DataExplorerChart'
import DataStatistics from '../components/DataStatistics'
import IndicatorStatistics from '../components/IndicatorStatistics'

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
          <Grid container spacing={3}>
            {/* Chart Configuration */}
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 3, elevation: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Chart Configuration
                </Typography>

                <Box sx={{ mb: 2 }}>
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
                    <option value="candlestick">Candlestick Chart</option>
                  </TextField>
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showVolume}
                      onChange={(e) => setShowVolume(e.target.checked)}
                    />
                  }
                  label="Show Volume"
                  sx={{ mb: 2 }}
                />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Technical Indicators
                  </Typography>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
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
                </Box>

                {/* Trend Indicators */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon fontSize="small" sx={{ color: 'primary.main' }} />
                      <Typography variant="subtitle2">Trend Indicators</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* SMA */}
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.sma}
                              onChange={(e) =>
                                handleIndicatorChange('sma', e.target.checked, { window: 20 })
                              }
                            />
                          }
                          label="SMA"
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
                            sx={{ mt: 1 }}
                            inputProps={{ min: 5, max: 200 }}
                          />
                        )}
                      </Box>

                      {/* EMA */}
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.ema}
                              onChange={(e) =>
                                handleIndicatorChange('ema', e.target.checked, { window: 20 })
                              }
                            />
                          }
                          label="EMA"
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
                            sx={{ mt: 1 }}
                            inputProps={{ min: 5, max: 200 }}
                          />
                        )}
                      </Box>

                      {/* RSI */}
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.rsi}
                              onChange={(e) =>
                                handleIndicatorChange('rsi', e.target.checked, { window: 14 })
                              }
                            />
                          }
                          label="RSI"
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
                            sx={{ mt: 1 }}
                            inputProps={{ min: 5, max: 50 }}
                          />
                        )}
                      </Box>
                      <Box>
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
                            />
                          }
                          label="Bollinger Bands"
                        />
                        {indicators.bollingerBands && (
                          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                          </Box>
                        )}
                      </Box>

                      {/* MACD */}
                      <Box>
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
                            />
                          }
                          label="MACD"
                        />
                        {indicators.macd && (
                          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                          </Box>
                        )}
                      </Box>

                      {/* Stochastic */}
                      <Box>
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
                            />
                          }
                          label="Stochastic"
                        />
                        {indicators.stochastic && (
                          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                          </Box>
                        )}
                      </Box>

                      {/* Williams %R */}
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.williamsR}
                              onChange={(e) =>
                                handleIndicatorChange('williamsR', e.target.checked, { window: 14 })
                              }
                            />
                          }
                          label="Williams %R"
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
                            sx={{ mt: 1 }}
                            inputProps={{ min: 5, max: 50 }}
                          />
                        )}
                      </Box>

                      {/* CCI */}
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.cci}
                              onChange={(e) =>
                                handleIndicatorChange('cci', e.target.checked, { window: 20 })
                              }
                            />
                          }
                          label="CCI"
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
                            sx={{ mt: 1 }}
                            inputProps={{ min: 5, max: 100 }}
                          />
                        )}
                      </Box>

                      {/* ROC */}
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.roc}
                              onChange={(e) =>
                                handleIndicatorChange('roc', e.target.checked, { window: 12 })
                              }
                            />
                          }
                          label="ROC"
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
                            sx={{ mt: 1 }}
                            inputProps={{ min: 1, max: 50 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Volatility Indicators */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShowChartIcon fontSize="small" sx={{ color: 'error.main' }} />
                      <Typography variant="subtitle2">Volatility Indicators</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Bollinger Bands */}
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.adx}
                              onChange={(e) =>
                                handleIndicatorChange('adx', e.target.checked, { window: 14 })
                              }
                            />
                          }
                          label="ADX"
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
                            sx={{ mt: 1 }}
                            inputProps={{ min: 5, max: 50 }}
                          />
                        )}
                      </Box>

                      {/* Ichimoku */}
                      <Box>
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
                            />
                          }
                          label="Ichimoku Cloud"
                        />
                        {indicators.ichimoku && (
                          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                          </Box>
                        )}
                      </Box>

                      {/* VWAP */}
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.vwap}
                              onChange={(e) => handleIndicatorChange('vwap', e.target.checked)}
                            />
                          }
                          label="VWAP"
                        />
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Momentum Indicators */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SpeedIcon fontSize="small" sx={{ color: 'warning.main' }} />
                      <Typography variant="subtitle2">Momentum Indicators</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* RSI */}
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.atr}
                              onChange={(e) =>
                                handleIndicatorChange('atr', e.target.checked, { window: 14 })
                              }
                            />
                          }
                          label="ATR"
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
                            sx={{ mt: 1 }}
                            inputProps={{ min: 5, max: 50 }}
                          />
                        )}
                      </Box>

                      {/* OBV */}
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.obv}
                              onChange={(e) => handleIndicatorChange('obv', e.target.checked)}
                            />
                          }
                          label="OBV (On-Balance Volume)"
                        />
                      </Box>

                      {/* Volume SMA */}
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.volumeSma}
                              onChange={(e) =>
                                handleIndicatorChange('volumeSma', e.target.checked, { window: 20 })
                              }
                            />
                          }
                          label="Volume SMA"
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
                            sx={{ mt: 1 }}
                            inputProps={{ min: 5, max: 200 }}
                          />
                        )}
                      </Box>

                      {/* Volume Profile */}
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!indicators.volumeProfile}
                              onChange={(e) =>
                                handleIndicatorChange('volumeProfile', e.target.checked, {
                                  bins: 20,
                                })
                              }
                            />
                          }
                          label="Volume Profile"
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
                            sx={{ mt: 1 }}
                            inputProps={{ min: 5, max: 100 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Paper>
            </Grid>

            {/* Chart */}
            <Grid item xs={12} md={9}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Price Chart
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportCSV}
                    size="small"
                  >
                    Export CSV
                  </Button>
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
