import { useState, useEffect } from 'react'
import { Container, Typography, Box, Paper, Button, useTheme, LinearProgress, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DataFetcher from '../components/DataFetcher'
import StrategySelector from '../components/StrategySelector'
import BacktestConfig from '../components/BacktestConfig'
import ResultsDisplay from '../components/ResultsDisplay'
import { useThemeMode } from '../contexts/ThemeContext'


export default function Backtest() {
  const location = useLocation()
  const theme = useTheme()
  const { isDark } = useThemeMode()
  const [data, setData] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const [strategy, setStrategy] = useState(null)
  const [config, setConfig] = useState(null)
  const [results, setResults] = useState(null)
  const [initialCustomStrategyId, setInitialCustomStrategyId] = useState(null)
  const [initialParams, setInitialParams] = useState(null)
  const [expandedAccordion, setExpandedAccordion] = useState('fetch-data')

  // Check for custom strategy or optimized parameters from navigation state
  useEffect(() => {
    if (location.state?.customStrategyId) {
      const customStrategyId = location.state.customStrategyId
      setInitialCustomStrategyId(customStrategyId)
      window.history.replaceState({}, document.title)
    }

    // Store optimized params for StrategySelector, but don't auto-set strategy
    // Let StrategySelector handle calling onStrategySelected
    if (location.state?.optimizedParams) {
      setInitialParams(location.state.optimizedParams)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Reset to fetch-data if no data exists
  useEffect(() => {
    if (!data) {
      setExpandedAccordion('fetch-data')
    }
  }, [data])

  // Auto-expand select-strategy when data becomes available
  useEffect(() => {
    if (data && !strategy) {
      setExpandedAccordion('select-strategy')
    }
  }, [data, strategy])

  useEffect(() => {
    if (data && strategy && !config) {
      setExpandedAccordion('configure-backtest')
    }
  }, [data, strategy, config])

  useEffect(() => {
    if (data && strategy && config && !results) {
      setExpandedAccordion('run-results')
    }
  }, [data, strategy, config, results])

  const handleDataFetched = (fetchedData, symbol) => {
    setData(fetchedData)
    setSelectedSymbol(symbol)
    setResults(null)
    // Reset config and strategy when new data is fetched
    setConfig(null)
    setStrategy(null)
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


  // Calculate progress percentage based on completed steps
  const getProgress = () => {
    // Start at 0% if no data has been fetched
    if (!data) {
      return 0
    }
    
    // There are 4 steps: Fetch Data, Select Strategy, Configure, Run & Results
    let completed = 0
    
    // Step 1: Fetch Market Data (always complete if we get here)
    completed++
    // Step 2: Select Strategy
    if (strategy) completed++
    // Step 3: Configure Backtest
    if (config) completed++
    // Step 4: Run & Results
    if (results) completed++
    
    // Return percentage (0-100)
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

      {/* Progress indicator at top */}
      <Paper
        sx={{
          p: 2.5,
          mb: 4,
          background: isDark
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.7) 100%)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          borderRadius: 3,
        }}
        elevation={0}
      >
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
      </Paper>

      {/* Main Content */}
      <Box sx={{ position: 'relative' }}>
        <Accordion
          expanded={expandedAccordion === 'fetch-data'}
          onChange={(event, isExpanded) => setExpandedAccordion(isExpanded ? 'fetch-data' : '')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Fetch Market Data
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <DataFetcher onDataFetched={handleDataFetched} />
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expandedAccordion === 'select-strategy'}
          onChange={(event, isExpanded) => setExpandedAccordion(isExpanded ? 'select-strategy' : '')}
          disabled={!data}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Select Strategy
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <StrategySelector
              onStrategySelected={handleStrategySelected}
              initialCustomStrategyId={initialCustomStrategyId}
              initialParams={initialParams}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expandedAccordion === 'configure-backtest'}
          onChange={(event, isExpanded) => setExpandedAccordion(isExpanded ? 'configure-backtest' : '')}
          disabled={!data || !strategy}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Configure Backtest
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <BacktestConfig onConfigChanged={handleConfigChanged} />
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expandedAccordion === 'run-results'}
          onChange={(event, isExpanded) => setExpandedAccordion(isExpanded ? 'run-results' : '')}
          disabled={!data || !strategy || !config}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Run & Results
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ResultsDisplay
              data={data}
              symbol={selectedSymbol}
              strategy={strategy}
              config={config}
              onBacktestComplete={handleBacktestComplete}
              results={results}
            />
          </AccordionDetails>
        </Accordion>
      </Box>
    </Container>
  )
}
