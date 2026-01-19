import { useState, useEffect } from 'react'
import { chartLibraryStorage } from '../../utils/chartLibraryStorage'

/**
 * Hook to get and manage the current chart library setting
 * @returns {Object} { library: string, setLibrary: function }
 */
export function useChartLibrary() {
  const [library, setLibraryState] = useState(() => chartLibraryStorage.get())

  useEffect(() => {
    // Sync with localStorage changes (e.g., from settings modal)
    const handleStorageChange = () => {
      setLibraryState(chartLibraryStorage.get())
    }

    // Listen for storage events (when changed in other tabs/components)
    window.addEventListener('storage', handleStorageChange)
    
    // Also poll for changes (since same-tab changes don't trigger storage event)
    const interval = setInterval(() => {
      const current = chartLibraryStorage.get()
      if (current !== library) {
        setLibraryState(current)
      }
    }, 100)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [library])

  const setLibrary = (newLibrary) => {
    chartLibraryStorage.set(newLibrary)
    setLibraryState(newLibrary)
    // Trigger a custom event for immediate updates in same tab
    window.dispatchEvent(new Event('chartLibraryChanged'))
  }

  return { library, setLibrary }
}
