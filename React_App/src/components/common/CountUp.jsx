import { useState, useEffect, useRef } from 'react'
import { Typography } from '@mui/material'
import { motion, useSpring, useTransform, useInView } from 'framer-motion'

/**
 * CountUp - Animated number counter component
 * 
 * @param {object} props
 * @param {number} props.value - Target value to count to
 * @param {string} props.prefix - Prefix string (e.g., '$')
 * @param {string} props.suffix - Suffix string (e.g., '%')
 * @param {number} props.decimals - Number of decimal places
 * @param {number} props.duration - Animation duration in seconds
 * @param {string} props.color - Text color (MUI color or CSS)
 * @param {string} props.variant - Typography variant
 */
export default function CountUp({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1,
  color,
  variant = 'h5',
  sx = {},
  ...props
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [hasAnimated, setHasAnimated] = useState(false)

  // Spring animation for smooth counting
  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration * 1000,
  })

  // Transform the spring value to the display value
  const displayValue = useTransform(spring, (latest) => {
    const factor = Math.pow(10, decimals)
    const rounded = Math.round(latest * factor) / factor
    return rounded.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  })

  // Start animation when in view
  useEffect(() => {
    if (isInView && !hasAnimated) {
      spring.set(value)
      setHasAnimated(true)
    }
  }, [isInView, hasAnimated, spring, value])

  // Update value if it changes after initial animation
  useEffect(() => {
    if (hasAnimated) {
      spring.set(value)
    }
  }, [value, hasAnimated, spring])

  return (
    <Typography
      ref={ref}
      component={motion.span}
      variant={variant}
      sx={{
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        color: color || 'text.primary',
        ...sx,
      }}
      {...props}
    >
      {prefix}
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </Typography>
  )
}

/**
 * Simple CountUp without spring (for faster animations)
 */
export function CountUpSimple({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 0.8,
  color,
  variant = 'h5',
  sx = {},
  ...props
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!isInView) return

    const startTime = performance.now()
    const startValue = 0
    const endValue = value

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      const current = startValue + (endValue - startValue) * easeProgress
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isInView, value, duration])

  const formattedValue = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <Typography
      ref={ref}
      variant={variant}
      sx={{
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        color: color || 'text.primary',
        ...sx,
      }}
      {...props}
    >
      {prefix}
      {formattedValue}
      {suffix}
    </Typography>
  )
}
