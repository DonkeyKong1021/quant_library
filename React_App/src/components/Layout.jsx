import { Box, CssBaseline } from '@mui/material'
import Header from './Header'
import Footer from './Footer'
import Breadcrumbs from './Breadcrumbs'

const headerHeight = 64

export default function Layout({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Header />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: `${headerHeight}px`,
          p: { xs: 2, sm: 3, md: 4 },
          backgroundColor: 'background.default',
          minHeight: `calc(100vh - ${headerHeight}px)`,
          display: 'flex',
          flexDirection: 'column',
          backgroundImage: 'linear-gradient(to bottom, rgba(248, 250, 252, 0.4), rgba(255, 255, 255, 0.8))',
        }}
      >
        <Breadcrumbs />
        <Box sx={{ flex: 1 }}>{children}</Box>
      </Box>

      <Footer />
    </Box>
  )
}