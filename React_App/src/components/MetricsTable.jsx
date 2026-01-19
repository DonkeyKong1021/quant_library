import { Paper, Grid, Typography, Box, Divider } from '@mui/material'
import { memo, useMemo } from 'react'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AssessmentIcon from '@mui/icons-material/Assessment'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'

const MetricsTable = memo(function MetricsTable({ results }) {
  if (!results || !results.metrics) {
    return null
  }

  const metrics = results.metrics

  const metricCards = [
    {
      label: 'Total Return',
      value: `${(metrics.total_return * 100).toFixed(2)}%`,
      icon: <TrendingUpIcon />,
      color: metrics.total_return >= 0 ? 'success.main' : 'error.main',
    },
    {
      label: 'Sharpe Ratio',
      value: metrics.sharpe_ratio?.toFixed(2) || '—',
      icon: <AssessmentIcon />,
      color: 'primary.main',
    },
    {
      label: 'Max Drawdown',
      value: metrics.max_drawdown_pct
        ? `${metrics.max_drawdown_pct.toFixed(2)}%`
        : '—',
      icon: <ShowChartIcon />,
      color: 'error.main',
    },
    {
      label: 'Total Trades',
      value: metrics.num_trades || 0,
      icon: <SwapHorizIcon />,
      color: 'text.primary',
    },
  ]

  const additionalMetrics = [
    {
      label: 'Sortino Ratio',
      value: metrics.sortino_ratio?.toFixed(2) || '—',
    },
    {
      label: 'Calmar Ratio',
      value: metrics.calmar_ratio?.toFixed(2) || '—',
    },
    {
      label: 'Annualized Volatility',
      value: metrics.annualized_volatility 
        ? `${(metrics.annualized_volatility * 100).toFixed(2)}%`
        : '—',
    },
    {
      label: 'Omega Ratio',
      value: metrics.omega_ratio?.toFixed(2) || '—',
    },
    {
      label: 'Initial Capital',
      value: `$${metrics.initial_capital?.toLocaleString() || '—'}`,
    },
    {
      label: 'Final Equity',
      value: `$${metrics.final_equity?.toLocaleString() || '—'}`,
    },
  ]

  // Risk metrics (from drawdown category)
  const riskMetrics = [
    {
      label: 'Ulcer Index',
      value: metrics.drawdown_ulcer_index?.toFixed(4) || '—',
    },
    {
      label: 'Avg Drawdown Duration',
      value: metrics.drawdown_average_drawdown_duration
        ? `${metrics.drawdown_average_drawdown_duration.toFixed(1)} periods`
        : '—',
    },
    {
      label: 'Tail Ratio',
      value: metrics.tail_ratio?.toFixed(4) || '—',
    },
  ]

  // Value at Risk metrics
  const varMetrics = [
    {
      label: 'Historical VaR (95%)',
      value: metrics.var_historical_var
        ? `${(metrics.var_historical_var * 100).toFixed(4)}%`
        : '—',
    },
    {
      label: 'Parametric VaR (95%)',
      value: metrics.var_parametric_var
        ? `${(metrics.var_parametric_var * 100).toFixed(4)}%`
        : '—',
    },
    {
      label: 'CVaR (Expected Shortfall)',
      value: metrics.var_cvar
        ? `${(metrics.var_cvar * 100).toFixed(4)}%`
        : '—',
    },
  ]

  // Distribution metrics
  const distributionMetrics = [
    {
      label: 'Skewness',
      value: metrics.distribution_skewness?.toFixed(4) || '—',
    },
    {
      label: 'Kurtosis',
      value: metrics.distribution_kurtosis?.toFixed(4) || '—',
    },
  ]

  // Trade statistics
  const tradeMetrics = [
    {
      label: 'Win Rate',
      value: metrics.trades_win_rate
        ? `${metrics.trades_win_rate.toFixed(2)}%`
        : '—',
    },
    {
      label: 'Profit Factor',
      value: metrics.trades_profit_factor?.toFixed(4) || '—',
    },
    {
      label: 'Avg Win',
      value: metrics.trades_avg_win
        ? `$${metrics.trades_avg_win.toFixed(2)}`
        : '—',
    },
    {
      label: 'Avg Loss',
      value: metrics.trades_avg_loss
        ? `$${metrics.trades_avg_loss.toFixed(2)}`
        : '—',
    },
  ]
  
  // Benchmark metrics
  const benchmarkMetrics = results.benchmark_metrics || {}
  const hasBenchmark = benchmarkMetrics && Object.keys(benchmarkMetrics).length > 0

  return (
    <Paper 
      sx={{ 
        p: 4, 
        mb: 3,
        elevation: 0,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.5) 100%)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 4, fontSize: '1.25rem', letterSpacing: '-0.01em' }}>
        Performance Metrics
      </Typography>

      <Grid container spacing={3}>
        {metricCards.map((metric, index) => (
          <Grid item xs={6} sm={6} md={3} key={index}>
            <Box
              sx={{
                p: 3,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.6) 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ color: metric.color, mr: 1 }}>{metric.icon}</Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {metric.label}
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: metric.color,
                }}
              >
                {metric.value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {additionalMetrics.some((m) => m.value !== '—') && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Additional Performance Metrics
          </Typography>
          <Grid container spacing={2}>
            {additionalMetrics.map((metric, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {metric.label}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {metric.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {riskMetrics.some((m) => m.value !== '—') && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Risk Metrics
          </Typography>
          <Grid container spacing={2}>
            {riskMetrics.map((metric, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {metric.label}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {metric.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {varMetrics.some((m) => m.value !== '—') && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Value at Risk (VaR) Metrics
          </Typography>
          <Grid container spacing={2}>
            {varMetrics.map((metric, index) => (
              <Grid item xs={6} sm={4} key={index}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {metric.label}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {metric.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {distributionMetrics.some((m) => m.value !== '—') && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Distribution Statistics
          </Typography>
          <Grid container spacing={2}>
            {distributionMetrics.map((metric, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {metric.label}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {metric.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {tradeMetrics.some((m) => m.value !== '—') && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Trade Statistics
          </Typography>
          <Grid container spacing={2}>
            {tradeMetrics.map((metric, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {metric.label}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {metric.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {hasBenchmark && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Benchmark Comparison (SPY)
          </Typography>
          <Grid container spacing={2}>
            {benchmarkMetrics.alpha !== null && benchmarkMetrics.alpha !== undefined && (
              <Grid item xs={6} sm={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Alpha
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 500,
                      color: benchmarkMetrics.alpha >= 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {benchmarkMetrics.alpha.toFixed(4)}
                  </Typography>
                </Box>
              </Grid>
            )}
            {benchmarkMetrics.beta !== null && benchmarkMetrics.beta !== undefined && (
              <Grid item xs={6} sm={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Beta
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {benchmarkMetrics.beta.toFixed(4)}
                  </Typography>
                </Box>
              </Grid>
            )}
            {benchmarkMetrics.information_ratio !== null && benchmarkMetrics.information_ratio !== undefined && (
              <Grid item xs={6} sm={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Information Ratio
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {benchmarkMetrics.information_ratio.toFixed(4)}
                  </Typography>
                </Box>
              </Grid>
            )}
            {benchmarkMetrics.total_return !== null && benchmarkMetrics.total_return !== undefined && (
              <Grid item xs={6} sm={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Benchmark Return
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 500,
                      color: benchmarkMetrics.total_return >= 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {benchmarkMetrics.total_return.toFixed(2)}%
                  </Typography>
                  {metrics.total_return !== null && metrics.total_return !== undefined && (
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          metrics.total_return - benchmarkMetrics.total_return >= 0
                            ? 'success.main'
                            : 'error.main',
                      }}
                    >
                      {metrics.total_return - benchmarkMetrics.total_return >= 0 ? '+' : ''}
                      {(metrics.total_return - benchmarkMetrics.total_return).toFixed(2)}% vs benchmark
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </>
      )}
      </Paper>
  )
})

export default MetricsTable