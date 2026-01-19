import { useState, useCallback } from 'react'
import { Snackbar, Alert } from '@mui/material'

/**
 * Custom hook for managing notifications with Material-UI Snackbar
 * Simple implementation that shows one notification at a time
 */
export function useNotifications() {
  const [open, setOpen] = useState(false)
  const [notification, setNotification] = useState({ message: '', severity: 'info' })

  const showNotification = useCallback((message, severity = 'info') => {
    setNotification({ message, severity })
    setOpen(true)
  }, [])

  const showSuccess = useCallback((message) => {
    showNotification(message, 'success')
  }, [showNotification])

  const showError = useCallback((message) => {
    showNotification(message, 'error')
  }, [showNotification])

  const showWarning = useCallback((message) => {
    showNotification(message, 'warning')
  }, [showNotification])

  const showInfo = useCallback((message) => {
    showNotification(message, 'info')
  }, [showNotification])

  const handleClose = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setOpen(false)
  }, [])

  const NotificationComponent = (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity={notification.severity}
        sx={{ width: '100%' }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  )

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    NotificationComponent,
  }
}
