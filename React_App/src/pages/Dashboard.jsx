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

export default function Dashboard() {
  const navigate = useNavigate()
  const { isDark } = useThemeMode()
  const [dbStatus, setDbStatus] = useState(null)
  const [dbStats, setDbStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
              p: 4.5,
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.2)',
                }}
              >
                <StorageIcon sx={{ fontSize: 28, color: '#fff' }} />
              </Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em' }}
              >
                Database Statistics
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {[
                {
                  label: 'Total Symbols',
                  value: dbStats.total_symbols,
                  color: 'primary.main',
                },
                {
                  label: 'Total Rows',
                  value: dbStats.total_rows || 0,
                  color: 'secondary.main',
                },
                {
                  label: 'Date Span',
                  value: dbStats.date_span_days ? Math.floor(dbStats.date_span_days / 365) : 0,
                  suffix: 'y',
                  color: 'success.main',
                },
                {
                  label: 'Database Size',
                  value: dbStats.total_size_gb
                    ? dbStats.total_size_gb < 1
                      ? dbStats.total_size_gb * 1024
                      : dbStats.total_size_gb
                    : 0,
                  suffix: dbStats.total_size_gb < 1 ? 'MB' : 'GB',
                  decimals: dbStats.total_size_gb < 1 ? 0 : 1,
                  color: 'info.main',
                },
              ].map((stat, index) => (
                <Grid item xs={6} sm={4} md={3} key={stat.label}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
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
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                        sx={{ fontWeight: 500, mb: 1.5 }}
                      >
                        {stat.label}
                      </Typography>
                      <CountUpSimple
                        value={stat.value}
                        suffix={stat.suffix || ''}
                        decimals={stat.decimals || 0}
                        variant="h4"
                        color={stat.color}
                        sx={{ fontSize: '2rem' }}
                      />
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
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
