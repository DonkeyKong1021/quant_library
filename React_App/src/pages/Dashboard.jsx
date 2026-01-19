import { useState, useEffect, useMemo } from 'react'
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
  Link,
  Card,
  CardContent,
  Divider,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Plot from 'react-plotly.js'
import { dataService } from '../services/dataService'
import { backtestService } from '../services/backtestService'
import { getLibraryStrategies } from '../services/strategyLibraryService'
import { useThemeMode } from '../contexts/ThemeContext'
import { getChartLayout, getChartColors, getChartConfig } from '../theme/chartTheme'
import { AnimatedCard, CountUpSimple, StaggerContainer, StaggerItem } from '../components/common'
import { DashboardCardSkeleton } from '../components/Skeletons'
import PerformanceDetailsModal from '../components/PerformanceDetailsModal'
import DatabaseStatsModal from '../components/DatabaseStatsModal'
import DatabaseSelectorModal from '../components/DatabaseSelectorModal'
import { databaseStorage } from '../utils/databaseStorage'
import StrategyPerformanceModal from '../components/StrategyPerformanceModal'
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
import ShowChartIcon from '@mui/icons-material/ShowChart'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import HistoryIcon from '@mui/icons-material/History'
import InsightsIcon from '@mui/icons-material/Lightbulb'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import VisibilityIcon from '@mui/icons-material/Visibility'
import LaunchIcon from '@mui/icons-material/Launch'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'

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
  const { isDark, mode } = useThemeMode()
  const [dbStatus, setDbStatus] = useState(null)
  const [dbStats, setDbStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState(null)
  
  // New state for backtest data
  const [backtestResults, setBacktestResults] = useState([])
  const [backtestLoading, setBacktestLoading] = useState(false)
  const [strategyLibrary, setStrategyLibrary] = useState([])
  
  // Modal states
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false)
  const [databaseModalOpen, setDatabaseModalOpen] = useState(false)
  const [databaseSelectorOpen, setDatabaseSelectorOpen] = useState(false)
  const [strategyModalOpen, setStrategyModalOpen] = useState(false)
  const [currentDatabase, setCurrentDatabase] = useState(() => {
    try {
      return localStorage.getItem('quantlib_selected_database') || 'yahoo'
    } catch {
      return 'yahoo'
    }
  })

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

  // Fetch backtest data
  useEffect(() => {
    const fetchBacktestData = async () => {
      try {
        setBacktestLoading(true)
        // Fetch backtests for aggregation (limit 100)
        const allResponse = await backtestService.listBacktestResults({
          limit: 100,
          offset: 0,
          sort_by: 'created_at',
          sort_order: 'DESC',
        }).catch((err) => {
          console.error('Error fetching all backtests:', err)
          return { results: [] }
        })
        setBacktestResults(allResponse.results || [])

        // Fetch strategy library
        try {
          const strategies = await getLibraryStrategies()
          setStrategyLibrary(strategies.strategies || [])
        } catch (err) {
          console.error('Error fetching strategy library:', err)
          setStrategyLibrary([])
        }
      } catch (err) {
        console.error('Error fetching backtest data:', err)
        // Set empty arrays on error to prevent rendering issues
        setBacktestResults([])
      } finally {
        setBacktestLoading(false)
      }
    }

    fetchBacktestData()
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

  // Aggregation functions for backtest statistics
  const performanceStats = useMemo(() => {
    if (!backtestResults || backtestResults.length === 0) {
      return null
    }

    const resultsWithMetrics = backtestResults.filter(r => r.metrics)
    
    if (resultsWithMetrics.length === 0) return null

    // Calculate total backtests
    const totalBacktests = backtestResults.length

    // Calculate average return
    const returns = resultsWithMetrics
      .map(r => r.metrics.total_return)
      .filter(r => r !== null && r !== undefined)
    const avgReturn = returns.length > 0 
      ? returns.reduce((a, b) => a + b, 0) / returns.length 
      : 0

    // Find best performing strategy (by Sharpe ratio)
    const strategiesWithSharpe = resultsWithMetrics
      .map(r => ({
        strategy: r.strategy_name || 'Unknown',
        sharpe: r.metrics.sharpe_ratio || 0,
        return: r.metrics.total_return || 0,
      }))
      .filter(s => s.sharpe !== null && s.sharpe !== undefined)
    
    const bestStrategy = strategiesWithSharpe.length > 0
      ? strategiesWithSharpe.reduce((best, current) => 
          current.sharpe > best.sharpe ? current : best
        )
      : null

    // Find most tested symbol
    const symbolCounts = {}
    backtestResults.forEach(r => {
      if (r.symbol) {
        symbolCounts[r.symbol] = (symbolCounts[r.symbol] || 0) + 1
      }
    })
    const mostTestedSymbol = Object.keys(symbolCounts).length > 0
      ? Object.keys(symbolCounts).reduce((a, b) => symbolCounts[a] > symbolCounts[b] ? a : b)
      : null

    // Calculate success rate (positive returns)
    const positiveReturns = returns.filter(r => r > 0).length
    const successRate = returns.length > 0 ? (positiveReturns / returns.length) * 100 : 0

    // Calculate total trades
    const totalTrades = resultsWithMetrics.reduce((sum, r) => {
      return sum + (r.metrics.num_trades || 0)
    }, 0)

    return {
      totalBacktests,
      avgReturn,
      bestStrategy: bestStrategy?.strategy || 'N/A',
      bestStrategySharpe: bestStrategy?.sharpe || 0,
      mostTestedSymbol: mostTestedSymbol || 'N/A',
      successRate,
      totalTrades,
    }
  }, [backtestResults])

  // Strategy usage statistics
  const strategyStats = useMemo(() => {
    if (!backtestResults || backtestResults.length === 0) return {}
    
    const counts = {}
    backtestResults.forEach(r => {
      const strategy = r.strategy_name || 'Unknown'
      counts[strategy] = (counts[strategy] || 0) + 1
    })
    return counts
  }, [backtestResults])

  // Symbol coverage statistics
  const symbolStats = useMemo(() => {
    if (!backtestResults || backtestResults.length === 0) return {}
    
    const counts = {}
    backtestResults.forEach(r => {
      if (r.symbol) {
        counts[r.symbol] = (counts[r.symbol] || 0) + 1
      }
    })
    return counts
  }, [backtestResults])

  // Top performing backtests (by Sharpe ratio)
  const topPerformers = useMemo(() => {
    if (!backtestResults || backtestResults.length === 0) return []
    
    return backtestResults
      .filter(r => r.metrics && r.metrics.sharpe_ratio !== null && r.metrics.sharpe_ratio !== undefined)
      .sort((a, b) => (b.metrics.sharpe_ratio || 0) - (a.metrics.sharpe_ratio || 0))
      .slice(0, 3)
  }, [backtestResults])

  // Strategy performance data for chart
  const strategyPerformanceData = useMemo(() => {
    if (!backtestResults || backtestResults.length === 0) return null
    
    const strategyMap = {}
    backtestResults.forEach(r => {
      if (r.metrics && r.metrics.sharpe_ratio !== null && r.metrics.sharpe_ratio !== undefined) {
        const strategy = r.strategy_name || 'Unknown'
        if (!strategyMap[strategy]) {
          strategyMap[strategy] = { values: [], count: 0 }
        }
        strategyMap[strategy].values.push(r.metrics.sharpe_ratio)
        strategyMap[strategy].count++
      }
    })
    
    const strategyAverages = Object.entries(strategyMap)
      .map(([strategy, data]) => ({
        strategy,
        avgSharpe: data.values.reduce((a, b) => a + b, 0) / data.values.length,
        count: data.count,
      }))
      .sort((a, b) => b.avgSharpe - a.avgSharpe)
      .slice(0, 5) // Top 5 strategies
    
    if (strategyAverages.length === 0) return null
    
    return {
      strategies: strategyAverages.map(s => s.strategy),
      sharpeRatios: strategyAverages.map(s => s.avgSharpe),
      counts: strategyAverages.map(s => s.count),
    }
  }, [backtestResults])

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
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              mb: 1,
              fontSize: '1.75rem',
              background: isDark
                ? 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)'
                : 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Welcome to QuantLib, an Open-Source Quantitative Backtesting Platform
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9375rem' }}>
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
        <Grid container spacing={2} sx={{ mb: 3 }}>
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
                    contentSx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          background: action.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1.5,
                          boxShadow: `0 4px 12px ${action.color === 'primary' ? 'rgba(37, 99, 235, 0.25)' : action.color === 'secondary' ? 'rgba(124, 58, 237, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                        }}
                      >
                        <Icon sx={{ fontSize: 20, color: '#fff' }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                        {action.title}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1.5, lineHeight: 1.5, flex: 1, fontSize: '0.8125rem', minHeight: '2.4rem' }}
                    >
                      {action.description}
                    </Typography>
                    <Button
                      variant={action.primary ? 'contained' : 'outlined'}
                      size="small"
                      fullWidth
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                      color={action.color}
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        height: 32,
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
                onClick={() => setDatabaseSelectorOpen(true)}
                contentSx={{ p: 3.5, display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
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
                      <CheckCircleIcon sx={{ fontSize: 20, color: '#fff' }} />
                    ) : (
                      <ErrorIcon sx={{ fontSize: 20, color: '#fff' }} />
                    )}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Database
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1.5, lineHeight: 1.5, flex: 1, fontSize: '0.8125rem', minHeight: '2.4rem' }}
                >
                  {dbStatus?.connected 
                    ? 'PostgreSQL database is online and ready' 
                    : 'Database connection unavailable'}
                </Typography>
                <Chip
                  label={dbStatus?.connected ? 'Active' : 'Inactive'}
                  color={dbStatus?.connected ? 'success' : 'error'}
                  size="small"
                  sx={{ 
                    fontWeight: 600,
                    height: 28,
                    fontSize: '0.8125rem',
                  }}
                />
              </AnimatedCard>
            </StaggerItem>
          </Grid>
        </Grid>
      </StaggerContainer>

      {/* High-Level Statistics - Compact Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Performance Overview Card */}
        {performanceStats && (
          <Grid item xs={12} sm={6} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <Paper
                sx={{
                  p: 2.5,
                  cursor: 'pointer',
                  elevation: 0,
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.5) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.5) 100%)',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: isDark
                      ? '0 8px 24px rgba(139, 92, 246, 0.2)'
                      : '0 8px 24px rgba(124, 58, 237, 0.15)',
                  },
                }}
                onClick={() => setPerformanceModalOpen(true)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)',
                      }}
                    >
                      <AnalyticsIcon sx={{ fontSize: 20, color: '#fff' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
                      Performance
                    </Typography>
                  </Box>
                  <ArrowForwardIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </Box>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                        Avg Return
                      </Typography>
                      <CountUpSimple
                        value={Math.abs(performanceStats.avgReturn * 100)}
                        prefix={performanceStats.avgReturn >= 0 ? '+' : '-'}
                        suffix="%"
                        decimals={2}
                        variant="h6"
                        color={performanceStats.avgReturn >= 0 ? 'success.main' : 'error.main'}
                        sx={{ fontSize: '1.25rem' }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                        Total Backtests
                      </Typography>
                      <CountUpSimple
                        value={performanceStats.totalBacktests}
                        variant="h6"
                        color="primary.main"
                        sx={{ fontSize: '1.25rem' }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        )}

        {/* Database Statistics Card */}
        {dbStats && dbStats.total_symbols > 0 && (
          <Grid item xs={12} sm={6} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Paper
                sx={{
                  p: 2.5,
                  cursor: 'pointer',
                  elevation: 0,
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.5) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.5) 100%)',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: isDark
                      ? '0 8px 24px rgba(59, 130, 246, 0.2)'
                      : '0 8px 24px rgba(37, 99, 235, 0.15)',
                  },
                }}
                onClick={() => setDatabaseModalOpen(true)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                      }}
                    >
                      <StorageIcon sx={{ fontSize: 20, color: '#fff' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
                      Database
                    </Typography>
                  </Box>
                  <ArrowForwardIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </Box>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                        Symbols
                      </Typography>
                      <CountUpSimple
                        value={dbStats.total_symbols}
                        variant="h6"
                        color="primary.main"
                        sx={{ fontSize: '1.25rem' }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                        Total Rows
                      </Typography>
                      <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: 'secondary.main' }}>
                        {formatNumberWithAbbr(dbStats.total_rows || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        )}

        {/* Strategy Analytics Card */}
        {backtestResults.length > 0 && (
          <Grid item xs={12} sm={6} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <Paper
                sx={{
                  p: 2.5,
                  cursor: 'pointer',
                  elevation: 0,
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.5) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.5) 100%)',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: isDark
                      ? '0 8px 24px rgba(245, 158, 11, 0.2)'
                      : '0 8px 24px rgba(217, 119, 6, 0.15)',
                  },
                }}
                onClick={() => setStrategyModalOpen(true)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                        boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)',
                      }}
                    >
                      <BarChartIcon sx={{ fontSize: 20, color: '#fff' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
                      Strategies
                    </Typography>
                  </Box>
                  <ArrowForwardIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </Box>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                        Unique Strategies
                      </Typography>
                      <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: 'warning.main' }}>
                        {Object.keys(strategyStats).length}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                        Symbols Tested
                      </Typography>
                      <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: 'secondary.main' }}>
                        {Object.keys(symbolStats).length}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        )}
      </Grid>


      {/* Quick Start Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Paper
          sx={{
            p: 2.5,
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
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 700, mb: 2, fontSize: '1.25rem', letterSpacing: '-0.02em' }}
          >
            Quick Start Guide
          </Typography>
          <Grid container spacing={2}>
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
                      p: 1.5,
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
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                        flexShrink: 0,
                      }}
                    >
                      {item.step}
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, mb: 0.25, fontSize: '0.9375rem' }}
                      >
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: '0.8125rem' }}>
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

      {/* Modals */}
      <PerformanceDetailsModal
        open={performanceModalOpen}
        onClose={() => setPerformanceModalOpen(false)}
        performanceStats={performanceStats}
        backtestResults={backtestResults}
      />
      
      <DatabaseStatsModal
        open={databaseModalOpen}
        onClose={() => setDatabaseModalOpen(false)}
        dbStats={dbStats}
        dbStatus={dbStatus}
        onUpdateAll={handleUpdateAllTickers}
        updating={updating}
        updateMessage={updateMessage}
        currentDatabase={currentDatabase}
        onSelectDatabase={(dbSource) => {
          setCurrentDatabase(dbSource)
          databaseStorage.set(dbSource)
        }}
        onDatabaseChange={(dbSource) => {
          // Refresh dashboard data after database change
          const fetchDashboardData = async () => {
            try {
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
            }
          }
          fetchDashboardData()
        }}
      />
      
      <StrategyPerformanceModal
        open={strategyModalOpen}
        onClose={() => setStrategyModalOpen(false)}
        strategyStats={strategyStats}
        symbolStats={symbolStats}
        strategyPerformanceData={strategyPerformanceData}
      />
      
      <DatabaseSelectorModal
        open={databaseSelectorOpen}
        onClose={() => setDatabaseSelectorOpen(false)}
        onSelectDatabase={(dbSource) => {
          setCurrentDatabase(dbSource)
          databaseStorage.set(dbSource)
          // Refresh dashboard data after database change
          const fetchDashboardData = async () => {
            try {
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
            }
          }
          fetchDashboardData()
        }}
        currentDatabase={currentDatabase}
      />
    </Container>
  )
}
