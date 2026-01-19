import { useState } from 'react'
import { Box, Container, Typography, Link, Grid, IconButton, Tooltip, Button } from '@mui/material'
import { motion } from 'framer-motion'
import { useThemeMode } from '../contexts/ThemeContext'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import GitHubIcon from '@mui/icons-material/GitHub'
import DescriptionIcon from '@mui/icons-material/Description'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import BugReportIcon from '@mui/icons-material/BugReport'
import IssueReportDialog from './IssueReportDialog'

// Get API base URL for API docs link
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_DOCS_URL = `${API_BASE_URL}/docs`

// GitHub repository URL
const GITHUB_REPO = 'https://github.com/DonkeyKong1021/quant_library'

const footerLinks = {
  resources: [
    { label: 'Documentation', href: `${GITHUB_REPO}#readme`, external: true },
    { label: 'API Reference', href: API_DOCS_URL, external: true },
    { label: 'Examples', href: `${GITHUB_REPO}/tree/main/examples`, external: true },
  ],
  support: [
    { label: 'Help Center', href: `${GITHUB_REPO}/blob/main/CONTRIBUTING.md`, external: true },
    { label: 'Issues', href: `${GITHUB_REPO}/issues`, external: true },
    { label: 'GitHub', href: GITHUB_REPO, external: true },
  ],
  legal: [
    { label: 'Privacy Policy', href: `${GITHUB_REPO}/blob/main/PRIVACY_POLICY.md`, external: true },
    { label: 'Terms of Service', href: `${GITHUB_REPO}/blob/main/TERMS_OF_SERVICE.md`, external: true },
  ],
}

function FooterLink({ href, children, external }) {
  const { isDark } = useThemeMode()
  
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      sx={{
        color: 'text.secondary',
        fontSize: '0.875rem',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        transition: 'color 0.2s ease',
        '&:hover': {
          color: 'primary.main',
        },
      }}
    >
      {children}
      {external && (
        <OpenInNewIcon sx={{ fontSize: 12, opacity: 0.6 }} />
      )}
    </Link>
  )
}

export default function Footer() {
  const { isDark } = useThemeMode()
  const currentYear = new Date().getFullYear()
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 5,
        mt: 'auto',
        transition: 'background-color 0.3s ease',
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Brand Column */}
          <Grid item xs={12} sm={6} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              viewport={{ once: true }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 20, color: '#fff' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                  QuantLib
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2.5, maxWidth: 280, lineHeight: 1.7 }}
              >
                Professional quantitative trading library for backtesting and strategy development.
                Build, test, and optimize your trading strategies with confidence.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="View on GitHub" arrow>
                  <IconButton
                    component="a"
                    href={GITHUB_REPO}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      '&:hover': {
                        color: 'text.primary',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                      },
                    }}
                  >
                    <GitHubIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="API Documentation" arrow>
                  <IconButton
                    component="a"
                    href={API_DOCS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      '&:hover': {
                        color: 'text.primary',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                      },
                    }}
                  >
                    <DescriptionIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </motion.div>
          </Grid>

          {/* Resources */}
          <Grid item xs={6} sm={3} md={2}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}
              >
                Resources
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {footerLinks.resources.map((link) => (
                  <FooterLink key={link.label} href={link.href} external={link.external}>
                    {link.label}
                  </FooterLink>
                ))}
              </Box>
            </motion.div>
          </Grid>

          {/* Support */}
          <Grid item xs={6} sm={3} md={2}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              viewport={{ once: true }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}
              >
                Support
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {footerLinks.support.map((link) => (
                  <FooterLink key={link.label} href={link.href} external={link.external}>
                    {link.label}
                  </FooterLink>
                ))}
                <Button
                  onClick={() => setIssueDialogOpen(true)}
                  startIcon={<BugReportIcon />}
                  sx={{
                    justifyContent: 'flex-start',
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    textTransform: 'none',
                    '&:hover': {
                      color: 'primary.main',
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  Report an Issue
                </Button>
              </Box>
            </motion.div>
          </Grid>

          {/* Legal */}
          <Grid item xs={6} sm={3} md={2}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}
              >
                Legal
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {footerLinks.legal.map((link) => (
                  <FooterLink key={link.label} href={link.href} external={link.external}>
                    {link.label}
                  </FooterLink>
                ))}
              </Box>
            </motion.div>
          </Grid>

          {/* Status Badge */}
          <Grid item xs={6} sm={3} md={2}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              viewport={{ once: true }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}
              >
                Status
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  backgroundColor: isDark ? 'rgba(52, 211, 153, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 500, color: 'success.main' }}
                >
                  All Systems Operational
                </Typography>
              </Box>
            </motion.div>
          </Grid>
        </Grid>

        {/* Bottom Bar */}
        <Box
          sx={{
            mt: 5,
            pt: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'center' },
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} QuantLib. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
            Built with React, MUI, and Plotly
          </Typography>
        </Box>
      </Container>

      {/* Issue Report Dialog */}
      <IssueReportDialog open={issueDialogOpen} onClose={() => setIssueDialogOpen(false)} />
    </Box>
  )
}
