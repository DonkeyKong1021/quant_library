import { useLocation, Link as RouterLink, useNavigate } from 'react-router-dom'
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box, Chip, Button } from '@mui/material'
import { motion } from 'framer-motion'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import HomeIcon from '@mui/icons-material/Home'
import TuneIcon from '@mui/icons-material/Tune'
import HistoryIcon from '@mui/icons-material/History'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { routeLabels } from '../config/navigation'
import { useThemeMode } from '../contexts/ThemeContext'

export default function Breadcrumbs() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDark } = useThemeMode()
  const pathnames = location.pathname.split('/').filter((x) => x)

  // Don't show breadcrumbs on home page
  if (pathnames.length === 0) {
    return null
  }

  // Define contextual quick actions for specific routes
  const getQuickActions = () => {
    const path = location.pathname
    if (path === '/backtest') {
      return [
        {
          label: 'Optimize',
          icon: <TuneIcon sx={{ fontSize: 14 }} />,
          onClick: () => navigate('/optimization'),
        },
        {
          label: 'History',
          icon: <HistoryIcon sx={{ fontSize: 14 }} />,
          onClick: () => navigate('/backtest-history'),
        },
      ]
    }
    if (path === '/optimization') {
      return [
        {
          label: 'Backtest',
          icon: <TrendingUpIcon sx={{ fontSize: 14 }} />,
          onClick: () => navigate('/backtest'),
        },
      ]
    }
    if (path === '/backtest-history') {
      return [
        {
          label: 'New Backtest',
          icon: <TrendingUpIcon sx={{ fontSize: 14 }} />,
          onClick: () => navigate('/backtest'),
        },
      ]
    }
    return []
  }

  const quickActions = getQuickActions()

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
        <MuiBreadcrumbs
          separator={
            <NavigateNextIcon
              fontSize="small"
              sx={{ color: 'text.disabled', fontSize: 16 }}
            />
          }
          aria-label="breadcrumb"
          sx={{
            '& .MuiBreadcrumbs-ol': {
              flexWrap: 'nowrap',
            },
            '& .MuiBreadcrumbs-li': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
        >
          <Link
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'text.secondary',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              px: 1,
              py: 0.5,
              borderRadius: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                color: 'primary.main',
                backgroundColor: isDark
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'rgba(37, 99, 235, 0.06)',
                textDecoration: 'none',
              },
            }}
          >
            <HomeIcon sx={{ fontSize: 16 }} />
            Home
          </Link>
          {pathnames.map((value, index) => {
            const last = index === pathnames.length - 1
            const to = `/${pathnames.slice(0, index + 1).join('/')}`
            const label =
              routeLabels[to] ||
              value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ')

            return last ? (
              <Chip
                key={to}
                label={label}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  height: 28,
                  backgroundColor: isDark
                    ? 'rgba(59, 130, 246, 0.15)'
                    : 'rgba(37, 99, 235, 0.08)',
                  color: 'primary.main',
                  border: '1px solid',
                  borderColor: isDark
                    ? 'rgba(59, 130, 246, 0.25)'
                    : 'rgba(37, 99, 235, 0.15)',
                  '& .MuiChip-label': {
                    px: 1.5,
                  },
                }}
              />
            ) : (
              <Link
                component={RouterLink}
                to={to}
                key={to}
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: isDark
                      ? 'rgba(59, 130, 246, 0.1)'
                      : 'rgba(37, 99, 235, 0.06)',
                    textDecoration: 'none',
                  },
                }}
              >
                {label}
              </Link>
            )
          })}
        </MuiBreadcrumbs>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {quickActions.map((action, index) => (
              <Button
                key={index}
                size="small"
                variant="outlined"
                startIcon={action.icon}
                onClick={action.onClick}
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  height: 28,
                  px: 1.5,
                  py: 0.5,
                  textTransform: 'none',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    backgroundColor: isDark
                      ? 'rgba(59, 130, 246, 0.1)'
                      : 'rgba(37, 99, 235, 0.06)',
                  },
                }}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        )}
      </Box>
    </motion.div>
  )
}
