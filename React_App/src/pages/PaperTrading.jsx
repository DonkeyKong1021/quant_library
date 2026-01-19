import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import { paperTradingService } from '../services/paperTradingService'
import { useNotifications } from '../hooks/useNotifications.jsx'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

export default function PaperTrading() {
  const { showSuccess, showError, NotificationComponent } = useNotifications()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [newSessionConfig, setNewSessionConfig] = useState({
    symbols: ['AAPL'],
    initial_capital: 100000,
    strategy: { type: 'moving_average', params: {} },
  })

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const response = await paperTradingService.listSessions()
      setSessions(response.sessions || [])
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const handleStartSession = async () => {
    setLoading(true)
    try {
      const result = await paperTradingService.startSession(newSessionConfig)
      showSuccess('Paper trading session started successfully')
      await loadSessions()
    } catch (error) {
      showError('Failed to start paper trading session: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleStopSession = async (sessionId) => {
    try {
      await paperTradingService.stopSession(sessionId)
      showSuccess('Paper trading session stopped')
      await loadSessions()
    } catch (error) {
      showError('Failed to stop session: ' + (error.response?.data?.detail || error.message))
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <NotificationComponent />
      
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Paper Trading
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        Paper trading allows you to test your strategies with simulated real-time data without risking real money.
        This is a stub implementation - full paper trading functionality is available in the backend.
      </Alert>

      {/* Start New Session */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Start New Paper Trading Session
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Symbols (comma-separated)"
              value={newSessionConfig.symbols.join(', ')}
              onChange={(e) => setNewSessionConfig({
                ...newSessionConfig,
                symbols: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              fullWidth
              placeholder="AAPL, MSFT, GOOGL"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Initial Capital"
              type="number"
              value={newSessionConfig.initial_capital}
              onChange={(e) => setNewSessionConfig({
                ...newSessionConfig,
                initial_capital: parseFloat(e.target.value) || 100000
              })}
              fullWidth
              InputProps={{ startAdornment: '$' }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartSession}
              disabled={loading}
              fullWidth
              sx={{ height: '56px' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Start Session'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Active Sessions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Active Sessions
        </Typography>
        
        {sessions.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No active paper trading sessions. Start a new session to begin.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Session ID</TableCell>
                  <TableCell>Symbols</TableCell>
                  <TableCell>Capital</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.session_id}>
                    <TableCell>{session.session_id.substring(0, 8)}...</TableCell>
                    <TableCell>{session.symbols?.join(', ') || 'N/A'}</TableCell>
                    <TableCell>${session.initial_capital?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={session.status}
                        color={session.status === 'running' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {session.status === 'running' && (
                        <Button
                          size="small"
                          startIcon={<StopIcon />}
                          onClick={() => handleStopSession(session.session_id)}
                          color="error"
                        >
                          Stop
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  )
}
