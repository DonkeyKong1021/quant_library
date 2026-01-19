import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Chip,
  IconButton,
  Box,
  Typography,
  Button,
  Pagination,
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { formatMetricValue, getMetricLabel, sortResultsByObjective } from '../utils/optimizationUtils'

export default function OptimizationResultsTable({
  results,
  objective,
  bestResultId,
  onSelectResult,
  onApplyParameters,
}) {
  const [orderBy, setOrderBy] = useState(objective)
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(0)
  const rowsPerPage = 25

  const sortedResults = useMemo(() => {
    if (!results || results.length === 0) return []

    const sorted = [...results]
    sorted.sort((a, b) => {
      let aValue = a.metrics?.[orderBy] ?? a.objective_value ?? -Infinity
      let bValue = b.metrics?.[orderBy] ?? b.objective_value ?? -Infinity

      if (orderBy === objective) {
        aValue = a.objective_value ?? -Infinity
        bValue = b.objective_value ?? -Infinity
      }

      if (order === 'asc') {
        return aValue - bValue
      }
      return bValue - aValue
    })

    return sorted
  }, [results, orderBy, order, objective])

  const paginatedResults = useMemo(() => {
    const start = page * rowsPerPage
    return sortedResults.slice(start, start + rowsPerPage)
  }, [sortedResults, page, rowsPerPage])

  const handleSort = (column) => {
    const isAsc = orderBy === column && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(column)
  }

  const handleApplyResult = (result) => {
    if (onApplyParameters && result.parameters) {
      onApplyParameters(result.parameters)
    }
  }

  if (!results || results.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No results to display.
      </Typography>
    )
  }

  const paramNames = Object.keys(results[0]?.parameters || {})

  return (
    <Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"></TableCell>
              {paramNames.map((paramName) => (
                <TableCell key={paramName} sortDirection={orderBy === paramName ? order : false}>
                  <TableSortLabel
                    active={orderBy === paramName}
                    direction={orderBy === paramName ? order : 'asc'}
                    onClick={() => handleSort(paramName)}
                  >
                    {paramName}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell sortDirection={orderBy === objective ? order : false}>
                <TableSortLabel
                  active={orderBy === objective}
                  direction={orderBy === objective ? order : 'asc'}
                  onClick={() => handleSort(objective)}
                >
                  {getMetricLabel(objective)}
                </TableSortLabel>
              </TableCell>
              <TableCell>Sharpe</TableCell>
              <TableCell>Return</TableCell>
              <TableCell>Drawdown</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedResults.map((result, index) => {
              const isBest = result.result_id === bestResultId
              const metrics = result.metrics || {}

              return (
                <TableRow
                  key={result.result_id || index}
                  hover
                  selected={isBest}
                  sx={{
                    backgroundColor: isBest ? 'action.selected' : 'transparent',
                    '&:hover': {
                      backgroundColor: isBest ? 'action.selected' : 'action.hover',
                    },
                  }}
                >
                  <TableCell padding="checkbox">
                    {isBest && (
                      <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    )}
                  </TableCell>
                  {paramNames.map((paramName) => (
                    <TableCell key={paramName}>
                      {result.parameters?.[paramName] ?? '—'}
                    </TableCell>
                  ))}
                  <TableCell sx={{ fontWeight: isBest ? 600 : 400 }}>
                    {formatMetricValue(result.objective_value, objective)}
                  </TableCell>
                  <TableCell>
                    {formatMetricValue(metrics.sharpe_ratio, 'sharpe_ratio')}
                  </TableCell>
                  <TableCell>
                    {formatMetricValue(metrics.total_return, 'total_return')}
                  </TableCell>
                  <TableCell>
                    {formatMetricValue(metrics.max_drawdown_pct, 'max_drawdown_pct')}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleApplyResult(result)}
                      title="Apply these parameters"
                    >
                      <PlayArrowIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {sortedResults.length > rowsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={Math.ceil(sortedResults.length / rowsPerPage)}
            page={page + 1}
            onChange={(e, newPage) => setPage(newPage - 1)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  )
}
