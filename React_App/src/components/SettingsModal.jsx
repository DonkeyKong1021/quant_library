import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useThemeMode } from '../contexts/ThemeContext'
import { chartLibraryStorage } from '../utils/chartLibraryStorage'
import { dataSourceStorage } from '../utils/dataSourceStorage'
import { settingsService } from '../services/settingsService'
import CloseIcon from '@mui/icons-material/Close'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SpeedIcon from '@mui/icons-material/Speed'
import StorageIcon from '@mui/icons-material/Storage'
import BarChartIcon from '@mui/icons-material/BarChart'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'

export default function SettingsModal({ open, onClose }) {
  const { isDark, toggleTheme } = useThemeMode()
  const [activeTab, setActiveTab] = useState(0)
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('quantlib_notifications')
    return stored !== null ? JSON.parse(stored) : true
  })
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const stored = localStorage.getItem('quantlib_auto_refresh')
    return stored !== null ? JSON.parse(stored) : true
  })
  const [refreshInterval, setRefreshInterval] = useState(() => {
    const stored = localStorage.getItem('quantlib_refresh_interval')
    return stored ? parseInt(stored, 10) : 30
  })
  const [defaultDataSource, setDefaultDataSource] = useState(() => dataSourceStorage.get())
  const [chartLibrary, setChartLibrary] = useState(() => chartLibraryStorage.get())
  
  // API keys state
  const [apiKeys, setApiKeys] = useState({
    alpha_vantage: '',
    polygon: '',
    openai: '',
    anthropic: '',
  })
  const [apiKeysSet, setApiKeysSet] = useState({
    alpha_vantage: false,
    polygon: false,
    openai: false,
    anthropic: false,
  })
  const [showApiKeys, setShowApiKeys] = useState({
    alpha_vantage: false,
    polygon: false,
    openai: false,
    anthropic: false,
  })
  const [loadingKeys, setLoadingKeys] = useState(false)
  const [savingKeys, setSavingKeys] = useState(false)
  const [keysError, setKeysError] = useState(null)

  // Load settings on mount
  useEffect(() => {
    if (open) {
      setDefaultDataSource(dataSourceStorage.get())
      setChartLibrary(chartLibraryStorage.get())
      loadAPIKeys()
    }
  }, [open])

  const loadAPIKeys = async () => {
    setLoadingKeys(true)
    setKeysError(null)
    try {
      const response = await settingsService.getAPIKeys()
      setApiKeysSet({
        alpha_vantage: response.alpha_vantage_set,
        polygon: response.polygon_set,
        openai: response.openai_set,
        anthropic: response.anthropic_set,
      })
      // Initialize keys as empty (we can't retrieve actual values for security)
      setApiKeys({
        alpha_vantage: '',
        polygon: '',
        openai: '',
        anthropic: '',
      })
    } catch (error) {
      console.error('Error loading API keys:', error)
      setKeysError('Failed to load API keys. Please try again.')
    } finally {
      setLoadingKeys(false)
    }
  }

  const handleSave = async () => {
    // Save data source
    dataSourceStorage.set(defaultDataSource)
    
    // Save other settings
    localStorage.setItem('quantlib_notifications', JSON.stringify(notifications))
    localStorage.setItem('quantlib_auto_refresh', JSON.stringify(autoRefresh))
    localStorage.setItem('quantlib_refresh_interval', refreshInterval.toString())
    
    // Chart library is saved on change, but ensure it's saved here too
    chartLibraryStorage.set(chartLibrary)
    
    // Save API keys to backend
    setSavingKeys(true)
    setKeysError(null)
    try {
      // Only send keys that have been changed (non-empty values)
      const keysToSave = {}
      if (apiKeys.alpha_vantage) keysToSave.alpha_vantage = apiKeys.alpha_vantage
      if (apiKeys.polygon) keysToSave.polygon = apiKeys.polygon
      if (apiKeys.openai) keysToSave.openai = apiKeys.openai
      if (apiKeys.anthropic) keysToSave.anthropic = apiKeys.anthropic
      
      await settingsService.saveAPIKeys(keysToSave)
      await loadAPIKeys() // Reload to update status
      onClose()
    } catch (error) {
      console.error('Error saving API keys:', error)
      setKeysError('Failed to save API keys. Please try again.')
      setSavingKeys(false)
    }
  }

  const handleApiKeyChange = (key, value) => {
    setApiKeys((prev) => ({ ...prev, [key]: value }))
  }

  const toggleApiKeyVisibility = (key) => {
    setShowApiKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }
  
  const getApiKeyPlaceholder = (keyType) => {
    return apiKeysSet[keyType] ? '•••••••• (key is set)' : 'Enter API key'
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: isDark
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Settings
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 48,
              },
            }}
          >
            <Tab label="General" icon={<DarkModeIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label="Data" icon={<StorageIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label="Charts" icon={<BarChartIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ py: 3, px: 3, minHeight: 400, maxHeight: 500, overflow: 'auto' }}>
          {/* General Tab */}
          {activeTab === 0 && (
            <Box>
              {/* Appearance Section */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                Appearance
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: '1px solid',
                  borderColor: 'divider',
                  mb: 3,
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={isDark}
                      onChange={toggleTheme}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DarkModeIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                      <Typography>Dark Mode</Typography>
                    </Box>
                  }
                  sx={{ width: '100%', justifyContent: 'space-between', ml: 0 }}
                  labelPlacement="start"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Notifications Section */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                Notifications
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NotificationsIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                      <Typography>Enable Notifications</Typography>
                    </Box>
                  }
                  sx={{ width: '100%', justifyContent: 'space-between', ml: 0 }}
                  labelPlacement="start"
                />
              </Box>
            </Box>
          )}

          {/* Data Tab */}
          {activeTab === 1 && (
            <Box>
              {/* Data Source Section */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                Data Source
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: '1px solid',
                  borderColor: 'divider',
                  mb: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2.5,
                }}
              >
                <FormControl fullWidth size="small">
                  <InputLabel>Default Data Source</InputLabel>
                  <Select
                    value={defaultDataSource}
                    label="Default Data Source"
                    onChange={(e) => setDefaultDataSource(e.target.value)}
                  >
                    <MenuItem value="yahoo">Yahoo Finance</MenuItem>
                    <MenuItem value="alpha_vantage">Alpha Vantage</MenuItem>
                    <MenuItem value="polygon">Polygon.io</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SpeedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                      <Typography>Auto-refresh Data</Typography>
                    </Box>
                  }
                  sx={{ width: '100%', justifyContent: 'space-between', ml: 0 }}
                  labelPlacement="start"
                />

                {autoRefresh && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Box sx={{ px: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Refresh Interval: {refreshInterval} seconds
                      </Typography>
                      <Slider
                        value={refreshInterval}
                        onChange={(e, value) => setRefreshInterval(value)}
                        min={10}
                        max={120}
                        step={10}
                        marks={[
                          { value: 10, label: '10s' },
                          { value: 60, label: '60s' },
                          { value: 120, label: '120s' },
                        ]}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </motion.div>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* API Keys Section */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                API Keys
              </Typography>
              {loadingKeys ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2.5,
                  }}
                >
                  {keysError && (
                    <Alert severity="error" sx={{ mb: 1 }} onClose={() => setKeysError(null)}>
                      {keysError}
                    </Alert>
                  )}

                  {/* Alpha Vantage API Key */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Alpha Vantage API Key"
                    type={showApiKeys.alpha_vantage ? 'text' : 'password'}
                    value={apiKeys.alpha_vantage}
                    onChange={(e) => handleApiKeyChange('alpha_vantage', e.target.value)}
                    placeholder={getApiKeyPlaceholder('alpha_vantage')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKeyIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => toggleApiKeyVisibility('alpha_vantage')}
                            edge="end"
                          >
                            {showApiKeys.alpha_vantage ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Required for Alpha Vantage data source"
                  />

                  {/* Polygon API Key */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Polygon.io API Key"
                    type={showApiKeys.polygon ? 'text' : 'password'}
                    value={apiKeys.polygon}
                    onChange={(e) => handleApiKeyChange('polygon', e.target.value)}
                    placeholder={getApiKeyPlaceholder('polygon')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKeyIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => toggleApiKeyVisibility('polygon')}
                            edge="end"
                          >
                            {showApiKeys.polygon ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Required for Polygon.io data source"
                  />

                  {/* OpenAI API Key */}
                  <TextField
                    fullWidth
                    size="small"
                    label="OpenAI API Key"
                    type={showApiKeys.openai ? 'text' : 'password'}
                    value={apiKeys.openai}
                    onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                    placeholder={getApiKeyPlaceholder('openai')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKeyIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => toggleApiKeyVisibility('openai')}
                            edge="end"
                          >
                            {showApiKeys.openai ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Required for AI-powered features (strategy generation, insights)"
                  />

                  {/* Anthropic API Key */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Anthropic API Key"
                    type={showApiKeys.anthropic ? 'text' : 'password'}
                    value={apiKeys.anthropic}
                    onChange={(e) => handleApiKeyChange('anthropic', e.target.value)}
                    placeholder={getApiKeyPlaceholder('anthropic')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKeyIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => toggleApiKeyVisibility('anthropic')}
                            edge="end"
                          >
                            {showApiKeys.anthropic ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Alternative to OpenAI for AI-powered features"
                  />

                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 1 }}>
                    API keys are encrypted and stored securely on the server. Leave fields empty to keep existing keys unchanged.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Charts Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                Chart Settings
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2.5,
                }}
              >
                <FormControl fullWidth size="small">
                  <InputLabel>Chart Library</InputLabel>
                  <Select
                    value={chartLibrary}
                    label="Chart Library"
                    onChange={(e) => {
                      const newLibrary = e.target.value
                      setChartLibrary(newLibrary)
                      chartLibraryStorage.set(newLibrary)
                      // Trigger chart library change event
                      window.dispatchEvent(new Event('chartLibraryChanged'))
                    }}
                  >
                    <MenuItem value="plotly">Plotly (Default)</MenuItem>
                    <MenuItem value="tradingview">TradingView Lightweight Charts</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  TradingView is optimized for financial charts with better performance for large datasets.
                  Plotly offers more chart types including heatmaps and histograms.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" disabled={savingKeys}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={savingKeys}
          sx={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          }}
        >
          {savingKeys ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
