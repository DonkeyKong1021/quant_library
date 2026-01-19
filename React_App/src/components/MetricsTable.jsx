import { Paper, Grid, Typography, Box, Divider, Tooltip } from '@mui/material'
import { memo } from 'react'
import { motion } from 'framer-motion'
import { useThemeMode } from '../contexts/ThemeContext'
import { CountUpSimple } from './common/CountUp'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import AssessmentIcon from '@mui/icons-material/Assessment'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

const MetricCard = memo(function MetricCard({ label, value, icon, color, delay = 0, tooltip }) {
  const { isDark } = useThemeMode()
  
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Box
        sx={{
          p: 2.5,
          borderRadius: 2.5,
          background: isDark
            ? 'rgba(255, 255, 255, 0.03)'
            : 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'divider',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          '&:hover': {
            background: isDark
              ? 'rgba(255, 255, 255, 0.05)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.6) 100%)',
            transform: 'translateY(-2px)',
            boxShadow: isDark
              ? '0px 4px 12px rgba(0, 0, 0, 0.3)'
              : '0px 4px 12px rgba(0, 0, 0, 0.08)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ color, mr: 1, display: 'flex', alignItems: 'center' }}>{icon}</Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 500, fontSize: '0.75rem' }}
          >
            {label}
          </Typography>
          {tooltip && (
            <InfoOutlinedIcon
              sx={{ fontSize: 14, ml: 0.5, color: 'text.disabled', cursor: 'help' }}
            />
          )}
        </Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </Typography>
      </Box>
    </motion.div>
  )

  return tooltip ? <Tooltip title={tooltip} arrow placement="top">{content}</Tooltip> : content
})

const MetricRow = memo(function MetricRow({ label, value, color, delay = 0 }) {
  const { isDark } = useThemeMode()
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2 }}
    >
      <Box
        sx={{
          py: 1.5,
          px: 2,
          borderRadius: 1.5,
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          },
        }}
      >
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.8125rem' }}>
          {label}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: color || 'text.primary',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </Typography>
      </Box>
    </motion.div>
  )
})

const MetricsTable = memo(function MetricsTable({ results }) {
  const { isDark } = useThemeMode()
  
  if (!results || !results.metrics) {
    return null
  }

  const metrics = results.metrics
  const totalReturn = metrics.total_return * 100
  const isPositive = totalReturn >= 0

  const primaryMetrics = [
    {
      label: 'Total Return',
      value: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CountUpSimple
            value={Math.abs(totalReturn)}
            prefix={isPositive ? '+' : '-'}
            suffix="%"
            decimals={2}
            variant="h5"
            color={isPositive ? 'success.main' : 'error.main'}
          />
        </Box>
      ),
      icon: isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />,
      color: isPositive ? 'success.main' : 'error.main',
      tooltip: 'Total percentage return over the backtest period',
    },
    {
      label: 'Sharpe Ratio',
      value: metrics.sharpe_ratio?.toFixed(2) || '—',
      icon: <AssessmentIcon />,
      color: 'primary.main',
      tooltip: 'Risk-adjusted return (higher is better)',
    },
    {
      label: 'Max Drawdown',
      value: metrics.max_drawdown_pct ? `${metrics.max_drawdown_pct.toFixed(2)}%` : '—',
      icon: <ShowChartIcon />,
      color: 'error.main',
      tooltip: 'Maximum peak-to-trough decline',
    },
    {
      label: 'Total Trades',
      value: metrics.num_trades?.toString() || '0',
      icon: <SwapHorizIcon />,
      color: 'text.primary',
      tooltip: 'Total number of completed trades',
    },
  ]

  const additionalMetrics = [
    { label: 'Sortino Ratio', value: metrics.sortino_ratio?.toFixed(2) || '—' },
    { label: 'Calmar Ratio', value: metrics.calmar_ratio?.toFixed(2) || '—' },
    {
      label: 'Ann. Volatility',
      value: metrics.annualized_volatility ? `${(metrics.annualized_volatility * 100).toFixed(2)}%` : '—',
    },
    { label: 'Omega Ratio', value: metrics.omega_ratio?.toFixed(2) || '—' },
    { label: 'Initial Capital', value: `$${metrics.initial_capital?.toLocaleString() || '—'}` },
    { label: 'Final Equity', value: `$${metrics.final_equity?.toLocaleString() || '—'}` },
  ].filter((m) => m.value !== '—')

  const riskMetrics = [
    { label: 'Ulcer Index', value: metrics.drawdown_ulcer_index?.toFixed(4) || '—' },
    {
      label: 'Avg DD Duration',
      value: metrics.drawdown_average_drawdown_duration
        ? `${metrics.drawdown_average_drawdown_duration.toFixed(1)} periods`
        : '—',
    },
    { label: 'Tail Ratio', value: metrics.tail_ratio?.toFixed(4) || '—' },
  ].filter((m) => m.value !== '—')

  const varMetrics = [
    {
      label: 'Historical VaR (95%)',
      value: metrics.var_historical_var ? `${(metrics.var_historical_var * 100).toFixed(4)}%` : '—',
    },
    {
      label: 'Parametric VaR (95%)',
      value: metrics.var_parametric_var ? `${(metrics.var_parametric_var * 100).toFixed(4)}%` : '—',
    },
    {
      label: 'CVaR (ES)',
      value: metrics.var_cvar ? `${(metrics.var_cvar * 100).toFixed(4)}%` : '—',
    },
  ].filter((m) => m.value !== '—')

  const tradeMetrics = [
    {
      label: 'Win Rate',
      value: metrics.trades_win_rate ? `${metrics.trades_win_rate.toFixed(2)}%` : '—',
      color: metrics.trades_win_rate >= 50 ? 'success.main' : 'warning.main',
    },
    { label: 'Profit Factor', value: metrics.trades_profit_factor?.toFixed(4) || '—' },
    {
      label: 'Avg Win',
      value: metrics.trades_avg_win ? `$${metrics.trades_avg_win.toFixed(2)}` : '—',
      color: 'success.main',
    },
    {
      label: 'Avg Loss',
      value: metrics.trades_avg_loss ? `$${metrics.trades_avg_loss.toFixed(2)}` : '—',
      color: 'error.main',
    },
  ].filter((m) => m.value !== '—')

  const benchmarkMetrics = results.benchmark_metrics || {}
  const hasBenchmark = benchmarkMetrics && Object.keys(benchmarkMetrics).length > 0

  return (
    <Paper
      sx={{
        p: 4,
        mb: 3,
        elevation: 0,
        background: isDark
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.5) 100%)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: 700, mb: 3, fontSize: '1.25rem', letterSpacing: '-0.01em' }}
        >
          Performance Metrics
        </Typography>
      </motion.div>

      {/* Primary Metrics */}
      <Grid container spacing={2.5}>
        {primaryMetrics.map((metric, index) => (
          <Grid item xs={6} sm={6} md={3} key={metric.label}>
            <MetricCard
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
              color={metric.color}
              delay={0.1 + index * 0.05}
              tooltip={metric.tooltip}
            />
          </Grid>
        ))}
      </Grid>

      {/* Additional Metrics Sections */}
      {additionalMetrics.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Additional Performance
          </Typography>
          <Grid container spacing={1}>
            {additionalMetrics.map((metric, index) => (
              <Grid item xs={6} sm={3} key={metric.label}>
                <MetricRow label={metric.label} value={metric.value} delay={0.3 + index * 0.03} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {riskMetrics.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Risk Metrics
          </Typography>
          <Grid container spacing={1}>
            {riskMetrics.map((metric, index) => (
              <Grid item xs={6} sm={4} key={metric.label}>
                <MetricRow label={metric.label} value={metric.value} delay={0.4 + index * 0.03} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {varMetrics.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Value at Risk (VaR)
          </Typography>
          <Grid container spacing={1}>
            {varMetrics.map((metric, index) => (
              <Grid item xs={6} sm={4} key={metric.label}>
                <MetricRow label={metric.label} value={metric.value} delay={0.5 + index * 0.03} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {tradeMetrics.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Trade Statistics
          </Typography>
          <Grid container spacing={1}>
            {tradeMetrics.map((metric, index) => (
              <Grid item xs={6} sm={3} key={metric.label}>
                <MetricRow
                  label={metric.label}
                  value={metric.value}
                  color={metric.color}
                  delay={0.6 + index * 0.03}
                />
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
                <MetricRow
                  label="Alpha"
                  value={benchmarkMetrics.alpha.toFixed(4)}
                  color={benchmarkMetrics.alpha >= 0 ? 'success.main' : 'error.main'}
                  delay={0.7}
                />
              </Grid>
            )}
            {benchmarkMetrics.beta !== null && benchmarkMetrics.beta !== undefined && (
              <Grid item xs={6} sm={3}>
                <MetricRow label="Beta" value={benchmarkMetrics.beta.toFixed(4)} delay={0.73} />
              </Grid>
            )}
            {benchmarkMetrics.information_ratio !== null &&
              benchmarkMetrics.information_ratio !== undefined && (
                <Grid item xs={6} sm={3}>
                  <MetricRow
                    label="Info Ratio"
                    value={benchmarkMetrics.information_ratio.toFixed(4)}
                    delay={0.76}
                  />
                </Grid>
              )}
            {benchmarkMetrics.total_return !== null && benchmarkMetrics.total_return !== undefined && (
              <Grid item xs={6} sm={3}>
                <Box>
                  <MetricRow
                    label="Benchmark Return"
                    value={`${benchmarkMetrics.total_return.toFixed(2)}%`}
                    color={benchmarkMetrics.total_return >= 0 ? 'success.main' : 'error.main'}
                    delay={0.79}
                  />
                  {metrics.total_return !== null && metrics.total_return !== undefined && (
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          metrics.total_return * 100 - benchmarkMetrics.total_return >= 0
                            ? 'success.main'
                            : 'error.main',
                        px: 2,
                        fontWeight: 500,
                      }}
                    >
                      {metrics.total_return * 100 - benchmarkMetrics.total_return >= 0 ? '+' : ''}
                      {(metrics.total_return * 100 - benchmarkMetrics.total_return).toFixed(2)}% vs
                      benchmark
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
