import { useLocation, Link as RouterLink } from 'react-router-dom'
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import HomeIcon from '@mui/icons-material/Home'
import { routeLabels } from '../config/navigation'

export default function Breadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  return (
    <Box sx={{ mb: 3 }}>
      <MuiBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" sx={{ color: 'text.disabled' }} />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'nowrap',
          },
        }}
      >
        <Link
          component={RouterLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
            '&:hover': {
              color: 'primary.main',
              textDecoration: 'none',
            },
          }}
        >
          <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
          Home
        </Link>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1
          const to = `/${pathnames.slice(0, index + 1).join('/')}`
          const label = routeLabels[to] || value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ')

          return last ? (
            <Typography
              key={to}
              color="text.primary"
              sx={{
                fontWeight: 600,
                fontSize: '0.9375rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {label}
            </Typography>
          ) : (
            <Link
              component={RouterLink}
              to={to}
              key={to}
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                fontSize: '0.9375rem',
                transition: 'color 0.2s ease',
                '&:hover': {
                  color: 'primary.main',
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
  )
}