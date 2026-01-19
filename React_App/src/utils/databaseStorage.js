/**
 * Storage utility for selected database/data source
 */

const STORAGE_KEY = 'quantlib_selected_database';

export const databaseStorage = {
  /**
   * Get the currently selected database source
   * @returns {string} Database source ('yahoo', 'alpha_vantage', 'polygon', 'default')
   */
  get() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored || 'yahoo'; // Default to yahoo
    } catch (error) {
      console.error('Error reading database selection:', error);
      return 'yahoo';
    }
  },

  /**
   * Set the selected database source
   * @param {string} source - Database source identifier
   */
  set(source) {
    try {
      localStorage.setItem(STORAGE_KEY, source);
    } catch (error) {
      console.error('Error saving database selection:', error);
    }
  },

  /**
   * Remove the stored database selection (reset to default)
   */
  remove() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error removing database selection:', error);
    }
  },
};
