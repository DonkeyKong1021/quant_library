import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  InputAdornment,
  Chip,
  Divider,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { navigationItems, getNavigationItemsByGroup } from '../config/navigation'

/**
 * Quick Navigation / Command Palette Component
 * Provides searchable navigation with keyboard shortcut (Cmd/Ctrl + K)
 */
export default function QuickNav({ open, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter navigation items based on search query and group them
  const filteredGroups = useMemo(() => {
    const allGroups = getNavigationItemsByGroup()
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return allGroups
    }

    // Filter items within each group
    const filtered = {}
    Object.entries(allGroups).forEach(([groupName, items]) => {
      const filteredItems = items.filter((item) => {
        const textMatch = item.text.toLowerCase().includes(query)
        const descMatch = item.description?.toLowerCase().includes(query)
        const pathMatch = item.path.toLowerCase().includes(query)
        return textMatch || descMatch || pathMatch
      })
      if (filteredItems.length > 0) {
        filtered[groupName] = filteredItems
      }
    })
    return filtered
  }, [searchQuery])

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearchQuery('')
    }
  }, [open])

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event) => {
      // Close on Escape
      if (event.key === 'Escape') {
        onClose()
      }
      // Navigate on Enter (if item selected)
      // Note: For multi-item selection, you'd need to track selected index
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  const handleItemClick = (path) => {
    navigate(path)
    onClose()
  }

  const getShortcutKey = () => {
    return navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          mt: '5vh',
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Quick Navigation
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          Search pages and navigate quickly
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 2, pb: 2 }}>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Box>

        {Object.keys(filteredGroups).length === 0 ? (
          <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No pages found matching "{searchQuery}"
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {Object.entries(filteredGroups).map(([groupName, items], groupIndex) => (
              <Box key={groupName}>
                {Object.keys(filteredGroups).length > 1 && (
                  <Box sx={{ px: 2, py: 1, pt: groupIndex === 0 ? 0 : 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: 'text.secondary',
                      }}
                    >
                      {groupName === 'main' ? 'Main' : groupName === 'backtest' ? 'Backtesting' : 'Trading'}
                    </Typography>
                  </Box>
                )}
                <List sx={{ pt: 0 }}>
                  {items.map((item) => {
                    const isActive = location.pathname === item.path
                    const IconComponent = item.icon

                    return (
                      <ListItem key={item.path} disablePadding>
                        <ListItemButton
                          selected={isActive}
                          onClick={() => handleItemClick(item.path)}
                          sx={{
                            py: 1.5,
                            px: 2,
                            borderRadius: 1,
                            mx: 1,
                            mb: 0.5,
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
                            <IconComponent />
                          </ListItemIcon>
                          <ListItemText
                            primary={item.text}
                            secondary={item.description}
                            primaryTypographyProps={{
                              fontWeight: isActive ? 600 : 400,
                            }}
                            secondaryTypographyProps={{
                              sx: {
                                color: isActive ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                                fontSize: '0.75rem',
                              },
                            }}
                          />
                          <Chip
                            label={`${getShortcutKey()}+${item.shortcut}`}
                            size="small"
                            sx={{
                              fontSize: '0.7rem',
                              height: 20,
                              backgroundColor: isActive
                                ? 'rgba(255, 255, 255, 0.2)'
                                : 'action.hover',
                              color: isActive ? 'primary.contrastText' : 'text.secondary',
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    )
                  })}
                </List>
                {groupIndex < Object.keys(filteredGroups).length - 1 && (
                  <Divider sx={{ mx: 2, my: 0.5 }} />
                )}
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Press <Chip label="Esc" size="small" sx={{ height: 18, fontSize: '0.65rem' }} /> to close
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
