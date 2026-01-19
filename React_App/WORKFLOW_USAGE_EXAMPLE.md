# Using Agent Workflows in React

The agent workflow system provides intelligent Bayesian optimization for backtest parameter tuning. Here's how to use it in your React app.

## Service Functions

The workflow service functions are available in `src/services/backtestService.js`:

```javascript
import { workflowService } from './services/backtestService'

// Create a new workflow
const workflow = await workflowService.createWorkflow({
  data: dataArray,
  strategy: strategyConfig,
  config: backtestConfig,
  symbol: 'AAPL',
  parameterRanges: {
    short_window: { min: 5, max: 50, type: 'int' },
    long_window: { min: 20, max: 200, type: 'int' }
  },
  objective: 'sharpe_ratio',
  maxIterations: 100,
  nWorkers: 4  // Optional, defaults to CPU count
})

// Get workflow status
const status = await workflowService.getWorkflowStatus(workflow.workflow_id)

// Stop a running workflow
await workflowService.stopWorkflow(workflow.workflow_id)

// List all workflows
const workflows = await workflowService.listWorkflows({ 
  status: 'completed',
  limit: 50 
})
```

## Basic Usage Example

Here's a simple component that creates and monitors a workflow:

```javascript
import { useState, useEffect } from 'react'
import { workflowService } from '../services/backtestService'
import { Button, Box, Typography, LinearProgress, Alert } from '@mui/material'

function WorkflowOptimization({ data, strategy, config, symbol, parameterRanges }) {
  const [workflowId, setWorkflowId] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Create workflow
  const handleStartWorkflow = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await workflowService.createWorkflow({
        data,
        strategy,
        config,
        symbol,
        parameterRanges,
        objective: 'sharpe_ratio',
        maxIterations: 100
      })
      
      setWorkflowId(response.workflow_id)
      setStatus(response)
    } catch (err) {
      setError(err.message || 'Failed to create workflow')
    } finally {
      setLoading(false)
    }
  }

  // Poll for status updates
  useEffect(() => {
    if (!workflowId || (status?.status === 'completed' || status?.status === 'failed')) {
      return
    }

    const interval = setInterval(async () => {
      try {
        const updatedStatus = await workflowService.getWorkflowStatus(workflowId)
        setStatus(updatedStatus)
        
        if (updatedStatus.status === 'completed' || updatedStatus.status === 'failed') {
          clearInterval(interval)
        }
      } catch (err) {
        console.error('Error fetching workflow status:', err)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [workflowId, status?.status])

  // Stop workflow
  const handleStop = async () => {
    if (!workflowId) return
    
    try {
      await workflowService.stopWorkflow(workflowId)
      const updatedStatus = await workflowService.getWorkflowStatus(workflowId)
      setStatus(updatedStatus)
    } catch (err) {
      setError(err.message || 'Failed to stop workflow')
    }
  }

  return (
    <Box>
      {!workflowId && (
        <Button 
          variant="contained" 
          onClick={handleStartWorkflow}
          disabled={loading || !data || !strategy}
        >
          Start Agent Workflow
        </Button>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {status && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Workflow Status</Typography>
          <Typography>Status: {status.status}</Typography>
          <Typography>Progress: {status.progress}%</Typography>
          
          {status.status === 'running' && (
            <>
              <LinearProgress variant="determinate" value={status.progress} sx={{ mt: 1 }} />
              <Button onClick={handleStop} sx={{ mt: 2 }}>Stop Workflow</Button>
            </>
          )}

          {status.best_result && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Best Result</Typography>
              <Typography>Objective Value: {status.best_result.objective_value.toFixed(4)}</Typography>
              <Typography>Parameters: {JSON.stringify(status.best_result.parameters)}</Typography>
            </Box>
          )}

          {status.top_results && status.top_results.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Top Results</Typography>
              {status.top_results.slice(0, 5).map((result, idx) => (
                <Typography key={idx}>
                  #{idx + 1}: {result.objective_value.toFixed(4)} - {JSON.stringify(result.parameters)}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

export default WorkflowOptimization
```

## Integration with Existing Optimization Page

You can add workflow support to your existing `Optimization.jsx` page by:

1. Adding a toggle between "Grid Search" and "Agent Workflow" modes
2. Using the workflow service when "Agent Workflow" is selected
3. Polling for status updates and displaying progress

Example modification:

```javascript
// In Optimization.jsx
const [optimizationMode, setOptimizationMode] = useState('grid') // 'grid' or 'workflow'

const handleRunOptimization = async () => {
  if (optimizationMode === 'workflow') {
    // Use workflow service
    const workflow = await workflowService.createWorkflow({
      data,
      strategy,
      config,
      symbol: selectedSymbol,
      parameterRanges: formattedRanges,
      objective: optimizationConfig.objective,
      maxIterations: optimizationConfig.max_iterations || 100,
    })
    
    // Poll for results
    // ... (polling logic)
  } else {
    // Use existing grid search
    const response = await backtestService.optimizeParameters({
      // ... existing code
    })
    setResults(response)
  }
}
```

## Key Differences from Grid Search

1. **Intelligent Exploration**: Bayesian optimization intelligently explores the parameter space instead of exhaustive grid search
2. **Asynchronous**: Workflows run in the background - you need to poll for status
3. **More Efficient**: Typically finds good solutions in fewer iterations (100 vs thousands for grid search)
4. **Progress Tracking**: Real-time progress updates as optimization proceeds

## Parameter Ranges Format

Parameter ranges use the same format as grid search:

```javascript
const parameterRanges = {
  short_window: {
    min: 5,
    max: 50,
    type: 'int'  // 'int' or 'float'
  },
  long_window: {
    min: 20,
    max: 200,
    type: 'int'
  },
  bb_std: {
    min: 1.0,
    max: 5.0,
    type: 'float'
  }
}
```

## Status Values

- `pending`: Workflow created but not started
- `running`: Optimization in progress
- `completed`: Optimization finished successfully
- `failed`: Optimization failed with error
- `stopped`: Workflow was stopped by user

## Response Structure

```javascript
{
  workflow_id: "uuid",
  status: "completed",
  progress: 100,
  best_result: {
    parameters: { short_window: 20, long_window: 50 },
    objective_value: 1.85,
    metrics: { /* full metrics */ }
  },
  top_results: [
    // Array of top 10 results
  ],
  total_backtests: 100,
  elapsed_seconds: 45.2,
  error: null
}
```
