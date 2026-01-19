import { Box, Typography } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import { useThemeMode } from '../../contexts/ThemeContext'

export default function StepHeader({ stepNumber, label, status = 'pending', showConnector = false }) {
  const { isDark } = useThemeMode()
  
  const isActive = status === 'active'
  const isCompleted = status === 'completed'
  const isDisabled = status === 'disabled'

  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', mb: 3 }}>
      {/* Step circle */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDisabled
            ? isDark
              ? 'rgba(255,255,255,0.04)'
              : 'action.disabledBackground'
            : isActive
              ? 'primary.main'
              : isCompleted
                ? 'success.main'
                : isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.06)',
          color: isDisabled
            ? 'text.disabled'
            : isActive || isCompleted
              ? 'white'
              : 'text.secondary',
          fontWeight: 600,
          fontSize: '1rem',
          flexShrink: 0,
          transition: 'all 0.2s ease',
          boxShadow: isActive
            ? '0 2px 12px rgba(37, 99, 235, 0.3)'
            : isCompleted
              ? '0 2px 12px rgba(16, 185, 129, 0.25)'
              : 'none',
          border: `2px solid ${
            isDisabled
              ? 'transparent'
              : isActive
                ? 'primary.main'
                : isCompleted
                  ? 'success.main'
                  : isDark
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(0,0,0,0.1)'
          }`,
        }}
      >
        <AnimatePresence mode="wait">
          {isCompleted ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <CheckCircleIcon sx={{ fontSize: 22 }} />
            </motion.div>
          ) : isActive ? (
            <motion.div
              key="active"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <PlayCircleIcon sx={{ fontSize: 22 }} />
            </motion.div>
          ) : (
            <motion.span
              key="number"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {stepNumber}
            </motion.span>
          )}
        </AnimatePresence>
      </Box>

      {/* Label */}
      <Typography
        variant="h6"
        sx={{
          ml: 2,
          fontWeight: 600,
          color: isDisabled ? 'text.disabled' : 'text.primary',
          transition: 'color 0.2s ease',
        }}
      >
        {label}
      </Typography>

      {/* Connector line - extends down */}
      {showConnector && (
        <Box
          sx={{
            position: 'absolute',
            left: 20,
            top: 40,
            width: 2,
            height: 'calc(100vh)',
            backgroundColor: isCompleted
              ? 'success.main'
              : isDark
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.1)',
            transition: 'background-color 0.3s ease',
            zIndex: 0,
          }}
        />
      )}
    </Box>
  )
}
