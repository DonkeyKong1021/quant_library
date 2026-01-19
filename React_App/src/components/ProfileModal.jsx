import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  TextField,
  Divider,
  IconButton,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeMode } from '../contexts/ThemeContext'
import CloseIcon from '@mui/icons-material/Close'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import BadgeIcon from '@mui/icons-material/Badge'

export default function ProfileModal({ open, onClose }) {
  const { isDark } = useThemeMode()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: isDark
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Profile
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Avatar
              sx={{
                width: 100,
                height: 100,
                mb: 2,
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
              }}
            >
              <PersonIcon sx={{ fontSize: 48 }} />
            </Avatar>
          </motion.div>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            QuantLib User
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quantitative Trader
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Display Name"
            defaultValue="QuantLib User"
            fullWidth
            InputProps={{
              startAdornment: (
                <BadgeIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
              ),
            }}
          />
          <TextField
            label="Email"
            defaultValue="user@quantlib.com"
            fullWidth
            InputProps={{
              startAdornment: (
                <EmailIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
              ),
            }}
          />
        </Box>

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.05)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.1)',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Profile features are for demonstration purposes. In a production app, this would
            connect to an authentication system.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  )
}
