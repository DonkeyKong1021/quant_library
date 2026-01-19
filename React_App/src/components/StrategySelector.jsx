import { useState, useEffect } from 'react'
import {
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Box,
  Typography,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useQuery } from '@tanstack/react-query'
import { strategyService } from '../services/backtestService'
import { strategyStorage } from '../utils/strategyStorage'
export default function StrategySelector({ onStrategySelected, initialCustomStrategyId, initialParams }) {
  const [strategyType, setStrategyType] = useState('moving_average')
  const [params, setParams] = useState(initialParams || {})
  const [customStrategyId, setCustomStrategyId] = useState('')
  const [savedStrategies, setSavedStrategies] = useState([])

  // Fetch strategy parameters definition
  const { data: strategyParams } = useQuery({
    queryKey: ['strategyParams', strategyType],
    queryFn: async () => {
      const response = await strategyService.getStrategyParams(strategyType)
      return response
    },
    enabled: !!strategyType,
  })

  // Load saved custom strategies
  useEffect(() => {
    const strategies = strategyStorage.getAll()
    setSavedStrategies(strategies)
  }, [])

  // Handle initial custom strategy selection
  useEffect(() => {
    if (initialCustomStrategyId && savedStrategies.length > 0) {
      const strategy = savedStrategies.find((s) => s.id === initialCustomStrategyId)
      if (strategy) {
        setStrategyType('custom')
        setCustomStrategyId(initialCustomStrategyId)
      }
    }
  }, [initialCustomStrategyId, savedStrategies])

  // Initialize default parameters
  useEffect(() => {
    if (strategyType !== 'custom' && strategyParams && strategyParams.parameters) {
      // Use initialParams if provided, otherwise use defaults
      const defaults = initialParams || {}
      Object.keys(strategyParams.parameters).forEach((key) => {
        if (!(key in defaults)) {
          defaults[key] = strategyParams.parameters[key].default
        }
      })
      setParams(defaults)
    }
  }, [strategyParams, strategyType, initialParams])

  // Notify parent when strategy changes
  useEffect(() => {
    if (!onStrategySelected) return

    if (strategyType === 'custom') {
      if (customStrategyId) {
        const selectedStrategy = savedStrategies.find((s) => s.id === customStrategyId)
        if (selectedStrategy) {
          onStrategySelected({
            type: 'custom',
            code: selectedStrategy.code,
          })
        }
      }
    } else if (strategyType && Object.keys(params).length > 0) {
      onStrategySelected({
        type: strategyType,
        params: params,
      })
    }
  }, [strategyType, params, customStrategyId, savedStrategies, onStrategySelected])

  const handleParamChange = (paramName, value) => {
    setParams((prev) => ({
      ...prev,
      [paramName]: value,
    }))
  }

  const handleStrategyTypeChange = (newType) => {
    setStrategyType(newType)
    if (newType !== 'custom') {
      setCustomStrategyId('')
    } else {
      setParams({})
    }
  }

  const strategies = [
    { value: 'moving_average', label: 'Moving Average Crossover' },
    { value: 'rsi', label: 'RSI Momentum' },
    { value: 'bollinger_bands', label: 'Bollinger Bands Mean Reversion' },
    { value: 'macd', label: 'MACD Crossover' },
    { value: 'custom', label: 'Custom Strategy' },
  ]

  return (
    <Paper sx={{ p: 4, elevation: 1 }}>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Strategy Type</InputLabel>
            <Select
              value={strategyType}
              label="Strategy Type"
              onChange={(e) => handleStrategyTypeChange(e.target.value)}
            >
              {strategies.map((strategy) => (
                <MenuItem key={strategy.value} value={strategy.value}>
                  {strategy.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {strategyType === 'custom' ? (
          <>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Custom Strategy</InputLabel>
                <Select
                  value={customStrategyId}
                  label="Select Custom Strategy"
                  onChange={(e) => setCustomStrategyId(e.target.value)}
                >
                  {savedStrategies.length === 0 ? (
                    <MenuItem disabled value="">
                      No custom strategies saved
                    </MenuItem>
                  ) : (
                    savedStrategies.map((strategy) => (
                      <MenuItem key={strategy.id} value={strategy.id}>
                        {strategy.name || 'Unnamed Strategy'}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            {customStrategyId && (
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'action.hover',
                    borderRadius: 2,
                    height: '100%',
                  }}
                >
                  {(() => {
                    const selected = savedStrategies.find((s) => s.id === customStrategyId)
                    return selected ? (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {selected.name}
                        </Typography>
                        {selected.description && (
                          <Typography variant="body2" color="text.secondary">
                            {selected.description}
                          </Typography>
                        )}
                      </>
                    ) : null
                  })()}
                </Box>
              </Grid>
            )}
          </>
        ) : (
          <>
            {strategyParams && strategyParams.description && (
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 2.5,
                    backgroundColor: 'action.hover',
                    borderRadius: 2.5,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {strategyParams.description}
                  </Typography>
                </Box>
              </Grid>
            )}

            {strategyParams && (
              <Grid item xs={12}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Strategy Parameters
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {Object.keys(strategyParams.parameters || {}).map((paramName) => {
                        const paramDef = strategyParams.parameters[paramName]
                        return (
                          <Grid item xs={12} sm={6} md={4} key={paramName}>
                            <TextField
                              label={paramDef.description || paramName}
                              type={paramDef.type === 'float' ? 'number' : 'number'}
                              value={params[paramName] || paramDef.default}
                              onChange={(e) =>
                                handleParamChange(
                                  paramName,
                                  paramDef.type === 'float'
                                    ? parseFloat(e.target.value) || 0
                                    : parseInt(e.target.value) || 0
                                )
                              }
                              fullWidth
                              inputProps={{
                                min: paramDef.min,
                                max: paramDef.max,
                                step: paramDef.type === 'float' ? 0.1 : 1,
                              }}
                            />
                          </Grid>
                        )
                      })}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            )}
          </>
        )}
      </Grid>
    </Paper>
  )
}