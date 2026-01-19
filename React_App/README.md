# QuantLib React App

Modern React frontend for the QuantLib quantitative trading library. This is the recommended interface for using QuantLib.

## Features

- **Dashboard**: Overview of database statistics, recent backtests, and quick actions
- **Backtest**: Run backtests with configurable strategies, view performance metrics and charts
- **Backtest History**: View, compare, and manage all past backtest results
- **Data Explorer**: Visualize market data with technical indicators
- **Strategy Builder**: Create, edit, and manage custom trading strategies
  - AI-powered strategy generation
  - Strategy library browsing
  - Code editor with syntax validation
  - Save and manage custom strategies
- **Optimization**: Parameter optimization for strategies using grid search

## Prerequisites

- Node.js 16+ and npm
- FastAPI backend running (see setup below)
- PostgreSQL database (see main [README](../README.md))

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Copy environment file (optional):**
   ```bash
   cp .env.example .env
   ```
   
   The `.env` file can contain:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

3. **Start the API backend** (in a separate terminal):
   ```bash
   cd ../api
   pip install -r requirements.txt
   uvicorn api.main:app --reload
   ```
   
   The API will be available at http://localhost:8000

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:3000

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory. You can serve them with any static file server or deploy to a hosting service.

## Project Structure

```
React_App/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components (Dashboard, Backtest, etc.)
│   ├── services/       # API service layer
│   ├── utils/          # Utility functions
│   ├── contexts/       # React contexts (theme, etc.)
│   └── theme/          # Material-UI theme configuration
├── public/             # Static assets
└── package.json       # Dependencies and scripts
```

## Key Technologies

- **React 18** - UI framework
- **Material-UI (MUI)** - Component library
- **React Router** - Navigation
- **React Query** - Data fetching and caching
- **Plotly.js** - Interactive charts
- **Axios** - HTTP client
- **Vite** - Build tool

## Features Details

### Dashboard
- Database connection status
- Database statistics (symbol count, date ranges, size)
- Quick action cards to navigate to main features
- Recent backtest results overview

### Backtest Page
- Fetch market data from multiple sources (Yahoo Finance, Alpha Vantage, Polygon)
- Select from built-in strategies or use custom strategies
- Configure backtest parameters (initial capital, commission, slippage)
- View comprehensive results:
  - Performance metrics (Sharpe ratio, Sortino ratio, max drawdown, etc.)
  - Interactive equity curve and drawdown charts
  - Trade history table
  - AI-generated insights

### Backtest History
- List all past backtest results
- View, compare, and delete backtests
- Rename backtests with custom names
- Export results

### Data Explorer
- Visualize market data with interactive charts
- Add technical indicators (SMA, EMA, RSI, Bollinger Bands, MACD, etc.)
- View data statistics
- Multiple chart library support (Plotly, Chart.js)

### Strategy Builder
- Code editor for writing custom strategies
- AI-powered strategy generation (requires OpenAI or Anthropic API key)
- Browse strategy library
- Validate strategy code
- Save and manage custom strategies
- Export/import strategies

### Optimization
- Parameter optimization using grid search
- Configure optimization parameters and ranges
- View optimization results

## API Integration

The React app communicates with the FastAPI backend at `http://localhost:8000` (configurable via `VITE_API_URL`). See the [API README](../api/README.md) for available endpoints.

## Development

### Running in Development Mode

```bash
npm run dev
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Configuration

### Environment Variables

- `VITE_API_URL` - Backend API URL (default: `http://localhost:8000`)

### API Keys (Optional)

For AI features (strategy generation, insights), set API keys in the Settings modal:
- OpenAI API key
- Anthropic API key

Or set them via environment variables in the API backend (see [API README](../api/README.md)).

## Troubleshooting

### "Failed to fetch" errors
- Ensure the API backend is running on port 8000
- Check that `VITE_API_URL` matches your API URL
- Verify CORS is configured in the API backend

### API connection issues
- Check browser console for error messages
- Verify database is running and connected
- Check API backend logs

### Build errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (requires 16+)

## Additional Resources

- [Main README](../README.md)
- [API Documentation](../api/README.md)
- [Data Setup Guide](../docs/DATA_SETUP.md)
- [Quick Start Guide](../docs/QUICK_START.md)