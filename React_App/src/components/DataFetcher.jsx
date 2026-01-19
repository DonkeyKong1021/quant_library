import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Autocomplete,
  CircularProgress,
  Alert,
  Grid,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { dataService } from '../services/dataService'
import { recentSymbolsStorage } from '../utils/localStorage'
import { dataSourceStorage } from '../utils/dataSourceStorage'
import { useThemeMode } from '../contexts/ThemeContext'
import SearchIcon from '@mui/icons-material/Search'
import CachedIcon from '@mui/icons-material/Cached'
import InfoIcon from '@mui/icons-material/Info'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DataPreview from './DataPreview'

// Preset date ranges
const DATE_PRESETS = [
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
  { label: '5 Years', days: 1825 },
]

export default function DataFetcher({ onDataFetched }) {
  const queryClient = useQueryClient()
  const { isDark } = useThemeMode()
  const [symbol, setSymbol] = useState('')
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [useCache, setUseCache] = useState(true)
  const [forceRefresh, setForceRefresh] = useState(false)
  const [dataSource, setDataSource] = useState(() => dataSourceStorage.get())
  const [fetchedData, setFetchedData] = useState(null)
  const [dataCached, setDataCached] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('')
  const [interval, setInterval] = useState('1d')
  const [fetchSuccess, setFetchSuccess] = useState(false)

  // Available data sources
  const availableDataSources = [
    { value: 'yahoo', label: 'Yahoo Finance' },
    { value: 'alpha_vantage', label: 'Alpha Vantage' },
    { value: 'polygon', label: 'Polygon.io' },
    { value: 'iex_cloud', label: 'IEX Cloud (deprecated)' },
  ]

  // Update localStorage when data source changes
  useEffect(() => {
    dataSourceStorage.set(dataSource)
  }, [dataSource])

  // Fetch all symbols with metadata
  const { data: allSymbolsData, isLoading: symbolsLoading } = useQuery({
    queryKey: ['allSymbols'],
    queryFn: async () => {
      const response = await dataService.getAllSymbols()
      const localRecent = recentSymbolsStorage.get()
      if (localRecent.length > 0) {
        response.recent = [...new Set([...localRecent, ...(response.recent || [])])].slice(0, 10)
      }
      return response
    },
    staleTime: 5 * 60 * 1000,
  })

  // Debounced symbol for metadata lookup
  const [debouncedSymbol, setDebouncedSymbol] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSymbol(symbol)
    }, 300)
    return () => clearTimeout(timer)
  }, [symbol])

  // Fetch metadata for selected symbol
  const { data: symbolMetadata } = useQuery({
    queryKey: ['symbolMetadata', debouncedSymbol],
    queryFn: async () => {
      if (!debouncedSymbol) return null
      return await dataService.getSymbolMetadata(debouncedSymbol)
    },
    enabled: !!debouncedSymbol && debouncedSymbol.length >= 1,
    staleTime: 2 * 60 * 1000,
  })

  // Get symbol options with grouping
  const symbolOptions = useMemo(() => {
    if (!allSymbolsData) return []

    const symbols = allSymbolsData.symbols || []
    const common = allSymbolsData.common || []
    const recent = allSymbolsData.recent || []

    return symbols.map((s) => ({
      value: s.symbol,
      label: s.symbol,
      source: s.source,
      sector: s.sector,
      inDatabase: s.in_database,
      isCommon: common.includes(s.symbol),
      isRecent: recent.includes(s.symbol),
    }))
  }, [allSymbolsData])

  // Set default dates
  useEffect(() => {
    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    if (!startDate && !endDate) {
      setStartDate(oneYearAgo)
      setEndDate(today)
    }
  }, [])

  // Auto-suggest date range from metadata
  useEffect(() => {
    if (symbolMetadata && symbolMetadata.available_date_range && !fetchedData && symbol) {
      const availableStart = new Date(symbolMetadata.available_date_range.start)
      const availableEnd = new Date(symbolMetadata.available_date_range.end)
      const today = new Date()

      const suggestedEnd = availableEnd < today ? availableEnd : today
      const oneYearBeforeEnd = new Date(suggestedEnd)
      oneYearBeforeEnd.setFullYear(oneYearBeforeEnd.getFullYear() - 1)
      let suggestedStart = availableStart > oneYearBeforeEnd ? availableStart : oneYearBeforeEnd

      if (suggestedStart >= suggestedEnd) {
        suggestedStart = new Date(suggestedEnd)
        suggestedStart.setDate(suggestedStart.getDate() - 365)
        if (suggestedStart < availableStart) {
          suggestedStart = new Date(availableStart)
        }
      }

      setStartDate(suggestedStart)
      setEndDate(suggestedEnd)
      setSelectedPreset('')
    }
  }, [symbol, symbolMetadata, fetchedData])

  const handlePresetDateRange = (days, presetLabel) => {
    const today = new Date()
    const end = new Date(today)
    const start = new Date(end)
    start.setDate(start.getDate() - days)

    setStartDate(start)
    setEndDate(end)
    setSelectedPreset(presetLabel)
  }

  const handleMaxDateRange = () => {
    if (symbolMetadata && symbolMetadata.available_date_range) {
      const start = new Date(symbolMetadata.available_date_range.start)
      const end = new Date(symbolMetadata.available_date_range.end)
      setStartDate(start)
      setEndDate(end)
      setSelectedPreset('Max')
    }
  }

  const handleFetch = async () => {
    if (!symbol) {
      setError('Please enter a symbol')
      return
    }

    if (!startDate || !endDate) {
      setError('Please select date range')
      return
    }

    if (startDate >= endDate) {
      setError('Start date must be before end date')
      return
    }

    setLoading(true)
    setError(null)
    setFetchSuccess(false)

    try {
      const startStr = startDate.toISOString().split('T')[0]
      const endStr = endDate.toISOString().split('T')[0]

      const response = await dataService.fetchData({
        symbol: symbol.toUpperCase(),
        startDate: startStr,
        endDate: endStr,
        useCache: useCache,
        forceRefresh: forceRefresh,
        dataSource: dataSource !== 'yahoo' ? dataSource : null,
        interval: interval,
      })

      if (response.data && response.data.length > 0) {
        const formattedData = response.data.map((row) => ({
          ...row,
          Date: new Date(row.Date),
        }))

        setFetchedData(formattedData)
        setDataCached(response.cached || false)
        setFetchSuccess(true)

        if (response.symbol) {
          const newRecent = recentSymbolsStorage.add(response.symbol)

          try {
            await dataService.updateRecentSymbols(newRecent)
          } catch (error) {
            console.warn('Failed to update recent symbols on backend:', error)
          }

          queryClient.invalidateQueries({ queryKey: ['allSymbols'] })

          if (forceRefresh || !response.cached) {
            queryClient.invalidateQueries({ queryKey: ['symbolMetadata', symbol.toUpperCase()] })
          }
        }

        if (onDataFetched) {
          onDataFetched(formattedData, symbol.toUpperCase())
        }

        // Reset success indicator after delay
        setTimeout(() => setFetchSuccess(false), 2000)
      } else {
        setError('No data found for the selected symbol and date range')
      }
    } catch (err) {
      let errorMessage = 'Failed to fetch data'

      if (err.code === 'NOT_FOUND') {
        errorMessage = `No data found for ${symbol.toUpperCase()}. Please check the symbol and date range.`
      } else if (err.code === 'BAD_REQUEST') {
        errorMessage = err.message || `Invalid symbol: ${symbol.toUpperCase()}`
      } else if (err.code === 'SERVICE_UNAVAILABLE' || err.code === 'NETWORK_ERROR') {
        errorMessage = err.message || 'Service temporarily unavailable. Please try again in a moment.'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const selectedSymbolOption = symbolOptions.find((opt) => opt.value === symbol.toUpperCase())

  return (
    <>
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        sx={{
          p: 4,
          background: isDark
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.5) 100%)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
        }}
        elevation={0}
      >
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <Grid container spacing={2}>
          {/* Row 1: Symbol, Date Range, and Fetch Button */}
          <Grid item xs={12} sm={12} md={3.5}>
            <Autocomplete
              freeSolo
              options={symbolOptions}
              value={selectedSymbolOption || symbol}
              onInputChange={(event, newValue, reason) => {
                if (reason === 'input') {
                  setSymbol(newValue)
                } else if (reason === 'reset' && newValue && typeof newValue === 'object') {
                  setSymbol(newValue.value)
                }
              }}
              onChange={(event, newValue) => {
                if (newValue && typeof newValue === 'object') {
                  setSymbol(newValue.value)
                } else if (typeof newValue === 'string') {
                  setSymbol(newValue)
                }
              }}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option
                return option.label || option.value || ''
              }}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography sx={{ flexGrow: 1, fontWeight: option.isCommon ? 600 : 400 }}>
                      {option.label}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {option.isRecent && (
                        <Chip label="Recent" size="small" color="primary" variant="outlined" />
                      )}
                      {option.isCommon && (
                        <Chip label="Common" size="small" color="secondary" variant="outlined" />
                      )}
                      {option.inDatabase && <Chip label="DB" size="small" variant="outlined" />}
                    </Box>
                  </Box>
                </Box>
              )}
              loading={symbolsLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Symbol"
                  placeholder="e.g., AAPL, MSFT"
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
            {symbolMetadata && symbolMetadata.in_database && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                  <Typography variant="caption" color="success.main" fontWeight={500}>
                    Available in database
                  </Typography>
                </Box>
              </motion.div>
            )}
          </Grid>

          <Grid item xs={12} sm={12} md={5.5}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  setStartDate(new Date(e.target.value))
                  setSelectedPreset('')
                }}
                fullWidth
                InputLabelProps={{ shrink: true }}
                size="small"
              />
              <TextField
                label="End Date"
                type="date"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  setEndDate(new Date(e.target.value))
                  setSelectedPreset('')
                }}
                fullWidth
                InputLabelProps={{ shrink: true }}
                size="small"
              />
              {symbolMetadata && symbolMetadata.available_date_range && (
                <Tooltip title="Set to maximum available date range" arrow>
                  <IconButton
                    onClick={handleMaxDateRange}
                    size="small"
                    sx={{
                      mt: '4px',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      '&:hover': {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                      },
                    }}
                  >
                    <CachedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} sm={12} md={3}>
            <Button
              component={motion.button}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              variant="contained"
              fullWidth
              onClick={handleFetch}
              disabled={loading}
              sx={{
                height: '40px',
                fontSize: '0.9375rem',
                fontWeight: 600,
                background: fetchSuccess
                  ? 'linear-gradient(135deg, #34d399 0%, #10b981 100%)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                boxShadow: fetchSuccess
                  ? '0 2px 12px rgba(16, 185, 129, 0.3)'
                  : '0 2px 12px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: fetchSuccess
                    ? '0 4px 16px rgba(16, 185, 129, 0.4)'
                    : '0 4px 16px rgba(37, 99, 235, 0.4)',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : fetchSuccess ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <CheckCircleIcon sx={{ fontSize: 18 }} />
                  Done
                </Box>
              ) : (
                'Fetch Data'
              )}
            </Button>
          </Grid>

          {/* Row 2: Interval, Quick Date Ranges, Cache Options, Data Source, and Info */}
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Interval</InputLabel>
              <Select value={interval} label="Interval" onChange={(e) => setInterval(e.target.value)}>
                <MenuItem value="1d">Daily (1d)</MenuItem>
                <MenuItem value="1h">Hourly (1h)</MenuItem>
                <MenuItem value="1m">1 Minute (1m)</MenuItem>
                <MenuItem value="5m">5 Minutes (5m)</MenuItem>
                <MenuItem value="15m">15 Minutes (15m)</MenuItem>
                <MenuItem value="30m">30 Minutes (30m)</MenuItem>
                <MenuItem value="60m">60 Minutes (60m)</MenuItem>
                <MenuItem value="90m">90 Minutes (90m)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Quick Date Ranges</InputLabel>
              <Select
                value={selectedPreset}
                label="Quick Date Ranges"
                onChange={(e) => {
                  const value = e.target.value
                  if (value !== '') {
                    if (value === 'Max') {
                      handleMaxDateRange()
                    } else {
                      const preset = DATE_PRESETS.find((p) => p.label === value)
                      if (preset) handlePresetDateRange(preset.days, preset.label)
                    }
                  } else {
                    setSelectedPreset('')
                  }
                }}
              >
                <MenuItem value="">
                  <em>Select preset...</em>
                </MenuItem>
                {DATE_PRESETS.map((preset) => (
                  <MenuItem key={preset.label} value={preset.label}>
                    {preset.label}
                  </MenuItem>
                ))}
                {symbolMetadata && symbolMetadata.available_date_range && (
                  <MenuItem value="Max">Max Available</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={12} md={7}>
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useCache}
                    onChange={(e) => setUseCache(e.target.checked)}
                    size="small"
                    sx={{
                      '&.Mui-checked': {
                        color: 'primary.main',
                      },
                    }}
                  />
                }
                label={<Typography variant="body2">Use Cache</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={forceRefresh}
                    onChange={(e) => setForceRefresh(e.target.checked)}
                    disabled={!useCache}
                    size="small"
                    sx={{
                      '&.Mui-checked': {
                        color: 'warning.main',
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" color={!useCache ? 'text.disabled' : 'text.secondary'}>
                    Force Refresh
                  </Typography>
                }
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Data Source</InputLabel>
                <Select
                  value={dataSource}
                  label="Data Source"
                  onChange={(e) => setDataSource(e.target.value)}
                >
                  {availableDataSources.map((source) => (
                    <MenuItem key={source.value} value={source.value}>
                      {source.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {symbolMetadata && symbolMetadata.available_date_range && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.25,
                    py: 0.375,
                    borderRadius: 1.5,
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.06)',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.12)',
                    ml: 'auto',
                  }}
                >
                  <InfoIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                  <Typography variant="caption" color="primary.main" fontWeight={500}>
                    {new Date(symbolMetadata.available_date_range.start).toLocaleDateString()} -{' '}
                    {new Date(symbolMetadata.available_date_range.end).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Connecting line from step 1 to step 2 */}
      {fetchedData && fetchedData.length > 0 && (
        <Box
          sx={{
            position: 'relative',
            height: 16,
            mt: -1,
            mb: -1,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: 20,
              top: 0,
              width: 2,
              height: '100%',
              backgroundColor: 'success.main',
              zIndex: 0,
            }}
          />
        </Box>
      )}

      {/* Data Preview */}
      <AnimatePresence>
        {fetchedData && fetchedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DataPreview
              data={fetchedData}
              metadata={symbolMetadata}
              cached={dataCached}
              symbol={symbol.toUpperCase()}
              stepNumber={2}
              stepStatus={fetchedData ? 'completed' : 'pending'}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
