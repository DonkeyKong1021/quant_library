import { useState, useEffect } from 'react'
import { Container, Typography, Box, LinearProgress, Accordion, AccordionSummary, AccordionDetails, Grid } from '@mui/material'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DataFetcher from '../components/DataFetcher'
import StrategySelector from '../components/StrategySelector'
import BacktestConfig from '../components/BacktestConfig'
import ResultsDisplay from '../components/ResultsDisplay'
import WorkflowStepper from '../components/WorkflowStepper'
import { useThemeMode } from '../contexts/ThemeContext'


export default function Backtest() {
  const location = useLocation()
  const { isDark } = useThemeMode()
  const [data, setData] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const [strategy, setStrategy] = useState(null)
  const [config, setConfig] = useState(null)
  const [results, setResults] = useState(null)
  const [initialCustomStrategyId, setInitialCustomStrategyId] = useState(null)
  const [initialParams, setInitialParams] = useState(null)
  const [expandedAccordion, setExpandedAccordion] = useState('fetch-data')
  const [userHasManuallyExpanded, setUserHasManuallyExpanded] = useState(false)

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
    if (data && strategy && config && !results && !userHasManuallyExpanded) {
      setExpandedAccordion('run-results')
    }
  }, [data, strategy, config, results, userHasManuallyExpanded])

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
                { id: 'configure-backtest', label: 'Configure', completed: !!config },
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
                <StrategySelector
                  onStrategySelected={handleStrategySelected}
                  initialCustomStrategyId={initialCustomStrategyId}
                  initialParams={initialParams}
                />
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

            {/* Step 4: Run & Results */}
            <Accordion
              expanded={expandedAccordion === 'run-results'}
              onChange={(event, isExpanded) => {
                setExpandedAccordion(isExpanded ? 'run-results' : '')
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
                  4. Run & Results
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
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
        </Grid>
      </Grid>
    </Container>
  )
}
