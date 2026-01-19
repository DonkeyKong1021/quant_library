import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
} from '@mui/material'
import { memo } from 'react'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'

const TradeHistory = memo(function TradeHistory({ trades }) {
  if (!trades || trades.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          No trades to display
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Trade History
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Symbol</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Direction</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Quantity
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Price
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Commission
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trades.map((trade, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  {trade.Date ? new Date(trade.Date).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell>{trade.symbol || '—'}</TableCell>
                <TableCell>
                  <Chip
                    icon={
                      trade.direction === 'BUY' ? (
                        <TrendingUpIcon />
                      ) : (
                        <TrendingDownIcon />
                      )
                    }
                    label={trade.direction || '—'}
                    color={trade.direction === 'BUY' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">{trade.quantity || '—'}</TableCell>
                <TableCell align="right">
                  {trade.price ? `$${trade.price.toFixed(2)}` : '—'}
                </TableCell>
                <TableCell align="right">
                  {trade.commission ? `$${trade.commission.toFixed(2)}` : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
})

export default TradeHistory