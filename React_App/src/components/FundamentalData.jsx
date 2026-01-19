import { useState, useEffect } from 'react'
import {
  Paper,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Button,
} from '@mui/material'
import { fundamentalService } from '../services/fundamentalService'
import { useQuery } from '@tanstack/react-query'

export default function FundamentalData({ symbol }) {
  const [statementType, setStatementType] = useState('income')

  const { data: fundamentals, isLoading, error } = useQuery({
    queryKey: ['fundamentals', symbol],
    queryFn: () => fundamentalService.getFundamentals(symbol),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (!symbol) {
    return (
      <Alert severity="info">
        Select a symbol to view fundamental data
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading fundamental data: {error.message}
      </Alert>
    )
  }

  if (!fundamentals) {
    return (
      <Alert severity="warning">
        Fundamental data not available for {symbol}. This feature requires integration with a data provider.
      </Alert>
    )
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Fundamental Data: {symbol}
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Fundamental data integration is available in the backend. This display will show company fundamentals
        when data providers are configured.
      </Alert>

      <Grid container spacing={3}>
        {/* Company Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Company Information
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Sector</strong></TableCell>
                      <TableCell>{fundamentals.sector || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Industry</strong></TableCell>
                      <TableCell>{fundamentals.industry || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Market Cap</strong></TableCell>
                      <TableCell>
                        {fundamentals.market_cap 
                          ? `$${(fundamentals.market_cap / 1e9).toFixed(2)}B`
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Valuation Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Valuation Metrics
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>P/E Ratio</strong></TableCell>
                      <TableCell>{fundamentals.pe_ratio || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>EPS</strong></TableCell>
                      <TableCell>{fundamentals.earnings_per_share || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Dividend Yield</strong></TableCell>
                      <TableCell>
                        {fundamentals.dividend_yield 
                          ? `${(fundamentals.dividend_yield * 100).toFixed(2)}%`
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Financial Metrics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Financial Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Revenue
                  </Typography>
                  <Typography variant="h6">
                    {fundamentals.revenue 
                      ? `$${(fundamentals.revenue / 1e6).toFixed(0)}M`
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Net Income
                  </Typography>
                  <Typography variant="h6">
                    {fundamentals.net_income 
                      ? `$${(fundamentals.net_income / 1e6).toFixed(0)}M`
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Total Assets
                  </Typography>
                  <Typography variant="h6">
                    {fundamentals.total_assets 
                      ? `$${(fundamentals.total_assets / 1e6).toFixed(0)}M`
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Cash
                  </Typography>
                  <Typography variant="h6">
                    {fundamentals.cash 
                      ? `$${(fundamentals.cash / 1e6).toFixed(0)}M`
                      : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  )
}
