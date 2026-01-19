import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  IconButton,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import BugReportIcon from '@mui/icons-material/BugReport'
import SendIcon from '@mui/icons-material/Send'

export default function IssueReportDialog({ open, onClose, initialError = null, initialErrorInfo = null }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [issueType, setIssueType] = useState('bug')
  
  // Auto-populate from error if provided
  useEffect(() => {
    if (initialError && open) {
      const errorMessage = initialError.message || initialError.toString() || 'Unknown error'
      setTitle(`Error: ${errorMessage.substring(0, 150)}`)
      setIssueType('bug')
      setSeverity('high')
      
      // Build description from error details (plain text, backend will format it)
      let errorDescription = `Error Message: ${errorMessage}\n\n`
      
      if (initialError.stack) {
        errorDescription += `Stack Trace:\n${initialError.stack}\n\n`
      }
      
      if (initialErrorInfo?.componentStack) {
        errorDescription += `Component Stack:\n${initialErrorInfo.componentStack}\n\n`
      }
      
      errorDescription += `Page URL: ${window.location.href}\n`
      errorDescription += `User Agent: ${navigator.userAgent}\n`
      errorDescription += `Timestamp: ${new Date().toISOString()}\n`
      
      setDescription(errorDescription)
      setExpectedBehavior('Application should function normally without errors')
      setActualBehavior(`Application crashed with error: ${errorMessage}`)
    }
  }, [initialError, initialErrorInfo, open])
  const [severity, setSeverity] = useState('medium')
  const [stepsToReproduce, setStepsToReproduce] = useState([''])
  const [expectedBehavior, setExpectedBehavior] = useState('')
  const [actualBehavior, setActualBehavior] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [environment, setEnvironment] = useState({
    browser: navigator.userAgent.split(' ')[0] || 'Unknown',
    os: navigator.platform || 'Unknown',
    url: window.location.href,
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [issueUrl, setIssueUrl] = useState(null)

  const issueTypes = [
    { value: 'bug', label: 'Bug' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'performance', label: 'Performance' },
    { value: 'ui_ux', label: 'UI/UX' },
    { value: 'other', label: 'Other' },
  ]

  const severityLevels = [
    { value: 'low', label: 'Low', color: 'success' },
    { value: 'medium', label: 'Medium', color: 'warning' },
    { value: 'high', label: 'High', color: 'error' },
    { value: 'critical', label: 'Critical', color: 'error' },
  ]

  const handleClose = () => {
    // Reset form (but don't reset if we have an initial error - let user keep the pre-filled data if they reopen)
    if (!initialError) {
      setTitle('')
      setDescription('')
      setIssueType('bug')
      setSeverity('medium')
      setStepsToReproduce([''])
      setExpectedBehavior('')
      setActualBehavior('')
      setAdditionalInfo('')
      setUserEmail('')
    }
    setError(null)
    setSuccess(false)
    setIssueUrl(null)
    onClose()
  }

  const handleAddStep = () => {
    setStepsToReproduce([...stepsToReproduce, ''])
  }

  const handleRemoveStep = (index) => {
    if (stepsToReproduce.length > 1) {
      setStepsToReproduce(stepsToReproduce.filter((_, i) => i !== index))
    }
  }

  const handleStepChange = (index, value) => {
    const newSteps = [...stepsToReproduce]
    newSteps[index] = value
    setStepsToReproduce(newSteps)
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!description.trim()) {
      setError('Description is required')
      return
    }
    if (title.length < 5) {
      setError('Title must be at least 5 characters')
      return
    }
    if (description.length < 10) {
      setError('Description must be at least 10 characters')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { issueService } = await import('../services/issueService')
      
      // Filter out empty steps
      const steps = stepsToReproduce.filter(step => step.trim() !== '')
      
      const issueData = {
        title: title.trim(),
        description: description.trim(),
        issue_type: issueType,
        severity: severity,
        environment: environment,
        steps_to_reproduce: steps.length > 0 ? steps : undefined,
        expected_behavior: expectedBehavior.trim() || undefined,
        actual_behavior: actualBehavior.trim() || undefined,
        additional_info: additionalInfo.trim() || undefined,
        user_email: userEmail.trim() || undefined,
      }

      const response = await issueService.logIssue(issueData)
      
      setSuccess(true)
      setIssueUrl(response.issue_url)
      
      // Close after 3 seconds if issue URL is available
      if (response.issue_url) {
        setTimeout(() => {
          handleClose()
        }, 3000)
      }
    } catch (err) {
      console.error('Error submitting issue:', err)
      setError(err.message || 'Failed to submit issue. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReportIcon />
            <Typography variant="h6">Report an Issue</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {success && issueUrl && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Issue reported successfully!{' '}
            <a href={issueUrl} target="_blank" rel="noopener noreferrer">
              View on GitHub
            </a>
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Issue Type and Severity */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Issue Type</InputLabel>
              <Select value={issueType} onChange={(e) => setIssueType(e.target.value)} label="Issue Type">
                {issueTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select value={severity} onChange={(e) => setSeverity(e.target.value)} label="Severity">
                {severityLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    <Chip label={level.label} color={level.color} size="small" />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Title */}
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            helperText="Brief description of the issue"
            disabled={loading || success}
          />

          {/* Description */}
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            multiline
            rows={4}
            fullWidth
            helperText="Detailed description of the issue"
            disabled={loading || success}
          />

          {/* Steps to Reproduce */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Steps to Reproduce (Optional)
            </Typography>
            {stepsToReproduce.map((step, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  placeholder={`Step ${index + 1}`}
                  fullWidth
                  size="small"
                  disabled={loading || success}
                />
                {stepsToReproduce.length > 1 && (
                  <Button
                    onClick={() => handleRemoveStep(index)}
                    size="small"
                    disabled={loading || success}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            ))}
            <Button
              onClick={handleAddStep}
              size="small"
              disabled={loading || success}
              sx={{ mt: 1 }}
            >
              Add Step
            </Button>
          </Box>

          <Divider />

          {/* Expected vs Actual Behavior */}
          <TextField
            label="Expected Behavior (Optional)"
            value={expectedBehavior}
            onChange={(e) => setExpectedBehavior(e.target.value)}
            multiline
            rows={2}
            fullWidth
            disabled={loading || success}
          />

          <TextField
            label="Actual Behavior (Optional)"
            value={actualBehavior}
            onChange={(e) => setActualBehavior(e.target.value)}
            multiline
            rows={2}
            fullWidth
            disabled={loading || success}
          />

          {/* Additional Info */}
          <TextField
            label="Additional Information (Optional)"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            multiline
            rows={3}
            fullWidth
            disabled={loading || success}
          />

          {/* User Email */}
          <TextField
            label="Email (Optional)"
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            fullWidth
            helperText="Optional - for follow-up communication"
            disabled={loading || success}
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {success ? 'Close' : 'Cancel'}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          disabled={loading || success || !title.trim() || !description.trim()}
        >
          {loading ? 'Submitting...' : 'Submit Issue'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
