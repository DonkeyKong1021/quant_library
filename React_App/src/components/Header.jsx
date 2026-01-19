import { useState } from 'react'
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
} from '@mui/material'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import HomeIcon from '@mui/icons-material/Home'
import ExploreIcon from '@mui/icons-material/Explore'
import BuildIcon from '@mui/icons-material/Build'
import HistoryIcon from '@mui/icons-material/History'

const menuItems = [
  { text: 'Dashboard', icon: <HomeIcon />, path: '/' },
  { text: 'Backtest', icon: <TrendingUpIcon />, path: '/backtest' },
  { text: 'Data Explorer', icon: <ExploreIcon />, path: '/data-explorer' },
  { text: 'Strategy Builder', icon: <BuildIcon />, path: '/strategy-builder' },
]

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [anchorEl, setAnchorEl] = useState(null)

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setAnchorEl(null)
  }

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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexGrow: 1 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                startIcon={!isMobile ? item.icon : null}
                sx={{
                  color: isActive ? 'primary.main' : 'text.secondary',
                  fontWeight: isActive ? 600 : 500,
                  px: { xs: 1.5, sm: 2 },
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive ? 'rgba(37, 99, 235, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                  },
                  transition: 'all 0.2s ease',
                  minWidth: { xs: 'auto', sm: 'auto' },
                }}
              >
                {item.text}
              </Button>
            )
          })}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
    </AppBar>
  )
}