import { useState, useEffect, useRef } from 'react'
import { Container, Typography, Box, Paper, Button, useTheme, LinearProgress } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import DataFetcher from '../components/DataFetcher'
import StrategySelector from '../components/StrategySelector'
import BacktestConfig from '../components/BacktestConfig'
import ResultsDisplay from '../components/ResultsDisplay'
import { useThemeMode } from '../contexts/ThemeContext'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'

const steps = [
  { id: 'fetch-data', label: 'Fetch Data', description: 'Select symbol and date range' },
  { id: 'select-strategy', label: 'Select Strategy', description: 'Choose trading strategy' },
  { id: 'configure-backtest', label: 'Configure', description: 'Set backtest parameters' },
  { id: 'run-results', label: 'Run & Results', description: 'Execute and view results' },
]

export default function Backtest() {
  const location = useLocation()
  const theme = useTheme()
  const { isDark } = useThemeMode()
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
    'run-results': null,
  })

  // Check for custom strategy or optimized parameters from navigation state
  useEffect(() => {
    if (location.state?.customStrategyId) {
      const customStrategyId = location.state.customStrategyId
      setInitialCustomStrategyId(customStrategyId)
      window.history.replaceState({}, document.title)
    }

    if (location.state?.optimizedParams && location.state?.strategy) {
      setStrategy(location.state.strategy)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Scroll detection using IntersectionObserver
  useEffect(() => {
    const observers = []
    const options = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
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
      observers.forEach((observer) => observer.disconnect())
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

  // Calculate progress percentage
  const getProgress = () => {
    let completed = 0
    if (data) completed++
    if (strategy) completed++
    if (config) completed++
    if (results) completed++
    return (completed / 4) * 100
  }

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
            Backtesting
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.0625rem' }}>
            Test your trading strategies with historical market data
          </Typography>
        </Box>
      </motion.div>

      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* Vertical Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Paper
            sx={{
              position: 'sticky',
              top: 100,
              alignSelf: 'flex-start',
              p: 3,
              minWidth: 240,
              height: 'fit-content',
              background: isDark
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.6) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
              backdropFilter: 'blur(12px)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              borderRadius: 3,
              boxShadow: isDark
                ? '0 4px 20px rgba(0,0,0,0.3)'
                : '0 4px 20px rgba(0,0,0,0.08)',
            }}
            elevation={0}
          >
            {/* Progress indicator */}
            <Box sx={{ mb: 3.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  Progress
                </Typography>
                <Typography
                  variant="caption"
                  color="primary.main"
                  sx={{ fontWeight: 700, fontSize: '0.8125rem' }}
                >
                  {Math.round(getProgress())}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getProgress()}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                    boxShadow: '0 0 8px rgba(37, 99, 235, 0.4)',
                  },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {steps.map((step, index) => {
                const status = getStepStatus(index)
                const isActive = activeStepIndex === index
                const isCompleted = status === 'completed'
                const isDisabled = status === 'disabled'

                return (
                  <motion.div
                    key={step.id}
                    initial={false}
                    animate={{
                      opacity: isDisabled ? 0.5 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      onClick={() => !isDisabled && scrollToSection(step.id)}
                      disabled={isDisabled}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                        justifyContent: 'flex-start',
                        p: 2,
                        borderRadius: 2.5,
                        textTransform: 'none',
                        width: '100%',
                        minHeight: isActive ? 72 : 64,
                        color: isDisabled
                          ? 'text.disabled'
                          : isActive
                            ? 'text.primary'
                            : isCompleted
                              ? 'text.secondary'
                              : 'text.secondary',
                        backgroundColor: isActive
                          ? isDark
                            ? 'rgba(59, 130, 246, 0.15)'
                            : 'rgba(37, 99, 235, 0.1)'
                          : 'transparent',
                        border: isActive
                          ? `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`
                          : '1px solid transparent',
                        '&:hover': {
                          backgroundColor: isDisabled
                            ? 'transparent'
                            : isActive
                              ? isDark
                                ? 'rgba(59, 130, 246, 0.18)'
                                : 'rgba(37, 99, 235, 0.12)'
                              : isDark
                                ? 'rgba(255, 255, 255, 0.04)'
                                : 'rgba(0, 0, 0, 0.03)',
                          borderColor: isActive
                            ? isDark
                              ? 'rgba(59, 130, 246, 0.4)'
                              : 'rgba(37, 99, 235, 0.25)'
                            : isDark
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(0,0,0,0.06)',
                        },
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isDisabled
                            ? isDark
                              ? 'rgba(255,255,255,0.04)'
                              : 'action.disabledBackground'
                            : isActive
                              ? 'primary.main'
                              : isCompleted
                                ? 'success.main'
                                : isDark
                                  ? 'rgba(255,255,255,0.06)'
                                  : 'rgba(0,0,0,0.04)',
                          color: isDisabled
                            ? 'text.disabled'
                            : isActive || isCompleted
                              ? 'white'
                              : 'text.secondary',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          flexShrink: 0,
                          transition: 'all 0.2s ease',
                          boxShadow: isActive
                            ? '0 2px 8px rgba(37, 99, 235, 0.25)'
                            : isCompleted
                              ? '0 2px 8px rgba(16, 185, 129, 0.25)'
                              : 'none',
                        }}
                      >
                        <AnimatePresence mode="wait">
                          {isCompleted ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 90 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            >
                              <CheckCircleIcon sx={{ fontSize: 20 }} />
                            </motion.div>
                          ) : isActive ? (
                            <motion.div
                              key="active"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 90 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                              <PlayCircleIcon sx={{ fontSize: 20 }} />
                            </motion.div>
                          ) : (
                            <motion.span
                              key="number"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              {index + 1}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Box>
                      <Box sx={{ textAlign: 'left', flex: 1, pt: 0.25 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isActive ? 600 : 500,
                            fontSize: '0.875rem',
                            lineHeight: 1.4,
                            mb: 0.25,
                            color: isActive ? 'text.primary' : 'text.secondary',
                          }}
                        >
                          {step.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: isActive ? 'text.secondary' : 'text.disabled',
                            fontSize: '0.75rem',
                            lineHeight: 1.4,
                            display: 'block',
                          }}
                        >
                          {step.description}
                        </Typography>
                      </Box>
                    </Button>
                  </motion.div>
                )
              })}
            </Box>
          </Paper>
        </motion.div>

        {/* Main Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <Box
              id="fetch-data"
              sx={{
                mb: 4,
                scrollMarginTop: '120px',
              }}
            >
              <DataFetcher onDataFetched={handleDataFetched} />
            </Box>
          </motion.div>

          <AnimatePresence>
            {data && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
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
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {data && strategy && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Box
                  id="configure-backtest"
                  sx={{
                    mb: 4,
                    scrollMarginTop: '120px',
                  }}
                >
                  <BacktestConfig onConfigChanged={handleConfigChanged} />
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {data && strategy && config && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Box>
    </Container>
  )
}
