import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  TextField,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Tab,
  Tabs,
  Chip,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import DeleteIcon from '@mui/icons-material/Delete'
import CodeIcon from '@mui/icons-material/Code'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { useNavigate } from 'react-router-dom'
import StrategyEditor from '../components/StrategyEditor'
import StrategyTemplates from '../components/StrategyTemplates'
import { strategyStorage } from '../utils/strategyStorage'
import { validateStrategyCode, extractClassName } from '../utils/strategyValidator'

export default function StrategyBuilder() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [strategyName, setStrategyName] = useState('')
  const [description, setDescription] = useState('')
  const [validationResult, setValidationResult] = useState(null)
  const [savedStrategies, setSavedStrategies] = useState([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState(null)
  const [tabValue, setTabValue] = useState(0)

  const loadSavedStrategies = () => {
    const strategies = strategyStorage.getAll()
    setSavedStrategies(strategies)
  }

  // Load saved strategies on mount
  useEffect(() => {
    loadSavedStrategies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Validate code when it changes
  useEffect(() => {
    if (code.trim()) {
      const result = validateStrategyCode(code)
      setValidationResult(result)
    } else {
      setValidationResult(null)
    }
  }, [code])

  const handleTemplateSelect = (templateCode) => {
    setCode(templateCode)
    const className = extractClassName(templateCode)
    if (className && !strategyName) {
      setStrategyName(className.replace('Strategy', '').replace(/([A-Z])/g, ' $1').trim())
    }
  }

  const handleSave = () => {
    if (!code.trim()) {
      return
    }

    const validation = validateStrategyCode(code)
    if (!validation.valid) {
      alert('Please fix validation errors before saving')
      return
    }

    if (!strategyName.trim()) {
      setSaveDialogOpen(true)
      return
    }

    saveStrategy()
  }

  const saveStrategy = () => {
    try {
      const strategy = {
        id: selectedStrategy?.id || `strategy_${Date.now()}`,
        name: strategyName.trim(),
        description: description.trim(),
        code: code,
      }

      strategyStorage.save(strategy)
      loadSavedStrategies()
      setSaveDialogOpen(false)
      setSelectedStrategy(null)
      alert('Strategy saved successfully!')
    } catch (error) {
      alert('Error saving strategy: ' + error.message)
    }
  }

  const handleLoad = (strategy) => {
    setCode(strategy.code)
    setStrategyName(strategy.name)
    setDescription(strategy.description || '')
    setSelectedStrategy(strategy)
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this strategy?')) {
      strategyStorage.delete(id)
      loadSavedStrategies()
      if (selectedStrategy?.id === id) {
        setCode('')
        setStrategyName('')
        setDescription('')
        setSelectedStrategy(null)
      }
    }
  }

  const handleUseInBacktest = () => {
    if (!code.trim()) {
      return
    }

    const validation = validateStrategyCode(code)
    if (!validation.valid) {
      alert('Please fix validation errors before using in backtest')
      return
    }

    // Save strategy temporarily if not already saved
    let strategyId = selectedStrategy?.id
    if (!strategyId) {
      const tempStrategy = {
        id: `temp_${Date.now()}`,
        name: strategyName.trim() || 'Temporary Strategy',
        description: description.trim(),
        code: code,
      }
      strategyStorage.save(tempStrategy)
      strategyId = tempStrategy.id
    }

    // Navigate to backtest page with strategy ID in state
    navigate('/backtest', {
      state: {
        customStrategyId: strategyId,
      },
    })
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
          Strategy Builder
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.0625rem' }}>
          Build and test custom trading strategies using the QuantLib framework
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Templates and Saved Strategies */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 4, elevation: 1 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
              <Tab label="Templates" />
              <Tab label="Saved" />
            </Tabs>

            {tabValue === 0 && (
              <Box>
                <StrategyTemplates onSelectTemplate={handleTemplateSelect} />
              </Box>
            )}

            {tabValue === 1 && (
              <Box>
                {savedStrategies.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      No saved strategies yet.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Create and save a strategy to see it here.
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ py: 0 }}>
                    {savedStrategies.map((strategy) => (
                      <ListItem 
                        key={strategy.id} 
                        divider
                        sx={{
                          py: 1.5,
                          transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                              {strategy.name}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {strategy.description || 'No description'}
                            </Typography>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleLoad(strategy)}
                            size="small"
                            sx={{ mr: 0.5 }}
                            title="Load strategy"
                          >
                            <CodeIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDelete(strategy.id)}
                            size="small"
                            color="error"
                            title="Delete strategy"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Editor */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, elevation: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Strategy Code
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleUseInBacktest}
                  disabled={!code.trim()}
                  sx={{ fontSize: '0.9375rem', fontWeight: 500 }}
                >
                  Use in Backtest
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={!code.trim()}
                  sx={{ fontSize: '0.9375rem', fontWeight: 500 }}
                >
                  Save
                </Button>
              </Box>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Strategy Name"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="e.g., My Custom Strategy"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Brief description of the strategy"
                />
              </Grid>
            </Grid>

            {validationResult && (
              <Box sx={{ mb: 2 }}>
                {validationResult.errors.length > 0 && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Errors:
                    </Typography>
                    <Box component="ul" sx={{ margin: 0, paddingLeft: 2.5, mb: 0 }}>
                      {validationResult.errors.map((error, index) => (
                        <Box component="li" key={index}>
                          <Typography variant="body2">{error}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Alert>
                )}
                {validationResult.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mb: validationResult.errors.length > 0 ? 1 : 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Warnings:
                    </Typography>
                    <Box component="ul" sx={{ margin: 0, paddingLeft: 2.5, mb: 0 }}>
                      {validationResult.warnings.map((warning, index) => (
                        <Box component="li" key={index}>
                          <Typography variant="body2">{warning}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Alert>
                )}
                {validationResult.valid && validationResult.errors.length === 0 && validationResult.warnings.length === 0 && (
                  <Alert severity="success" sx={{ mb: 0 }}>
                    Strategy code structure is valid!
                  </Alert>
                )}
              </Box>
            )}

            <StrategyEditor code={code} onChange={setCode} height="600px" />
          </Paper>
        </Grid>
      </Grid>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Strategy</DialogTitle>
        <DialogContent>
          <TextField
            label="Strategy Name"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            fullWidth
            autoFocus
            sx={{ mt: 1 }}
          />
          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveStrategy} variant="contained" disabled={!strategyName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
