import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  FormControl,
  FormLabel,
  Checkbox,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'

export default function ExportDialog({ 
  open, 
  onClose, 
  onExport, 
  formats = ['metrics-csv', 'trades-csv', 'equity-csv', 'json'],
  dataTypes = ['metrics', 'trades', 'equity', 'all']
}) {
  const [exportType, setExportType] = useState(dataTypes[0] || 'all')
  const [format, setFormat] = useState(formats[0] || 'csv')

  const handleExport = () => {
    if (onExport) {
      onExport({ type: exportType, format })
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Backtest Results</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
              Data to Export
            </FormLabel>
            <RadioGroup value={exportType} onChange={(e) => setExportType(e.target.value)}>
              {dataTypes.includes('metrics') && (
                <FormControlLabel value="metrics" control={<Radio />} label="Performance Metrics" />
              )}
              {dataTypes.includes('trades') && (
                <FormControlLabel value="trades" control={<Radio />} label="Trade History" />
              )}
              {dataTypes.includes('equity') && (
                <FormControlLabel value="equity" control={<Radio />} label="Equity Curve" />
              )}
              {dataTypes.includes('all') && (
                <FormControlLabel value="all" control={<Radio />} label="All Data (JSON only)" />
              )}
            </RadioGroup>
          </FormControl>
        </Box>

        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
            Export Format
          </FormLabel>
          <RadioGroup value={format} onChange={(e) => setFormat(e.target.value)}>
            {(exportType === 'equity' && formats.includes('png')) && (
              <FormControlLabel value="png" control={<Radio />} label="PNG (Image)" />
            )}
            {exportType !== 'all' && (formats.includes('csv') || formats.includes('metrics-csv') || formats.includes('trades-csv') || formats.includes('equity-csv')) && (
              <FormControlLabel value="csv" control={<Radio />} label="CSV (Comma Separated Values)" />
            )}
            {formats.includes('json') && (
              <FormControlLabel value="json" control={<Radio />} label="JSON (JavaScript Object Notation)" />
            )}
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleExport} variant="contained" startIcon={<DownloadIcon />}>
          Export
        </Button>
      </DialogActions>
    </Dialog>
  )
}
