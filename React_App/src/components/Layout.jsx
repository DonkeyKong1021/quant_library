import { Box, CssBaseline } from '@mui/material'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Breadcrumbs from './Breadcrumbs'
import { useThemeMode } from '../contexts/ThemeContext'

const headerHeight = 64

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -8,
  },
}

const pageTransition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.2,
}

export default function Layout({ children }) {
  const location = useLocation()
  const { isDark } = useThemeMode()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        transition: 'background-color 0.3s ease',
      }}
    >
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
          position: 'relative',
          overflow: 'hidden',
          transition: 'background-color 0.3s ease',
          // Subtle gradient background
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '400px',
            background: isDark
              ? 'radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at 50% 0%, rgba(37, 99, 235, 0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
            transition: 'background 0.3s ease',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Breadcrumbs />
        </Box>
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
          style={{ flex: 1, position: 'relative', zIndex: 1 }}
        >
          {children}
        </motion.div>
      </Box>

      <Footer />
    </Box>
  )
}
