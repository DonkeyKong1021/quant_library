import { useState, useEffect, useMemo } from 'react'
import { Container, Typography, Box, Stepper, Step, StepLabel, Paper } from '@mui/material'
import { useLocation } from 'react-router-dom'
import DataFetcher from '../components/DataFetcher'
import StrategySelector from '../components/StrategySelector'
import BacktestConfig from '../components/BacktestConfig'
import ResultsDisplay from '../components/ResultsDisplay'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const steps = ['Fetch Data', 'Select Strategy', 'Configure Backtest', 'Run & View Results']

export default function Backtest() {
  const location = useLocation()
  const [data, setData] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const [strategy, setStrategy] = useState(null)
  const [config, setConfig] = useState(null)
  const [results, setResults] = useState(null)
  const [activeStep, setActiveStep] = useState(0)
  const [initialCustomStrategyId, setInitialCustomStrategyId] = useState(null)

  // Check for custom strategy from navigation state
  useEffect(() => {
    if (location.state?.customStrategyId) {
      const customStrategyId = location.state.customStrategyId
      setInitialCustomStrategyId(customStrategyId)
      // Clear the state to avoid re-applying on re-renders
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleDataFetched = (fetchedData, symbol) => {
    setData(fetchedData)
    setSelectedSymbol(symbol)
    setActiveStep(1)
    setResults(null)
  }

  const handleStrategySelected = (selectedStrategy) => {
    setStrategy(selectedStrategy)
    if (data) setActiveStep(2)
    setResults(null)
  }

  const handleConfigChanged = (backtestConfig) => {
    setConfig(backtestConfig)
    if (strategy) setActiveStep(3)
  }

  const handleBacktestComplete = (backtestResults) => {
    setResults(backtestResults)
  }

  // Determine active step based on state
  const currentStep = data ? (strategy ? (config ? 3 : 2) : 1) : 0

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

      {/* Progress Stepper */}
      <Paper sx={{ p: 4, mb: 4, elevation: 1 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                StepIconComponent={
                  index < currentStep
                    ? () => (
                        <CheckCircleIcon
                          sx={{
                            color: 'success.main',
                            fontSize: 24,
                          }}
                        />
                      )
                    : undefined
                }
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Box sx={{ mb: 4 }}>
        <DataFetcher onDataFetched={handleDataFetched} />
      </Box>

      {data && (
        <>
          <Box sx={{ mb: 4 }}>
            <StrategySelector 
              onStrategySelected={handleStrategySelected} 
              initialCustomStrategyId={initialCustomStrategyId}
            />
          </Box>

          {strategy && (
            <Box sx={{ mb: 4 }}>
              <BacktestConfig onConfigChanged={handleConfigChanged} />
            </Box>
          )}

          {strategy && config && (
            <Box sx={{ mb: 4 }}>
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
    </Container>
  )
}