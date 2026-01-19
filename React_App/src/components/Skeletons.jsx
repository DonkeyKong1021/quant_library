import { Box, Skeleton, Table, TableBody, TableCell, TableRow, Paper, Grid, Card, CardContent } from '@mui/material'

export function ChartSkeleton({ height = 400 }) {
  return (
    <Box sx={{ width: '100%', height }}>
      <Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: 1 }} />
    </Box>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <Table>
      <TableBody>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRow key={index}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton variant="text" width="100%" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function CardSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="40%" height={20} />
        <Skeleton variant="rectangular" width="100%" height={100} sx={{ mt: 2, borderRadius: 1 }} />
      </CardContent>
    </Card>
  )
}

export function DashboardCardSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="40%" height={16} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" height={32} />
      </CardContent>
    </Card>
  )
}

export function MetricsTableSkeleton() {
  return (
    <Paper sx={{ p: 2 }}>
      <Skeleton variant="text" width="200px" height={28} sx={{ mb: 2 }} />
      <TableSkeleton rows={8} columns={2} />
    </Paper>
  )
}

export function TradeHistorySkeleton() {
  return (
    <Paper sx={{ p: 2 }}>
      <Skeleton variant="text" width="200px" height={28} sx={{ mb: 2 }} />
      <TableSkeleton rows={10} columns={6} />
    </Paper>
  )
}

export function DataExplorerSkeleton() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2 }}>
          <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 2, borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1 }} />
        </Paper>
      </Grid>
      <Grid item xs={12} md={9}>
        <Paper sx={{ p: 3 }}>
          <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
          <ChartSkeleton height={400} />
        </Paper>
      </Grid>
    </Grid>
  )
}
