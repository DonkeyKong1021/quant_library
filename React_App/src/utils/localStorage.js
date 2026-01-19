const RECENT_SYMBOLS_KEY = 'quantlib_recent_symbols'
const MAX_RECENT_SYMBOLS = 10

export const recentSymbolsStorage = {
  get() {
    try {
      const stored = localStorage.getItem(RECENT_SYMBOLS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading recent symbols from localStorage:', error)
      return []
    }
  },

  add(symbol) {
    try {
      const symbols = this.get()
      const symbolUpper = symbol.toUpperCase()
      // Remove if already exists
      const filtered = symbols.filter((s) => s !== symbolUpper)
      // Add to front
      const updated = [symbolUpper, ...filtered].slice(0, MAX_RECENT_SYMBOLS)
      localStorage.setItem(RECENT_SYMBOLS_KEY, JSON.stringify(updated))
      return updated
    } catch (error) {
      console.error('Error saving recent symbols to localStorage:', error)
      return []
    }
  },

  set(symbols) {
    try {
      const symbolArray = Array.isArray(symbols) ? symbols : []
      const updated = symbolArray.map((s) => s.toUpperCase()).slice(0, MAX_RECENT_SYMBOLS)
      localStorage.setItem(RECENT_SYMBOLS_KEY, JSON.stringify(updated))
      return updated
    } catch (error) {
      console.error('Error setting recent symbols in localStorage:', error)
      return []
    }
  },
}
