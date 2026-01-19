import { useState, useEffect } from 'react'
import {
  Paper,
  TextField,
  Box,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { strategyService } from '../services/backtestService'

export default function OptimizationConfig({
  strategy,
  onConfigChanged,
}) {
  const [parameterRanges, setParameterRanges] = useState({})
  const [objective, setObjective] = useState('sharpe_ratio')
  const [optimizationType, setOptimizationType] = useState('grid')
  const [maxCombinations, setMaxCombinations] = useState(100)
  const [estimatedCombinations, setEstimatedCombinations] = useState(0)

  // Fetch strategy parameters definition
  const { data: strategyParams } = useQuery({
    queryKey: ['strategyParams', strategy?.type],
    queryFn: async () => {
      if (strategy?.type === 'custom') {
        return null // Custom strategies don't have parameter definitions
      }
      const response = await strategyService.getStrategyParams(strategy?.type)
      return response
    },
    enabled: !!strategy?.type && strategy.type !== 'custom',
  })

  // Initialize parameter ranges when strategy changes
  useEffect(() => {
    if (!strategyParams || !strategyParams.parameters) {
      setParameterRanges({})
      return
    }

    const ranges = {}
    Object.keys(strategyParams.parameters).forEach((paramName) => {
      const paramDef = strategyParams.parameters[paramName]
      const defaultValue = paramDef.default || 0
      ranges[paramName] = {
        min: paramDef.min !== undefined ? paramDef.min : (defaultValue - Math.abs(defaultValue * 0.5)),
        max: paramDef.max !== undefined ? paramDef.max : (defaultValue + Math.abs(defaultValue * 0.5)),
        step: paramDef.type === 'int' ? 1 : 0.1,
        type: paramDef.type || 'float',
      }
      // Ensure min < max
      if (ranges[paramName].min >= ranges[paramName].max) {
        ranges[paramName].max = ranges[paramName].min + (paramDef.type === 'int' ? 10 : 1.0)
      }
    })
    setParameterRanges(ranges)
  }, [strategyParams, strategy?.type])

  // Calculate estimated combinations
  useEffect(() => {
    if (Object.keys(parameterRanges).length === 0) {
      setEstimatedCombinations(0)
      return
    }

    let combinations = 1
    Object.values(parameterRanges).forEach((range) => {
      if (range.type === 'int') {
        const steps = Math.floor((range.max - range.min) / range.step) + 1
        combinations *= steps
      } else {
        const steps = Math.floor((range.max - range.min) / range.step) + 1
        combinations *= steps
      }
    })

    setEstimatedCombinations(combinations)
  }, [parameterRanges])

  // Notify parent when config changes
  useEffect(() => {
    if (onConfigChanged && Object.keys(parameterRanges).length > 0) {
      onConfigChanged({
        parameter_ranges: parameterRanges,
        objective,
        optimization_type: optimizationType,
        max_combinations: maxCombinations,
      })
    }
  }, [parameterRanges, objective, optimizationType, maxCombinations, onConfigChanged])

  const handleRangeChange = (paramName, field, value) => {
    setParameterRanges((prev) => ({
      ...prev,
      [paramName]: {
        ...prev[paramName],
        [field]: field === 'type' ? value : parseFloat(value) || 0,
      },
    }))
  }

  const objectives = [
    { value: 'sharpe_ratio', label: 'Sharpe Ratio' },
    { value: 'sortino_ratio', label: 'Sortino Ratio' },
    { value: 'total_return', label: 'Total Return' },
    { value: 'calmar_ratio', label: 'Calmar Ratio' },
    { value: 'information_ratio', label: 'Information Ratio' },
  ]

  if (!strategy || strategy.type === 'custom') {
    return (
      <Paper sx={{ p: 4 }}>
        <Alert severity="info">
          Parameter optimization is currently only available for built-in strategies.
          Custom strategies will be supported in a future update.
        </Alert>
      </Paper>
    )
  }

  if (!strategyParams || !strategyParams.parameters) {
    return (
      <Paper sx={{ p: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Loading strategy parameters...
        </Typography>
      </Paper>
    )
  }

  const paramNames = Object.keys(strategyParams.parameters)

  return (
    <Paper sx={{ p: 4, elevation: 1 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Optimization Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* Objective Selection */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Objective Metric</InputLabel>
            <Select
              value={objective}
              label="Objective Metric"
              onChange={(e) => setObjective(e.target.value)}
            >
              {objectives.map((obj) => (
                <MenuItem key={obj.value} value={obj.value}>
                  {obj.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Optimization Type */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Optimization Type</InputLabel>
            <Select
              value={optimizationType}
              label="Optimization Type"
              onChange={(e) => setOptimizationType(e.target.value)}
            >
              <MenuItem value="grid">Grid Search</MenuItem>
              <MenuItem value="minimize">Minimize (Continuous)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Max Combinations (for grid search) */}
        {optimizationType === 'grid' && (
          <Grid item xs={12} md={6}>
            <TextField
              label="Max Combinations"
              type="number"
              value={maxCombinations}
              onChange={(e) => setMaxCombinations(parseInt(e.target.value) || 100)}
              fullWidth
              inputProps={{ min: 1, max: 1000, step: 1 }}
              helperText="Maximum number of parameter combinations to test"
            />
          </Grid>
        )}

        {/* Estimated Combinations */}
        {optimizationType === 'grid' && estimatedCombinations > 0 && (
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 2,
                backgroundColor: estimatedCombinations > maxCombinations
                  ? 'error.light'
                  : estimatedCombinations > maxCombinations * 0.8
                  ? 'warning.light'
                  : 'success.light',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Estimated Combinations:
              </Typography>
              <Chip
                label={estimatedCombinations.toLocaleString()}
                color={estimatedCombinations > maxCombinations ? 'error' : 'default'}
                size="small"
              />
              {estimatedCombinations > maxCombinations && (
                <Typography variant="body2" color="error" sx={{ ml: 1 }}>
                  (Exceeds max - reduce ranges or increase max)
                </Typography>
              )}
            </Box>
          </Grid>
        )}

        {/* Parameter Ranges */}
        {paramNames.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Parameter Ranges
            </Typography>
            <Grid container spacing={2}>
              {paramNames.map((paramName) => {
                const paramDef = strategyParams.parameters[paramName]
                const range = parameterRanges[paramName] || {}
                const paramType = range.type || paramDef.type

                return (
                  <Grid item xs={12} sm={6} md={4} key={paramName}>
                    <Paper
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                        {paramDef.description || paramName}
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <TextField
                            label="Min"
                            type="number"
                            size="small"
                            value={range.min || ''}
                            onChange={(e) =>
                              handleRangeChange(paramName, 'min', e.target.value)
                            }
                            fullWidth
                            inputProps={{
                              step: paramType === 'int' ? 1 : 0.1,
                            }}
                            error={range.min !== undefined && range.max !== undefined && range.min >= range.max}
                            helperText={range.min !== undefined && range.max !== undefined && range.min >= range.max ? 'Min must be less than Max' : ''}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Max"
                            type="number"
                            size="small"
                            value={range.max || ''}
                            onChange={(e) =>
                              handleRangeChange(paramName, 'max', e.target.value)
                            }
                            fullWidth
                            inputProps={{
                              step: paramType === 'int' ? 1 : 0.1,
                            }}
                            error={range.min !== undefined && range.max !== undefined && range.min >= range.max}
                          />
                        </Grid>
                        {optimizationType === 'grid' && (
                          <Grid item xs={12}>
                            <TextField
                              label="Step"
                              type="number"
                              size="small"
                              value={range.step || ''}
                              onChange={(e) =>
                                handleRangeChange(paramName, 'step', e.target.value)
                              }
                              fullWidth
                              inputProps={{
                                min: paramType === 'int' ? 1 : 0.01,
                                step: paramType === 'int' ? 1 : 0.01,
                              }}
                              error={range.step !== undefined && range.step <= 0}
                              helperText={range.step !== undefined && range.step <= 0 
                                ? 'Step must be greater than 0'
                                : `Default: ${paramDef.default || 'N/A'}`}
                            />
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                )
              })}
            </Grid>
          </Grid>
        )}
      </Grid>
    </Paper>
  )
}
