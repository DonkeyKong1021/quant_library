import { useState, useEffect, useRef } from 'react'
import { Container, Typography, Box, Paper, Button, useTheme, Alert, CircularProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DataFetcher from '../components/DataFetcher'
import StrategySelector from '../components/StrategySelector'
import BacktestConfig from '../components/BacktestConfig'
import OptimizationConfig from '../components/OptimizationConfig'
import { backtestService } from '../services/backtestService'
import OptimizationResults from '../components/OptimizationResults'

const steps = [
  { id: 'fetch-data', label: 'Fetch Data' },
  { id: 'select-strategy', label: 'Select Strategy' },
  { id: 'configure-backtest', label: 'Configure Backtest' },
  { id: 'configure-optimization', label: 'Configure Optimization' },
  { id: 'run-results', label: 'Run & View Results' },
]

export default function Optimization() {
  const navigate = useNavigate()
  const theme = useTheme()
  const [data, setData] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const [strategy, setStrategy] = useState(null)
  const [config, setConfig] = useState(null)
  const [optimizationConfig, setOptimizationConfig] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  const handleDataFetched = (fetchedData, symbol) => {
    setData(fetchedData)
    setSelectedSymbol(symbol)
    setActiveStepIndex(1)
  }

  const handleStrategySelected = (selectedStrategy) => {
    setStrategy(selectedStrategy)
    if (data) {
      setActiveStepIndex(2)
    }
  }

  const handleConfigChanged = (backtestConfig) => {
    setConfig(backtestConfig)
    if (strategy) {
      setActiveStepIndex(3)
    }
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

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      // Format parameter ranges for API
      const formattedRanges = {}
      Object.keys(optimizationConfig.parameter_ranges).forEach((paramName) => {
        const range = optimizationConfig.parameter_ranges[paramName]
        formattedRanges[paramName] = {
          min: range.min,
          max: range.max,
          step: range.step,
          type: range.type || 'float',
        }
      })

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
      setActiveStepIndex(4)
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to run optimization'
      setError(errorMessage)
      console.error('Optimization error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStepStatus = (index) => {
    if (index === 0) return data ? 'completed' : activeStepIndex === 0 ? 'active' : 'pending'
    if (index === 1) {
      if (!data) return 'disabled'
      return strategy ? 'completed' : activeStepIndex === 1 ? 'active' : 'pending'
    }
    if (index === 2) {
      if (!data || !strategy) return 'disabled'
      return config ? 'completed' : activeStepIndex === 2 ? 'active' : 'pending'
    }
    if (index === 3) {
      if (!data || !strategy || !config) return 'disabled'
      return optimizationConfig ? 'completed' : activeStepIndex === 3 ? 'active' : 'pending'
    }
    if (index === 4) {
      if (!data || !strategy || !config || !optimizationConfig) return 'disabled'
      return activeStepIndex === 4 ? 'active' : results ? 'completed' : 'pending'
    }
    return 'pending'
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  // Validate optimization config
  const validateOptimizationConfig = () => {
    if (!optimizationConfig || !optimizationConfig.parameter_ranges) {
      return false
    }
    
    const ranges = optimizationConfig.parameter_ranges
    return Object.keys(ranges).every((paramName) => {
      const range = ranges[paramName]
      return (
        range.min !== undefined &&
        range.max !== undefined &&
        range.min < range.max &&
        range.step !== undefined &&
        range.step > 0
      )
    })
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
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
          Parameter Optimization
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.0625rem' }}>
          Find optimal strategy parameters through systematic testing
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* Vertical Navigation */}
        <Paper
          sx={{
            position: 'sticky',
            top: 100,
            alignSelf: 'flex-start',
            p: 2,
            minWidth: 200,
            height: 'fit-content',
            elevation: 2,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {steps.map((step, index) => {
              const status = getStepStatus(index)
              const isActive = activeStepIndex === index
              const isCompleted = status === 'completed'
              const isDisabled = status === 'disabled'

              return (
                <Button
                  key={step.id}
                  onClick={() => !isDisabled && scrollToSection(step.id)}
                  disabled={isDisabled}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    justifyContent: 'flex-start',
                    p: 1.5,
                    borderRadius: 1,
                    textTransform: 'none',
                    color: isDisabled
                      ? 'text.disabled'
                      : isActive
                      ? 'primary.main'
                      : isCompleted
                      ? 'text.secondary'
                      : 'text.primary',
                    backgroundColor: isActive ? 'action.selected' : 'transparent',
                    '&:hover': {
                      backgroundColor: isDisabled ? 'transparent' : 'action.hover',
                    },
                    transition: 'all 0.2s ease-in-out',
                    borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                    pl: isActive ? 1.25 : 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDisabled
                        ? 'action.disabledBackground'
                        : isActive
                        ? 'primary.main'
                        : isCompleted
                        ? 'success.main'
                        : 'action.selected',
                      color: isDisabled
                        ? 'text.disabled'
                        : isActive || isCompleted
                        ? 'white'
                        : 'text.secondary',
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.875rem',
                      flexShrink: 0,
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon sx={{ fontSize: 20 }} />
                    ) : (
                      index + 1
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.875rem',
                    }}
                  >
                    {step.label}
                  </Typography>
                </Button>
              )
            })}
          </Box>
        </Paper>

        {/* Main Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            id="fetch-data"
            sx={{
              mb: 4,
              scrollMarginTop: '120px',
            }}
          >
            <DataFetcher onDataFetched={handleDataFetched} />
          </Box>

          {data && (
            <>
              <Box
                id="select-strategy"
                sx={{
                  mb: 4,
                  scrollMarginTop: '120px',
                }}
              >
                <StrategySelector onStrategySelected={handleStrategySelected} />
              </Box>

              {strategy && (
                <>
                  <Box
                    id="configure-backtest"
                    sx={{
                      mb: 4,
                      scrollMarginTop: '120px',
                    }}
                  >
                    <BacktestConfig onConfigChanged={handleConfigChanged} />
                  </Box>

                  {config && (
                    <>
                      <Box
                        id="configure-optimization"
                        sx={{
                          mb: 4,
                          scrollMarginTop: '120px',
                        }}
                      >
                        <OptimizationConfig
                          strategy={strategy}
                          onConfigChanged={handleOptimizationConfigChanged}
                        />
                      </Box>

                      {optimizationConfig && (
                        <Box
                          id="run-results"
                          sx={{
                            mb: 4,
                            scrollMarginTop: '120px',
                          }}
                        >
                          <Paper sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Run Optimization
                              </Typography>
                              <Button
                                variant="contained"
                                size="large"
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                                onClick={handleRunOptimization}
                                disabled={!canRunOptimization || loading}
                              >
                                {loading ? 'Running...' : 'Run Optimization'}
                              </Button>
                            </Box>

                            {loading && (
                              <Box sx={{ textAlign: 'center', py: 4 }}>
                                <CircularProgress size={60} />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                  Running optimization... This may take a while.
                                </Typography>
                              </Box>
                            )}

                            {results && !loading && (
                              <OptimizationResults
                                results={results}
                                strategy={strategy}
                                config={config}
                                data={data}
                                symbol={selectedSymbol}
                                onApplyParameters={(params) => {
                                  // Navigate to backtest page with optimized parameters
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
                          </Paper>
                        </Box>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </Box>
      </Box>
    </Container>
  )
}
