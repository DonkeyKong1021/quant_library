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
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { navigationItems } from '../config/navigation'
import QuickNav from './QuickNav'

// Create menu items with icon components
const menuItems = navigationItems.map((item) => ({
  ...item,
  icon: <item.icon />,
}))

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [anchorEl, setAnchorEl] = useState(null)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [quickNavOpen, setQuickNavOpen] = useState(false)

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

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for Ctrl (Windows/Linux) or Cmd (Mac) modifier
      const isModifierPressed = event.ctrlKey || event.metaKey
      if (!isModifierPressed) return

      // Quick navigation (Cmd/Ctrl + K)
      if (event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setQuickNavOpen(true)
        return
      }

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
  }, [navigate])

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#ffffff',
        color: 'text.primary',
        boxShadow: '0px 1px 3px rgba(0,0,0,0.08), 0px 1px 2px rgba(0,0,0,0.06)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(8px)',
      }}
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
          <TrendingUpIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            QuantLib
          </Typography>
        </Box>

        {/* Desktop navigation */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1,
            flexGrow: 1,
          }}
        >
          {/* Group navigation items */}
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path
            const isLastInGroup = index === menuItems.length - 1 || menuItems[index + 1].group !== item.group
            
            return (
              <Box key={item.path} sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip
                  title={`${item.description} (${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+${item.shortcut})`}
                  arrow
                >
                  <Button
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
                      backgroundColor: isActive ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                      '&:hover': {
                        backgroundColor: isActive ? 'rgba(37, 99, 235, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                      },
                      transition: 'all 0.2s ease',
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
                      mx: 0.5,
                    }}
                  />
                )}
              </Box>
            )
          })}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Quick Navigation Button */}
          <Tooltip title={`Quick Navigation (${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+K)`} arrow>
            <IconButton
              onClick={() => setQuickNavOpen(true)}
              sx={{
                p: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <SearchIcon />
            </IconButton>
          </Tooltip>

          <IconButton
            onClick={handleUserMenuOpen}
            sx={{
              p: 0.5,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <AccountCircleIcon />
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
          >
            <MenuItem onClick={handleUserMenuClose}>Profile</MenuItem>
            <MenuItem onClick={handleUserMenuClose}>Settings</MenuItem>
            <MenuItem onClick={handleUserMenuClose}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Mobile drawer navigation */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={handleMobileDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
          },
        }}
      >
        <Box sx={{ pt: 8 }}>
          <Typography variant="h6" sx={{ px: 2, py: 1.5, fontWeight: 600 }}>
            Navigation
          </Typography>
          <Divider />
          <List>
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path
              const isLastInGroup = index === menuItems.length - 1 || menuItems[index + 1].group !== item.group
              
              return (
                <Box key={item.path}>
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => handleMobileNavClick(item.path)}
                      sx={{
                        py: 1.5,
                        px: 2,
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
                  {/* Add divider between groups */}
                  {!isLastInGroup && item.group === 'backtest' && <Divider sx={{ mx: 2 }} />}
                </Box>
              )
            })}
          </List>
        </Box>
      </Drawer>

      {/* Quick Navigation Dialog */}
      <QuickNav open={quickNavOpen} onClose={() => setQuickNavOpen(false)} />
    </AppBar>
  )
}