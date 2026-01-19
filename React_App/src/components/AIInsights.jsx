import { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import CloseIcon from '@mui/icons-material/Close'
import { backtestService } from '../services/backtestService'
import { useThemeMode } from '../contexts/ThemeContext'

export default function AIInsights({ results, strategyName, symbol, open, onClose }) {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState(null)
  const [error, setError] = useState(null)
  const { isDark } = useThemeMode()

  const handleGenerateInsights = async () => {
    if (!results) return

    setLoading(true)
    setError(null)

    try {
      // Extract metrics from results
      const metrics = {
        total_return: results.metrics?.total_return || results.total_return || 0,
        sharpe_ratio: results.metrics?.sharpe_ratio || results.sharpe_ratio || 0,
        sortino_ratio: results.metrics?.sortino_ratio || results.sortino_ratio || 0,
        calmar_ratio: results.metrics?.calmar_ratio || results.calmar_ratio || 0,
        max_drawdown_pct: results.metrics?.max_drawdown_pct || results.max_drawdown_pct || 0,
        volatility: results.metrics?.volatility || results.volatility || 0,
        var_historical: results.metrics?.var_historical || results.var_historical || 0,
        cvar: results.metrics?.cvar || results.cvar || 0,
        skewness: results.metrics?.skewness || results.skewness || 0,
        kurtosis: results.metrics?.kurtosis || results.kurtosis || 0,
        initial_capital: results.metrics?.initial_capital || results.initial_capital || 0,
        final_equity: results.metrics?.final_equity || results.final_equity || 0,
      }

      // Extract trades summary if available
      let tradesSummary = null
      const numTrades = results.metrics?.num_trades || results.num_trades || 0
      if (numTrades > 0) {
        tradesSummary = {
          num_trades: numTrades,
          win_rate: results.metrics?.win_rate || results.win_rate || 0,
          profit_factor: results.metrics?.profit_factor || results.profit_factor || 0,
          avg_win: results.metrics?.avg_win || results.avg_win || 0,
          avg_loss: results.metrics?.avg_loss || results.avg_loss || 0,
        }
      }

      const response = await backtestService.generateInsights({
        metrics,
        strategyName: strategyName || 'Unknown Strategy',
        symbol: symbol || 'Unknown',
        tradesSummary,
      })

      if (response.error) {
        if (response.error === 'no_api_key') {
          setError({
            type: 'info',
            message: 'AI Insights requires an API key. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to your .env file.',
          })
        } else {
          setError({
            type: 'warning',
            message: response.message || 'Failed to generate insights',
          })
        }
      } else {
        setInsights(response)
      }
    } catch (err) {
      setError({
        type: 'error',
        message: err.message || 'Failed to generate insights',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!results) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            AI Insights
          </Typography>
          <Chip
            label="Beta"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          {!insights && !loading && !error && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Get AI-powered analysis of your backtest results, including performance
                interpretation, risk assessment, and improvement suggestions.
              </Typography>
              <Button
                variant="contained"
                onClick={handleGenerateInsights}
                startIcon={<AutoAwesomeIcon />}
                sx={{ fontWeight: 500 }}
              >
                Generate AI Insights
              </Button>
            </Box>
          )}

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Analyzing backtest results...
              </Typography>
            </Box>
          )}

          {error && (
            <Box>
              <Alert severity={error.type} sx={{ mb: 2 }}>
                {error.message}
              </Alert>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setError(null)
                  setInsights(null)
                }}
              >
                Try Again
              </Button>
            </Box>
          )}

          {insights && !error && (
            <Box>
              {/* Summary */}
              {insights.summary && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                    {insights.summary}
                  </Typography>
                </Box>
              )}

              {/* Strengths and Concerns side by side */}
              <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                {/* Strengths */}
                {insights.strengths?.length > 0 && (
                  <Box sx={{ flex: 1, minWidth: 250 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1, color: 'success.main' }}
                    >
                      Strengths
                    </Typography>
                    <List dense disablePadding>
                      {insights.strengths.map((strength, index) => (
                        <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircleOutlineIcon
                              fontSize="small"
                              sx={{ color: 'success.main' }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={strength}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Concerns */}
                {insights.concerns?.length > 0 && (
                  <Box sx={{ flex: 1, minWidth: 250 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1, color: 'warning.main' }}
                    >
                      Concerns
                    </Typography>
                    <List dense disablePadding>
                      {insights.concerns.map((concern, index) => (
                        <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <WarningAmberIcon fontSize="small" sx={{ color: 'warning.main' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={concern}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>

              {/* Suggestions */}
              {insights.suggestions?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Suggestions for Improvement
                  </Typography>
                  <List dense disablePadding>
                    {insights.suggestions.map((suggestion, index) => (
                      <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <LightbulbOutlinedIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={suggestion}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Regenerate button */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleGenerateInsights}
                  disabled={loading}
                >
                  Regenerate Insights
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
