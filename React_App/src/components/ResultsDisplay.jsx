import { useState, useRef } from 'react'
import {
  Paper,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import { backtestService } from '../services/backtestService'
import MetricsTable from './MetricsTable'
import TradeHistory from './TradeHistory'
import Chart from './Chart'
import ExportDialog from './ExportDialog'
import AIInsights from './AIInsights'
import {
  exportMetricsToCSV,
  exportTradesToCSV,
  exportEquityCurveToCSV,
  exportResultsToJSON,
  downloadFile,
} from '../utils/exportUtils'

export default function ResultsDisplay({
  data,
  symbol,
  strategy,
  config,
  onBacktestComplete,
  loading: externalLoading,
  results: externalResults,
}) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(externalResults || null)
  const [error, setError] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [backtestName, setBacktestName] = useState('')
  const chartExportRef = useRef(null)

  const handleRunBacktest = async () => {
    if (!data || !strategy || !config) {
      setError('Please configure data, strategy, and backtest settings first')
      return
    }

    if (!backtestName.trim()) {
      setError('Please enter a name for this backtest')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Use symbol prop if provided, otherwise extract from data
      const backtestSymbol = symbol || data[0]?.symbol || 'SYMBOL'

      const response = await backtestService.runBacktest({
        data: data,
        strategy: strategy,
        config: config,
        symbol: backtestSymbol,
        name: backtestName.trim(),
      })

      setResults(response)
      if (onBacktestComplete) {
        onBacktestComplete(response)
      }
    } catch (err) {
      setError(err.message || 'Failed to run backtest')
    } finally {
      setLoading(false)
    }
  }

  const isLoading = loading || externalLoading
  const displayResults = results || externalResults

  const handleExport = async ({ type, format }) => {
    if (!displayResults) return

    const strategyName = strategy?.type || 'Unknown'
    const exportSymbol = symbol || 'SYMBOL'
    const timestamp = new Date().toISOString().split('T')[0]

    if (format === 'png' && type === 'equity') {
      // Export chart as PNG
      if (chartExportRef.current?.exportImage) {
        const imgData = await chartExportRef.current.exportImage('png')
        if (imgData) {
          downloadFile(imgData, `${exportSymbol}_equity_curve_${timestamp}.png`, 'image/png')
        }
      }
    } else if (format === 'json') {
      const jsonContent = exportResultsToJSON(displayResults, exportSymbol, strategyName)
      downloadFile(jsonContent, `${exportSymbol}_${strategyName}_${timestamp}.json`, 'application/json')
    } else if (format === 'csv') {
      let csvContent, filename
      
      if (type === 'metrics') {
        csvContent = exportMetricsToCSV(displayResults.metrics || {}, exportSymbol, strategyName)
        filename = `${exportSymbol}_metrics_${timestamp}.csv`
      } else if (type === 'trades') {
        csvContent = exportTradesToCSV(displayResults.trades || [], exportSymbol)
        filename = `${exportSymbol}_trades_${timestamp}.csv`
      } else if (type === 'equity') {
        csvContent = exportEquityCurveToCSV(displayResults.equity_curve || [], exportSymbol)
        filename = `${exportSymbol}_equity_curve_${timestamp}.csv`
      }
      
      if (csvContent && filename) {
        downloadFile(csvContent, filename, 'text/csv')
      }
    }
  }

  return (
    <Paper sx={{ p: 4, elevation: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Backtest Results
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Backtest Name"
            placeholder="e.g., RSI_AAPL_v1"
            value={backtestName}
            onChange={(e) => setBacktestName(e.target.value)}
            size="small"
            required
            error={!backtestName.trim() && !!data && !!strategy && !!config}
            helperText={!backtestName.trim() && !!data && !!strategy && !!config ? 'Required' : ''}
            sx={{ 
              minWidth: 200,
              '& .MuiFormHelperText-root': {
                position: 'absolute',
                bottom: -20,
              }
            }}
          />
          {displayResults && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => setExportDialogOpen(true)}
              size="large"
              sx={{ fontSize: '0.9375rem', fontWeight: 500 }}
            >
              Export
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleRunBacktest}
            disabled={isLoading || !data || !strategy || !config || !backtestName.trim()}
            size="large"
            sx={{ fontSize: '0.9375rem', fontWeight: 500 }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Run Backtest'}
          </Button>
        </Box>
      </Box>

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        formats={displayResults?.equity_curve ? ['csv', 'json', 'png'] : ['json']}
        dataTypes={
          displayResults?.trades?.length > 0
            ? ['metrics', 'trades', 'equity', 'all']
            : ['metrics', 'equity', 'all']
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {displayResults && (
        <>
          <MetricsTable results={displayResults} />

          <AIInsights 
            results={displayResults} 
            strategyName={strategy?.type || 'Unknown Strategy'} 
            symbol={symbol || 'Unknown'} 
          />

          <Box sx={{ mt: 3 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Equity & Drawdown" />
              <Tab label="Returns Analysis" />
              <Tab label="Trade History" />
            </Tabs>

            {tabValue === 0 && (
              <Box sx={{ mt: 3 }}>
                {displayResults.equity_curve && displayResults.equity_curve.length > 0 ? (
                  <Chart 
                    data={displayResults.equity_curve} 
                    type="equity"
                    benchmarkData={displayResults.benchmark_equity_curve}
                    onChartReady={(exportFunctions) => {
                      chartExportRef.current = exportFunctions
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      p: 6,
                      textAlign: 'center',
                      backgroundColor: 'action.hover',
                      borderRadius: 3,
                      border: '1px dashed',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      No equity curve data available
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {tabValue === 1 && (
              <Box sx={{ mt: 3 }}>
                <Box
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    backgroundColor: 'action.hover',
                    borderRadius: 3,
                    border: '1px dashed',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Returns analysis charts will be implemented here
                  </Typography>
                </Box>
              </Box>
            )}

            {tabValue === 2 && displayResults.trades && (
              <Box sx={{ mt: 3 }}>
                <TradeHistory trades={displayResults.trades} />
              </Box>
            )}
          </Box>
        </>
      )}

      {!displayResults && !isLoading && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            backgroundColor: 'action.hover',
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
            Configure data, strategy, and backtest settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Then click "Run Backtest" to see results here
          </Typography>
        </Box>
      )}
    </Paper>
  )
}