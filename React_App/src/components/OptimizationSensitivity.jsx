import { useMemo } from 'react'
import { Box, Typography, Grid, Alert } from '@mui/material'
import Plot from 'react-plotly.js'
import { prepareSensitivityData, getMetricLabel } from '../utils/optimizationUtils'

export default function OptimizationSensitivity({
  results,
  parameters,
  objective,
  bestParameters,
}) {
  const sensitivityCharts = useMemo(() => {
    if (!results || results.length === 0 || !parameters || parameters.length === 0) {
      return []
    }

    return parameters.map((paramName) => {
      const data = prepareSensitivityData(results, paramName, objective, bestParameters)
      return { paramName, data }
    }).filter((chart) => chart.data !== null)
  }, [results, parameters, objective, bestParameters])

  if (sensitivityCharts.length === 0) {
    return (
      <Alert severity="info">
        Unable to generate sensitivity charts. Ensure optimization has completed successfully.
      </Alert>
    )
  }

  return (
    <Grid container spacing={3}>
      {sensitivityCharts.map(({ paramName, data }) => {
        const plotData = [
          {
            x: data.x,
            y: data.y,
            type: 'scatter',
            mode: 'lines+markers',
            name: getMetricLabel(objective),
            line: { color: '#1976d2', width: 2 },
            marker: { size: 6 },
          },
        ]

        const layout = {
          title: `${getMetricLabel(objective)} vs ${paramName}`,
          xaxis: {
            title: paramName,
          },
          yaxis: {
            title: getMetricLabel(objective),
          },
          width: null,
          height: 400,
          margin: { l: 60, r: 20, t: 60, b: 60 },
        }

        return (
          <Grid item xs={12} md={6} key={paramName}>
            <Box>
              <Plot
                data={plotData}
                layout={layout}
                config={{ displayModeBar: true }}
                style={{ width: '100%' }}
              />
            </Box>
          </Grid>
        )
      })}
    </Grid>
  )
}
