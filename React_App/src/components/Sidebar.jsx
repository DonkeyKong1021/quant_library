import { useNavigate, useLocation } from 'react-router-dom'
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ExploreIcon from '@mui/icons-material/Explore'
import BuildIcon from '@mui/icons-material/Build'

const menuItems = [
  { text: 'Dashboard', icon: <HomeIcon />, path: '/' },
  { text: 'Backtest', icon: <TrendingUpIcon />, path: '/backtest' },
  { text: 'Data Explorer', icon: <ExploreIcon />, path: '/data-explorer' },
  { text: 'Strategy Builder', icon: <BuildIcon />, path: '/strategy-builder' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
        borderRight: '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Navigation
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => navigate(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  py: 1.25,
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
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : 'action.hover',
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
                    fontSize: '0.9375rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2, pt: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          Quantitative Trading Library
        </Typography>
      </Box>
    </Box>
  )
}