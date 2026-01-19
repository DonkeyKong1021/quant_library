import { Paper, Typography, Box, Grid, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import StepHeader from './common/StepHeader'

export default function DataPreview({ data, metadata, cached, symbol, stepNumber = 2, stepStatus = 'pending' }) {
  if (!data || data.length === 0) {
    return null
  }

  const startDate = data[0]?.Date ? new Date(data[0].Date).toLocaleDateString() : '—'
  const endDate = data[data.length - 1]?.Date
    ? new Date(data[data.length - 1].Date).toLocaleDateString()
    : '—'

  const previewRows = data.slice(0, 5)
  const lastRows = data.slice(-5)

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <StepHeader 
        stepNumber={stepNumber} 
        label="Data Summary" 
        status={stepStatus}
        showConnector={false}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, mt: -2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {cached && (
            <Chip
              icon={<CheckCircleIcon />}
              label="Cached"
              color="success"
              size="small"
              variant="outlined"
            />
          )}
          {!cached && (
            <Chip
              icon={<CloudDownloadIcon />}
              label="Fresh"
              color="primary"
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Symbol
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {symbol || '—'}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Row Count
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {data.length.toLocaleString()}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Start Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {startDate}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              End Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {endDate}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {metadata && metadata.available_date_range && (
        <Box sx={{ mb: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CalendarTodayIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Available Date Range
            </Typography>
          </Box>
          <Typography variant="body2">
            {new Date(metadata.available_date_range.start).toLocaleDateString()} -{' '}
            {new Date(metadata.available_date_range.end).toLocaleDateString()}
          </Typography>
        </Box>
      )}

      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Data Preview
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Open
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                High
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Low
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Close
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Volume
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {previewRows.map((row, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  {row.Date ? new Date(row.Date).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell align="right">
                  {row.Open ? `$${parseFloat(row.Open).toFixed(2)}` : '—'}
                </TableCell>
                <TableCell align="right">
                  {row.High ? `$${parseFloat(row.High).toFixed(2)}` : '—'}
                </TableCell>
                <TableCell align="right">
                  {row.Low ? `$${parseFloat(row.Low).toFixed(2)}` : '—'}
                </TableCell>
                <TableCell align="right">
                  {row.Close ? `$${parseFloat(row.Close).toFixed(2)}` : '—'}
                </TableCell>
                <TableCell align="right">
                  {row.Volume ? parseInt(row.Volume).toLocaleString() : '—'}
                </TableCell>
              </TableRow>
            ))}
            {data.length > 10 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  ... {data.length - 10} more rows ...
                </TableCell>
              </TableRow>
            )}
            {data.length > 10 &&
              lastRows.map((row, index) => (
                <TableRow key={`last-${index}`} hover>
                  <TableCell>
                    {row.Date ? new Date(row.Date).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {row.Open ? `$${parseFloat(row.Open).toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {row.High ? `$${parseFloat(row.High).toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {row.Low ? `$${parseFloat(row.Low).toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {row.Close ? `$${parseFloat(row.Close).toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {row.Volume ? parseInt(row.Volume).toLocaleString() : '—'}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}