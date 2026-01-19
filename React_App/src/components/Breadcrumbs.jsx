import { useLocation, Link as RouterLink } from 'react-router-dom'
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import HomeIcon from '@mui/icons-material/Home'

const routeLabels = {
  '/': 'Dashboard',
  '/backtest': 'Backtesting',
  '/backtest-history': 'Backtest History',
  '/data-explorer': 'Data Explorer',
  '/strategy-builder': 'Strategy Builder',
}

export default function Breadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  return (
    <MuiBreadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 2 }}
    >
      <Link
        component={RouterLink}
        to="/"
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: 'text.secondary',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        }}
      >
        <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
        Home
      </Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1
        const to = `/${pathnames.slice(0, index + 1).join('/')}`
        const label = routeLabels[to] || value.charAt(0).toUpperCase() + value.slice(1)

        return last ? (
          <Typography key={to} color="text.primary" sx={{ fontWeight: 500 }}>
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
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {label}
          </Link>
        )
      })}
    </MuiBreadcrumbs>
  )
}