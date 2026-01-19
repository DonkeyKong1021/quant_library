import { Box, Container, Typography, Link, Grid } from '@mui/material'

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              QuantLib
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Professional quantitative trading library for backtesting and strategy development.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Resources
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Link href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                Documentation
              </Link>
              <Link href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                API Reference
              </Link>
              <Link href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                Examples
              </Link>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Support
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Link href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                Help Center
              </Link>
              <Link href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                Contact
              </Link>
              <Link href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                GitHub
              </Link>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Legal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Link href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                Privacy Policy
              </Link>
              <Link href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                Terms of Service
              </Link>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} QuantLib. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}