import { motion } from 'framer-motion'

// Default page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -12,
  },
}

const pageTransition = {
  type: 'tween',
  ease: [0.4, 0, 0.2, 1], // Material ease
  duration: 0.25,
}

/**
 * PageTransition - Wrapper component for page-level animations
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.variant - Animation variant: 'fade', 'slide', 'scale'
 */
export default function PageTransition({
  children,
  variant = 'slide',
  className,
  style,
}) {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: pageVariants,
    scale: {
      initial: { opacity: 0, scale: 0.98 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.02 },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[variant] || variants.slide}
      transition={pageTransition}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/**
 * StaggerContainer - Container for staggered child animations
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.05,
  delay = 0,
  className,
  style,
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delay,
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/**
 * StaggerItem - Child component for use within StaggerContainer
 */
export function StaggerItem({ children, className, style }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 100,
            damping: 12,
          },
        },
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/**
 * FadeIn - Simple fade in animation wrapper
 */
export function FadeIn({ children, delay = 0, duration = 0.3, className, style }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration, ease: 'easeOut' }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/**
 * SlideIn - Slide in animation wrapper
 */
export function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.3,
  className,
  style,
}) {
  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        delay,
        duration,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}
