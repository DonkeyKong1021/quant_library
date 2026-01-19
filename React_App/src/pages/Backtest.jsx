import { useState, useEffect, useRef } from 'react'
import { Container, Typography, Box, Paper, Button, useTheme } from '@mui/material'
import { useLocation } from 'react-router-dom'
import DataFetcher from '../components/DataFetcher'
import StrategySelector from '../components/StrategySelector'
import BacktestConfig from '../components/BacktestConfig'
import ResultsDisplay from '../components/ResultsDisplay'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const steps = [
  { id: 'fetch-data', label: 'Fetch Data' },
  { id: 'select-strategy', label: 'Select Strategy' },
  { id: 'configure-backtest', label: 'Configure Backtest' },
  { id: 'run-results', label: 'Run & View Results' }
]

export default function Backtest() {
  const location = useLocation()
  const theme = useTheme()
  const [data, setData] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const [strategy, setStrategy] = useState(null)
  const [config, setConfig] = useState(null)
  const [results, setResults] = useState(null)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [initialCustomStrategyId, setInitialCustomStrategyId] = useState(null)
  
  // Refs for each section
  const sectionRefs = useRef({
    'fetch-data': null,
    'select-strategy': null,
    'configure-backtest': null,
    'run-results': null
  })

  // Check for custom strategy or optimized parameters from navigation state
  useEffect(() => {
    if (location.state?.customStrategyId) {
      const customStrategyId = location.state.customStrategyId
      setInitialCustomStrategyId(customStrategyId)
      // Clear the state to avoid re-applying on re-renders
      window.history.replaceState({}, document.title)
    }
    
    // Handle optimized parameters
    if (location.state?.optimizedParams && location.state?.strategy) {
      setStrategy(location.state.strategy)
      // Note: StrategySelector will need to be updated to accept initial parameters
      // For now, we'll set the strategy and let the user configure it
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Scroll detection using IntersectionObserver
  useEffect(() => {
    const observers = []
    const options = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    }

    steps.forEach((step, index) => {
      const element = document.getElementById(step.id)
      if (!element) return

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveStepIndex(index)
          }
        })
      }, options)

      observer.observe(element)
      observers.push(observer)
    })

    return () => {
      observers.forEach(observer => observer.disconnect())
    }
  }, [data, strategy, config])

  const handleDataFetched = (fetchedData, symbol) => {
    setData(fetchedData)
    setSelectedSymbol(symbol)
    setResults(null)
  }

  const handleStrategySelected = (selectedStrategy) => {
    setStrategy(selectedStrategy)
    setResults(null)
  }

  const handleConfigChanged = (backtestConfig) => {
    setConfig(backtestConfig)
  }

  const handleBacktestComplete = (backtestResults) => {
    setResults(backtestResults)
  }

  // Scroll to section handler
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  // Determine completed steps based on state
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
      return activeStepIndex === 3 ? 'active' : results ? 'completed' : 'pending'
    }
    return 'pending'
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
          Backtesting
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.0625rem' }}>
          Test your trading strategies with historical market data
        </Typography>
      </Box>

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
            elevation: 2
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
                <StrategySelector
                  onStrategySelected={handleStrategySelected}
                  initialCustomStrategyId={initialCustomStrategyId}
                  initialParams={location.state?.optimizedParams}
                />
              </Box>

              {strategy && (
                <Box
                  id="configure-backtest"
                  sx={{
                    mb: 4,
                    scrollMarginTop: '120px',
                  }}
                >
                  <BacktestConfig onConfigChanged={handleConfigChanged} />
                </Box>
              )}

              {strategy && config && (
                <Box
                  id="run-results"
                  sx={{
                    mb: 4,
                    scrollMarginTop: '120px',
                  }}
                >
                  <ResultsDisplay
                    data={data}
                    symbol={selectedSymbol}
                    strategy={strategy}
                    config={config}
                    onBacktestComplete={handleBacktestComplete}
                    results={results}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Container>
  )
}