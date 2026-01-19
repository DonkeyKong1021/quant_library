import { useNavigate } from 'react-router-dom'
import { Box, Typography, Button, Paper } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useThemeMode } from '../contexts/ThemeContext'

/**
 * RelatedPages component for cross-page discoverability
 * Displays related page links in a compact card format
 * 
 * @param {string} currentPath - Current route path
 * @param {Array} relatedItems - Array of { path, label, description, icon }
 */
export default function RelatedPages({ currentPath, relatedItems = [] }) {
  const navigate = useNavigate()
  const { isDark } = useThemeMode()

  if (!relatedItems || relatedItems.length === 0) {
    return null
  }

  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 2,
        backgroundColor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
        mt: 3,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Related Pages
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {relatedItems.map((item, index) => {
          const IconComponent = item.icon
          return (
            <Button
              key={index}
              variant="outlined"
              startIcon={IconComponent ? <IconComponent /> : undefined}
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(item.path)}
              size="medium"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none',
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  backgroundColor: isDark
                    ? 'rgba(59, 130, 246, 0.1)'
                    : 'rgba(37, 99, 235, 0.06)',
                },
              }}
            >
              {item.label}
            </Button>
          )
        })}
      </Box>
    </Paper>
  )
}
