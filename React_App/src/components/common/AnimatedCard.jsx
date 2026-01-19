import { forwardRef } from 'react'
import { Card, CardContent } from '@mui/material'
import { motion } from 'framer-motion'
import { useThemeMode } from '../../contexts/ThemeContext'

// Motion-enhanced Card component
const MotionCard = motion(Card)

/**
 * AnimatedCard - A card component with entrance and hover animations
 * 
 * @param {object} props
 * @param {number} props.delay - Animation delay in seconds
 * @param {boolean} props.hover - Enable hover effects
 * @param {string} props.variant - Card variant: 'default', 'gradient', 'outlined'
 * @param {object} props.sx - Additional MUI sx styles
 * @param {React.ReactNode} props.children - Card content
 */
const AnimatedCard = forwardRef(function AnimatedCard(
  {
    children,
    delay = 0,
    hover = true,
    variant = 'default',
    gradient,
    onClick,
    sx = {},
    contentSx = {},
    ...props
  },
  ref
) {
  const { isDark } = useThemeMode()

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        delay,
      },
    },
  }

  const hoverVariants = hover
    ? {
        whileHover: {
          y: -4,
          transition: { type: 'spring', stiffness: 400, damping: 25 },
        },
        whileTap: onClick ? { scale: 0.98 } : {},
      }
    : {}

  const getVariantStyles = () => {
    switch (variant) {
      case 'gradient':
        return {
          background: gradient || (isDark
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(124, 58, 237, 0.02) 100%)'),
          border: '1px solid',
          borderColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.1)',
        }
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          border: '1px solid',
          borderColor: 'divider',
        }
      default:
        return {
          backgroundColor: 'background.paper',
          boxShadow: isDark
            ? '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
            : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        }
    }
  }

  // Check if height is set to enable full-height content
  const hasFullHeight = sx.height === '100%'

  return (
    <MotionCard
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      {...hoverVariants}
      onClick={onClick}
      elevation={0}
      sx={{
        ...getVariantStyles(),
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        display: hasFullHeight ? 'flex' : undefined,
        flexDirection: hasFullHeight ? 'column' : undefined,
        '&:hover': hover
          ? {
              boxShadow: isDark
                ? '0 10px 40px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)'
                : '0 10px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
              borderColor: variant === 'gradient'
                ? isDark
                  ? 'rgba(59, 130, 246, 0.3)'
                  : 'rgba(37, 99, 235, 0.2)'
                : undefined,
            }
          : {},
        ...sx,
      }}
      {...props}
    >
      <CardContent 
        sx={{ 
          p: 3, 
          '&:last-child': { pb: 3 }, 
          flex: hasFullHeight ? 1 : undefined,
          display: hasFullHeight ? 'flex' : undefined,
          flexDirection: hasFullHeight ? 'column' : undefined,
          ...contentSx 
        }}
      >
        {children}
      </CardContent>
    </MotionCard>
  )
})

export default AnimatedCard
