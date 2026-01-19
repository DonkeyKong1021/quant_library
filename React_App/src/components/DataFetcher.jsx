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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { dataService } from '../services/dataService'
import { recentSymbolsStorage } from '../utils/localStorage'
import { dataSourceStorage } from '../utils/dataSourceStorage'
import SearchIcon from '@mui/icons-material/Search'
import CachedIcon from '@mui/icons-material/Cached'
import RefreshIcon from '@mui/icons-material/Refresh'
import InfoIcon from '@mui/icons-material/Info'
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
      // Merge with localStorage recent symbols
      const localRecent = recentSymbolsStorage.get()
      if (localRecent.length > 0) {
        response.recent = [...new Set([...localRecent, ...(response.recent || [])])].slice(0, 10)
      }
      return response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Debounced symbol for metadata lookup (avoid API calls on every keystroke)
  const [debouncedSymbol, setDebouncedSymbol] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSymbol(symbol)
    }, 300)
    return () => clearTimeout(timer)
  }, [symbol])

  // Fetch metadata for selected symbol (debounced)
  const { data: symbolMetadata } = useQuery({
    queryKey: ['symbolMetadata', debouncedSymbol],
    queryFn: async () => {
      if (!debouncedSymbol) return null
      return await dataService.getSymbolMetadata(debouncedSymbol)
    },
    enabled: !!debouncedSymbol && debouncedSymbol.length >= 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
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

  // Set default dates (1 year ago to today)
  useEffect(() => {
    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    if (!startDate && !endDate) {
      setStartDate(oneYearAgo)
      setEndDate(today)
    }
  }, [])

  // Auto-suggest date range from metadata (only when symbol changes)
  useEffect(() => {
    if (symbolMetadata && symbolMetadata.available_date_range && !fetchedData && symbol) {
      const availableStart = new Date(symbolMetadata.available_date_range.start)
      const availableEnd = new Date(symbolMetadata.available_date_range.end)
      const today = new Date()

      // Set end date to today or available end, whichever is earlier
      const suggestedEnd = availableEnd < today ? availableEnd : today

      // Set start date to 1 year before end or available start, whichever is later
      const oneYearBeforeEnd = new Date(suggestedEnd)
      oneYearBeforeEnd.setFullYear(oneYearBeforeEnd.getFullYear() - 1)
      let suggestedStart = availableStart > oneYearBeforeEnd ? availableStart : oneYearBeforeEnd

      // Ensure start is always before end
      if (suggestedStart >= suggestedEnd) {
        suggestedStart = new Date(suggestedEnd)
        suggestedStart.setDate(suggestedStart.getDate() - 365) // Go back 1 year from end
        if (suggestedStart < availableStart) {
          suggestedStart = new Date(availableStart)
        }
      }

      // Set both dates together to ensure valid range
      setStartDate(suggestedStart)
      setEndDate(suggestedEnd)
      setSelectedPreset('') // Clear preset when auto-setting dates
    }
  }, [symbol, symbolMetadata, fetchedData])

  const handlePresetDateRange = (days, presetLabel) => {
    const today = new Date()
    const end = new Date(today) // Today

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

    try {
      const startStr = startDate.toISOString().split('T')[0]
      const endStr = endDate.toISOString().split('T')[0]

      const response = await dataService.fetchData({
        symbol: symbol.toUpperCase(),
        startDate: startStr,
        endDate: endStr,
        useCache: useCache,
        forceRefresh: forceRefresh,
        dataSource: dataSource !== 'yahoo' ? dataSource : null, // Only send if not default
        interval: interval,
      })

      if (response.data && response.data.length > 0) {
        // Convert data back to format expected by components
        const formattedData = response.data.map((row) => ({
          ...row,
          Date: new Date(row.Date),
        }))

        setFetchedData(formattedData)
        setDataCached(response.cached || false)

        // Update recent symbols in localStorage
        if (response.symbol) {
          const newRecent = recentSymbolsStorage.add(response.symbol)
          
          // Also update backend (optional, for future multi-user support)
          try {
            await dataService.updateRecentSymbols(newRecent)
          } catch (error) {
            // Backend update is optional, localStorage is source of truth
            console.warn('Failed to update recent symbols on backend:', error)
          }
          
          // Invalidate symbols query to refresh recent symbols
          queryClient.invalidateQueries({ queryKey: ['allSymbols'] })
          
          // Invalidate metadata query to refresh date ranges after fetching data
          // This ensures the UI shows updated available_date_range when data is refreshed
          // Metadata changes when data is saved to database (force refresh or new data)
          if (forceRefresh || !response.cached) {
            queryClient.invalidateQueries({ queryKey: ['symbolMetadata', symbol.toUpperCase()] })
          }
        }

        if (onDataFetched) {
          onDataFetched(formattedData, symbol.toUpperCase())
        }
      } else {
        setError('No data found for the selected symbol and date range')
      }
    } catch (err) {
      // Enhanced error handling with specific messages
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
      <Paper sx={{ p: 4, elevation: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Fetch Market Data
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Symbol Selection */}
          <Grid item xs={12} md={4}>
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
                      {option.inDatabase && (
                        <Chip label="DB" size="small" variant="outlined" />
                      )}
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
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
            {symbolMetadata && symbolMetadata.in_database && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Available in database
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Date Range */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                setStartDate(new Date(e.target.value))
                setSelectedPreset('') // Clear preset when manually changed
              }}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="End Date"
                type="date"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  setEndDate(new Date(e.target.value))
                  setSelectedPreset('') // Clear preset when manually changed
                }}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              {symbolMetadata && symbolMetadata.available_date_range && (
                <Tooltip title="Set to maximum available date range">
                  <IconButton onClick={handleMaxDateRange} size="small" sx={{ mt: 1 }}>
                    <CachedIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Grid>

          {/* Fetch Button */}
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleFetch}
              disabled={loading}
              sx={{ 
                height: '56px',
                fontSize: '0.9375rem',
                fontWeight: 500,
              }}
              size="large"
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Fetch Data'}
            </Button>
          </Grid>

          {/* Interval Selector */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Interval</InputLabel>
              <Select
                value={interval}
                label="Interval"
                onChange={(e) => setInterval(e.target.value)}
              >
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

          {/* Date Presets */}
          <Grid item xs={12} md={4}>
            <FormControl size="small" fullWidth>
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

          {/* Cache Options and Data Source */}
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Checkbox checked={useCache} onChange={(e) => setUseCache(e.target.checked)} />
                }
                label="Use Cache"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={forceRefresh}
                    onChange={(e) => setForceRefresh(e.target.checked)}
                    disabled={!useCache}
                  />
                }
                label="Force Refresh"
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
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
                <Typography variant="caption" color="text.secondary">
                  Available: {new Date(symbolMetadata.available_date_range.start).toLocaleDateString()} -{' '}
                  {new Date(symbolMetadata.available_date_range.end).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Preview */}
      {fetchedData && fetchedData.length > 0 && (
        <DataPreview
          data={fetchedData}
          metadata={symbolMetadata}
          cached={dataCached}
          symbol={symbol.toUpperCase()}
        />
      )}
    </>
  )
}