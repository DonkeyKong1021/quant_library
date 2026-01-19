import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Button,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material'
import StopIcon from '@mui/icons-material/Stop'
import { workflowService } from '../services/backtestService'
import { estimateWorkflowTime, formatTimeRemaining } from '../utils/timeEstimator'

export default function WorkflowStatus({
  workflowId,
  onCompleted,
  onError,
  maxIterations,
}) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startTime, setStartTime] = useState(Date.now())
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null)

  // Initialize start time
  useEffect(() => {
    if (workflowId) {
      setStartTime(Date.now())
    }
  }, [workflowId])

  // Poll for status updates
  useEffect(() => {
    if (!workflowId) return

    const fetchStatus = async () => {
      try {
        const updatedStatus = await workflowService.getWorkflowStatus(workflowId)
        setStatus(updatedStatus)
        setLoading(false)

        // Calculate estimated time remaining for workflows
        if (updatedStatus.status === 'running' && maxIterations && updatedStatus.total_backtests) {
          const elapsedSeconds = (Date.now() - startTime) / 1000
          const estimated = estimateWorkflowTime(maxIterations, updatedStatus.total_backtests, elapsedSeconds)
          setEstimatedTimeRemaining(estimated)
        } else if (updatedStatus.status === 'completed') {
          setEstimatedTimeRemaining(0)
        }

        // Handle completion
        if (updatedStatus.status === 'completed') {
          if (onCompleted) {
            // Transform workflow results to match OptimizationResults format
            const transformedResults = {
              best_result: {
                parameters: updatedStatus.best_result?.parameters || {},
                metrics: updatedStatus.best_result?.metrics || {},
                objective_value: updatedStatus.best_result?.objective_value || 0,
                result_id: workflowId,
              },
              all_results: updatedStatus.top_results?.map((r, idx) => ({
                parameters: r.parameters || {},
                metrics: r.metrics || {},
                objective_value: r.objective_value || 0,
                result_id: `${workflowId}-${idx}`,
              })) || [],
              total_runs: updatedStatus.total_backtests || 0,
              optimization_type: 'workflow',
              objective: 'sharpe_ratio', // This would come from the request
            }
            onCompleted(transformedResults)
          }
        }

        // Handle errors
        if (updatedStatus.status === 'failed' || updatedStatus.status === 'stopped') {
          if (onError) {
            onError(updatedStatus.error || 'Workflow failed')
          }
          setError(updatedStatus.error || 'Workflow failed')
        }
      } catch (err) {
        console.error('Error fetching workflow status:', err)
        setError(err.message || 'Failed to fetch workflow status')
        setLoading(false)
      }
    }

    // Initial fetch
    fetchStatus()

    // Poll every 2 seconds if still running
    const interval = setInterval(() => {
      if (status?.status === 'running' || !status) {
        fetchStatus()
      } else {
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [workflowId, status?.status, onCompleted, onError])

  const handleStop = async () => {
    try {
      await workflowService.stopWorkflow(workflowId)
      const updatedStatus = await workflowService.getWorkflowStatus(workflowId)
      setStatus(updatedStatus)
    } catch (err) {
      setError(err.message || 'Failed to stop workflow')
    }
  }

  if (loading && !status) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading workflow status...</Typography>
      </Box>
    )
  }

  if (!status) {
    return (
      <Alert severity="error">Workflow status not available</Alert>
    )
  }

  const statusColors = {
    pending: 'default',
    running: 'info',
    completed: 'success',
    failed: 'error',
    stopped: 'warning',
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Agent Workflow Status</Typography>
        <Chip
          label={status.status.toUpperCase()}
          color={statusColors[status.status] || 'default'}
          size="small"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {status.status === 'running' && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Progress</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="body2">{status.progress}%</Typography>
              {estimatedTimeRemaining !== null && (
                <Typography variant="body2" color="text.secondary">
                  Est. remaining: {formatTimeRemaining(estimatedTimeRemaining)}
                </Typography>
              )}
            </Box>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={status.progress} 
            sx={{ height: 8, borderRadius: 4, mb: 2 }}
          />
          <Button
            startIcon={<StopIcon />}
            onClick={handleStop}
            color="error"
            size="small"
          >
            Stop Workflow
          </Button>
        </Box>
      )}

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Backtests
              </Typography>
              <Typography variant="h5">
                {status.total_backtests || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {status.elapsed_seconds && (
          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Elapsed Time
                </Typography>
                <Typography variant="h5">
                  {Math.round(status.elapsed_seconds)}s
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {status.best_result && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Current Best Result
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Typography variant="body2" color="text.secondary">
              Objective Value
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {status.best_result.objective_value?.toFixed(4) || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Parameters
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {JSON.stringify(status.best_result.parameters, null, 2)}
            </Typography>
          </Paper>
        </Box>
      )}

      {status.status === 'completed' && status.top_results && status.top_results.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Top 5 Results
          </Typography>
          {status.top_results.slice(0, 5).map((result, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  #{idx + 1}: {result.objective_value?.toFixed(4) || 'N/A'}
                </Typography>
                <Chip
                  label={JSON.stringify(result.parameters)}
                  size="small"
                  sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                />
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Paper>
  )
}
