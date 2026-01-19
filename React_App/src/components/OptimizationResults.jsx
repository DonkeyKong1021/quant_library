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
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'success.light', backgroundImage: 'none' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Optimization Complete
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Strategy: <strong>{results.strategy_name}</strong> | Symbol: <strong>{symbol}</strong> | 
              Total Runs: <strong>{results.total_runs}</strong> | Objective: <strong>{getMetricLabel(results.objective)}</strong>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {Object.keys(bestResult.parameters).map((paramName) => (
                <Chip
                  key={paramName}
                  label={`${paramName}: ${bestResult.parameters[paramName]}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleApplyBest}
                size="small"
              >
                Use Best Parameters
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Best Result Metrics */}
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {getMetricLabel(results.objective)}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatMetricValue(bestResult.objective_value, results.objective)}
              </Typography>
            </Box>
          </Grid>
          {bestResult.metrics && (
            <>
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Return
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatMetricValue(bestResult.metrics.total_return, 'total_return')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Sharpe Ratio
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatMetricValue(bestResult.metrics.sharpe_ratio, 'sharpe_ratio')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Max Drawdown
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
      <Paper sx={{ p: 3 }}>
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
    </Box>
  )
}
