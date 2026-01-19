import { useState } from 'react'
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
} from '@mui/material'
import { motion } from 'framer-motion'
import { useThemeMode } from '../contexts/ThemeContext'
import CloseIcon from '@mui/icons-material/Close'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SpeedIcon from '@mui/icons-material/Speed'
import StorageIcon from '@mui/icons-material/Storage'

export default function SettingsModal({ open, onClose }) {
  const { isDark, toggleTheme } = useThemeMode()
  const [notifications, setNotifications] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30)
  const [defaultDataSource, setDefaultDataSource] = useState('yahoo')

  const handleSave = () => {
    // In a real app, save settings to localStorage or backend
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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

      <DialogContent>
        <Box sx={{ py: 2 }}>
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
              mb: 3,
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

          <Divider sx={{ my: 2 }} />

          {/* Data Section */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
            Data Settings
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
              <InputLabel>Default Data Source</InputLabel>
              <Select
                value={defaultDataSource}
                label="Default Data Source"
                onChange={(e) => setDefaultDataSource(e.target.value)}
                startAdornment={
                  <StorageIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                }
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
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          }}
        >
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  )
}
