import { Box, Typography, Button } from '@mui/material'
import { motion } from 'framer-motion'
import { useThemeMode } from '../../contexts/ThemeContext'

// Icons for different empty state types
import SearchOffIcon from '@mui/icons-material/SearchOff'
import AssessmentIcon from '@mui/icons-material/Assessment'
import TimelineIcon from '@mui/icons-material/Timeline'
import StorageIcon from '@mui/icons-material/Storage'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import HistoryIcon from '@mui/icons-material/History'
import CodeIcon from '@mui/icons-material/Code'

const iconMap = {
  search: SearchOffIcon,
  chart: AssessmentIcon,
  data: StorageIcon,
  strategy: TimelineIcon,
  backtest: TrendingUpIcon,
  history: HistoryIcon,
  code: CodeIcon,
  default: AssessmentIcon,
}

/**
 * EmptyState - A professional empty state component with animation
 * 
 * @param {object} props
 * @param {string} props.type - Icon type: 'search', 'chart', 'data', 'strategy', 'backtest', 'history', 'code'
 * @param {string} props.title - Main title text
 * @param {string} props.description - Description text
 * @param {string} props.actionText - Button text (optional)
 * @param {function} props.onAction - Button click handler (optional)
 * @param {string} props.size - Size variant: 'small', 'medium', 'large'
 */
export default function EmptyState({
  type = 'default',
  title = 'No data available',
  description = 'There is nothing to display at the moment.',
  actionText,
  onAction,
  size = 'medium',
  icon: CustomIcon,
}) {
  const { isDark } = useThemeMode()
  const Icon = CustomIcon || iconMap[type] || iconMap.default

  const sizes = {
    small: { icon: 48, title: 'subtitle1', description: 'body2', spacing: 2 },
    medium: { icon: 64, title: 'h6', description: 'body1', spacing: 3 },
    large: { icon: 80, title: 'h5', description: 'body1', spacing: 4 },
  }

  const config = sizes[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: config.spacing * 2,
          px: config.spacing,
        }}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        >
          <Box
            sx={{
              width: config.icon * 1.5,
              height: config.icon * 1.5,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDark
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(124, 58, 237, 0.04) 100%)',
              mb: config.spacing,
            }}
          >
            <Icon
              sx={{
                fontSize: config.icon,
                color: isDark ? 'grey.500' : 'grey.400',
              }}
            />
          </Box>
        </motion.div>

        <Typography
          variant={config.title}
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            mb: 1,
          }}
        >
          {title}
        </Typography>

        <Typography
          variant={config.description}
          sx={{
            color: 'text.secondary',
            maxWidth: 400,
            mb: actionText ? config.spacing : 0,
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>

        {actionText && onAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="contained"
              onClick={onAction}
              sx={{ mt: 1 }}
            >
              {actionText}
            </Button>
          </motion.div>
        )}
      </Box>
    </motion.div>
  )
}
