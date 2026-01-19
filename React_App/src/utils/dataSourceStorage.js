const DATA_SOURCE_KEY = 'quantlib_data_source'
const DEFAULT_DATA_SOURCE = 'yahoo'

export const dataSourceStorage = {
  get() {
    try {
      const stored = localStorage.getItem(DATA_SOURCE_KEY)
      return stored || DEFAULT_DATA_SOURCE
    } catch (error) {
      console.error('Error reading data source from localStorage:', error)
      return DEFAULT_DATA_SOURCE
    }
  },

  set(dataSource) {
    try {
      localStorage.setItem(DATA_SOURCE_KEY, dataSource)
      return dataSource
    } catch (error) {
      console.error('Error saving data source to localStorage:', error)
      return DEFAULT_DATA_SOURCE
    }
  },
}
