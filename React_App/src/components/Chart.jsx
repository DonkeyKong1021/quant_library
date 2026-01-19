import { useState, useEffect, memo } from 'react'
import { Box } from '@mui/material'
import { useThemeMode } from '../contexts/ThemeContext'
import { chartFactory } from '../charts'
import { useChartLibrary } from '../charts/hooks/useChartLibrary'

const Chart = memo(function Chart({ data, type = 'equity', onChartReady, benchmarkData, title }) {
  const { mode, isDark } = useThemeMode()
  const { library } = useChartLibrary()
  const [chartKey, setChartKey] = useState(0) // Force re-render when library changes

  // Listen for library changes
  useEffect(() => {
    const handleLibraryChange = () => {
      setChartKey((prev) => prev + 1)
    }
    window.addEventListener('chartLibraryChanged', handleLibraryChange)
    return () => window.removeEventListener('chartLibraryChanged', handleLibraryChange)
  }, [])

  // Also update when library changes from hook
  useEffect(() => {
    setChartKey((prev) => prev + 1)
  }, [library])

  const options = {
    mode,
    title: title || (type === 'equity' ? 'Equity Curve' : type === 'drawdown' ? 'Drawdown' : 'Chart'),
    height: 400,
    onChartReady,
  }

  if (!data || data.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 400,
          color: 'text.secondary',
          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          borderRadius: 2,
          border: '1px dashed',
          borderColor: 'divider',
        }}
      >
        No data available for chart
      </Box>
    )
  }

  // Render based on chart type using the factory
  if (type === 'equity') {
    const ChartComponent = chartFactory.renderEquityCurve(data, benchmarkData, options)
    return <Box key={chartKey}>{ChartComponent}</Box>
  }

  if (type === 'drawdown') {
    const ChartComponent = chartFactory.renderDrawdown(data, options)
    return <Box key={chartKey}>{ChartComponent}</Box>
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 400,
        color: 'text.secondary',
      }}
    >
      Unknown chart type: {type}
    </Box>
  )
})

export default Chart
