import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Grid,
  Alert,
  Divider,
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import HistoryIcon from '@mui/icons-material/History'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '../contexts/ThemeContext'
import OptimizationResultsTable from './OptimizationResultsTable'
import OptimizationHeatmap from './OptimizationHeatmap'
import OptimizationSensitivity from './OptimizationSensitivity'
import { formatMetricValue, getMetricLabel } from '../utils/optimizationUtils'

export default function OptimizationResults({
  results,
  strategy,
  config,
  data,
  symbol,
  onApplyParameters,
}) {
  const navigate = useNavigate()
  const { isDark } = useThemeMode()
  const [selectedResult, setSelectedResult] = useState(null)

  if (!results || !results.best_result) {
    return (
      <Alert severity="warning">No optimization results available.</Alert>
    )
  }

  const bestResult = results.best_result
  const allResults = results.all_results || []
  const paramNames = Object.keys(bestResult.parameters || {})

  const handleApplyBest = () => {
    if (onApplyParameters) {
      onApplyParameters(bestResult.parameters)
    }
  }

  const handleApplySelected = () => {
    if (selectedResult && onApplyParameters) {
      onApplyParameters(selectedResult.parameters)
    }
  }

  return (
    <Box>
      {/* Summary */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          border: '1px solid',
          borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.4)',
          backgroundColor: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.06)',
          backgroundImage: 'none',
          borderRadius: 2,
        }}
        elevation={0}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 22 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Optimization Complete
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Strategy: <strong>{results.strategy_name}</strong> | Symbol: <strong>{symbol}</strong> | 
              Total Runs: <strong>{results.total_runs}</strong> | Objective: <strong>{getMetricLabel(results.objective)}</strong>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.keys(bestResult.parameters).map((paramName) => (
                <Chip
                  key={paramName}
                  label={`${paramName}: ${bestResult.parameters[paramName]}`}
                  size="small"
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontWeight: 500,
                  }}
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleApplyBest}
                size="medium"
                sx={{ fontWeight: 500 }}
              >
                Use Best Parameters
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Best Result Metrics */}
        <Divider sx={{ my: 2.5, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {getMetricLabel(results.objective)}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {formatMetricValue(bestResult.objective_value, results.objective)}
              </Typography>
            </Box>
          </Grid>
          {bestResult.metrics && (
            <>
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Total Return
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatMetricValue(bestResult.metrics.total_return, 'total_return')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Sharpe Ratio
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatMetricValue(bestResult.metrics.sharpe_ratio, 'sharpe_ratio')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Max Drawdown
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatMetricValue(bestResult.metrics.max_drawdown_pct, 'max_drawdown_pct')}
                  </Typography>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {/* Visualizations */}
      {paramNames.length === 2 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Parameter Sensitivity Heatmap
          </Typography>
          <OptimizationHeatmap
            results={allResults}
            param1Name={paramNames[0]}
            param2Name={paramNames[1]}
            objective={results.objective}
          />
        </Paper>
      )}

      {paramNames.length >= 1 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Parameter Sensitivity Analysis
          </Typography>
          <OptimizationSensitivity
            results={allResults}
            parameters={paramNames}
            objective={results.objective}
            bestParameters={bestResult.parameters}
          />
        </Paper>
      )}

      {/* Results Table */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          All Results ({allResults.length})
        </Typography>
        <OptimizationResultsTable
          results={allResults}
          objective={results.objective}
          bestResultId={bestResult.result_id}
          onSelectResult={setSelectedResult}
          onApplyParameters={handleApplySelected}
        />
      </Paper>

      {/* Next Steps Navigation */}
      <Paper
        sx={{
          p: 2.5,
          borderRadius: 2,
          backgroundColor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Next Steps
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<AccountBalanceWalletIcon />}
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/paper-trading', {
              state: {
                strategy: strategy,
                symbol: symbol,
              }
            })}
            size="medium"
            sx={{ fontSize: '0.875rem', fontWeight: 500 }}
          >
            Start Paper Trading
          </Button>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/backtest-history')}
            size="medium"
            sx={{ fontSize: '0.875rem', fontWeight: 500 }}
          >
            View Backtest History
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
