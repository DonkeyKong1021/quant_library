import { useState, useEffect, useRef } from 'react'
import {
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
  Button,
  Alert,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useQuery } from '@tanstack/react-query'
import { strategyService } from '../services/backtestService'
import { strategyStorage } from '../utils/strategyStorage'
import { useThemeMode } from '../contexts/ThemeContext'
export default function StrategySelector({ onStrategySelected, initialCustomStrategyId, initialParams }) {
  const { isDark } = useThemeMode()
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

  // Handle strategy selection when button is clicked
  const handleSelectStrategy = () => {
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
  }

  // Check if strategy selection is valid
  const isStrategyValid = () => {
    if (strategyType === 'custom') {
      return !!customStrategyId && savedStrategies.length > 0
    } else {
      // For non-custom strategies, need strategyParams to be loaded and params to be set
      return strategyType && strategyParams && Object.keys(params).length > 0
    }
  }

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Strategy Type Selection */}
      <Box>
        <FormControl fullWidth>
          <InputLabel>Strategy Type</InputLabel>
          <Select
            value={strategyType}
            label="Strategy Type"
            onChange={(e) => handleStrategyTypeChange(e.target.value)}
            sx={{
              '& .MuiSelect-select': {
                py: 1.5,
              },
            }}
          >
            {strategies.map((strategy) => (
              <MenuItem key={strategy.value} value={strategy.value}>
                {strategy.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {strategyType === 'custom' ? (
        <>
          <FormControl fullWidth>
            <InputLabel>Select Custom Strategy</InputLabel>
            <Select
              value={customStrategyId}
              label="Select Custom Strategy"
              onChange={(e) => setCustomStrategyId(e.target.value)}
              sx={{
                '& .MuiSelect-select': {
                  py: 1.5,
                },
              }}
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
          {customStrategyId && (
            <Alert 
              severity="info" 
              icon={<InfoOutlinedIcon />}
              sx={{
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
            >
              {(() => {
                const selected = savedStrategies.find((s) => s.id === customStrategyId)
                return selected ? (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {selected.name}
                    </Typography>
                    {selected.description && (
                      <Typography variant="body2" color="text.secondary">
                        {selected.description}
                      </Typography>
                    )}
                  </Box>
                ) : null
              })()}
            </Alert>
          )}
        </>
      ) : (
        <>
          {/* Strategy Description */}
          {strategyParams && strategyParams.description && (
            <Alert 
              severity="info" 
              icon={<InfoOutlinedIcon />}
              sx={{
                backgroundColor: isDark 
                  ? 'rgba(59, 130, 246, 0.08)' 
                  : 'rgba(59, 130, 246, 0.04)',
                border: '1px solid',
                borderColor: isDark 
                  ? 'rgba(59, 130, 246, 0.2)' 
                  : 'rgba(59, 130, 246, 0.12)',
                '& .MuiAlert-icon': {
                  color: 'primary.main',
                },
                '& .MuiAlert-message': {
                  width: '100%',
                  py: 0.5,
                },
              }}
            >
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {strategyParams.description}
              </Typography>
            </Alert>
          )}

          {/* Strategy Parameters */}
          {strategyParams && strategyParams.parameters && Object.keys(strategyParams.parameters).length > 0 && (
            <Accordion 
              defaultExpanded
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
                <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                  Strategy Parameters
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Grid container spacing={2}>
                  {Object.keys(strategyParams.parameters).map((paramName) => {
                    const paramDef = strategyParams.parameters[paramName]
                    return (
                      <Grid item xs={12} sm={6} key={paramName}>
                        <TextField
                          label={paramDef.description || paramName}
                          type="number"
                          value={params[paramName] ?? paramDef.default ?? ''}
                          onChange={(e) =>
                            handleParamChange(
                              paramName,
                              paramDef.type === 'float'
                                ? parseFloat(e.target.value) || 0
                                : parseInt(e.target.value) || 0
                            )
                          }
                          fullWidth
                          size="small"
                          inputProps={{
                            min: paramDef.min,
                            max: paramDef.max,
                            step: paramDef.type === 'float' ? 0.1 : 1,
                          }}
                          helperText={
                            paramDef.min !== undefined && paramDef.max !== undefined
                              ? `Range: ${paramDef.min} - ${paramDef.max}`
                              : paramDef.min !== undefined
                              ? `Min: ${paramDef.min}`
                              : paramDef.max !== undefined
                              ? `Max: ${paramDef.max}`
                              : undefined
                          }
                        />
                      </Grid>
                    )
                  })}
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}
        </>
      )}

      {/* Select Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
        <Button
          variant="contained"
          onClick={handleSelectStrategy}
          disabled={!isStrategyValid()}
          size="medium"
          sx={{ 
            minWidth: 140,
            px: 3,
            py: 1,
            fontSize: '0.9375rem',
            fontWeight: 500,
          }}
        >
          Select Strategy
        </Button>
      </Box>
    </Box>
  )
}