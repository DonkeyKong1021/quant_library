import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import { databaseService } from '../services/databaseService'
import { useThemeMode } from '../contexts/ThemeContext'

export default function DatabaseSelectorModal({ open, onClose, onSelectDatabase, currentDatabase }) {
  const { isDark } = useThemeMode()
  const [databases, setDatabases] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedDatabase, setSelectedDatabase] = useState(currentDatabase || 'yahoo')

  useEffect(() => {
    if (open) {
      loadDatabaseInfo()
    }
  }, [open])

  const loadDatabaseInfo = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await databaseService.getDatabaseInfo()
      setDatabases(data.databases || [])
    } catch (err) {
      console.error('Error loading database info:', err)
      setError('Failed to load database information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (db) => {
    const dbSource = getDatabaseSource(db.name)
    if (dbSource) {
      setSelectedDatabase(dbSource)
      // Immediately switch if database is available
      if (db.available && onSelectDatabase) {
        onSelectDatabase(dbSource)
        onClose()
      }
    }
  }

  const handleConfirm = () => {
    if (onSelectDatabase && selectedDatabase) {
      onSelectDatabase(selectedDatabase)
    }
    onClose()
  }

  const getDatabaseSource = (name) => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('yahoo')) return 'yahoo'
    if (nameLower.includes('alpha')) return 'alpha_vantage'
    if (nameLower.includes('polygon')) return 'polygon'
    if (nameLower.includes('default')) return 'default'
    return null
  }

  const isSelected = (db) => {
    const dbSource = getDatabaseSource(db.name)
    if (!dbSource) return false
    const currentSource = currentDatabase?.toLowerCase() || 'yahoo'
    return dbSource === currentSource || dbSource === selectedDatabase
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box component="span" sx={{ fontWeight: 600 }}>
          Select Database
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose which database to use for data operations. Each database stores data from its respective source.
            </Typography>

            <Box display="flex" flexDirection="column" gap={2}>
              {databases.map((db) => {
                const dbSource = getDatabaseSource(db.name)
                const isActive = dbSource === (currentDatabase?.toLowerCase() || 'yahoo')

                return (
                  <Box
                    key={db.name}
                    sx={{
                      p: 2.5,
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      borderRadius: 2,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        {db.available ? (
                          <CheckCircleIcon sx={{ color: isDark ? '#4caf50' : '#66bb6a', fontSize: 28 }} />
                        ) : (
                          <ErrorIcon sx={{ color: '#f44336', fontSize: 28 }} />
                        )}
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {db.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {db.available 
                              ? (isActive ? 'Currently active database' : 'Database is online and ready')
                              : (db.error || 'Database unavailable')
                            }
                          </Typography>
                        </Box>
                      </Box>
                      {isActive && (
                        <Chip
                          label="Active"
                          size="small"
                          sx={{
                            backgroundColor: isDark ? '#4caf50' : '#66bb6a',
                            color: '#ffffff',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Box>

                    <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
                      <Box display="flex" gap={1.5} flexWrap="wrap">
                        {db.available && db.database_name && (
                          <Chip
                            label={`DB: ${db.database_name}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {db.available && db.size_gb !== undefined && (
                          <Chip
                            label={`${db.size_gb} GB`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {!db.available && (
                          <Chip
                            label={db.error || 'Unavailable'}
                            size="small"
                            sx={{
                              backgroundColor: isDark ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)',
                              color: '#f44336',
                            }}
                          />
                        )}
                      </Box>
                      <Button
                        variant={isActive ? "contained" : "outlined"}
                        onClick={() => handleSelect(db)}
                        disabled={!db.available}
                        sx={{
                          minWidth: 100,
                          backgroundColor: isActive 
                            ? (isDark ? '#4caf50' : '#66bb6a')
                            : 'transparent',
                          borderColor: isDark ? '#4caf50' : '#66bb6a',
                          color: isActive 
                            ? '#ffffff'
                            : (isDark ? '#4caf50' : '#66bb6a'),
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: isActive
                              ? (isDark ? '#45a049' : '#5ba85f')
                              : (isDark ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.08)'),
                            borderColor: isDark ? '#4caf50' : '#66bb6a',
                          },
                          '&:disabled': {
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                          },
                        }}
                      >
                        {isActive ? 'Active' : 'Switch To'}
                      </Button>
                    </Box>
                  </Box>
                )
              })}
            </Box>

            {databases.length > 0 && (
              <Box 
                mt={3} 
                p={2} 
                sx={{ 
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 1 
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  <strong>Summary:</strong> {databases.filter((db) => db.available).length} of{' '}
                  {databases.length} databases available
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
