import api from './api'

export const fundamentalService = {
  async getFundamentals(symbol) {
    const response = await api.get(`/api/fundamental/${symbol}`)
    return response.data
  },

  async getFinancialStatements(symbol, statementType = 'income') {
    const response = await api.get(`/api/fundamental/${symbol}/financial-statements`, {
      params: { statement_type: statementType }
    })
    return response.data
  },
}
