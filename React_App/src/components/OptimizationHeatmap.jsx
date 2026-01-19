import { useMemo } from 'react'
import { Box, Typography, Alert } from '@mui/material'
import Plot from 'react-plotly.js'
import { prepareHeatmapData, getMetricLabel } from '../utils/optimizationUtils'

export default function OptimizationHeatmap({
  results,
  param1Name,
  param2Name,
  objective,
}) {
  const heatmapData = useMemo(() => {
    if (!results || results.length === 0 || !param1Name || !param2Name) {
      return null
    }
    return prepareHeatmapData(results, param1Name, param2Name, objective)
  }, [results, param1Name, param2Name, objective])

  if (!heatmapData) {
    return (
      <Alert severity="info">
        Heatmap requires exactly 2 parameters. Current optimization has different number of parameters.
      </Alert>
    )
  }

  const layout = {
    title: `${getMetricLabel(objective)} Heatmap`,
    xaxis: {
      title: param1Name,
      type: 'linear',
    },
    yaxis: {
      title: param2Name,
      type: 'linear',
    },
    width: null,
    height: 500,
    margin: { l: 60, r: 20, t: 60, b: 60 },
  }

  const data = [
    {
      z: heatmapData.z,
      x: heatmapData.x,
      y: heatmapData.y,
      type: 'heatmap',
      colorscale: 'Viridis',
      colorbar: {
        title: getMetricLabel(objective),
      },
      hovertemplate: `${param1Name}: %{x}<br>${param2Name}: %{y}<br>${getMetricLabel(objective)}: %{z:.4f}<extra></extra>`,
    },
  ]

  return (
    <Box>
      <Plot data={data} layout={layout} config={{ displayModeBar: true }} style={{ width: '100%' }} />
    </Box>
  )
}
