import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Checkbox,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material'
import StrategyComparison from '../components/StrategyComparison'
import { backtestService } from '../services/backtestService'

export default function BacktestHistory() {
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  
  // Filters
  const [symbolFilter, setSymbolFilter] = useState('')
  const [strategyFilter, setStrategyFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('DESC')
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resultToDelete, setResultToDelete] = useState(null)
  
  // Comparison
  const [selectedForComparison, setSelectedForComparison] = useState([])
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false)

  const fetchResults = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await backtestService.listBacktestResults({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        symbol: symbolFilter || undefined,
        strategy_name: strategyFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      setResults(response.results || [])
      setTotal(response.total || 0)
    } catch (err) {
      console.error('Error fetching backtest results:', err)
      setError(err.message || 'Failed to load backtest results')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [page, rowsPerPage, sortBy, sortOrder])

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) {
        fetchResults()
      } else {
        setPage(0) // Reset to first page when filter changes
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [symbolFilter, strategyFilter])

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleDeleteClick = (resultId) => {
    setResultToDelete(resultId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!resultToDelete) return

    try {
      await backtestService.deleteBacktestResult(resultToDelete)
      setDeleteDialogOpen(false)
      setResultToDelete(null)
      fetchResults() // Refresh the list
    } catch (err) {
      console.error('Error deleting result:', err)
      setError(err.message || 'Failed to delete backtest result')
      setDeleteDialogOpen(false)
    }
  }

  const handleViewResult = (resultId) => {
    navigate(`/backtest?resultId=${resultId}`)
  }

  const formatMetric = (value, type = 'number') => {
    if (value === null || value === undefined) return '—'
    
    if (type === 'percentage') {
      return `${(value * 100).toFixed(2)}%`
    } else if (type === 'currency') {
      return `$${value.toFixed(2)}`
    } else if (type === 'number') {
      return typeof value === 'number' ? value.toFixed(2) : value
    }
    return value
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
          Backtest History
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.0625rem' }}>
          View and manage your saved backtest results
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3, elevation: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Filter by Symbol"
            value={symbolFilter}
            onChange={(e) => setSymbolFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="Filter by Strategy"
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="created_at">Date</MenuItem>
              <MenuItem value="symbol">Symbol</MenuItem>
              <MenuItem value="strategy_name">Strategy</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Order</InputLabel>
            <Select
              value={sortOrder}
              label="Order"
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <MenuItem value="DESC">Descending</MenuItem>
              <MenuItem value="ASC">Ascending</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="outlined"
            onClick={fetchResults}
            sx={{ fontSize: '0.9375rem', fontWeight: 500 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<CompareIcon />}
            onClick={() => {
              if (selectedForComparison.length >= 2) {
                setComparisonDialogOpen(true)
              }
            }}
            disabled={selectedForComparison.length < 2}
            sx={{ fontSize: '0.9375rem', fontWeight: 500 }}
          >
            Compare ({selectedForComparison.length})
          </Button>
        </Box>
      </Paper>

      {/* Results Table */}
      <Paper sx={{ elevation: 1 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Symbol</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Strategy</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Total Return</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Sharpe Ratio</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Max Drawdown</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Trades</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Select</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                      No backtest results found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result) => {
                  const metrics = result.metrics || {}
                  const totalReturn = metrics.total_return || 0
                  const sharpeRatio = metrics.sharpe_ratio
                  const maxDrawdown = metrics.max_drawdown_pct
                  const numTrades = metrics.num_trades || 0

                  return (
                    <TableRow key={result.result_id} hover>
                      <TableCell>
                        <Chip label={result.symbol} size="small" sx={{ fontWeight: 500 }} />
                      </TableCell>
                      <TableCell>{result.strategy_name || 'Unknown'}</TableCell>
                      <TableCell>{formatDate(result.created_at)}</TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: totalReturn >= 0 ? 'success.main' : 'error.main',
                          }}
                        >
                          {formatMetric(totalReturn, 'percentage')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{formatMetric(sharpeRatio)}</TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: maxDrawdown ? 'error.main' : 'text.secondary',
                          }}
                        >
                          {formatMetric(maxDrawdown, 'percentage')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{numTrades}</TableCell>
                      <TableCell align="center">
                        <Checkbox
                          size="small"
                          checked={selectedForComparison.includes(result.result_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedForComparison([...selectedForComparison, result.result_id])
                            } else {
                              setSelectedForComparison(selectedForComparison.filter(id => id !== result.result_id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewResult(result.result_id)}
                            title="View Result"
                            sx={{ color: 'primary.main' }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(result.result_id)}
                            title="Delete"
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Backtest Result</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this backtest result? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            sx={{ fontSize: '0.9375rem', fontWeight: 500 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comparison Dialog */}
      <Dialog
        open={comparisonDialogOpen}
        onClose={() => setComparisonDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Strategy Comparison</DialogTitle>
        <DialogContent>
          <StrategyComparison resultIds={selectedForComparison} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComparisonDialogOpen(false)} sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
