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
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material'

export default function BacktestConfig({ onConfigChanged }) {
  const [initialCapital, setInitialCapital] = useState(100000)
  const [commission, setCommission] = useState(1.0)
  const [slippage, setSlippage] = useState(0.0)
  const [commissionType, setCommissionType] = useState('fixed')
  const [useBenchmark, setUseBenchmark] = useState(true)
  const [benchmarkSymbol, setBenchmarkSymbol] = useState('SPY')

  useEffect(() => {
    if (onConfigChanged) {
      onConfigChanged({
        initial_capital: initialCapital,
        commission: commission,
        slippage: slippage,
        commission_type: commissionType,
        use_benchmark: useBenchmark,
        benchmark_symbol: benchmarkSymbol,
      })
    }
  }, [initialCapital, commission, slippage, commissionType, useBenchmark, benchmarkSymbol])

  return (
    <Paper sx={{ p: 4, elevation: 1 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Backtest Configuration
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Initial Capital"
            type="number"
            value={initialCapital}
            onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 0)}
            fullWidth
            inputProps={{ min: 1000, max: 10000000, step: 10000 }}
            InputProps={{
              startAdornment: '$',
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            label="Commission"
            type="number"
            value={commission}
            onChange={(e) => setCommission(parseFloat(e.target.value) || 0)}
            fullWidth
            inputProps={{ min: 0, max: 100, step: 0.1 }}
            InputProps={{
              startAdornment: commissionType === 'fixed' ? '$' : undefined,
              endAdornment: commissionType === 'percentage' ? '%' : undefined,
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            label="Slippage"
            type="number"
            value={slippage * 100}
            onChange={(e) => setSlippage((parseFloat(e.target.value) || 0) / 100)}
            fullWidth
            inputProps={{ min: 0, max: 5, step: 0.1 }}
            InputProps={{
              endAdornment: '%',
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Commission Type</InputLabel>
            <Select
              value={commissionType}
              label="Commission Type"
              onChange={(e) => setCommissionType(e.target.value)}
            >
              <MenuItem value="fixed">Fixed ($ per trade)</MenuItem>
              <MenuItem value="percentage">Percentage (% of value)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={useBenchmark}
                onChange={(e) => setUseBenchmark(e.target.checked)}
              />
            }
            label="Enable Benchmark Comparison"
          />
          {useBenchmark && (
            <TextField
              label="Benchmark Symbol"
              value={benchmarkSymbol}
              onChange={(e) => setBenchmarkSymbol(e.target.value.toUpperCase())}
              fullWidth
              sx={{ mt: 2, maxWidth: 300 }}
              placeholder="SPY"
            />
          )}
        </Grid>
      </Grid>
    </Paper>
  )
}