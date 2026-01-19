import { createTheme, alpha } from '@mui/material/styles'

// Design tokens for consistent styling
export const designTokens = {
  colors: {
    primary: { light: '#2563eb', dark: '#3b82f6' },
    secondary: { light: '#7c3aed', dark: '#8b5cf6' },
    success: { light: '#10b981', dark: '#34d399' },
    error: { light: '#ef4444', dark: '#f87171' },
    warning: { light: '#f59e0b', dark: '#fbbf24' },
    info: { light: '#06b6d4', dark: '#22d3ee' },
    chart: {
      equity: { light: '#2563eb', dark: '#60a5fa' },
      benchmark: { light: '#f59e0b', dark: '#fbbf24' },
      drawdown: { light: '#ef4444', dark: '#f87171' },
      positive: { light: '#10b981', dark: '#34d399' },
      negative: { light: '#ef4444', dark: '#f87171' },
      grid: { light: 'rgba(0, 0, 0, 0.06)', dark: 'rgba(255, 255, 255, 0.06)' },
    },
  },
  shadows: {
    card: {
      light: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
      dark: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
    },
    cardHover: {
      light: '0 10px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
      dark: '0 10px 40px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)',
    },
    elevated: {
      light: '0 4px 20px rgba(0,0,0,0.1)',
      dark: '0 4px 20px rgba(0,0,0,0.4)',
    },
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
}

// Shared component overrides
const getComponentOverrides = (mode) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        transition: 'background-color 0.2s ease, color 0.2s ease',
      },
      '*::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '*::-webkit-scrollbar-track': {
        background: mode === 'dark' ? '#1e293b' : '#f1f5f9',
        borderRadius: '4px',
      },
      '*::-webkit-scrollbar-thumb': {
        background: mode === 'dark' ? '#475569' : '#cbd5e1',
        borderRadius: '4px',
        '&:hover': {
          background: mode === 'dark' ? '#64748b' : '#94a3b8',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: designTokens.borderRadius.md,
        transition: `box-shadow ${designTokens.transitions.normal}, transform ${designTokens.transitions.normal}`,
        backgroundImage: 'none',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: designTokens.borderRadius.md,
        backgroundImage: 'none',
        transition: `background-color ${designTokens.transitions.normal}, box-shadow ${designTokens.transitions.normal}`,
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        padding: '10px 20px',
        fontWeight: 600,
        textTransform: 'none',
        transition: `all ${designTokens.transitions.normal}`,
        boxShadow: 'none',
        '&:hover': {
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      },
      contained: {
        boxShadow: mode === 'dark' 
          ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
          : '0 2px 8px rgba(37, 99, 235, 0.25)',
        '&:hover': {
          boxShadow: mode === 'dark'
            ? '0 4px 16px rgba(0, 0, 0, 0.4)'
            : '0 4px 16px rgba(37, 99, 235, 0.35)',
        },
      },
      outlined: {
        borderWidth: 1.5,
        '&:hover': {
          borderWidth: 1.5,
          backgroundColor: mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(37, 99, 235, 0.04)',
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 10,
          transition: `all ${designTokens.transitions.normal}`,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? '#64748b' : '#94a3b8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      root: {
        borderRadius: 10,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 500,
        transition: `all ${designTokens.transitions.fast}`,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '0.9375rem',
        minHeight: 48,
        transition: `all ${designTokens.transitions.normal}`,
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 10,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 8,
        fontSize: '0.8125rem',
        padding: '8px 12px',
        backgroundColor: mode === 'dark' ? '#334155' : '#1e293b',
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
        marginTop: 8,
        boxShadow: mode === 'dark'
          ? '0 10px 40px rgba(0,0,0,0.5)'
          : '0 10px 40px rgba(0,0,0,0.15)',
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        margin: '2px 6px',
        padding: '8px 12px',
        transition: `background-color ${designTokens.transitions.fast}`,
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        transition: `all ${designTokens.transitions.normal}`,
        '&:hover': {
          transform: 'scale(1.05)',
        },
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        height: 6,
      },
    },
  },
  MuiSkeleton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
})

// Light theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: designTokens.colors.primary.light,
      light: '#3b82f6',
      dark: '#1e40af',
      contrastText: '#fff',
    },
    secondary: {
      main: designTokens.colors.secondary.light,
      light: '#8b5cf6',
      dark: '#6d28d9',
      contrastText: '#fff',
    },
    success: {
      main: designTokens.colors.success.light,
      light: '#34d399',
      dark: '#059669',
    },
    error: {
      main: designTokens.colors.error.light,
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: designTokens.colors.warning.light,
      light: '#fbbf24',
      dark: '#d97706',
    },
    info: {
      main: designTokens.colors.info.light,
      light: '#22d3ee',
      dark: '#0891b2',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      disabled: 'rgba(15, 23, 42, 0.38)',
    },
    divider: 'rgba(15, 23, 42, 0.08)',
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.01em' },
    h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.5 },
    subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.57 },
    body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600 },
    caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.66 },
  },
  shape: { borderRadius: 12 },
  spacing: 8,
  components: getComponentOverrides('light'),
})

// Dark theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: designTokens.colors.primary.dark,
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#fff',
    },
    secondary: {
      main: designTokens.colors.secondary.dark,
      light: '#a78bfa',
      dark: '#7c3aed',
      contrastText: '#fff',
    },
    success: {
      main: designTokens.colors.success.dark,
      light: '#6ee7b7',
      dark: '#10b981',
    },
    error: {
      main: designTokens.colors.error.dark,
      light: '#fca5a5',
      dark: '#ef4444',
    },
    warning: {
      main: designTokens.colors.warning.dark,
      light: '#fde68a',
      dark: '#f59e0b',
    },
    info: {
      main: designTokens.colors.info.dark,
      light: '#67e8f9',
      dark: '#06b6d4',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
      disabled: 'rgba(241, 245, 249, 0.38)',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.01em' },
    h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.5 },
    subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.57 },
    body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600 },
    caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.66 },
  },
  shape: { borderRadius: 12 },
  spacing: 8,
  components: getComponentOverrides('dark'),
})

export default { lightTheme, darkTheme, designTokens }
