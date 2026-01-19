import { Box, Typography, Button } from '@mui/material'
import { motion } from 'framer-motion'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import { useThemeMode } from '../contexts/ThemeContext'

/**
 * WorkflowStepper component for displaying multi-step workflows
 * Vertical stepper with empty circles connected by a line
 * 
 * @param {Array} steps - Array of { id, label, completed, disabled? }
 * @param {string} currentStep - ID of the currently active step
 * @param {Function} onStepClick - Callback when a step is clicked
 */
export default function WorkflowStepper({ steps = [], currentStep, onStepClick }) {
  const { isDark } = useThemeMode()

  if (!steps || steps.length === 0) {
    return null
  }

  const getStepStatus = (step, index) => {
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    
    if (step.completed) return 'completed'
    if (step.id === currentStep) return 'active'
    if (step.disabled) return 'disabled'
    if (currentIndex !== -1 && index < currentIndex) return 'completed'
    return 'pending'
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        mb: 3,
        position: 'relative',
      }}
    >
      {steps.map((step, index) => {
        const status = getStepStatus(step, index)
        const isCompleted = status === 'completed'
        const isActive = status === 'active'
        const isDisabled = status === 'disabled'
        const isPending = status === 'pending'
        const isLast = index === steps.length - 1

        return (
          <Box
            key={step.id}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              position: 'relative',
              pb: isLast ? 0 : 3,
            }}
          >
            {/* Step circle */}
            <Box
              sx={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Button
                component={motion.button}
                whileHover={!isDisabled ? { scale: 1.1 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                onClick={() => !isDisabled && onStepClick && onStepClick(step.id)}
                disabled={isDisabled}
                sx={{
                  minWidth: 32,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  padding: 0,
                  border: `2px solid ${
                    isDisabled
                      ? isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.12)'
                      : isActive
                        ? 'primary.main'
                        : isCompleted
                          ? 'success.main'
                          : isDark
                            ? 'rgba(255,255,255,0.3)'
                            : 'rgba(0,0,0,0.26)'
                  }`,
                  backgroundColor: 'transparent',
                  color: isDisabled
                    ? 'text.disabled'
                    : isActive
                      ? 'primary.main'
                      : isCompleted
                        ? 'success.main'
                        : isDark
                          ? 'rgba(255,255,255,0.5)'
                          : 'rgba(0,0,0,0.38)',
                  '&:hover': {
                    backgroundColor: isDisabled
                      ? 'transparent'
                      : isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(0,0,0,0.04)',
                    borderColor: isDisabled
                      ? undefined
                      : isActive
                        ? 'primary.dark'
                        : isCompleted
                          ? 'success.dark'
                          : 'primary.main',
                  },
                  transition: 'all 0.2s ease',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  boxShadow: 'none',
                }}
              >
                {isCompleted ? (
                  <CheckCircleIcon 
                    sx={{ 
                      fontSize: 20,
                      color: 'success.main',
                    }} 
                  />
                ) : (
                  <RadioButtonUncheckedIcon
                    sx={{
                      fontSize: isActive ? 20 : 18,
                      color: 'inherit',
                    }}
                  />
                )}
              </Button>
            </Box>

            {/* Connector line */}
            {!isLast && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: 32,
                  width: 2,
                  height: 'calc(100% - 32px)',
                  backgroundColor: isCompleted || isActive
                    ? isCompleted
                      ? 'success.main'
                      : 'primary.main'
                    : isDark
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(0,0,0,0.12)',
                  zIndex: 0,
                  transition: 'background-color 0.3s ease',
                }}
              />
            )}

            {/* Step label */}
            <Box
              sx={{
                ml: 2,
                pt: 0.5,
                flex: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.875rem',
                  color: isDisabled ? 'text.disabled' : isActive ? 'primary.main' : 'text.primary',
                  transition: 'color 0.2s ease',
                }}
              >
                {step.label}
              </Typography>
              {step.description && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    color: isDisabled ? 'text.disabled' : 'text.secondary',
                    mt: 0.25,
                    display: 'block',
                  }}
                >
                  {step.description}
                </Typography>
              )}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
