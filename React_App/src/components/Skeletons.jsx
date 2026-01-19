import { Box, Skeleton, Table, TableBody, TableCell, TableRow, Paper, Grid, Card, CardContent, keyframes } from '@mui/material'
import { useThemeMode } from '../contexts/ThemeContext'

// Shimmer animation keyframes
const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

// Custom shimmer skeleton component
function ShimmerSkeleton({ variant = 'rectangular', width, height, sx = {}, ...props }) {
  const { isDark } = useThemeMode()
  
  const shimmerBg = isDark
    ? 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)'
    : 'linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 75%)'

  return (
    <Skeleton
      variant={variant}
      width={width}
      height={height}
      animation={false}
      sx={{
        background: shimmerBg,
        backgroundSize: '200% 100%',
        animation: `${shimmer} 1.5s ease-in-out infinite`,
        borderRadius: variant === 'circular' ? '50%' : 1,
        ...sx,
      }}
      {...props}
    />
  )
}

export function ChartSkeleton({ height = 400 }) {
  const { isDark } = useThemeMode()
  
  return (
    <Box
      sx={{
        width: '100%',
        height,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Chart area skeleton */}
      <ShimmerSkeleton
        variant="rectangular"
        width="100%"
        height={height}
        sx={{ borderRadius: 2 }}
      />
      {/* Simulated chart lines */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 60,
          left: 60,
          right: 20,
          height: '50%',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 0.5,
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: `${30 + Math.sin(i * 0.5) * 40 + Math.random() * 20}%`,
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.1)',
              borderRadius: 0.5,
              opacity: 0.5,
            }}
          />
        ))}
      </Box>
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
              <TableCell key={colIndex} sx={{ py: 2 }}>
                <ShimmerSkeleton
                  variant="text"
                  width={colIndex === 0 ? '70%' : '50%'}
                  height={20}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function CardSkeleton() {
  const { isDark } = useThemeMode()
  
  return (
    <Card
      sx={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
      elevation={0}
    >
      <CardContent sx={{ p: 3 }}>
        <ShimmerSkeleton variant="text" width="60%" height={24} sx={{ mb: 1.5 }} />
        <ShimmerSkeleton variant="text" width="40%" height={18} sx={{ mb: 2 }} />
        <ShimmerSkeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: 1.5 }} />
      </CardContent>
    </Card>
  )
}

export function DashboardCardSkeleton() {
  const { isDark } = useThemeMode()
  
  return (
    <Card
      sx={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
      }}
      elevation={0}
    >
      <CardContent sx={{ p: 3.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
          <ShimmerSkeleton variant="rounded" width={48} height={48} sx={{ mr: 1.5, borderRadius: 2 }} />
          <ShimmerSkeleton variant="text" width={100} height={24} />
        </Box>
        <ShimmerSkeleton variant="text" width="80%" height={16} sx={{ mb: 1 }} />
        <ShimmerSkeleton variant="text" width="60%" height={16} sx={{ mb: 2.5 }} />
        <ShimmerSkeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 2 }} />
      </CardContent>
    </Card>
  )
}

export function MetricsTableSkeleton() {
  const { isDark } = useThemeMode()
  
  return (
    <Paper
      sx={{
        p: 4,
        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
      }}
      elevation={0}
    >
      <ShimmerSkeleton variant="text" width={200} height={28} sx={{ mb: 4 }} />
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              }}
            >
              <ShimmerSkeleton variant="text" width="60%" height={16} sx={{ mb: 1.5 }} />
              <ShimmerSkeleton variant="text" width="80%" height={32} />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  )
}

export function TradeHistorySkeleton() {
  const { isDark } = useThemeMode()
  
  return (
    <Paper
      sx={{
        p: 3,
        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
      }}
      elevation={0}
    >
      <ShimmerSkeleton variant="text" width={200} height={28} sx={{ mb: 3 }} />
      <TableSkeleton rows={8} columns={6} />
    </Paper>
  )
}

export function DataExplorerSkeleton() {
  const { isDark } = useThemeMode()
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Paper
          sx={{
            p: 3,
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          }}
          elevation={0}
        >
          <ShimmerSkeleton variant="text" width="60%" height={24} sx={{ mb: 2.5 }} />
          <ShimmerSkeleton variant="rectangular" width="100%" height={48} sx={{ mb: 2, borderRadius: 2 }} />
          <ShimmerSkeleton variant="rectangular" width="100%" height={48} sx={{ mb: 2, borderRadius: 2 }} />
          <ShimmerSkeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
        </Paper>
      </Grid>
      <Grid item xs={12} md={9}>
        <Paper
          sx={{
            p: 3,
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          }}
          elevation={0}
        >
          <ShimmerSkeleton variant="text" width="40%" height={28} sx={{ mb: 3 }} />
          <ChartSkeleton height={400} />
        </Paper>
      </Grid>
    </Grid>
  )
}

export function FormSkeleton({ fields = 4 }) {
  const { isDark } = useThemeMode()
  
  return (
    <Paper
      sx={{
        p: 4,
        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
      }}
      elevation={0}
    >
      <ShimmerSkeleton variant="text" width={180} height={28} sx={{ mb: 3 }} />
      <Grid container spacing={2}>
        {Array.from({ length: fields }).map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <ShimmerSkeleton variant="text" width="40%" height={14} sx={{ mb: 1 }} />
            <ShimmerSkeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <ShimmerSkeleton variant="rectangular" width={120} height={42} sx={{ borderRadius: 2 }} />
        <ShimmerSkeleton variant="rectangular" width={100} height={42} sx={{ borderRadius: 2 }} />
      </Box>
    </Paper>
  )
}

// Export the base shimmer skeleton for custom use
export { ShimmerSkeleton }
