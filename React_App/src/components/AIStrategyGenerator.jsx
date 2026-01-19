import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CloseIcon from '@mui/icons-material/Close'
import { strategyService } from '../services/backtestService'

export default function AIStrategyGenerator({ open, onClose, onStrategyGenerated }) {
  const [prompt, setPrompt] = useState('')
  const [strategyType, setStrategyType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.trim().length < 10) {
      setError('Please provide a more detailed description (at least 10 characters)')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await strategyService.generateStrategy(
        prompt.trim(),
        strategyType || null
      )

      if (response.error) {
        if (response.error === 'no_api_key') {
          setError({
            type: 'info',
            message: 'AI Strategy Generation requires an API key. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to your .env file.',
          })
        } else {
          setError({
            type: 'error',
            message: response.message || 'Failed to generate strategy',
          })
        }
      } else {
        if (onStrategyGenerated) {
          onStrategyGenerated({
            code: response.code,
            name: response.name,
            description: response.description,
          })
        }
        handleClose()
      }
    } catch (err) {
      setError({
        type: 'error',
        message: err.message || 'Failed to generate strategy',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPrompt('')
    setStrategyType('')
    setError(null)
    setLoading(false)
    onClose()
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              AI Strategy Generator
            </Typography>
            <Chip
              label="Beta"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Describe the trading strategy you want to create. The AI will generate Python code
            that follows the QuantLib framework conventions.
          </Typography>

          {error && (
            <Alert severity={error.type} sx={{ mb: 2 }}>
              {error.message}
            </Alert>
          )}

          <TextField
            label="Strategy Description"
            placeholder="e.g., Buy when RSI is below 30 and price is above 20-day moving average, sell when RSI is above 70"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            fullWidth
            multiline
            rows={4}
            disabled={loading}
            sx={{ mb: 2 }}
            helperText={`${prompt.length}/10 minimum characters`}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Strategy Type (Optional)</InputLabel>
            <Select
              value={strategyType}
              onChange={(e) => setStrategyType(e.target.value)}
              label="Strategy Type (Optional)"
              disabled={loading}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="momentum">Momentum</MenuItem>
              <MenuItem value="mean_reversion">Mean Reversion</MenuItem>
              <MenuItem value="trend_following">Trend Following</MenuItem>
              <MenuItem value="breakout">Breakout</MenuItem>
            </Select>
          </FormControl>

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Generating strategy code...
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          disabled={loading || !prompt.trim() || prompt.trim().length < 10}
        >
          Generate Strategy
        </Button>
      </DialogActions>
    </Dialog>
  )
}
