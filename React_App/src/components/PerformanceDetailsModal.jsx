import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Grid,
  Divider,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useThemeMode } from '../contexts/ThemeContext'
import { CountUpSimple } from './common'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AssessmentIcon from '@mui/icons-material/Assessment'
import TimelineIcon from '@mui/icons-material/Timeline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'

export default function PerformanceDetailsModal({ open, onClose, performanceStats, backtestResults }) {
  const { isDark } = useThemeMode()

  if (!performanceStats) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: isDark
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Performance Details
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Overview Metrics
            </Typography>
            <Grid container spacing={2}>
              {[
                {
                  label: 'Total Backtests',
                  value: performanceStats.totalBacktests,
                  color: 'primary.main',
                  icon: AssessmentIcon,
                },
                {
                  label: 'Avg Return',
                  value: performanceStats.avgReturn * 100,
                  suffix: '%',
                  decimals: 2,
                  color: performanceStats.avgReturn >= 0 ? 'success.main' : 'error.main',
                  icon: TrendingUpIcon,
                  isPercentage: true,
                },
                {
                  label: 'Best Strategy',
                  value: performanceStats.bestStrategy,
                  color: 'secondary.main',
                  icon: TimelineIcon,
                  isText: true,
                  subtitle: `Sharpe: ${performanceStats.bestStrategySharpe.toFixed(2)}`,
                },
                {
                  label: 'Success Rate',
                  value: performanceStats.successRate,
                  suffix: '%',
                  decimals: 1,
                  color: 'success.main',
                  icon: CheckCircleIcon,
                },
                {
                  label: 'Total Trades',
                  value: performanceStats.totalTrades,
                  color: 'warning.main',
                  icon: SwapHorizIcon,
                },
              ].map((stat) => (
                <Grid item xs={6} key={stat.label}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                      <stat.icon sx={{ fontSize: 18, color: stat.color, opacity: 0.7 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {stat.label}
                      </Typography>
                    </Box>
                    {stat.isText ? (
                      <Box>
                        <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 600, color: stat.color }}>
                          {stat.value}
                        </Typography>
                        {stat.subtitle && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {stat.subtitle}
                          </Typography>
                        )}
                      </Box>
                    ) : stat.isPercentage ? (
                      <CountUpSimple
                        value={Math.abs(stat.value)}
                        prefix={stat.value >= 0 ? '+' : '-'}
                        suffix={stat.suffix || ''}
                        decimals={stat.decimals || 2}
                        variant="h6"
                        color={stat.color}
                        sx={{ fontSize: '1.125rem' }}
                      />
                    ) : (
                      <CountUpSimple
                        value={stat.value}
                        suffix={stat.suffix || ''}
                        decimals={stat.decimals || 0}
                        variant="h6"
                        color={stat.color}
                        sx={{ fontSize: '1.125rem' }}
                      />
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Additional Information
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Most Tested Symbol: <strong>{performanceStats.mostTestedSymbol}</strong>
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" color="text.secondary">
                These metrics are calculated from the last {backtestResults?.length || 0} backtest runs.
                For a complete analysis, visit the Backtest History page.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  )
}
