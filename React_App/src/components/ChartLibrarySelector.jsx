import {
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Box,
} from '@mui/material'
import BarChartIcon from '@mui/icons-material/BarChart'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import { useChartLibrary } from '../charts/hooks/useChartLibrary'

/**
 * Quick selector to switch between chart libraries
 * Displays as toggle buttons for easy switching
 */
export default function ChartLibrarySelector({ size = 'small', sx = {} }) {
  const { library, setLibrary } = useChartLibrary()

  const handleChange = (event, newLibrary) => {
    if (newLibrary !== null) {
      setLibrary(newLibrary)
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ...sx }}>
      <ToggleButtonGroup
        value={library}
        exclusive
        onChange={handleChange}
        size={size}
        aria-label="chart library selector"
        sx={{
          '& .MuiToggleButton-root': {
            px: 1.5,
            py: 0.5,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Tooltip title="Plotly - More chart types, heatmaps, histograms">
          <ToggleButton value="plotly" aria-label="plotly">
            <ShowChartIcon sx={{ fontSize: 18, mr: 0.5 }} />
            Plotly
          </ToggleButton>
        </Tooltip>
        <Tooltip title="TradingView - Optimized for financial charts, better performance">
          <ToggleButton value="tradingview" aria-label="tradingview">
            <BarChartIcon sx={{ fontSize: 18, mr: 0.5 }} />
            TradingView
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
    </Box>
  )
}
