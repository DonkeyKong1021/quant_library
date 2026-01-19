import api from './api';

export const databaseService = {
  /**
   * Get information about all databases
   */
  async getDatabaseInfo() {
    const response = await api.get('/api/database-info/databases');
    return response.data;
  },

  /**
   * Get information about a specific source database
   */
  async getDatabaseInfoForSource(source) {
    const response = await api.get(`/api/database-info/databases/${source}`);
    return response.data;
  },
};
