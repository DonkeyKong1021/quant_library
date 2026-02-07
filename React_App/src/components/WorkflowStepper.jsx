import { Box, Typography, ButtonBase } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import { useThemeMode } from '../contexts/ThemeContext'

/**
 * WorkflowStepper - Minimal vertical stepper for multi-step workflows
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

  // Design tokens
  const circleSize = 24
  const lineWidth = 1
  const stepSpacing = 32

  return (
    <Box sx={{ py: 1 }}>
      {steps.map((step, index) => {
        const status = getStepStatus(step, index)
        const isCompleted = status === 'completed'
        const isActive = status === 'active'
        const isDisabled = status === 'disabled'
        const isLast = index === steps.length - 1

        // Color logic
        const circleColor = isActive
          ? 'primary.main'
          : isCompleted
            ? 'primary.main'
            : isDark
              ? 'rgba(255,255,255,0.25)'
              : 'rgba(0,0,0,0.2)'

        const lineColor = isCompleted
          ? isDark ? 'primary.dark' : 'primary.main'
          : isDark
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(0,0,0,0.08)'

        const labelColor = isActive
          ? 'primary.main'
          : isDisabled
            ? 'text.disabled'
            : 'text.primary'

        return (
          <Box
            key={step.id}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              position: 'relative',
              minHeight: isLast ? 'auto' : stepSpacing,
            }}
          >
            {/* Circle and connector container */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                mr: 1.5,
              }}
            >
              {/* Step circle */}
              <ButtonBase
                onClick={() => !isDisabled && onStepClick && onStepClick(step.id)}
                disabled={isDisabled}
                sx={{
                  width: circleSize,
                  height: circleSize,
                  borderRadius: '50%',
                  border: `2px solid`,
                  borderColor: circleColor,
                  backgroundColor: isCompleted
                    ? 'primary.main'
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isDisabled ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  '&:hover': !isDisabled ? {
                    borderColor: 'primary.main',
                    backgroundColor: isCompleted
                      ? 'primary.dark'
                      : isDark
                        ? 'rgba(59, 130, 246, 0.08)'
                        : 'rgba(59, 130, 246, 0.04)',
                  } : {},
                }}
              >
                {isCompleted && (
                  <CheckIcon
                    sx={{
                      fontSize: 14,
                      color: 'white',
                    }}
                  />
                )}
              </ButtonBase>

              {/* Connector line */}
              {!isLast && (
                <Box
                  sx={{
                    width: lineWidth,
                    flexGrow: 1,
                    minHeight: stepSpacing - circleSize,
                    backgroundColor: lineColor,
                    transition: 'background-color 0.15s ease',
                  }}
                />
              )}
            </Box>

            {/* Step label */}
            <Typography
              variant="body2"
              sx={{
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.8125rem',
                color: labelColor,
                lineHeight: `${circleSize}px`,
                transition: 'color 0.15s ease',
                opacity: isDisabled ? 0.5 : 1,
                letterSpacing: '-0.01em',
              }}
            >
              {step.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
