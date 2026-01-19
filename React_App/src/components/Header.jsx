import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Badge,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import HistoryIcon from '@mui/icons-material/History'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import NotificationsIcon from '@mui/icons-material/Notifications'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import CircularProgress from '@mui/material/CircularProgress'
import { navigationItems } from '../config/navigation'
import QuickNav from './QuickNav'
import ProfileModal from './ProfileModal'
import SettingsModal from './SettingsModal'
import { useThemeMode } from '../contexts/ThemeContext'
import { backtestService } from '../services/backtestService'

// Create menu items with icon components
const menuItems = navigationItems.map((item) => ({
  ...item,
  icon: <item.icon />,
}))

// Animated theme toggle icon
const ThemeToggleIcon = ({ isDark }) => (
  <AnimatePresence mode="wait" initial={false}>
    <motion.div
      key={isDark ? 'dark' : 'light'}
      initial={{ y: -20, opacity: 0, rotate: -90 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      exit={{ y: 20, opacity: 0, rotate: 90 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {isDark ? <LightModeIcon /> : <DarkModeIcon />}
    </motion.div>
  </AnimatePresence>
)

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { mode, toggleTheme, isDark } = useThemeMode()
  const [anchorEl, setAnchorEl] = useState(null)
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [quickNavOpen, setQuickNavOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [recentBacktests, setRecentBacktests] = useState([])
  const [backtestsLoading, setBacktestsLoading] = useState(false)

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setAnchorEl(null)
  }

  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen)
  }

  const handleMobileNavClick = (path) => {
    navigate(path)
    setMobileDrawerOpen(false)
  }

  const handleProfileClick = () => {
    handleUserMenuClose()
    setProfileModalOpen(true)
  }

  const handleSettingsClick = () => {
    handleUserMenuClose()
    setSettingsModalOpen(true)
  }

  const handleLogout = () => {
    handleUserMenuClose()
    // In a real app, this would clear auth state and redirect to login
    console.log('Logout clicked')
  }

  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget)
  }

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null)
  }

  const handleNotificationClick = (resultId) => {
    handleNotificationMenuClose()
    navigate(`/backtest?resultId=${resultId}`)
  }

  // Fetch recent backtests
  useEffect(() => {
    const fetchRecentBacktests = async () => {
      try {
        setBacktestsLoading(true)
        const response = await backtestService.listBacktestResults({
          limit: 5,
          offset: 0,
          sort_by: 'created_at',
          sort_order: 'DESC',
        }).catch(() => ({ results: [] }))
        setRecentBacktests(response.results || [])
      } catch (err) {
        console.error('Error fetching recent backtests:', err)
        setRecentBacktests([])
      } finally {
        setBacktestsLoading(false)
      }
    }

    fetchRecentBacktests()
    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentBacktests, 30000)
    return () => clearInterval(interval)
  }, [])

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for Ctrl (Windows/Linux) or Cmd (Mac) modifier
      const isModifierPressed = event.ctrlKey || event.metaKey

      // Quick navigation (Cmd/Ctrl + K)
      if (isModifierPressed && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setQuickNavOpen(true)
        return
      }

      // Theme toggle (Cmd/Ctrl + Shift + L)
      if (isModifierPressed && event.shiftKey && event.key.toLowerCase() === 'l') {
        event.preventDefault()
        toggleTheme()
        return
      }

      if (!isModifierPressed) return

      // Prevent default browser shortcuts when our shortcuts are used
      const shortcutKey = event.key.toLowerCase()

      // Find matching navigation item
      const navItem = navigationItems.find((item) => item.shortcut.toLowerCase() === shortcutKey)

      if (navItem) {
        event.preventDefault()
        navigate(navItem.path)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigate, toggleTheme])

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: isDark 
          ? 'rgba(30, 41, 59, 0.85)' 
          : 'rgba(255, 255, 255, 0.85)',
        color: 'text.primary',
        boxShadow: isDark
          ? '0px 1px 3px rgba(0,0,0,0.3), 0px 1px 2px rgba(0,0,0,0.2)'
          : '0px 1px 3px rgba(0,0,0,0.08), 0px 1px 2px rgba(0,0,0,0.06)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(12px)',
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
      }}
      elevation={0}
    >
      <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}>
        {/* Mobile menu button */}
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMobileDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              }}
            >
              <TrendingUpIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                display: { xs: 'none', sm: 'block' },
                letterSpacing: '-0.02em',
              }}
            >
              QuantLib
            </Typography>
          </motion.div>
        </Box>

        {/* Desktop navigation */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 0.5,
            flexGrow: 1,
          }}
        >
          {/* Group navigation items */}
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path
            const isLastInGroup =
              index === menuItems.length - 1 || menuItems[index + 1].group !== item.group

            return (
              <Box key={item.path} sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip
                  title={`${item.description} (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+${item.shortcut})`}
                  arrow
                  enterDelay={500}
                >
                  <Button
                    component={motion.button}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(item.path)}
                    startIcon={item.icon}
                    sx={{
                      color: isActive ? 'primary.main' : 'text.secondary',
                      fontWeight: isActive ? 600 : 500,
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '0.9375rem',
                      backgroundColor: isActive
                        ? isDark
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(37, 99, 235, 0.08)'
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: isActive
                          ? isDark
                            ? 'rgba(59, 130, 246, 0.2)'
                            : 'rgba(37, 99, 235, 0.12)'
                          : isDark
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'rgba(0, 0, 0, 0.04)',
                      },
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      '&::after': isActive
                        ? {
                            content: '""',
                            position: 'absolute',
                            bottom: 4,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 20,
                            height: 3,
                            borderRadius: 2,
                            backgroundColor: 'primary.main',
                          }
                        : {},
                    }}
                  >
                    {item.text}
                  </Button>
                </Tooltip>
                {/* Add visual separator between groups */}
                {!isLastInGroup && item.group === 'backtest' && (
                  <Box
                    sx={{
                      width: '1px',
                      height: '24px',
                      backgroundColor: 'divider',
                      mx: 1,
                    }}
                  />
                )}
              </Box>
            )
          })}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Theme Toggle Button */}
          <Tooltip
            title={`Switch to ${isDark ? 'light' : 'dark'} mode (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Shift+L)`}
            arrow
          >
            <IconButton
              onClick={toggleTheme}
              sx={{
                p: 1,
                color: 'text.secondary',
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.04)',
                '&:hover': {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.08)',
                  color: isDark ? 'warning.main' : 'primary.main',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ThemeToggleIcon isDark={isDark} />
            </IconButton>
          </Tooltip>

          {/* Quick Navigation Button */}
          <Tooltip
            title={`Quick Navigation (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+K)`}
            arrow
          >
            <IconButton
              onClick={() => setQuickNavOpen(true)}
              sx={{
                p: 1,
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'action.hover',
                },
              }}
            >
              <SearchIcon />
            </IconButton>
          </Tooltip>

          {/* Recent Activity / Notifications Button */}
          <Tooltip title="Recent Activity" arrow>
            <IconButton
              onClick={handleNotificationMenuOpen}
              sx={{
                p: 1,
                color: 'text.secondary',
                position: 'relative',
                '&:hover': {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'action.hover',
                },
              }}
            >
              <Badge 
                badgeContent={recentBacktests.length > 0 ? recentBacktests.length : undefined} 
                color="primary" 
                max={9}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    minWidth: 18,
                    height: 18,
                    padding: '0 4px',
                  },
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              elevation: 8,
              sx: {
                minWidth: 360,
                maxWidth: 420,
                maxHeight: 520,
                borderRadius: 2,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                mt: 1.5,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)'
                  : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(12px)',
                boxShadow: isDark
                  ? '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                  : '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                '& .MuiList-root': {
                  padding: 0,
                },
              },
            }}
            MenuListProps={{
              sx: {
                py: 0,
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '100%',
              },
            }}
          >
            {/* Header - Fixed */}
            <Box 
              sx={{ 
                px: 2.5, 
                py: 2, 
                borderBottom: '1px solid', 
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                background: isDark
                  ? 'rgba(255, 255, 255, 0.02)'
                  : 'rgba(0, 0, 0, 0.02)',
                flexShrink: 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.9375rem', color: 'text.primary' }}>
                  Recent Activity
                </Typography>
                {recentBacktests.length > 0 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    {recentBacktests.length} {recentBacktests.length === 1 ? 'backtest' : 'backtests'}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Scrollable Content */}
            <Box 
              sx={{ 
                overflowY: 'auto',
                overflowX: 'hidden',
                flex: 1,
                maxHeight: 'calc(520px - 140px)',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                  },
                },
              }}
            >
              {backtestsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : recentBacktests.length === 0 ? (
                <Box sx={{ px: 2.5, py: 4, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 2,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <HistoryIcon sx={{ fontSize: 32, color: 'text.secondary', opacity: 0.5 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                    No recent backtests
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Run a backtest to see activity here
                  </Typography>
                </Box>
              ) : (
                recentBacktests.map((result) => {
                const metrics = result.metrics || {}
                const totalReturn = metrics.total_return || 0
                const sharpeRatio = metrics.sharpe_ratio
                const isPositive = totalReturn >= 0
                const returnPercent = totalReturn * 100

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
                    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                  } catch {
                    return dateString
                  }
                }

                return (
                  <MenuItem
                    key={result.result_id}
                    onClick={() => handleNotificationClick(result.result_id)}
                    sx={{
                      py: 0,
                      px: 0,
                      mx: 1,
                      my: 0.5,
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      '&:hover': {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.04)',
                      },
                      '&:active': {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.12)'
                          : 'rgba(0, 0, 0, 0.08)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 1.5, p: 1.5 }}>
                      <Box
                        sx={{
                          minWidth: 40,
                          height: 40,
                          width: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isDark
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid',
                          borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
                          flexShrink: 0,
                        }}
                      >
                        <ShowChartIcon sx={{ fontSize: 20, color: isDark ? 'rgb(16, 185, 129)' : 'rgb(5, 150, 105)' }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9375rem', color: 'text.primary', lineHeight: 1.2 }}>
                          {result.symbol || 'N/A'}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ 
                            fontSize: '0.8125rem', 
                            display: 'block',
                            fontWeight: 400,
                            lineHeight: 1.3,
                          }}
                        >
                          {result.custom_name || result.strategy_name || 'Unknown Strategy'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          {sharpeRatio !== null && sharpeRatio !== undefined && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 400 }}>
                                Sharpe:
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary' }}>
                                {sharpeRatio.toFixed(2)}
                              </Typography>
                            </Box>
                          )}
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                              fontSize: '0.75rem',
                              fontWeight: 400,
                            }}
                          >
                            {formatRelativeTime(result.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          px: 1.25,
                          py: 0.5,
                          borderRadius: 1.5,
                          backgroundColor: isPositive
                            ? isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)'
                            : isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                          flexShrink: 0,
                          alignSelf: 'flex-start',
                          mt: 0.25,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: isPositive ? (isDark ? 'rgb(16, 185, 129)' : 'rgb(5, 150, 105)') : (isDark ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)'),
                            fontSize: '0.8125rem',
                          }}
                        >
                          {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                )
              })
              )}
            </Box>

            {/* Footer - Fixed */}
            {recentBacktests.length > 0 && (
              <>
                <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', flexShrink: 0 }} />
                <Box sx={{ px: 1.5, py: 1, flexShrink: 0 }}>
                  <MenuItem
                    onClick={() => {
                      handleNotificationMenuClose()
                      navigate('/backtest-history')
                    }}
                    sx={{
                      borderRadius: 1.5,
                      py: 1.25,
                      px: 2,
                      justifyContent: 'center',
                      backgroundColor: isDark
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'rgba(37, 99, 235, 0.08)',
                      '&:hover': {
                        backgroundColor: isDark
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(37, 99, 235, 0.12)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'primary.main',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      View All Backtests
                    </Typography>
                  </MenuItem>
                </Box>
              </>
            )}
          </Menu>

          <IconButton
            onClick={handleUserMenuOpen}
            sx={{
              p: 0.5,
              '&:hover': {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'action.hover',
              },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              }}
            >
              <AccountCircleIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              elevation: 0,
              sx: {
                minWidth: 180,
                border: '1px solid',
                borderColor: 'divider',
                mt: 1,
              },
            }}
          >
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleSettingsClick}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Mobile drawer navigation */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={handleMobileDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Box sx={{ pt: 8 }}>
          <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Navigation
            </Typography>
            <IconButton onClick={toggleTheme} size="small">
              <ThemeToggleIcon isDark={isDark} />
            </IconButton>
          </Box>
          <Divider />
          <List sx={{ px: 1 }}>
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path
              const isLastInGroup =
                index === menuItems.length - 1 || menuItems[index + 1].group !== item.group

              return (
                <Box key={item.path}>
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => handleMobileNavClick(item.path)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        borderRadius: 2,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'primary.contrastText',
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive ? 'primary.contrastText' : 'text.secondary',
                          minWidth: 40,
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontWeight: isActive ? 600 : 400,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  {!isLastInGroup && item.group === 'backtest' && <Divider sx={{ mx: 2, my: 1 }} />}
                </Box>
              )
            })}
          </List>
        </Box>
      </Drawer>

      {/* Quick Navigation Dialog */}
      <QuickNav open={quickNavOpen} onClose={() => setQuickNavOpen(false)} />

      {/* Profile Modal */}
      <ProfileModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} />

      {/* Settings Modal */}
      <SettingsModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
    </AppBar>
  )
}
