import { useState } from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Chip,
} from '@mui/material'
import StrategyTemplates from './StrategyTemplates'
import StrategyLibrary from './StrategyLibrary'

export default function StrategyBrowse({ onSelectTemplate, onSelectLibraryStrategy }) {
  const [subTab, setSubTab] = useState(0)

  return (
    <Box>
      <Tabs 
        value={subTab} 
        onChange={(e, newValue) => setSubTab(newValue)} 
        sx={{ mb: 2 }}
        variant="fullWidth"
      >
        <Tab label="Templates" />
        <Tab label="Library" />
      </Tabs>

      {subTab === 0 && (
        <StrategyTemplates onSelectTemplate={onSelectTemplate} />
      )}

      {subTab === 1 && (
        <StrategyLibrary onSelectStrategy={onSelectLibraryStrategy} />
      )}
    </Box>
  )
}
