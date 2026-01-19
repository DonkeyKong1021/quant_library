import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from '@mui/material'
import Plotly from 'react-plotly.js'
import { backtestService } from '../services/backtestService'

// Import plotly.js for type definitions
import 'plotly.js'

export default function StrategyComparison({ resultIds = [], onClose }) {
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedMetrics, setSelectedMetrics] = useState([
    'total_return',
    'sharpe_ratio',
    'max_drawdown_pct',
    'calmar_ratio',
  ])

  useEffect(() => {
    if (resultIds.length >= 2) {
      fetchComparison()
    }
  }, [resultIds.join(',')])

  const fetchComparison = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await backtestService.compareBacktests(resultIds)
      setComparison(response)
    } catch (err) {
      console.error('Error fetching comparison:', err)
      setError(err.message || 'Failed to load comparison')
    } finally {
      setLoading(false)
    }
  }

  const formatMetric = (value, metricName) => {
    if (value === null || value === undefined) return '—'
    
    if (metricName.includes('pct') || metricName.includes('return')) {
      return `${(value * 100).toFixed(2)}%`
    } else if (typeof value === 'number') {
      return value.toFixed(2)
    }
    return value
  }

  const getMetricLabel = (metricName) => {
    const labels = {
      total_return: 'Total Return',
      sharpe_ratio: 'Sharpe Ratio',
      sortino_ratio: 'Sortino Ratio',
      max_drawdown: 'Max Drawdown',
      max_drawdown_pct: 'Max Drawdown %',
      calmar_ratio: 'Calmar Ratio',
      num_trades: 'Number of Trades',
      final_equity: 'Final Equity',
    }
    return labels[metricName] || metricName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const renderEquityCurveChart = () => {
    if (!comparison || !comparison.equity_curves) return null

    const traces = comparison.result_ids.map((resultId, index) => {
      const equityCurve = comparison.equity_curves[resultId] || []
      
      if (equityCurve.length === 0) return null

      const x = equityCurve.map((point) => point.timestamp || point.date || point.x)
      const y = equityCurve.map((point) => point.equity || point.y || point.value)

      return {
        x,
        y,
        type: 'scatter',
        mode: 'lines',
        name: `Result ${resultId.slice(0, 8)}...`,
        line: {
          width: 2,
        },
      }
    }).filter(Boolean)

    if (traces.length === 0) return null

    return (
      <Box sx={{ height: 400, width: '100%' }}>
        <Plotly
          data={traces}
          layout={{
            title: 'Equity Curves Comparison',
            xaxis: { title: 'Date' },
            yaxis: { title: 'Equity ($)' },
            hovermode: 'closest',
            showlegend: true,
            margin: { l: 60, r: 20, t: 60, b: 60 },
          }}
          config={{
            responsive: true,
            doubleClick: 'reset+autosize',
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
            toImageButtonOptions: {
              format: 'png',
              width: 1200,
              height: 600,
              scale: 2,
            },
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>
    )
  }

  if (loading) {
    return (
      <Paper sx={{ p: 4, elevation: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      </Paper>
    )
  }

  if (error) {
    return (
      <Paper sx={{ p: 4, elevation: 1 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    )
  }

  if (!comparison) {
    return (
      <Paper sx={{ p: 4, elevation: 1 }}>
        <Typography variant="body1" color="text.secondary">
          Select at least 2 backtest results to compare
        </Typography>
      </Paper>
    )
  }

  const filteredComparisons = comparison.comparisons.filter((c) =>
    selectedMetrics.includes(c.metric_name)
  )

  return (
    <Box>
      {/* Metric Selection */}
      <Paper sx={{ p: 3, mb: 3, elevation: 1 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Metrics to Display</InputLabel>
          <Select
            multiple
            value={selectedMetrics}
            onChange={(e) => setSelectedMetrics(e.target.value)}
            renderValue={(selected) => selected.map((m) => getMetricLabel(m)).join(', ')}
            label="Metrics to Display"
          >
            {comparison.comparisons.map((comp) => (
              <MenuItem key={comp.metric_name} value={comp.metric_name}>
                <Checkbox checked={selectedMetrics.includes(comp.metric_name)} />
                <ListItemText primary={getMetricLabel(comp.metric_name)} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Comparison Table */}
      <Paper sx={{ p: 4, mb: 3, elevation: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Performance Metrics Comparison
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Metric</TableCell>
                {comparison.result_ids.map((resultId) => (
                  <TableCell key={resultId} align="right" sx={{ fontWeight: 600 }}>
                    <Chip label={resultId.slice(0, 8)} size="small" />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredComparisons.map((comp) => (
                <TableRow key={comp.metric_name}>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {getMetricLabel(comp.metric_name)}
                  </TableCell>
                  {comparison.result_ids.map((resultId) => {
                    const value = comp.values[resultId]
                    const isBest = comp.best === resultId
                    const isWorst = comp.worst === resultId
                    
                    return (
                      <TableCell
                        key={resultId}
                        align="right"
                        sx={{
                          fontWeight: isBest || isWorst ? 600 : 400,
                          color: isBest ? 'success.main' : isWorst ? 'error.main' : 'text.primary',
                          bgcolor: isBest ? 'rgba(16, 185, 129, 0.1)' : isWorst ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                        }}
                      >
                        {formatMetric(value, comp.metric_name)}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Equity Curves Chart */}
      <Paper sx={{ p: 4, elevation: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Equity Curves Comparison
        </Typography>
        {renderEquityCurveChart()}
      </Paper>
    </Box>
  )
}
