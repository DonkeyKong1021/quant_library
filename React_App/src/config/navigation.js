/**
 * Central navigation configuration
 * Single source of truth for navigation items, routes, icons, and metadata
 */

import HomeIcon from '@mui/icons-material/Home'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ExploreIcon from '@mui/icons-material/Explore'
import BuildIcon from '@mui/icons-material/Build'
import HistoryIcon from '@mui/icons-material/History'
import TuneIcon from '@mui/icons-material/Tune'

/**
 * Navigation items configuration
 * Each item includes path, label, icon, keyboard shortcut, and description
 */
export const navigationItems = [
  {
    text: 'Dashboard',
    icon: HomeIcon,
    path: '/',
    shortcut: '1',
    description: 'Overview and quick actions',
    group: 'main',
  },
  {
    text: 'Backtest',
    icon: TrendingUpIcon,
    path: '/backtest',
    shortcut: '2',
    description: 'Run strategy backtests',
    group: 'backtest',
  },
  {
    text: 'Backtest History',
    icon: HistoryIcon,
    path: '/backtest-history',
    shortcut: 'H',
    description: 'View and compare past backtests',
    group: 'backtest',
  },
  {
    text: 'Data Explorer',
    icon: ExploreIcon,
    path: '/data-explorer',
    shortcut: '3',
    description: 'Explore and analyze market data',
    group: 'main',
  },
  {
    text: 'Strategy Builder',
    icon: BuildIcon,
    path: '/strategy-builder',
    shortcut: '4',
    description: 'Create and edit trading strategies',
    group: 'main',
  },
  {
    text: 'Optimization',
    icon: TuneIcon,
    path: '/optimization',
    shortcut: '5',
    description: 'Optimize strategy parameters',
    group: 'backtest',
  },
]

/**
 * Route labels for breadcrumbs
 */
export const routeLabels = {
  '/': 'Dashboard',
  '/optimization': 'Optimization',
  '/backtest': 'Backtesting',
  '/backtest-history': 'Backtest History',
  '/data-explorer': 'Data Explorer',
  '/strategy-builder': 'Strategy Builder',
}

/**
 * Get navigation items by group
 */
export const getNavigationItemsByGroup = () => {
  const groups = {}
  navigationItems.forEach((item) => {
    if (!groups[item.group]) {
      groups[item.group] = []
    }
    groups[item.group].push(item)
  })
  return groups
}

/**
 * Get navigation item by path
 */
export const getNavigationItemByPath = (path) => {
  return navigationItems.find((item) => item.path === path)
}

/**
 * Get keyboard shortcut for a path
 */
export const getShortcutForPath = (path) => {
  const item = getNavigationItemByPath(path)
  return item?.shortcut || null
}
