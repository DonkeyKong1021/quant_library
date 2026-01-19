import { useState, useEffect, useRef } from 'react'
import { Box, Typography, Button, Paper, useTheme, useMediaQuery, Select, MenuItem, FormControl } from '@mui/material'
import { useThemeMode } from '../contexts/ThemeContext'

/**
 * SectionNavigation component for table of contents / section navigation
 * Highlights active section based on scroll position
 * 
 * @param {Array} sections - Array of { id, label, icon? }
 * @param {string} orientation - 'vertical' (sidebar) or 'horizontal' (mobile)
 */
export default function SectionNavigation({ sections = [], orientation = 'vertical' }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { isDark } = useThemeMode()
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '')
  const observerRef = useRef(null)

  useEffect(() => {
    if (!sections || sections.length === 0) return

    // Create IntersectionObserver to detect active section
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    }

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }, observerOptions)

    // Observe all sections
    sections.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element) {
        observerRef.current.observe(element)
      }
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [sections])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 100 // Account for header
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
      setActiveSection(sectionId)
    }
  }

  if (!sections || sections.length === 0) {
    return null
  }

  // Mobile: Use select dropdown
  if (isMobile || orientation === 'horizontal') {
    return (
      <FormControl size="small" sx={{ minWidth: 200, mb: 2 }}>
        <Select
          value={activeSection}
          onChange={(e) => scrollToSection(e.target.value)}
          sx={{
            fontSize: '0.875rem',
            '& .MuiSelect-select': {
              py: 1,
            },
          }}
        >
          {sections.map((section) => (
            <MenuItem key={section.id} value={section.id}>
              {section.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  }

  // Desktop: Use vertical sidebar
  return (
    <Paper
      sx={{
        position: 'sticky',
        top: 100,
        p: 2,
        borderRadius: 2,
        backgroundColor: isDark
          ? 'rgba(255, 255, 255, 0.02)'
          : 'rgba(0, 0, 0, 0.02)',
        border: '1px solid',
        borderColor: 'divider',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
      }}
      elevation={0}
    >
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 600,
          mb: 1.5,
          fontSize: '0.8125rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'text.secondary',
        }}
      >
        Sections
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {sections.map((section) => {
          const isActive = activeSection === section.id
          const IconComponent = section.icon

          return (
            <Button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              startIcon={IconComponent ? <IconComponent sx={{ fontSize: 16 }} /> : undefined}
              sx={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'primary.main' : 'text.secondary',
                backgroundColor: isActive
                  ? isDark
                    ? 'rgba(59, 130, 246, 0.1)'
                    : 'rgba(37, 99, 235, 0.08)'
                  : 'transparent',
                borderRadius: 1.5,
                px: 1.5,
                py: 0.75,
                '&:hover': {
                  backgroundColor: isActive
                    ? isDark
                      ? 'rgba(59, 130, 246, 0.15)'
                      : 'rgba(37, 99, 235, 0.12)'
                    : isDark
                      ? 'rgba(255, 255, 255, 0.04)'
                      : 'rgba(0, 0, 0, 0.04)',
                  color: isActive ? 'primary.main' : 'text.primary',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {section.label}
            </Button>
          )
        })}
      </Box>
    </Paper>
  )
}
