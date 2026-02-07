import { useState, useEffect } from 'react'
import { Container, Typography, Box, Button, Alert, CircularProgress, LinearProgress, Accordion, AccordionSummary, AccordionDetails, Grid } from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import DataFetcher from '../components/DataFetcher'
import StrategySelector from '../components/StrategySelector'
import BacktestConfig from '../components/BacktestConfig'
import OptimizationConfig from '../components/OptimizationConfig'
import { backtestService, workflowService } from '../services/backtestService'
import OptimizationResults from '../components/OptimizationResults'
import WorkflowStatus from '../components/WorkflowStatus'
import WorkflowStepper from '../components/WorkflowStepper'
import { useThemeMode } from '../contexts/ThemeContext'
import { formatTimeRemaining } from '../utils/timeEstimator'

export default function Optimization() {
  const navigate = useNavigate()
  const { isDark } = useThemeMode()
  const [data, setData] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const [strategy, setStrategy] = useState(null)
  const [config, setConfig] = useState(null)
  const [optimizationConfig, setOptimizationConfig] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [workflowId, setWorkflowId] = useState(null)
  const [optimizationStartTime, setOptimizationStartTime] = useState(null)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null)
  const [optimizationProgress, setOptimizationProgress] = useState(0)
  const [expandedAccordion, setExpandedAccordion] = useState('fetch-data')
  const [userHasManuallyExpanded, setUserHasManuallyExpanded] = useState(false)

  // Reset to fetch-data if no data exists
  useEffect(() => {
    if (!data) {
      setExpandedAccordion('fetch-data')
      setUserHasManuallyExpanded(false)
    }
  }, [data])

  // Auto-expand select-strategy when data becomes available (only if user hasn't manually expanded)
  useEffect(() => {
    if (data && !strategy && !userHasManuallyExpanded) {
      setExpandedAccordion('select-strategy')
    }
  }, [data, strategy, userHasManuallyExpanded])

  useEffect(() => {
    if (data && strategy && !config && !userHasManuallyExpanded) {
      setExpandedAccordion('configure-backtest')
    }
  }, [data, strategy, config, userHasManuallyExpanded])

  useEffect(() => {
    if (data && strategy && config && !optimizationConfig && !userHasManuallyExpanded) {
      setExpandedAccordion('configure-optimization')
    }
  }, [data, strategy, config, optimizationConfig, userHasManuallyExpanded])

  useEffect(() => {
    if (data && strategy && config && optimizationConfig && !results && !userHasManuallyExpanded) {
      setExpandedAccordion('run-results')
    }
  }, [data, strategy, config, optimizationConfig, results, userHasManuallyExpanded])

  const handleDataFetched = (fetchedData, symbol) => {
    setData(fetchedData)
    setSelectedSymbol(symbol)
    setResults(null)
    // Reset config and strategy when new data is fetched
    setConfig(null)
    setStrategy(null)
    setOptimizationConfig(null)
  }

  const handleStrategySelected = (selectedStrategy) => {
    setStrategy(selectedStrategy)
    setResults(null)
  }

  const handleConfigChanged = (backtestConfig) => {
    setConfig(backtestConfig)
  }

  const handleOptimizationConfigChanged = (optConfig) => {
    setOptimizationConfig(optConfig)
  }

  const handleRunOptimization = async () => {
    if (!data || !strategy || !config || !optimizationConfig) {
      setError('Please complete all configuration steps')
      return
    }

    if (!optimizationConfig.parameter_ranges || Object.keys(optimizationConfig.parameter_ranges).length === 0) {
      setError('Please configure at least one parameter range')
      return
    }

    // Check if estimated combinations exceed max for grid search
    if (optimizationConfig.optimization_type === 'grid' && 
        optimizationConfig.estimated_combinations && 
        optimizationConfig.max_combinations) {
      if (optimizationConfig.estimated_combinations > optimizationConfig.max_combinations) {
        setError(
          `Estimated combinations (${optimizationConfig.estimated_combinations.toLocaleString()}) ` +
          `exceeds maximum (${optimizationConfig.max_combinations.toLocaleString()}). ` +
          `Please reduce parameter ranges or increase max combinations.`
        )
        return
      }
    }

    setError(null) // Clear any previous errors
    setLoading(true)
    setError(null)
    setResults(null)
    setWorkflowId(null)
    setOptimizationStartTime(Date.now())
    setEstimatedTimeRemaining(null)
    setOptimizationProgress(0)

    try {
      // Format parameter ranges for API
      const formattedRanges = {}
      Object.keys(optimizationConfig.parameter_ranges).forEach((paramName) => {
        const range = optimizationConfig.parameter_ranges[paramName]
        const formattedRange = {
          min: range.min,
          max: range.max,
          type: range.type || 'float',
        }
        // Step is optional for workflow/minimize, required for grid
        if (range.step !== undefined) {
          formattedRange.step = range.step
        }
        formattedRanges[paramName] = formattedRange
      })

      // Check if this is a workflow optimization
      if (optimizationConfig.optimization_type === 'workflow') {
        // Start workflow
        const workflow = await workflowService.createWorkflow({
          data,
          strategy,
          config,
          symbol: selectedSymbol,
          parameterRanges: formattedRanges,
          objective: optimizationConfig.objective,
          maxIterations: optimizationConfig.max_iterations || 100,
        })
        setWorkflowId(workflow.workflow_id)
        setLoading(false) // Workflow runs in background
      } else {
        // Use existing grid/minimize optimization
        // Start progress estimation timer
        const startTime = Date.now()
        const totalCombinations = optimizationConfig.estimated_combinations || optimizationConfig.max_combinations || 100
        
        // For grid search, we can't track progress in real-time since it's a blocking call
        // But we can show estimated time based on initial assumptions
        // For minimize, we show a generic message
        if (optimizationConfig.optimization_type === 'grid' && totalCombinations) {
          // Estimate 0.5 seconds per combination as initial guess
          const initialEstimate = (totalCombinations * 0.5)
          setEstimatedTimeRemaining(initialEstimate)
        } else if (optimizationConfig.optimization_type === 'minimize') {
          // Estimate 30 seconds for minimize (it's usually faster)
          setEstimatedTimeRemaining(30)
        }
        
        const response = await backtestService.optimizeParameters({
          data,
          strategy,
          config,
          symbol: selectedSymbol,
          parameterRanges: formattedRanges,
          objective: optimizationConfig.objective,
          optimizationType: optimizationConfig.optimization_type,
          maxCombinations: optimizationConfig.max_combinations,
        })

        setResults(response)
        setLoading(false)
        setEstimatedTimeRemaining(null)
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to run optimization'
      setError(errorMessage)
      console.error('Optimization error:', err)
      setLoading(false)
      setEstimatedTimeRemaining(null)
      setOptimizationProgress(0)
    }
  }

  const handleWorkflowCompleted = (workflowResults) => {
    setResults(workflowResults)
    setWorkflowId(null)
  }

  const handleWorkflowError = (errorMessage) => {
    setError(errorMessage)
    setWorkflowId(null)
  }

  // Calculate progress percentage based on completed steps
  const getProgress = () => {
    // Start at 0% if no data has been fetched
    if (!data) {
      return 0
    }
    
    // There are 5 steps: Fetch Data, Select Strategy, Configure Backtest, Configure Optimization, Run & Results
    let completed = 0
    
    // Step 1: Fetch Market Data (always complete if we get here)
    completed++
    // Step 2: Select Strategy
    if (strategy) completed++
    // Step 3: Configure Backtest
    if (config) completed++
    // Step 4: Configure Optimization
    if (optimizationConfig) completed++
    // Step 5: Run & Results
    if (results) completed++
    
    // Return percentage (0-100)
    return (completed / 5) * 100
  }

  // Validate optimization config
  const validateOptimizationConfig = () => {
    if (!optimizationConfig || !optimizationConfig.parameter_ranges) {
      return false
    }
    
    const ranges = optimizationConfig.parameter_ranges
    const optimizationType = optimizationConfig.optimization_type || 'grid'
    
    const rangesValid = Object.keys(ranges).every((paramName) => {
      const range = ranges[paramName]
      const isValid = (
        range.min !== undefined &&
        range.max !== undefined &&
        range.min < range.max
      )
      
      // Step is only required for grid search
      if (optimizationType === 'grid') {
        return isValid && range.step !== undefined && range.step > 0
      }
      
      return isValid
    })
    
    // For grid search, also check if estimated combinations exceed max
    if (optimizationType === 'grid' && optimizationConfig.estimated_combinations) {
      const maxCombinations = optimizationConfig.max_combinations || 100
      if (optimizationConfig.estimated_combinations > maxCombinations) {
        return false
      }
    }
    
    return rangesValid
  }

  const canRunOptimization =
    data &&
    strategy &&
    config &&
    optimizationConfig &&
    optimizationConfig.parameter_ranges &&
    Object.keys(optimizationConfig.parameter_ranges).length > 0 &&
    validateOptimizationConfig()

  return (
    <Container maxWidth="xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700, mb: 1 }}
          >
            Parameter Optimization
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.0625rem' }}>
            Find optimal strategy parameters through systematic testing
          </Typography>
        </Box>
      </motion.div>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Minimal progress indicator */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <LinearProgress
            variant="determinate"
            value={getProgress()}
            sx={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                backgroundColor: 'primary.main',
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              color: 'primary.main',
              minWidth: 36,
            }}
          >
            {Math.round(getProgress())}%
          </Typography>
        </Box>
      </Box>

      {/* Side-by-side Layout: Stepper and Content */}
      <Grid container spacing={3}>
        {/* Workflow Stepper - Left Side */}
        <Grid item xs={12} md={3}>
          <Box sx={{ position: 'sticky', top: 100 }}>
            <WorkflowStepper
              steps={[
                { id: 'fetch-data', label: 'Fetch Data', completed: !!data },
                { id: 'select-strategy', label: 'Select Strategy', completed: !!strategy },
                { id: 'configure-backtest', label: 'Configure Backtest', completed: !!config },
                { id: 'configure-optimization', label: 'Configure Optimization', completed: !!optimizationConfig },
                { id: 'run-results', label: 'Run & Results', completed: !!results },
              ]}
              currentStep={expandedAccordion}
              onStepClick={(stepId) => {
                setExpandedAccordion(stepId)
                setUserHasManuallyExpanded(true)
              }}
            />
          </Box>
        </Grid>

        {/* Main Content - Right Side */}
        <Grid item xs={12} md={9}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Step 1: Fetch Market Data */}
            <Accordion
              expanded={expandedAccordion === 'fetch-data'}
              onChange={(event, isExpanded) => {
                setExpandedAccordion(isExpanded ? 'fetch-data' : '')
                setUserHasManuallyExpanded(true)
              }}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                '&:before': { display: 'none' },
                boxShadow: 'none',
                '&.Mui-expanded': {
                  margin: 0,
                  borderColor: 'primary.main',
                  borderWidth: 1,
                },
              }}
              disableGutters
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 20 }} />}
                sx={{
                  minHeight: 52,
                  px: 2.5,
                  '& .MuiAccordionSummary-content': { my: 1.5 },
                }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: '0.9375rem' }}>
                  1. Fetch Market Data
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <DataFetcher onDataFetched={handleDataFetched} />
              </AccordionDetails>
            </Accordion>

            {/* Step 2: Select Strategy */}
            <Accordion
              expanded={expandedAccordion === 'select-strategy'}
              onChange={(event, isExpanded) => {
                setExpandedAccordion(isExpanded ? 'select-strategy' : '')
                setUserHasManuallyExpanded(true)
              }}
              disabled={!data}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                '&:before': { display: 'none' },
                boxShadow: 'none',
                '&.Mui-expanded': {
                  margin: 0,
                  borderColor: 'primary.main',
                  borderWidth: 1,
                },
                '&.Mui-disabled': {
                  backgroundColor: 'transparent',
                  opacity: 0.5,
                },
              }}
              disableGutters
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 20 }} />}
                sx={{
                  minHeight: 52,
                  px: 2.5,
                  '& .MuiAccordionSummary-content': { my: 1.5 },
                }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: '0.9375rem' }}>
                  2. Select Strategy
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <StrategySelector onStrategySelected={handleStrategySelected} />
              </AccordionDetails>
            </Accordion>

            {/* Step 3: Configure Backtest */}
            <Accordion
              expanded={expandedAccordion === 'configure-backtest'}
              onChange={(event, isExpanded) => {
                setExpandedAccordion(isExpanded ? 'configure-backtest' : '')
                setUserHasManuallyExpanded(true)
              }}
              disabled={!data || !strategy}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                '&:before': { display: 'none' },
                boxShadow: 'none',
                '&.Mui-expanded': {
                  margin: 0,
                  borderColor: 'primary.main',
                  borderWidth: 1,
                },
                '&.Mui-disabled': {
                  backgroundColor: 'transparent',
                  opacity: 0.5,
                },
              }}
              disableGutters
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 20 }} />}
                sx={{
                  minHeight: 52,
                  px: 2.5,
                  '& .MuiAccordionSummary-content': { my: 1.5 },
                }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: '0.9375rem' }}>
                  3. Configure Backtest
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <BacktestConfig onConfigChanged={handleConfigChanged} />
              </AccordionDetails>
            </Accordion>

            {/* Step 4: Configure Optimization */}
            <Accordion
              expanded={expandedAccordion === 'configure-optimization'}
              onChange={(event, isExpanded) => {
                setExpandedAccordion(isExpanded ? 'configure-optimization' : '')
                setUserHasManuallyExpanded(true)
              }}
              disabled={!data || !strategy || !config}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                '&:before': { display: 'none' },
                boxShadow: 'none',
                '&.Mui-expanded': {
                  margin: 0,
                  borderColor: 'primary.main',
                  borderWidth: 1,
                },
                '&.Mui-disabled': {
                  backgroundColor: 'transparent',
                  opacity: 0.5,
                },
              }}
              disableGutters
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 20 }} />}
                sx={{
                  minHeight: 52,
                  px: 2.5,
                  '& .MuiAccordionSummary-content': { my: 1.5 },
                }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: '0.9375rem' }}>
                  4. Configure Optimization
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <OptimizationConfig
                  strategy={strategy}
                  onConfigChanged={handleOptimizationConfigChanged}
                />
              </AccordionDetails>
            </Accordion>

            {/* Step 5: Run & Results */}
            <Accordion
              expanded={expandedAccordion === 'run-results'}
              onChange={(event, isExpanded) => {
                setExpandedAccordion(isExpanded ? 'run-results' : '')
                setUserHasManuallyExpanded(true)
              }}
              disabled={!data || !strategy || !config || !optimizationConfig}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                '&:before': { display: 'none' },
                boxShadow: 'none',
                '&.Mui-expanded': {
                  margin: 0,
                  borderColor: 'primary.main',
                  borderWidth: 1,
                },
                '&.Mui-disabled': {
                  backgroundColor: 'transparent',
                  opacity: 0.5,
                },
              }}
              disableGutters
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 20 }} />}
                sx={{
                  minHeight: 52,
                  px: 2.5,
                  '& .MuiAccordionSummary-content': { my: 1.5 },
                }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: '0.9375rem' }}>
                  5. Run & Results
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.9375rem' }}>
                      Run Optimization
                    </Typography>
                    <Button
                      variant="contained"
                      size="medium"
                      startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
                      onClick={handleRunOptimization}
                      disabled={!canRunOptimization || loading}
                      sx={{ px: 3 }}
                    >
                      {loading ? 'Running...' : 'Run Optimization'}
                    </Button>
                  </Box>

                  {loading && !workflowId && (
                    <Box sx={{ py: 4 }}>
                      <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <CircularProgress size={48} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          Running optimization... This may take a while.
                        </Typography>
                      </Box>
                      
                      {/* Progress Bar for Grid Search */}
                      {optimizationConfig?.optimization_type === 'grid' && optimizationConfig?.estimated_combinations && (
                        <Box sx={{ mt: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Progress: {optimizationProgress}%
                            </Typography>
                            {estimatedTimeRemaining !== null && (
                              <Typography variant="body2" color="text.secondary">
                                Est. remaining: {formatTimeRemaining(estimatedTimeRemaining)}
                              </Typography>
                            )}
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={optimizationProgress} 
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Testing {optimizationConfig.estimated_combinations?.toLocaleString() || optimizationConfig.estimated_combinations} parameter combinations...
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Progress info for minimize */}
                      {optimizationConfig?.optimization_type === 'minimize' && (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Running continuous optimization (L-BFGS-B algorithm)...
                          </Typography>
                          {estimatedTimeRemaining !== null && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Est. remaining: {formatTimeRemaining(estimatedTimeRemaining)}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  )}

                  {workflowId && (
                    <WorkflowStatus
                      workflowId={workflowId}
                      onCompleted={handleWorkflowCompleted}
                      onError={handleWorkflowError}
                      maxIterations={optimizationConfig?.max_iterations || 100}
                    />
                  )}
                  {results && !loading && !workflowId && (
                    <OptimizationResults
                      results={results}
                      strategy={strategy}
                      config={config}
                      data={data}
                      symbol={selectedSymbol}
                      onApplyParameters={(params) => {
                        navigate('/backtest', {
                          state: {
                            optimizedParams: params,
                            strategy: strategy,
                            symbol: selectedSymbol,
                          },
                        })
                      }}
                    />
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Grid>
      </Grid>
    </Container>
  )
}
