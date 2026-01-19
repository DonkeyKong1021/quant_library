import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Alert,
  Card,
  CardContent,
  Button,
  Chip,
} from '@mui/material'
import { DashboardCardSkeleton } from '../components/Skeletons'
import { useNavigate } from 'react-router-dom'
import { dataService } from '../services/dataService'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import StorageIcon from '@mui/icons-material/Storage'
import AssessmentIcon from '@mui/icons-material/Assessment'
import TimelineIcon from '@mui/icons-material/Timeline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'

export default function Dashboard() {
  const navigate = useNavigate()
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
        // Set default disconnected status if we can't get status
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
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
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
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
          Welcome to QuantLib
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.0625rem' }}>
          Professional quantitative trading library for backtesting and strategy development
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%)',
              border: '1px solid',
              borderColor: 'rgba(37, 99, 235, 0.12)',
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: '0px 12px 24px rgba(37, 99, 235, 0.15)',
                borderColor: 'rgba(37, 99, 235, 0.25)',
              },
            }}
            onClick={() => navigate('/backtest')}
            elevation={0}
          >
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
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
                    boxShadow: '0px 4px 12px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 24, color: '#fff' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
                  Run Backtest
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                Test your trading strategies with historical data
              </Typography>
              <Button 
                variant="contained" 
                size="small" 
                fullWidth 
                sx={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  boxShadow: '0px 2px 8px rgba(37, 99, 235, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                    boxShadow: '0px 4px 12px rgba(37, 99, 235, 0.4)',
                  },
                }}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(124, 58, 237, 0.02) 100%)',
              border: '1px solid',
              borderColor: 'rgba(124, 58, 237, 0.12)',
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: '0px 12px 24px rgba(124, 58, 237, 0.15)',
                borderColor: 'rgba(124, 58, 237, 0.25)',
              },
            }}
            onClick={() => navigate('/data-explorer')}
            elevation={0}
          >
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                    boxShadow: '0px 4px 12px rgba(124, 58, 237, 0.25)',
                  }}
                >
                  <AssessmentIcon sx={{ fontSize: 24, color: '#fff' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
                  Explore Data
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                Visualize market data and technical indicators
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                fullWidth 
                sx={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600,
                  borderColor: 'rgba(124, 58, 237, 0.3)',
                  color: 'secondary.main',
                  '&:hover': {
                    borderColor: 'secondary.main',
                    background: 'rgba(124, 58, 237, 0.08)',
                  },
                }}
              >
                Explore
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)',
              border: '1px solid',
              borderColor: 'rgba(16, 185, 129, 0.12)',
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: '0px 12px 24px rgba(16, 185, 129, 0.15)',
                borderColor: 'rgba(16, 185, 129, 0.25)',
              },
            }}
            onClick={() => navigate('/strategy-builder')}
            elevation={0}
          >
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                    boxShadow: '0px 4px 12px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <TimelineIcon sx={{ fontSize: 24, color: '#fff' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
                  Build Strategy
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                Create and test custom trading strategies
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                fullWidth 
                sx={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600,
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  color: 'success.main',
                  '&:hover': {
                    borderColor: 'success.main',
                    background: 'rgba(16, 185, 129, 0.08)',
                  },
                }}
              >
                Build
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: dbStatus?.connected
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
              border: '1px solid',
              borderColor: dbStatus?.connected 
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(239, 68, 68, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: dbStatus?.connected
                  ? '0px 12px 24px rgba(16, 185, 129, 0.15)'
                  : '0px 12px 24px rgba(239, 68, 68, 0.15)',
              },
            }}
            elevation={0}
          >
            <CardContent sx={{ p: 3.5 }}>
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
                      ? '0px 4px 12px rgba(16, 185, 129, 0.25)'
                      : '0px 4px 12px rgba(239, 68, 68, 0.25)',
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
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 500, color: 'text.primary' }}>
                {dbStatus?.connected ? 'Connected' : 'Disconnected'}
              </Typography>
              <Chip
                label={dbStatus?.connected ? 'Active' : 'Inactive'}
                color={dbStatus?.connected ? 'success' : 'error'}
                size="small"
                sx={{
                  fontWeight: 600,
                  background: dbStatus?.connected
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%)',
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Database Statistics */}
      {dbStats && dbStats.total_symbols > 0 && (
        <Paper 
          sx={{ 
            p: 4.5, 
            mb: 5, 
            elevation: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.5) 100%)',
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
                boxShadow: '0px 4px 16px rgba(37, 99, 235, 0.2)',
              }}
            >
              <StorageIcon sx={{ fontSize: 28, color: '#fff' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
              Database Statistics
            </Typography>
          </Box>
          <Grid container spacing={4}>
            <Grid item xs={6} sm={4} md={3}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(37, 99, 235, 0.02) 100%)',
                  border: '1px solid',
                  borderColor: 'rgba(37, 99, 235, 0.1)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(37, 99, 235, 0.04) 100%)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500, mb: 1.5 }}>
                  Total Symbols
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '2rem' }}>
                  {dbStats.total_symbols?.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.06) 0%, rgba(124, 58, 237, 0.02) 100%)',
                  border: '1px solid',
                  borderColor: 'rgba(124, 58, 237, 0.1)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(124, 58, 237, 0.04) 100%)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500, mb: 1.5 }}>
                  Total Rows
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '2rem' }}>
                  {dbStats.total_rows ? dbStats.total_rows.toLocaleString() : '—'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%)',
                  border: '1px solid',
                  borderColor: 'rgba(16, 185, 129, 0.1)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.04) 100%)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500, mb: 1.5 }}>
                  Date Span
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '2rem' }}>
                  {dbStats.date_span_days
                    ? `${Math.floor(dbStats.date_span_days / 365)}y`
                    : '—'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.06) 0%, rgba(6, 182, 212, 0.02) 100%)',
                  border: '1px solid',
                  borderColor: 'rgba(6, 182, 212, 0.1)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.04) 100%)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500, mb: 1.5 }}>
                  Database Size
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '2rem' }}>
                  {dbStats.total_size_gb
                    ? dbStats.total_size_gb < 1
                      ? `${(dbStats.total_size_gb * 1024).toFixed(0)}MB`
                      : `${dbStats.total_size_gb.toFixed(1)}GB`
                    : '—'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Quick Start Guide */}
      <Paper 
        sx={{ 
          p: 4.5, 
          elevation: 0,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.5) 100%)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
          Quick Start Guide
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box 
              sx={{ 
                display: 'flex', 
                mb: 3,
                p: 2.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.6) 100%)',
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
                  boxShadow: '0px 4px 12px rgba(37, 99, 235, 0.25)',
                  flexShrink: 0,
                }}
              >
                1
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, fontSize: '1.0625rem' }}>
                  Navigate to Backtest
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Click on the Backtest page in the navigation menu
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box 
              sx={{ 
                display: 'flex', 
                mb: 3,
                p: 2.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.6) 100%)',
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
                  boxShadow: '0px 4px 12px rgba(37, 99, 235, 0.25)',
                  flexShrink: 0,
                }}
              >
                2
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, fontSize: '1.0625rem' }}>
                  Fetch Market Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Select a symbol and date range, then fetch data
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box 
              sx={{ 
                display: 'flex', 
                mb: 3,
                p: 2.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.6) 100%)',
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
                  boxShadow: '0px 4px 12px rgba(37, 99, 235, 0.25)',
                  flexShrink: 0,
                }}
              >
                3
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, fontSize: '1.0625rem' }}>
                  Select Strategy
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Choose a built-in strategy or create a custom one
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box 
              sx={{ 
                display: 'flex', 
                mb: 3,
                p: 2.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.6) 100%)',
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
                  boxShadow: '0px 4px 12px rgba(37, 99, 235, 0.25)',
                  flexShrink: 0,
                }}
              >
                4
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, fontSize: '1.0625rem' }}>
                  Configure & Run
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Set parameters and run your backtest to see results
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}