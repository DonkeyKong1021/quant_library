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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import SpeedIcon from '@mui/icons-material/Speed'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DataFetcher from '../components/DataFetcher'
import DataExplorerChart from '../components/DataExplorerChart'
import DataStatistics from '../components/DataStatistics'
import ChartLibrarySelector from '../components/ChartLibrarySelector'
import SectionNavigation from '../components/SectionNavigation'
import ScrollToTop from '../components/ScrollToTop'
import { useThemeMode } from '../contexts/ThemeContext'
import { useQuery } from '@tanstack/react-query'
import { fundamentalService } from '../services/fundamentalService'

// Section definitions for navigation
const sections = [
  { id: 'fetch-data', label: 'Fetch Market Data' },
  { id: 'data-table', label: 'Data Table' },
  { id: 'data-summary', label: 'Data Summary' },
  { id: 'chart-config', label: 'Chart Configuration & Display' },
]

// Indicator preset configurations
const INDICATOR_PRESETS = {
  trend_following: {
    sma: { window: 50 },
    ema: { window: 20 },
    macd: { fast: 12, slow: 26, signal: 9 },
    adx: { window: 14 },
  },
  mean_reversion: {
    bollingerBands: { window: 20, numStd: 2.0 },
    rsi: { window: 14 },
    stochastic: { k_window: 14, d_window: 3 },
  },
  momentum: {
    rsi: { window: 14 },
    macd: { fast: 12, slow: 26, signal: 9 },
    roc: { window: 12 },
    williamsR: { window: 14 },
  },
  volatility: {
    bollingerBands: { window: 20, numStd: 2.0 },
    keltnerChannels: { window: 20, multiplier: 2.0 },
    atr: { window: 14 },
  },
  volume_analysis: {
    vwap: {},
    obv: {},
    volumeSma: { window: 20 },
  },
  complete: {
    sma: { window: 50 },
    ema: { window: 20 },
    macd: { fast: 12, slow: 26, signal: 9 },
    adx: { window: 14 },
    rsi: { window: 14 },
    stochastic: { k_window: 14, d_window: 3 },
    bollingerBands: { window: 20, numStd: 2.0 },
    atr: { window: 14 },
    obv: {},
    volumeSma: { window: 20 },
  },
}

// Empty indicator state
const EMPTY_INDICATORS = {
  sma: null, ema: null, macd: null, adx: null, ichimoku: null, vwap: null,
  rsi: null, stochastic: null, williamsR: null, cci: null, roc: null,
  bollingerBands: null, keltnerChannels: null, donchianChannels: null, atr: null,
  obv: null, volumeSma: null, volumeProfile: null,
}

export default function DataExplorer() {
  const { isDark } = useThemeMode()
  const [data, setData] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const [chartType, setChartType] = useState('candlestick')
  const [showVolume, setShowVolume] = useState(true)
  
  // Fetch fundamental data
  const { data: fundamentals } = useQuery({
    queryKey: ['fundamentals', selectedSymbol],
    queryFn: () => fundamentalService.getFundamentals(selectedSymbol),
    enabled: !!selectedSymbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
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
  const [indicatorTabValue, setIndicatorTabValue] = useState(0)
  const [expandedAccordion, setExpandedAccordion] = useState('')
  const [userHasManuallyExpanded, setUserHasManuallyExpanded] = useState(false)
  
  // Filtering state
  const [filteredData, setFilteredData] = useState(null)
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: null, end: null })
  const [priceRangeFilter, setPriceRangeFilter] = useState({ min: null, max: null })
  const [volumeFilter, setVolumeFilter] = useState({ min: null })

  const handleDataFetched = (fetchedData, symbol) => {
    setData(fetchedData)
    setSelectedSymbol(symbol)
  }

  // Reset accordion state when no data exists
  useEffect(() => {
    if (!data) {
      setExpandedAccordion('')
      setUserHasManuallyExpanded(false)
    }
  }, [data])

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

      {/* Main Content with Section Navigation */}
      <Grid container spacing={3}>
        {/* Section Navigation - Left Side (Desktop) */}
        <Grid item xs={12} md={2.5} sx={{ display: { xs: 'none', md: 'block' } }}>
          <SectionNavigation 
            sections={sections} 
            onSectionClick={(sectionId) => {
              setExpandedAccordion(sectionId)
              setUserHasManuallyExpanded(true)
            }}
          />
        </Grid>

        {/* Mobile Section Navigation */}
        <Grid item xs={12} sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
          <SectionNavigation 
            sections={sections} 
            orientation="horizontal"
            onSectionClick={(sectionId) => {
              setExpandedAccordion(sectionId)
              setUserHasManuallyExpanded(true)
            }}
          />
        </Grid>

        {/* Main Content - Right Side */}
        <Grid item xs={12} md={9.5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Fetch Market Data */}
            <Accordion
              id="fetch-data"
              expanded={expandedAccordion === 'fetch-data'}
              onChange={(event, isExpanded) => {
                setExpandedAccordion(isExpanded ? 'fetch-data' : '')
                setUserHasManuallyExpanded(true)
              }}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                '&:before': { display: 'none' },
                boxShadow: 'none',
                '&.Mui-expanded': {
                  margin: 0,
                  borderColor: 'primary.main',
                  borderWidth: 1,
                },
              }}
              disableGutters
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 20 }} />}
                sx={{
                  minHeight: 52,
                  px: 2.5,
                  '& .MuiAccordionSummary-content': { my: 1.5 },
                }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: '0.9375rem' }}>
                  1. Fetch Market Data
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <DataFetcher onDataFetched={handleDataFetched} />
              </AccordionDetails>
            </Accordion>

            {/* Data Table */}
            <Accordion
              id="data-table"
              expanded={expandedAccordion === 'data-table'}
              onChange={(event, isExpanded) => {
                setExpandedAccordion(isExpanded ? 'data-table' : '')
                setUserHasManuallyExpanded(true)
              }}
              disabled={!data}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                '&:before': { display: 'none' },
                boxShadow: 'none',
                '&.Mui-expanded': {
                  margin: 0,
                  borderColor: 'primary.main',
                  borderWidth: 1,
                },
                '&.Mui-disabled': {
                  backgroundColor: 'transparent',
                  opacity: 0.5,
                },
              }}
              disableGutters
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 20 }} />}
                sx={{
                  minHeight: 52,
                  px: 2.5,
                  '& .MuiAccordionSummary-content': { my: 1.5 },
                }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: '0.9375rem' }}>
                  2. Data Table
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                {data && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
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
              </AccordionDetails>
            </Accordion>

            {/* Data Summary */}
            <Accordion
              id="data-summary"
              expanded={expandedAccordion === 'data-summary'}
              onChange={(event, isExpanded) => {
                setExpandedAccordion(isExpanded ? 'data-summary' : '')
                setUserHasManuallyExpanded(true)
              }}
              disabled={!data}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                '&:before': { display: 'none' },
                boxShadow: 'none',
                '&.Mui-expanded': {
                  margin: 0,
                  borderColor: 'primary.main',
                  borderWidth: 1,
                },
                '&.Mui-disabled': {
                  backgroundColor: 'transparent',
                  opacity: 0.5,
                },
              }}
              disableGutters
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 20 }} />}
                sx={{
                  minHeight: 52,
                  px: 2.5,
                  '& .MuiAccordionSummary-content': { my: 1.5 },
                }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: '0.9375rem' }}>
                  3. Data Summary
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                {data && <DataStatistics data={data} />}
              </AccordionDetails>
            </Accordion>

            {/* Chart Configuration & Indicators */}
            <Accordion
              id="chart-config"
              expanded={expandedAccordion === 'chart-config'}
              onChange={(event, isExpanded) => {
                setExpandedAccordion(isExpanded ? 'chart-config' : '')
                setUserHasManuallyExpanded(true)
              }}
              disabled={!data}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                '&:before': { display: 'none' },
                boxShadow: 'none',
                '&.Mui-expanded': {
                  margin: 0,
                  borderColor: 'primary.main',
                  borderWidth: 1,
                },
                '&.Mui-disabled': {
                  backgroundColor: 'transparent',
                  opacity: 0.5,
                },
              }}
              disableGutters
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 20 }} />}
                sx={{
                  minHeight: 52,
                  px: 2.5,
                  '& .MuiAccordionSummary-content': { my: 1.5 },
                }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: '0.9375rem' }}>
                  4. Chart Configuration & Display
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                {data && (
                  <>
                    {/* Chart Configuration Header - Compact */}
                    <Grid container spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6} md={2.5}>
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
                      <Grid item xs={12} sm={6} md={2.5}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Presets</InputLabel>
                          <Select
                            value=""
                            label="Presets"
                            onChange={(e) => {
                              const preset = e.target.value
                              if (!preset || !INDICATOR_PRESETS[preset]) return
                              setIndicators({ ...EMPTY_INDICATORS, ...INDICATOR_PRESETS[preset] })
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
                      <Grid item xs={12} sm={6} md="auto">
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={showVolume}
                              onChange={(e) => setShowVolume(e.target.checked)}
                              size="small"
                            />
                          }
                          label="Volume"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md="auto">
                        <ChartLibrarySelector size="small" />
                      </Grid>
                      <Grid item xs={12} sm={6} md="auto">
                        <Button
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={handleExportCSV}
                          size="small"
                        >
                          Export CSV
                        </Button>
                      </Grid>
                    </Grid>

                {/* Indicators Tabs - Compact */}
                <Tabs 
                  value={indicatorTabValue} 
                  onChange={(e, newValue) => setIndicatorTabValue(newValue)}
                  onKeyDown={(e) => {
                    const tabCount = 3
                    if (e.key === 'ArrowRight') {
                      e.preventDefault()
                      setIndicatorTabValue((prev) => (prev + 1) % tabCount)
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault()
                      setIndicatorTabValue((prev) => (prev - 1 + tabCount) % tabCount)
                    }
                  }}
                  sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider', 
                    mb: 1.5, 
                    minHeight: 36,
                    '& .MuiTabs-indicator': {
                      height: 2,
                    },
                  }}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab 
                    icon={<TrendingUpIcon sx={{ fontSize: 16 }} />} 
                    iconPosition="start"
                    label="Trend" 
                    sx={{ 
                      minHeight: 36, 
                      textTransform: 'none', 
                      fontSize: '0.8125rem', 
                      py: 0.75,
                      px: 1.5,
                      fontWeight: indicatorTabValue === 0 ? 600 : 400,
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: -2,
                        borderRadius: 1,
                      },
                    }}
                  />
                  <Tab 
                    icon={<ShowChartIcon sx={{ fontSize: 16 }} />} 
                    iconPosition="start"
                    label="Volatility" 
                    sx={{ 
                      minHeight: 36, 
                      textTransform: 'none', 
                      fontSize: '0.8125rem', 
                      py: 0.75,
                      px: 1.5,
                      fontWeight: indicatorTabValue === 1 ? 600 : 400,
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: -2,
                        borderRadius: 1,
                      },
                    }}
                  />
                  <Tab 
                    icon={<SpeedIcon sx={{ fontSize: 16 }} />} 
                    iconPosition="start"
                    label="Momentum" 
                    sx={{ 
                      minHeight: 36, 
                      textTransform: 'none', 
                      fontSize: '0.8125rem', 
                      py: 0.75,
                      px: 1.5,
                      fontWeight: indicatorTabValue === 2 ? 600 : 400,
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: -2,
                        borderRadius: 1,
                      },
                    }}
                  />
                </Tabs>

                {indicatorTabValue === 0 && (
                  <Grid container spacing={1.5}>
                    {/* SMA */}
                    <Grid item xs={6} sm={4} md={2.4}>
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
                    <Grid item xs={6} sm={4} md={2.4}>
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
                    <Grid item xs={6} sm={4} md={2.4}>
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
                    <Grid item xs={12} sm={6} md={2.4}>
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
                    <Grid item xs={12} sm={6} md={2.4}>
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
                    <Grid item xs={12} sm={6} md={2.4}>
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
                    <Grid item xs={6} sm={4} md={2.4}>
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
                    <Grid item xs={6} sm={4} md={2.4}>
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
                    <Grid item xs={6} sm={4} md={2.4}>
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
                )}

                {indicatorTabValue === 1 && (
                  <Grid container spacing={1.5}>
                    {/* ADX */}
                    <Grid item xs={6} sm={4} md={2.4}>
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
                    <Grid item xs={12} sm={6} md={2.4}>
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
                    <Grid item xs={6} sm={4} md={2.4}>
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
                )}

                {indicatorTabValue === 2 && (
                  <Grid container spacing={1.5}>
                    {/* ATR */}
                    <Grid item xs={6} sm={4} md={2.4}>
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
                    <Grid item xs={6} sm={4} md={2.4}>
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
                    <Grid item xs={6} sm={4} md={2.4}>
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
                    <Grid item xs={6} sm={4} md={2.4}>
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
                )}

                    {/* Chart Display */}
                    <Box sx={{ mt: 3 }}>
                      <DataExplorerChart
                        data={filteredData || data}
                        chartType={chartType}
                        indicators={indicators}
                        showVolume={showVolume}
                      />
                    </Box>
                  </>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Fundamentals - 4 Key Metrics */}
            {selectedSymbol && fundamentals && (
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  backgroundImage: 'none',
                }}
                elevation={0}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.875rem' }}>
                  Key Metrics: {selectedSymbol}
                </Typography>
                <Grid container spacing={2}>
                  {[
                    {
                      label: 'Market Cap',
                      value: fundamentals.market_cap
                        ? `$${(fundamentals.market_cap / 1e9).toFixed(2)}B`
                        : 'N/A',
                    },
                    {
                      label: 'P/E Ratio',
                      value:
                        fundamentals.pe_ratio !== null && fundamentals.pe_ratio !== undefined
                          ? Number(fundamentals.pe_ratio).toFixed(2)
                          : 'N/A',
                    },
                    {
                      label: 'Revenue',
                      value: fundamentals.revenue
                        ? `$${Math.round(fundamentals.revenue / 1e6).toLocaleString()}M`
                        : 'N/A',
                    },
                    {
                      label: 'EPS',
                      value: fundamentals.earnings_per_share || 'N/A',
                    },
                  ].map((metric, index) => (
                    <Grid item xs={6} sm={3} key={index}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block', mb: 0.5 }}>
                          {metric.label}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                          {metric.value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Scroll to top button */}
      <ScrollToTop />
    </Container>
  )
}
