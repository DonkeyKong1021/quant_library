const CHART_LIBRARY_KEY = 'quantlib_chart_library'
const DEFAULT_CHART_LIBRARY = 'plotly'

export const chartLibraryStorage = {
  get() {
    try {
      const stored = localStorage.getItem(CHART_LIBRARY_KEY)
      return stored || DEFAULT_CHART_LIBRARY
    } catch (error) {
      console.error('Error reading chart library from localStorage:', error)
      return DEFAULT_CHART_LIBRARY
    }
  },

  set(library) {
    try {
      localStorage.setItem(CHART_LIBRARY_KEY, library)
      return library
    } catch (error) {
      console.error('Error saving chart library to localStorage:', error)
      return DEFAULT_CHART_LIBRARY
    }
  },
}
