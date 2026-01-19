import { useState, useEffect } from 'react'
import { Fab, useScrollTrigger, Zoom } from '@mui/material'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import { useThemeMode } from '../contexts/ThemeContext'

/**
 * ScrollToTop component - Floating action button that appears when user scrolls down
 * Provides smooth scroll to top functionality
 */
export default function ScrollToTop({ threshold = 400 }) {
  const { isDark } = useThemeMode()
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: threshold,
  })

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor')
    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }

  return (
    <>
      {/* Anchor for scroll positioning */}
      <div id="back-to-top-anchor" />
      <Zoom in={trigger}>
        <Fab
          onClick={handleClick}
          color="primary"
          size="small"
          aria-label="scroll back to top"
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 1000,
            boxShadow: isDark
              ? '0 4px 12px rgba(0, 0, 0, 0.4)'
              : '0 4px 12px rgba(37, 99, 235, 0.25)',
            '&:hover': {
              boxShadow: isDark
                ? '0 6px 16px rgba(0, 0, 0, 0.5)'
                : '0 6px 16px rgba(37, 99, 235, 0.35)',
            },
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>
    </>
  )
}
