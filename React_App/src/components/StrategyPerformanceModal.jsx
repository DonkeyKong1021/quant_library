import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import BarChartIcon from '@mui/icons-material/BarChart'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import { useThemeMode } from '../contexts/ThemeContext'
import Plot from 'react-plotly.js'
import { getChartLayout, getChartConfig } from '../theme/chartTheme'

export default function StrategyPerformanceModal({ 
  open, 
  onClose, 
  strategyStats,
  symbolStats,
  strategyPerformanceData 
}) {
  const { isDark, mode } = useThemeMode()

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BarChartIcon sx={{ fontSize: 24, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Strategy & Usage Analytics
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Strategy Usage */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Strategy Usage
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {Object.keys(strategyStats || {}).length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {Object.entries(strategyStats || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([strategy, count]) => (
                      <Box key={strategy} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ flex: 1, fontSize: '0.875rem' }}>
                          {strategy}
                        </Typography>
                        <Chip
                          label={count}
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 600, minWidth: 50 }}
                        />
                      </Box>
                    ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  No strategy data available
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Symbol Coverage */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Most Tested Symbols
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {Object.keys(symbolStats || {}).length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {Object.entries(symbolStats || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([symbol, count]) => (
                      <Box key={symbol} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>
                          {symbol}
                        </Typography>
                        <Chip
                          label={count}
                          size="small"
                          color="secondary"
                          sx={{ fontWeight: 600, minWidth: 50 }}
                        />
                      </Box>
                    ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  No symbol data available
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Performance Chart */}
          {strategyPerformanceData && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Strategy Performance Comparison
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ height: 400 }}>
                  <Plot
                    data={[
                      {
                        x: strategyPerformanceData.strategies,
                        y: strategyPerformanceData.sharpeRatios,
                        type: 'bar',
                        marker: {
                          color: strategyPerformanceData.sharpeRatios.map(sharpe =>
                            sharpe >= 1 ? (isDark ? '#34d399' : '#10b981') : sharpe >= 0 ? (isDark ? '#fbbf24' : '#f59e0b') : (isDark ? '#f87171' : '#ef4444')
                          ),
                        },
                        text: strategyPerformanceData.sharpeRatios.map((sharpe, i) => 
                          `Avg: ${sharpe.toFixed(2)}<br>Tests: ${strategyPerformanceData.counts[i]}`
                        ),
                        textposition: 'outside',
                        hovertemplate: '<b>%{x}</b><br>Avg Sharpe Ratio: %{y:.2f}<br>Backtests: %{customdata}<extra></extra>',
                        customdata: strategyPerformanceData.counts,
                      },
                    ]}
                    layout={getChartLayout(mode || (isDark ? 'dark' : 'light'), {
                      title: 'Average Sharpe Ratio by Strategy',
                      xAxisTitle: 'Strategy',
                      yAxisTitle: 'Average Sharpe Ratio',
                      height: 400,
                    })}
                    config={getChartConfig()}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler={true}
                  />
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
