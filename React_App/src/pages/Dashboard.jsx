import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Alert,
  Button,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { dataService } from '../services/dataService'
import { useThemeMode } from '../contexts/ThemeContext'
import { AnimatedCard, CountUpSimple, StaggerContainer, StaggerItem } from '../components/common'
import { DashboardCardSkeleton } from '../components/Skeletons'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import StorageIcon from '@mui/icons-material/Storage'
import AssessmentIcon from '@mui/icons-material/Assessment'
import TimelineIcon from '@mui/icons-material/Timeline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import ListIcon from '@mui/icons-material/List'
import TableChartIcon from '@mui/icons-material/TableChart'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import DataUsageIcon from '@mui/icons-material/DataUsage'
import EventIcon from '@mui/icons-material/Event'
import ScheduleIcon from '@mui/icons-material/Schedule'
import BarChartIcon from '@mui/icons-material/BarChart'
import SpeedIcon from '@mui/icons-material/Speed'

// Quick action card data
const quickActions = [
  {
    id: 'backtest',
    title: 'Run Backtest',
    description: 'Test your trading strategies with historical data',
    icon: TrendingUpIcon,
    path: '/backtest',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'primary',
    primary: true,
  },
  {
    id: 'explorer',
    title: 'Explore Data',
    description: 'Visualize market data and technical indicators',
    icon: AssessmentIcon,
    path: '/data-explorer',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: 'secondary',
  },
  {
    id: 'strategy',
    title: 'Build Strategy',
    description: 'Create and test custom trading strategies',
    icon: TimelineIcon,
    path: '/strategy-builder',
    gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    color: 'success',
  },
]

// Quick start steps
const quickStartSteps = [
  { step: 1, title: 'Navigate to Backtest', description: 'Click on the Backtest page in the navigation menu' },
  { step: 2, title: 'Fetch Market Data', description: 'Select a symbol and date range, then fetch data' },
  { step: 3, title: 'Select Strategy', description: 'Choose a built-in strategy or create a custom one' },
  { step: 4, title: 'Configure & Run', description: 'Set parameters and run your backtest to see results' },
]

// Helper functions for formatting
const formatNumberWithAbbr = (value) => {
  if (!value || value === 0) return '0'
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

const formatDateSpan = (days) => {
  if (!days || days === 0) return '0 days'
  const years = Math.floor(days / 365)
  const remainingDays = days % 365
  if (years > 0 && remainingDays > 0) {
    return `${years}y ${remainingDays}d`
  }
  if (years > 0) {
    return `${years}y`
  }
  return `${days}d`
}

const formatRowsPerDay = (totalRows, days) => {
  if (!totalRows || !days || days === 0) return '0'
  const rowsPerDay = Math.round(totalRows / days)
  return rowsPerDay.toLocaleString()
}

const formatCompactDate = (dateString) => {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
  } catch {
    return dateString
  }
}

const formatRelativeTime = (dateString) => {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return formatCompactDate(dateString)
  } catch {
    return formatCompactDate(dateString)
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { isDark } = useThemeMode()
  const [dbStatus, setDbStatus] = useState(null)
  const [dbStats, setDbStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [status, stats] = await Promise.all([
          dataService.getDatabaseStatus().catch((err) => {
            console.error('Database status error:', err)
            return { connected: false, message: err.message || 'Connection failed' }
          }),
          dataService.getDatabaseStatistics().catch(() => null),
        ])
        setDbStatus(status)
        setDbStats(stats)
      } catch (err) {
        console.error('Dashboard data fetch error:', err)
        setError(err.message || 'Failed to load dashboard data')
        setDbStatus({ connected: false, message: 'Unable to check connection' })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleUpdateAllTickers = async () => {
    setUpdating(true)
    setUpdateMessage(null)
    setError(null)
    
    try {
      const result = await dataService.updateAllTickers()
      setUpdateMessage(result.message || `Successfully updated ${result.successful} tickers`)
      // Refresh statistics after update
      const stats = await dataService.getDatabaseStatistics()
      setDbStats(stats)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update database')
      setUpdateMessage(null)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
          Dashboard
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <DashboardCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Box sx={{ mb: 5 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              mb: 1.5,
              background: isDark
                ? 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)'
                : 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Welcome to QuantLib, an Open-Source Quantitative Backtesting Platform
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.0625rem' }}>
            Professional quantitative trading library for backtesting and strategy development
          </Typography>
        </Box>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        </motion.div>
      )}

      {/* Quick Actions */}
      <StaggerContainer staggerDelay={0.08}>
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Grid item xs={12} sm={6} md={3} key={action.id}>
                <StaggerItem>
                  <AnimatedCard
                    hover
                    onClick={() => navigate(action.path)}
                    variant="gradient"
                    gradient={
                      isDark
                        ? `linear-gradient(135deg, ${action.gradient.includes('#3b82f6') ? 'rgba(59, 130, 246, 0.1)' : action.gradient.includes('#8b5cf6') ? 'rgba(139, 92, 246, 0.1)' : 'rgba(52, 211, 153, 0.1)'} 0%, transparent 100%)`
                        : `linear-gradient(135deg, ${action.gradient.includes('#3b82f6') ? 'rgba(37, 99, 235, 0.05)' : action.gradient.includes('#8b5cf6') ? 'rgba(124, 58, 237, 0.05)' : 'rgba(16, 185, 129, 0.05)'} 0%, transparent 100%)`
                    }
                    sx={{
                      height: '100%',
                      border: '1px solid',
                      borderColor: isDark
                        ? `${action.color === 'primary' ? 'rgba(59, 130, 246, 0.2)' : action.color === 'secondary' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(52, 211, 153, 0.2)'}`
                        : `${action.color === 'primary' ? 'rgba(37, 99, 235, 0.12)' : action.color === 'secondary' ? 'rgba(124, 58, 237, 0.12)' : 'rgba(16, 185, 129, 0.12)'}`,
                    }}
                    contentSx={{ p: 3.5, display: 'flex', flexDirection: 'column', height: '100%' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          background: action.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1.5,
                          boxShadow: `0 4px 12px ${action.color === 'primary' ? 'rgba(37, 99, 235, 0.25)' : action.color === 'secondary' ? 'rgba(124, 58, 237, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                        }}
                      >
                        <Icon sx={{ fontSize: 24, color: '#fff' }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
                        {action.title}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2.5, lineHeight: 1.6, flex: 1, minHeight: '2.8rem' }}
                    >
                      {action.description}
                    </Typography>
                    <Button
                      variant={action.primary ? 'contained' : 'outlined'}
                      size="small"
                      fullWidth
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                      color={action.color}
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        height: 36,
                        ...(action.primary && {
                          background: action.gradient,
                          boxShadow: `0 2px 8px ${action.color === 'primary' ? 'rgba(37, 99, 235, 0.3)' : 'rgba(0,0,0,0.2)'}`,
                          '&:hover': {
                            boxShadow: `0 4px 12px ${action.color === 'primary' ? 'rgba(37, 99, 235, 0.4)' : 'rgba(0,0,0,0.3)'}`,
                          },
                        }),
                      }}
                    >
                      {action.primary ? 'Get Started' : 'Explore'}
                    </Button>
                  </AnimatedCard>
                </StaggerItem>
              </Grid>
            )
          })}

          {/* Database Status Card */}
          <Grid item xs={12} sm={6} md={3}>
            <StaggerItem>
              <AnimatedCard
                variant="gradient"
                gradient={
                  dbStatus?.connected
                    ? isDark
                      ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, transparent 100%)'
                      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, transparent 100%)'
                    : isDark
                      ? 'linear-gradient(135deg, rgba(248, 113, 113, 0.1) 0%, transparent 100%)'
                      : 'linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, transparent 100%)'
                }
                sx={{
                  height: '100%',
                  border: '1px solid',
                  borderColor: dbStatus?.connected
                    ? isDark
                      ? 'rgba(52, 211, 153, 0.2)'
                      : 'rgba(16, 185, 129, 0.15)'
                    : isDark
                      ? 'rgba(248, 113, 113, 0.2)'
                      : 'rgba(239, 68, 68, 0.15)',
                }}
                contentSx={{ p: 3.5, display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: dbStatus?.connected
                        ? 'linear-gradient(135deg, #34d399 0%, #10b981 100%)'
                        : 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1.5,
                      boxShadow: dbStatus?.connected
                        ? '0 4px 12px rgba(16, 185, 129, 0.25)'
                        : '0 4px 12px rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    {dbStatus?.connected ? (
                      <CheckCircleIcon sx={{ fontSize: 24, color: '#fff' }} />
                    ) : (
                      <ErrorIcon sx={{ fontSize: 24, color: '#fff' }} />
                    )}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
                    Database
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2.5, lineHeight: 1.6, flex: 1, minHeight: '2.8rem' }}
                >
                  {dbStatus?.connected 
                    ? 'PostgreSQL database is online and ready' 
                    : 'Database connection unavailable'}
                </Typography>
                <Chip
                  label={dbStatus?.connected ? 'Active' : 'Inactive'}
                  color={dbStatus?.connected ? 'success' : 'error'}
                  size="medium"
                  sx={{ 
                    fontWeight: 600,
                    height: 36,
                    fontSize: '0.875rem',
                  }}
                />
              </AnimatedCard>
            </StaggerItem>
          </Grid>
        </Grid>
      </StaggerContainer>

      {/* Database Statistics */}
      {dbStats && dbStats.total_symbols > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Paper
            sx={{
              p: 3,
              mb: 5,
              elevation: 0,
              background: isDark
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.5) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.5) 100%)',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                  }}
                >
                  <StorageIcon sx={{ fontSize: 24, color: '#fff' }} />
                </Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, fontSize: '1.375rem', letterSpacing: '-0.02em' }}
                >
                  Database Statistics
                </Typography>
              </Box>
              <Tooltip title="Update database with all tickers from tickers.json">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={updating ? <CircularProgress size={16} color="inherit" /> : <CloudDownloadIcon />}
                  onClick={handleUpdateAllTickers}
                  disabled={updating || !dbStatus?.connected}
                  sx={{
                    minWidth: 140,
                  }}
                >
                  {updating ? 'Updating...' : 'Update All'}
                </Button>
              </Tooltip>
            </Box>
            {updateMessage && (
              <Alert severity="success" sx={{ mb: 2.5 }} onClose={() => setUpdateMessage(null)}>
                {updateMessage}
              </Alert>
            )}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              {[
                {
                  label: 'Symbols',
                  value: dbStats.total_symbols,
                  color: 'primary.main',
                  icon: ListIcon,
                },
                {
                  label: 'Total Rows',
                  value: dbStats.total_rows || 0,
                  color: 'secondary.main',
                  icon: TableChartIcon,
                },
                {
                  label: 'Avg Rows',
                  value: dbStats.avg_rows_per_symbol ? Math.round(dbStats.avg_rows_per_symbol) : 0,
                  color: 'warning.main',
                  icon: BarChartIcon,
                },
                {
                  label: 'Date Span',
                  value: dbStats.date_span_days || 0,
                  suffix: '',
                  color: 'success.main',
                  icon: CalendarTodayIcon,
                  formatSpan: true,
                },
                {
                  label: 'Top Ticker',
                  value: 'AAPL',
                  color: 'primary.main',
                  icon: TrendingUpIcon,
                  isText: true,
                },
                {
                  label: 'DB Size',
                  value: dbStats.total_size_gb
                    ? dbStats.total_size_gb < 1
                      ? dbStats.total_size_gb * 1024
                      : dbStats.total_size_gb
                    : 0,
                  suffix: dbStats.total_size_gb && dbStats.total_size_gb < 1 ? 'MB' : 'GB',
                  decimals: dbStats.total_size_gb && dbStats.total_size_gb < 1 ? 0 : 1,
                  color: 'info.main',
                  icon: DataUsageIcon,
                },
                {
                  label: 'Rows/Day',
                  value: formatRowsPerDay(dbStats.total_rows, dbStats.date_span_days),
                  color: 'warning.main',
                  icon: SpeedIcon,
                  isText: true,
                },
                {
                  label: 'Earliest',
                  value: dbStats.earliest_date,
                  color: 'text.secondary',
                  icon: EventIcon,
                  isDate: true,
                },
                {
                  label: 'Latest',
                  value: dbStats.latest_date,
                  color: 'text.secondary',
                  icon: EventIcon,
                  isDate: true,
                },
                {
                  label: 'Last Update',
                  value: dbStats.last_update,
                  color: 'text.secondary',
                  icon: ScheduleIcon,
                  isRelativeTime: true,
                },
              ].map((stat, index) => (
                <Box
                  key={stat.label}
                  sx={{
                    flex: { xs: '1 1 calc(50% - 6px)', sm: '1 1 calc(33.333% - 10px)', md: '1 1 calc(20% - 12px)' },
                    minWidth: { xs: 'calc(50% - 6px)', sm: 'calc(33.333% - 10px)', md: 'calc(20% - 12px)' },
                    maxWidth: { xs: 'calc(50% - 6px)', sm: 'calc(33.333% - 10px)', md: 'calc(20% - 12px)' },
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.08 }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        background: isDark
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'rgba(0, 0, 0, 0.02)',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.03)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75, gap: 0.5 }}>
                        {stat.icon && (
                          <stat.icon
                            sx={{
                              fontSize: 16,
                              color: stat.color,
                              opacity: 0.7,
                            }}
                          />
                        )}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                        >
                          {stat.label}
                        </Typography>
                      </Box>
                      {stat.isDate ? (
                        <Typography
                          variant="h6"
                          sx={{ fontSize: '1rem', fontWeight: 600, color: stat.color, lineHeight: 1.3 }}
                        >
                          {formatCompactDate(stat.value)}
                        </Typography>
                      ) : stat.isRelativeTime ? (
                        <Typography
                          variant="h6"
                          sx={{ fontSize: '1rem', fontWeight: 600, color: stat.color, lineHeight: 1.3 }}
                        >
                          {formatRelativeTime(stat.value)}
                        </Typography>
                      ) : stat.isText ? (
                        <Typography
                          variant="h6"
                          sx={{ fontSize: '1.375rem', fontWeight: 600, color: stat.color, lineHeight: 1.3 }}
                        >
                          {stat.value}
                        </Typography>
                      ) : stat.formatSpan ? (
                        <Typography
                          variant="h6"
                          sx={{ fontSize: '1.375rem', fontWeight: 600, color: stat.color, lineHeight: 1.3 }}
                        >
                          {formatDateSpan(stat.value)}
                        </Typography>
                      ) : (
                        <CountUpSimple
                          value={stat.value}
                          suffix={stat.suffix || ''}
                          decimals={stat.decimals || 0}
                          variant="h4"
                          color={stat.color}
                          sx={{ fontSize: '1.375rem' }}
                        />
                      )}
                    </Box>
                  </motion.div>
                </Box>
              ))}
            </Box>
          </Paper>
        </motion.div>
      )}

      {/* Quick Start Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Paper
          sx={{
            p: 4.5,
            elevation: 0,
            background: isDark
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.5) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.5) 100%)',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 700, mb: 3, fontSize: '1.5rem', letterSpacing: '-0.02em' }}
          >
            Quick Start Guide
          </Typography>
          <Grid container spacing={3}>
            {quickStartSteps.map((item, index) => (
              <Grid item xs={12} md={6} key={item.step}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      p: 2.5,
                      borderRadius: 2,
                      background: isDark
                        ? 'rgba(255, 255, 255, 0.02)'
                        : 'rgba(248, 250, 252, 0.8)',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: isDark
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(255, 255, 255, 0.9)',
                        borderColor: 'primary.main',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2.5,
                        fontWeight: 700,
                        fontSize: '1.125rem',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                        flexShrink: 0,
                      }}
                    >
                      {item.step}
                    </Box>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.0625rem' }}
                      >
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {item.description}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </motion.div>
    </Container>
  )
}
