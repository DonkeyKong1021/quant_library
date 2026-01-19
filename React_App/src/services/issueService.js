import api from './api'

export const issueService = {
  /**
   * Log an issue to GitHub
   * @param {Object} issueData - Issue data to log
   * @param {string} issueData.title - Issue title
   * @param {string} issueData.description - Issue description
   * @param {string} issueData.issue_type - Type of issue (bug, feature_request, etc.)
   * @param {string} [issueData.severity] - Severity level (low, medium, high, critical)
   * @param {Object} [issueData.environment] - Environment details
   * @param {string[]} [issueData.steps_to_reproduce] - Steps to reproduce
   * @param {string} [issueData.expected_behavior] - Expected behavior
   * @param {string} [issueData.actual_behavior] - Actual behavior
   * @param {string} [issueData.additional_info] - Additional information
   * @param {string} [issueData.user_email] - User email for follow-up
   * @returns {Promise<Object>} Response with issue URL and number
   */
  async logIssue(issueData) {
    const response = await api.post('/api/issues/log', issueData)
    return response.data
  },
}
