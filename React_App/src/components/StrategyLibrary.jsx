import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CodeIcon from '@mui/icons-material/Code'
import InfoIcon from '@mui/icons-material/Info'
import { getLibraryStrategies, getLibraryCategories } from '../services/strategyLibraryService'

export default function StrategyLibrary({ onSelectStrategy }) {
  const [strategies, setStrategies] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStrategy, setSelectedStrategy] = useState(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  useEffect(() => {
    loadCategories()
    loadStrategies()
  }, [])

  useEffect(() => {
    loadStrategies()
  }, [selectedCategory, searchQuery])

  const loadCategories = async () => {
    try {
      const data = await getLibraryCategories()
      setCategories(data.categories || [])
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const loadStrategies = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getLibraryStrategies(
        selectedCategory || null,
        searchQuery || null,
        null
      )
      setStrategies(data.strategies || [])
    } catch (err) {
      setError('Failed to load strategy library')
      console.error('Error loading strategies:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStrategyClick = async (strategy) => {
    setSelectedStrategy(strategy)
    setDetailDialogOpen(true)
  }

  const handleUseStrategy = () => {
    if (selectedStrategy && onSelectStrategy) {
      // Fetch code and call callback
      // For now, we'll just pass the strategy ID
      // The parent component can fetch the code
      onSelectStrategy(selectedStrategy.id)
    }
    setDetailDialogOpen(false)
  }

  const filteredStrategies = strategies.filter(strategy => {
    if (selectedCategory && strategy.category !== selectedCategory) {
      return false
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        strategy.name.toLowerCase().includes(query) ||
        strategy.description.toLowerCase().includes(query) ||
        strategy.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    return true
  })

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search strategies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth size="small">
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            label="Category"
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          {filteredStrategies.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body2" color="text.secondary">
                No strategies found.
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {filteredStrategies.map((strategy) => (
                <ListItem key={strategy.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleStrategyClick(strategy)}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {strategy.name}
                          </Typography>
                          {strategy.uses_framework && (
                            <Chip
                              label="Framework"
                              size="small"
                              color="primary"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {strategy.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                            {strategy.tags.slice(0, 3).map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                    <InfoIcon sx={{ color: 'text.secondary', ml: 1 }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </>
      )}

      {/* Strategy Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedStrategy?.name}
          {selectedStrategy?.uses_framework && (
            <Chip
              label="Framework"
              size="small"
              color="primary"
              sx={{ ml: 1 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedStrategy && (
            <Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedStrategy.description}
              </Typography>

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                Category: {selectedStrategy.category}
              </Typography>

              {selectedStrategy.tags.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                    Tags:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                    {selectedStrategy.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          <Button
            onClick={handleUseStrategy}
            variant="contained"
            startIcon={<CodeIcon />}
          >
            Use Strategy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
