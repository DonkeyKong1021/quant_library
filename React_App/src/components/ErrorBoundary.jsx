import React from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset)
      }

      return (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 600,
            mx: 'auto',
            mt: 4,
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {this.props.message ||
              'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.'}
          </Typography>
          {this.props.showDetails && this.state.error && (
            <Box
              sx={{
                p: 2,
                mb: 3,
                backgroundColor: 'error.light',
                borderRadius: 1,
                textAlign: 'left',
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                window.location.reload()
              }}
            >
              Reload Page
            </Button>
          </Box>
        </Paper>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
