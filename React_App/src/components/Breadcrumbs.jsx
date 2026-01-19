import { useLocation, Link as RouterLink } from 'react-router-dom'
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box, Chip } from '@mui/material'
import { motion } from 'framer-motion'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import HomeIcon from '@mui/icons-material/Home'
import { routeLabels } from '../config/navigation'
import { useThemeMode } from '../contexts/ThemeContext'

export default function Breadcrumbs() {
  const location = useLocation()
  const { isDark } = useThemeMode()
  const pathnames = location.pathname.split('/').filter((x) => x)

  // Don't show breadcrumbs on home page
  if (pathnames.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Box sx={{ mb: 3 }}>
        <MuiBreadcrumbs
          separator={
            <NavigateNextIcon
              fontSize="small"
              sx={{ color: 'text.disabled', fontSize: 16 }}
            />
          }
          aria-label="breadcrumb"
          sx={{
            '& .MuiBreadcrumbs-ol': {
              flexWrap: 'nowrap',
            },
            '& .MuiBreadcrumbs-li': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
        >
          <Link
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'text.secondary',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              px: 1,
              py: 0.5,
              borderRadius: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                color: 'primary.main',
                backgroundColor: isDark
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'rgba(37, 99, 235, 0.06)',
                textDecoration: 'none',
              },
            }}
          >
            <HomeIcon sx={{ fontSize: 16 }} />
            Home
          </Link>
          {pathnames.map((value, index) => {
            const last = index === pathnames.length - 1
            const to = `/${pathnames.slice(0, index + 1).join('/')}`
            const label =
              routeLabels[to] ||
              value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ')

            return last ? (
              <Chip
                key={to}
                label={label}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  height: 28,
                  backgroundColor: isDark
                    ? 'rgba(59, 130, 246, 0.15)'
                    : 'rgba(37, 99, 235, 0.08)',
                  color: 'primary.main',
                  border: '1px solid',
                  borderColor: isDark
                    ? 'rgba(59, 130, 246, 0.25)'
                    : 'rgba(37, 99, 235, 0.15)',
                  '& .MuiChip-label': {
                    px: 1.5,
                  },
                }}
              />
            ) : (
              <Link
                component={RouterLink}
                to={to}
                key={to}
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: isDark
                      ? 'rgba(59, 130, 246, 0.1)'
                      : 'rgba(37, 99, 235, 0.06)',
                    textDecoration: 'none',
                  },
                }}
              >
                {label}
              </Link>
            )
          })}
        </MuiBreadcrumbs>
      </Box>
    </motion.div>
  )
}
