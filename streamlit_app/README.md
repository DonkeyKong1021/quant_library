# Streamlit Dashboard Setup

## Overview

The Streamlit dashboard is an **alternative interface** to the React web application. It provides a simpler, Python-based interface for the QuantLib library. For the primary modern web interface, see the [React App](../React_App/README.md).

## Prerequisites

- Python 3.8+
- PostgreSQL database (see main [Data Setup Guide](../docs/DATA_SETUP.md))
- Virtual environment (recommended)

## Installation

1. **Install Python dependencies** (from project root):
   ```bash
   # Activate virtual environment
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install Streamlit and dependencies (if not already installed)
   pip install streamlit plotly
   
   # Ensure QuantLib library is installed
   pip install -e .
   ```

2. **Set up database** (if not already done):
   ```bash
   # Create database
   createdb quant_library
   
   # Set environment variable
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quant_library"
   
   # Initialize database schema
   python scripts/init_database.py
   ```

3. **Fetch market data** (optional, can be done on-demand):
   - Data will be fetched automatically when you request it in the UI
   - Or use: `python scripts/fetch_all_tickers.py`
   - See [Data Setup Guide](../docs/DATA_SETUP.md) for details

## Running the Dashboard

### Option 1: Run from Project Root (Recommended)

```bash
# Make sure you're in the project root directory
cd /path/to/quant_library

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run Streamlit
streamlit run streamlit_app/app.py
```

### Option 2: Use Convenience Script

```bash
# From project root
./scripts/run_streamlit.sh
```

⚠️ **Important Notes:**
- Always use `streamlit run` command, **NOT** `python streamlit_app/app.py`
- Make sure you're in the project root directory when running
- The dashboard will open at `http://localhost:8501`

## Features

### 📊 Backtest Page
- Fetch market data from Yahoo Finance
- Configure built-in strategies:
  - Moving Average Crossover
  - RSI Momentum
  - Bollinger Bands Mean Reversion
  - MACD Crossover
- Set backtest parameters (initial capital, commission, slippage)
- Benchmark comparison (default: SPY)
- Run backtests and view results
- Interactive Plotly charts:
  - Equity curve
  - Drawdown chart
  - Returns distribution
- Performance metrics display with benchmark comparison
- Trade history with filtering and export

### 🔧 Strategy Builder Page
- Strategy code templates
- Documentation and examples
- Code editor for custom strategies (reference only)

### 📈 Data Explorer Page
- Visualize market data without backtesting
- Add technical indicators:
  - SMA, EMA (trend indicators)
  - RSI (momentum indicator)
  - Bollinger Bands (volatility indicator)
  - MACD (trend/momentum indicator)
  - Stochastic Oscillator (momentum indicator)
  - ADX (trend strength indicator)
- Interactive charts with indicators overlay
- Data statistics and preview

## Configuration

### Database Connection

The dashboard uses the same database configuration as the main library. Set the `DATABASE_URL` environment variable:

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quant_library"
```

Or use a custom connection:
```bash
export DATABASE_URL="postgresql://username:password@host:port/database"
```

### Streamlit Configuration

Streamlit configuration is in `.streamlit/config.toml`. Default settings:
- Theme: Light mode
- Port: 8501
- Browser: Auto-open enabled

## Troubleshooting

### "ModuleNotFoundError: No module named 'streamlit'"
```bash
pip install streamlit plotly
```

### "Database connection failed"
- Ensure PostgreSQL is running
- Check `DATABASE_URL` environment variable
- Verify database exists: `psql -l | grep quant_library`
- Run `python scripts/init_database.py` to initialize schema

### "No data found"
- Ensure you've fetched data (on-demand fetching is automatic)
- Check that symbols exist in the database
- Verify database connection

### Port 8501 already in use
- Streamlit will automatically use the next available port (8502, 8503, etc.)
- Or specify a different port: `streamlit run streamlit_app/app.py --server.port 8502`

### Dashboard not opening in browser
- Manually navigate to `http://localhost:8501`
- Check terminal output for the actual URL and port

## Differences from React App

The Streamlit dashboard is simpler but has some differences:

**Streamlit Dashboard:**
- ✅ Single command to run
- ✅ No separate backend (runs Python directly)
- ✅ Simpler setup (just Python dependencies)
- ❌ Less modern UI/UX
- ❌ Slower for complex interactions
- ❌ Limited customization

**React App (Recommended):**
- ✅ Modern, responsive UI
- ✅ Better performance
- ✅ More customization options
- ✅ Separate frontend/backend architecture
- ❌ Requires Node.js/npm
- ❌ Requires running both frontend and backend

## Next Steps

- **For new users**: Start with the [React App](../React_App/README.md) for the best experience
- **For Python developers**: The Streamlit dashboard is fine for quick testing and prototyping
- **For production**: Use the React App + FastAPI backend

## Additional Resources

- [Main README](../README.md)
- [Data Setup Guide](../docs/DATA_SETUP.md)
- [Quick Start Guide](../docs/QUICK_START.md)
- [React App Documentation](../React_App/README.md)
