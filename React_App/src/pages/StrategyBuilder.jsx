import { useState, useEffect, useRef } from 'react'
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
  Tab,
  Tabs,
  Chip,
  CircularProgress,
  InputAdornment,
  Menu,
  MenuItem,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SaveIcon from '@mui/icons-material/Save'
import DeleteIcon from '@mui/icons-material/Delete'
import CodeIcon from '@mui/icons-material/Code'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SearchIcon from '@mui/icons-material/Search'
import DownloadIcon from '@mui/icons-material/Download'
import UploadIcon from '@mui/icons-material/Upload'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { useNavigate } from 'react-router-dom'
import StrategyEditor from '../components/StrategyEditor'
import StrategyBrowse from '../components/StrategyBrowse'
import AIStrategyGenerator from '../components/AIStrategyGenerator'
import { strategyStorage } from '../utils/strategyStorage'
import { validateStrategyCode, extractClassName } from '../utils/strategyValidator'
import { getLibraryStrategyCode } from '../services/strategyLibraryService'
import { useNotifications } from '../hooks/useNotifications.jsx'

export default function StrategyBuilder() {
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning, showInfo, NotificationComponent } = useNotifications()
  
  const [code, setCode] = useState('')
  const [strategyName, setStrategyName] = useState('')
  const [description, setDescription] = useState('')
  const [validationResult, setValidationResult] = useState(null)
  const [savedStrategies, setSavedStrategies] = useState([])
  const [filteredStrategies, setFilteredStrategies] = useState([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteStrategyId, setDeleteStrategyId] = useState(null)
  const [selectedStrategy, setSelectedStrategy] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null)
  const [importFileInputRef, setImportFileInputRef] = useState(null)
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false)
  const [expandedAccordions, setExpandedAccordions] = useState({
    browseSave: true,
    codeEditor: true,
  })

  // Track initial state for unsaved changes detection
  const initialStateRef = useRef({ code: '', name: '', description: '' })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Track unsaved changes
  useEffect(() => {
    const currentState = {
      code: code.trim(),
      name: strategyName.trim(),
      description: description.trim(),
    }
    const initial = initialStateRef.current
    const changed = 
      currentState.code !== initial.code ||
      currentState.name !== initial.name ||
      currentState.description !== initial.description
    setHasUnsavedChanges(changed)
  }, [code, strategyName, description])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])


  const handleLibraryStrategySelect = async (strategyId) => {
    setLoading(true)
    try {
      const data = await getLibraryStrategyCode(strategyId)
      if (data.code) {
        setCode(data.code)
        const className = extractClassName(data.code)
        if (className && !strategyName) {
          setStrategyName(data.name || className.replace('Strategy', '').replace(/([A-Z])/g, ' $1').trim())
        }
        updateInitialState()
        showSuccess('Strategy loaded successfully')
      }
    } catch (error) {
      showError('Error loading strategy code: ' + error.message)
      console.error('Error loading strategy:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateInitialState = () => {
    initialStateRef.current = {
      code: code.trim(),
      name: strategyName.trim(),
      description: description.trim(),
    }
    setHasUnsavedChanges(false)
  }

  const loadSavedStrategies = () => {
    const strategies = strategyStorage.getAll()
    setSavedStrategies(strategies)
    filterStrategies(strategies, searchQuery)
  }

  const filterStrategies = (strategies, query) => {
    if (!query.trim()) {
      setFilteredStrategies(strategies)
      return
    }
    const lowerQuery = query.toLowerCase()
    const filtered = strategies.filter((strategy) => 
      strategy.name.toLowerCase().includes(lowerQuery) ||
      (strategy.description && strategy.description.toLowerCase().includes(lowerQuery))
    )
    setFilteredStrategies(filtered)
  }

  useEffect(() => {
    filterStrategies(savedStrategies, searchQuery)
  }, [searchQuery, savedStrategies])

  // Load saved strategies on mount
  useEffect(() => {
    loadSavedStrategies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Validate code when it changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (code.trim()) {
        const result = validateStrategyCode(code)
        setValidationResult(result)
      } else {
        setValidationResult(null)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [code])

  const handleTemplateSelect = (templateCode) => {
    setCode(templateCode)
    const className = extractClassName(templateCode)
    if (className && !strategyName) {
      setStrategyName(className.replace('Strategy', '').replace(/([A-Z])/g, ' $1').trim())
    }
    updateInitialState()
  }

  const checkForDuplicate = (name) => {
    const strategies = strategyStorage.getAll()
    return strategies.find((s) => s.name.toLowerCase() === name.toLowerCase() && s.id !== selectedStrategy?.id)
  }

  const saveStrategy = () => {
    try {
      const name = strategyName.trim()
      const duplicate = checkForDuplicate(name)
      
      if (duplicate && !selectedStrategy) {
        // Show dialog to confirm overwrite or rename
        setSaveDialogOpen(true)
        showWarning(`A strategy named "${name}" already exists. You can overwrite it or choose a different name.`)
        return
      }

      const strategy = {
        id: selectedStrategy?.id || `strategy_${Date.now()}`,
        name: name,
        description: description.trim(),
        code: code,
      }

      strategyStorage.save(strategy)
      loadSavedStrategies()
      setSaveDialogOpen(false)
      updateInitialState()
      setSelectedStrategy(strategy)
      showSuccess('Strategy saved successfully!')
    } catch (error) {
      showError('Error saving strategy: ' + error.message)
    }
  }

  const handleSave = () => {
    if (!code.trim()) {
      return
    }

    const validation = validateStrategyCode(code)
    if (!validation.valid) {
      showWarning('Please fix validation errors before saving')
      return
    }

    if (!strategyName.trim()) {
      setSaveDialogOpen(true)
      return
    }

    saveStrategy()
  }

  const handleUseInBacktest = () => {
    if (!code.trim()) {
      return
    }

    const validation = validateStrategyCode(code)
    if (!validation.valid) {
      showWarning('Please fix validation errors before using in backtest')
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


  const handleLoad = (strategy) => {
    if (hasUnsavedChanges) {
      // Use a simple confirm for now - could be replaced with a dialog
      if (!window.confirm('You have unsaved changes. Load this strategy anyway?')) {
        return
      }
    }
    setCode(strategy.code)
    setStrategyName(strategy.name)
    setDescription(strategy.description || '')
    setSelectedStrategy(strategy)
    updateInitialState()
  }

  const handleDeleteClick = (id) => {
    setDeleteStrategyId(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (deleteStrategyId) {
      strategyStorage.delete(deleteStrategyId)
      loadSavedStrategies()
      if (selectedStrategy?.id === deleteStrategyId) {
        setCode('')
        setStrategyName('')
        setDescription('')
        setSelectedStrategy(null)
        updateInitialState()
      }
      showSuccess('Strategy deleted successfully')
    }
    setDeleteDialogOpen(false)
    setDeleteStrategyId(null)
  }

  // Keyboard shortcuts - use refs to avoid stale closures
  const handleSaveRef = useRef(handleSave)
  const handleUseInBacktestRef = useRef(handleUseInBacktest)

  useEffect(() => {
    handleSaveRef.current = handleSave
    handleUseInBacktestRef.current = handleUseInBacktest
  })

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveRef.current()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        handleUseInBacktestRef.current()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleExport = (strategyId = null) => {
    try {
      const jsonString = strategyStorage.export(strategyId ? [strategyId] : null)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = strategyId 
        ? `strategy_${selectedStrategy?.name || 'export'}.json`
        : `strategies_export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showSuccess(strategyId ? 'Strategy exported successfully' : 'All strategies exported successfully')
    } catch (error) {
      showError('Error exporting strategies: ' + error.message)
    }
    setExportMenuAnchor(null)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        const text = await file.text()
        const result = strategyStorage.import(text, { overwrite: false, skipDuplicates: true })
        loadSavedStrategies()
        showSuccess(`Imported ${result.imported} strategy(ies). ${result.skipped > 0 ? `${result.skipped} duplicate(s) skipped.` : ''}`)
        if (result.errors.length > 0) {
          showWarning(`Some errors occurred: ${result.errors.join(', ')}`)
        }
      } catch (error) {
        showError('Error importing strategies: ' + error.message)
      }
    }
    input.click()
  }

  const errorCount = validationResult?.errors.length || 0
  const warningCount = validationResult?.warnings.length || 0

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

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Browse & Save Strategies Accordion */}
        <Accordion
          expanded={expandedAccordions.browseSave}
          onChange={(event, isExpanded) => {
            setExpandedAccordions((prev) => ({ ...prev, browseSave: isExpanded }))
          }}
          sx={{ mb: 0 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Browse & Save Strategies
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
              <Tab label="Browse" />
              <Tab label="Saved" />
            </Tabs>

            {tabValue === 0 && (
              <Box>
                {loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                )}
                <StrategyBrowse 
                  onSelectTemplate={handleTemplateSelect}
                  onSelectLibraryStrategy={handleLibraryStrategySelect}
                />
              </Box>
            )}

            {tabValue === 1 && (
              <Box>
                <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
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
                  />
                  <IconButton
                    onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                    title="Export/Import"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                {filteredStrategies.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {searchQuery ? 'No strategies match your search.' : 'No saved strategies yet.'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {searchQuery ? 'Try a different search term.' : 'Create and save a strategy to see it here.'}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {searchQuery && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {filteredStrategies.length} strategy(ies) found
                      </Typography>
                    )}
                    <List sx={{ py: 0 }}>
                      {filteredStrategies.map((strategy) => (
                        <ListItem 
                          key={strategy.id} 
                          divider
                          sx={{
                            py: 1.5,
                            transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            backgroundColor: selectedStrategy?.id === strategy.id ? 'action.selected' : 'transparent',
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
                                {strategy.updatedAt && (
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(strategy.updatedAt).toLocaleDateString()}
                                  </Typography>
                                )}
                              </Box>
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
                              onClick={() => handleDeleteClick(strategy.id)}
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
                  </>
                )}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Strategy Code Editor Accordion */}
        <Accordion
          expanded={expandedAccordions.codeEditor}
          onChange={(event, isExpanded) => {
            setExpandedAccordions((prev) => ({ ...prev, codeEditor: isExpanded }))
          }}
          sx={{ mb: 0 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', mr: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Strategy Code Editor
              </Typography>
              {errorCount > 0 && (
                <Chip 
                  label={`${errorCount} error${errorCount > 1 ? 's' : ''}`}
                  color="error"
                  size="small"
                />
              )}
              {warningCount > 0 && errorCount === 0 && (
                <Chip 
                  label={`${warningCount} warning${warningCount > 1 ? 's' : ''}`}
                  color="warning"
                  size="small"
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<AutoAwesomeIcon />}
                onClick={() => setAiGeneratorOpen(true)}
                sx={{ fontSize: '0.9375rem', fontWeight: 500 }}
                color="secondary"
              >
                AI Generate
              </Button>
              <Button
                variant="outlined"
                startIcon={<PlayArrowIcon />}
                onClick={handleUseInBacktest}
                disabled={!code.trim() || loading}
                sx={{ fontSize: '0.9375rem', fontWeight: 500 }}
              >
                Use in Backtest
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={!code.trim() || loading}
                sx={{ fontSize: '0.9375rem', fontWeight: 500 }}
              >
                Save
              </Button>
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
                      Errors ({validationResult.errors.length}):
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
                      Warnings ({validationResult.warnings.length}):
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
          </AccordionDetails>
        </Accordion>
      </Box>

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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Strategy</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this strategy? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleExport(selectedStrategy?.id)} disabled={!selectedStrategy}>
          <DownloadIcon sx={{ mr: 1 }} />
          Export Current Strategy
        </MenuItem>
        <MenuItem onClick={() => handleExport(null)}>
          <DownloadIcon sx={{ mr: 1 }} />
          Export All Strategies
        </MenuItem>
        <MenuItem onClick={handleImport}>
          <UploadIcon sx={{ mr: 1 }} />
          Import Strategies
        </MenuItem>
      </Menu>

      {/* AI Strategy Generator */}
      <AIStrategyGenerator
        open={aiGeneratorOpen}
        onClose={() => setAiGeneratorOpen(false)}
        onStrategyGenerated={(generated) => {
          setCode(generated.code)
          if (generated.name && !strategyName) {
            setStrategyName(generated.name)
          }
          if (generated.description && !description) {
            setDescription(generated.description)
          }
          updateInitialState()
          showSuccess('Strategy generated successfully!')
        }}
      />

      {/* Notifications */}
      {NotificationComponent}
    </Container>
  )
}
