import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Grid,
  Button,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import StorageIcon from '@mui/icons-material/Storage'
import { useThemeMode } from '../contexts/ThemeContext'
import { CountUpSimple } from './common'
import ListIcon from '@mui/icons-material/List'
import TableChartIcon from '@mui/icons-material/TableChart'
import BarChartIcon from '@mui/icons-material/BarChart'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import DataUsageIcon from '@mui/icons-material/DataUsage'
import EventIcon from '@mui/icons-material/Event'
import ScheduleIcon from '@mui/icons-material/Schedule'
import SpeedIcon from '@mui/icons-material/Speed'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

const formatDateSpan = (days) => {
  if (!days || days === 0) return '0 days'
  const years = Math.floor(days / 365)
  const remainingDays = days % 365
  if (years > 0 && remainingDays > 0) {
    return `${years}y ${remainingDays}d`
  }
  if (years > 0) {
    return `${years}y`
  }
  return `${days}d`
}

const formatRowsPerDay = (totalRows, days) => {
  if (!totalRows || !days || days === 0) return '0'
  const rowsPerDay = Math.round(totalRows / days)
  return rowsPerDay.toLocaleString()
}

const formatCompactDate = (dateString) => {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
  } catch {
    return dateString
  }
}

const formatRelativeTime = (dateString) => {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return formatCompactDate(dateString)
  } catch {
    return formatCompactDate(dateString)
  }
}

export default function DatabaseStatsModal({ 
  open, 
  onClose, 
  dbStats, 
  dbStatus,
  onUpdateAll,
  updating,
  updateMessage 
}) {
  const { isDark } = useThemeMode()

  if (!dbStats) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: isDark
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <StorageIcon sx={{ fontSize: 24, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Database Statistics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {onUpdateAll && (
            <Tooltip title="Update database with all tickers from tickers.json">
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={updating ? <CircularProgress size={14} color="inherit" /> : <CloudDownloadIcon sx={{ fontSize: 16 }} />}
                onClick={onUpdateAll}
                disabled={updating || !dbStatus?.connected}
                sx={{ fontSize: '0.8125rem' }}
              >
                {updating ? 'Updating...' : 'Update All'}
              </Button>
            </Tooltip>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {updateMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => {}}>
            {updateMessage}
          </Alert>
        )}
        <Grid container spacing={2}>
          {[
            {
              label: 'Symbols',
              value: dbStats.total_symbols,
              color: 'primary.main',
              icon: ListIcon,
            },
            {
              label: 'Total Rows',
              value: dbStats.total_rows || 0,
              color: 'secondary.main',
              icon: TableChartIcon,
            },
            {
              label: 'Avg Rows',
              value: dbStats.avg_rows_per_symbol ? Math.round(dbStats.avg_rows_per_symbol) : 0,
              color: 'warning.main',
              icon: BarChartIcon,
            },
            {
              label: 'Date Span',
              value: dbStats.date_span_days || 0,
              suffix: '',
              color: 'success.main',
              icon: CalendarTodayIcon,
              formatSpan: true,
            },
            {
              label: 'Top Ticker',
              value: 'AAPL',
              color: 'primary.main',
              icon: TrendingUpIcon,
              isText: true,
            },
            {
              label: 'DB Size',
              value: dbStats.total_size_gb
                ? dbStats.total_size_gb < 1
                  ? dbStats.total_size_gb * 1024
                  : dbStats.total_size_gb
                : 0,
              suffix: dbStats.total_size_gb && dbStats.total_size_gb < 1 ? 'MB' : 'GB',
              decimals: dbStats.total_size_gb && dbStats.total_size_gb < 1 ? 0 : 1,
              color: 'info.main',
              icon: DataUsageIcon,
            },
            {
              label: 'Rows/Day',
              value: formatRowsPerDay(dbStats.total_rows, dbStats.date_span_days),
              color: 'warning.main',
              icon: SpeedIcon,
              isText: true,
            },
            {
              label: 'Earliest',
              value: dbStats.earliest_date,
              color: 'text.secondary',
              icon: EventIcon,
              isDate: true,
            },
            {
              label: 'Latest',
              value: dbStats.latest_date,
              color: 'text.secondary',
              icon: EventIcon,
              isDate: true,
            },
            {
              label: 'Last Update',
              value: dbStats.last_update,
              color: 'text.secondary',
              icon: ScheduleIcon,
              isRelativeTime: true,
            },
          ].map((stat, index) => (
            <Grid item xs={6} sm={4} md={3} key={stat.label}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75, gap: 0.5 }}>
                  <stat.icon sx={{ fontSize: 16, color: stat.color, opacity: 0.7 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {stat.label}
                  </Typography>
                </Box>
                {stat.isDate ? (
                  <Typography variant="body1" sx={{ fontSize: '0.9375rem', fontWeight: 600, color: stat.color }}>
                    {formatCompactDate(stat.value)}
                  </Typography>
                ) : stat.isRelativeTime ? (
                  <Typography variant="body1" sx={{ fontSize: '0.9375rem', fontWeight: 600, color: stat.color }}>
                    {formatRelativeTime(stat.value)}
                  </Typography>
                ) : stat.isText ? (
                  <Typography variant="body1" sx={{ fontSize: '1rem', fontWeight: 600, color: stat.color }}>
                    {stat.value}
                  </Typography>
                ) : stat.formatSpan ? (
                  <Typography variant="body1" sx={{ fontSize: '1rem', fontWeight: 600, color: stat.color }}>
                    {formatDateSpan(stat.value)}
                  </Typography>
                ) : (
                  <CountUpSimple
                    value={stat.value}
                    suffix={stat.suffix || ''}
                    decimals={stat.decimals || 0}
                    variant="body1"
                    color={stat.color}
                    sx={{ fontSize: '1rem' }}
                  />
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
