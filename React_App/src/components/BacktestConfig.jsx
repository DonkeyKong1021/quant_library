import { useState } from 'react'
import {
  TextField,
  Box,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Button,
  InputAdornment,
} from '@mui/material'
export default function BacktestConfig({ onConfigChanged }) {
  const [initialCapital, setInitialCapital] = useState(100000)
  const [commission, setCommission] = useState(1.0)
  const [slippage, setSlippage] = useState(0.0)
  const [commissionType, setCommissionType] = useState('fixed')
  const [useBenchmark, setUseBenchmark] = useState(true)
  const [benchmarkSymbol, setBenchmarkSymbol] = useState('SPY')
  const [defaultOrderType, setDefaultOrderType] = useState('MARKET')

  const handleConfig = () => {
    if (onConfigChanged) {
      onConfigChanged({
        initial_capital: initialCapital,
        commission: commission,
        slippage: slippage,
        commission_type: commissionType,
        use_benchmark: useBenchmark,
        benchmark_symbol: benchmarkSymbol,
        default_order_type: defaultOrderType,
      })
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Financial Parameters */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            label="Initial Capital"
            type="number"
            value={initialCapital}
            onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 0)}
            fullWidth
            size="small"
            inputProps={{ min: 1000, max: 10000000, step: 10000 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            helperText="Range: $1,000 - $10,000,000"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            label="Commission"
            type="number"
            value={commission}
            onChange={(e) => setCommission(parseFloat(e.target.value) || 0)}
            fullWidth
            size="small"
            inputProps={{ min: 0, max: 100, step: 0.1 }}
            InputProps={{
              startAdornment: commissionType === 'fixed' ? (
                <InputAdornment position="start">$</InputAdornment>
              ) : undefined,
              endAdornment: commissionType === 'percentage' ? (
                <InputAdornment position="end">%</InputAdornment>
              ) : undefined,
            }}
            helperText={commissionType === 'fixed' ? 'Range: $0 - $100' : 'Range: 0% - 100%'}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            label="Slippage"
            type="number"
            value={slippage * 100}
            onChange={(e) => setSlippage((parseFloat(e.target.value) || 0) / 100)}
            fullWidth
            size="small"
            inputProps={{ min: 0, max: 5, step: 0.1 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            helperText="Range: 0% - 5%"
          />
        </Grid>
      </Grid>

      {/* Order Configuration */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Commission Type</InputLabel>
            <Select
              value={commissionType}
              label="Commission Type"
              onChange={(e) => setCommissionType(e.target.value)}
              sx={{
                '& .MuiSelect-select': {
                  py: 1.5,
                },
              }}
            >
              <MenuItem value="fixed">Fixed ($ per trade)</MenuItem>
              <MenuItem value="percentage">Percentage (% of value)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Default Order Type</InputLabel>
            <Select
              value={defaultOrderType}
              label="Default Order Type"
              onChange={(e) => setDefaultOrderType(e.target.value)}
              sx={{
                '& .MuiSelect-select': {
                  py: 1.5,
                },
              }}
            >
              <MenuItem value="MARKET">Market Order</MenuItem>
              <MenuItem value="LIMIT">Limit Order</MenuItem>
              <MenuItem value="STOP">Stop Order</MenuItem>
              <MenuItem value="STOP_LIMIT">Stop-Limit Order</MenuItem>
              <MenuItem value="TRAILING_STOP">Trailing Stop Order</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Benchmark Configuration */}
      <Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={useBenchmark}
              onChange={(e) => setUseBenchmark(e.target.checked)}
            />
          }
          label="Enable Benchmark Comparison"
          sx={{ mb: useBenchmark ? 2 : 0 }}
        />
        {useBenchmark && (
          <TextField
            label="Benchmark Symbol"
            value={benchmarkSymbol}
            onChange={(e) => setBenchmarkSymbol(e.target.value.toUpperCase())}
            size="small"
            sx={{ maxWidth: 300 }}
            placeholder="SPY"
            helperText="Symbol for benchmark comparison (e.g., SPY, QQQ)"
          />
        )}
      </Box>

      {/* Config Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
        <Button
          variant="contained"
          onClick={handleConfig}
          size="medium"
          sx={{ 
            minWidth: 120,
            px: 3,
            py: 1,
            fontSize: '0.9375rem',
            fontWeight: 500,
          }}
        >
          Config
        </Button>
      </Box>
    </Box>
  )
}