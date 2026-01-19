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
import { navigationItems, getNavigationItemsByGroup } from '../config/navigation'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const groups = getNavigationItemsByGroup()

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
      <Box sx={{ flexGrow: 1, overflowY: 'auto', pt: 1 }}>
        {Object.entries(groups).map(([groupName, items], groupIndex) => (
          <Box key={groupName}>
            {groupIndex > 0 && (
              <Box sx={{ px: 2, py: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {groupName === 'main' ? 'Main' : groupName === 'backtest' ? 'Backtesting' : 'Trading'}
                </Typography>
              </Box>
            )}
            <List sx={{ pt: groupIndex > 0 ? 0 : 0 }}>
              {items.map((item) => {
                const isActive = location.pathname === item.path
                const IconComponent = item.icon
                return (
                  <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
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
                        <IconComponent />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        secondary={item.description}
                        primaryTypographyProps={{
                          fontWeight: isActive ? 600 : 400,
                          fontSize: '0.9375rem',
                        }}
                        secondaryTypographyProps={{
                          sx: {
                            fontSize: '0.7rem',
                            mt: 0.25,
                            lineHeight: 1.2,
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </List>
            {groupIndex < Object.keys(groups).length - 1 && (
              <Divider sx={{ mx: 2, my: 1 }} />
            )}
          </Box>
        ))}
      </Box>
      <Divider />
      <Box sx={{ p: 2, pt: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          Quantitative Trading Library
        </Typography>
      </Box>
    </Box>
  )
}