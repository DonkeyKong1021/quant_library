# Streamlit Dashboard Guide

## Overview

The Streamlit dashboard provides an interactive web interface for the QuantLib quantitative trading library. It enables users to fetch market data, configure strategies, run backtests, and visualize results.

## Quick Start

1. **Activate virtual environment:**
   ```bash
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Run the dashboard:**
   
   **Option 1 (Recommended):** Run from project root
   ```bash
   streamlit run streamlit_app/app.py
   ```
   
   **Option 2:** Use the convenience script
   ```bash
   ./scripts/run_streamlit.sh
   ```
   
   ⚠️ **Important**: 
   - Always use `streamlit run` command, NOT `python streamlit_app/app.py`
   - Make sure you're in the project root directory when running

3. **Open your browser:**
   The app will automatically open at `http://localhost:8501`
   
   If it doesn't open automatically, navigate to: `http://localhost:8501`

## Installation

### Install Dependencies

```bash
# Activate virtual environment
source .venv/bin/activate  # or: .venv\Scripts\activate on Windows

# Install Streamlit dependencies
pip install streamlit plotly

# Make sure QuantLib is installed
pip install -e .
```

## Features

### 📊 Backtest Page
- Fetch market data from Yahoo Finance
- Configure built-in strategies (Moving Average Crossover, RSI Momentum, Bollinger Bands, MACD)
- Set backtest parameters (capital, commission, slippage)
- Benchmark comparison (default: SPY)
- Run backtests and view results
- Interactive Plotly charts (equity curve, drawdown, returns)
- Performance metrics display with benchmark comparison
- Trade history with filtering and export

### 🔧 Strategy Builder Page
- Strategy code templates
- Documentation and examples
- Code editor for custom strategies (reference only - security disabled)

### 📈 Data Explorer Page
- Visualize market data without backtesting
- Add technical indicators (SMA, EMA, RSI, Bollinger Bands, MACD, Stochastic, ADX)
- Interactive charts with indicators overlay
- Data statistics and preview
- Download data as CSV

## Usage Guide

### Running a Backtest

1. **Navigate to Backtest page**
2. **Fetch Data**:
   - Enter symbol (e.g., AAPL, MSFT)
   - Select date range (default end date is yesterday to ensure data availability)
   - Click "Fetch Data"
3. **Configure Strategy**:
   - Select built-in strategy (Moving Average, RSI, Bollinger Bands, or MACD)
   - Adjust parameters
4. **Configure Backtest**:
   - Set initial capital
   - Set commission and slippage
   - Choose commission type (fixed or percentage)
   - Enable/disable benchmark comparison (default: SPY)
5. **Run Backtest**:
   - Click "Run Backtest" button
   - Wait for completion
6. **View Results**:
   - Interactive charts in tabs
   - Performance metrics (including benchmark comparison: Alpha, Beta, Information Ratio)
   - Trade history table with analytics

### Exploring Data

1. **Navigate to Data Explorer page**
2. **Fetch Data** (same as backtest)
3. **Configure Chart**:
   - Select chart type (line or candlestick)
   - Choose indicators to display (SMA, EMA, RSI, Bollinger Bands, MACD, Stochastic, ADX)
   - Adjust indicator parameters
4. **View Chart**: Interactive Plotly visualization
5. **Download Data**: Export fetched data as CSV

## Project Structure

```
streamlit_app/
├── app.py                    # Main application (dashboard/home)
├── pages/
│   ├── backtest.py          # Backtesting page
│   ├── strategy_builder.py  # Strategy builder page
│   └── data_explorer.py     # Data explorer page
├── components/
│   ├── data_fetcher.py      # Data fetching UI
│   ├── strategy_selector.py # Strategy configuration
│   ├── backtest_config.py  # Backtest parameters
│   ├── results_display.py   # Results visualization
│   ├── metrics_table.py    # Performance metrics
│   └── trade_history.py    # Trade history table
└── utils/
    ├── streamlit_helpers.py # Helper functions
    └── plotly_charts.py     # Plotly chart functions
```

## Configuration

Streamlit configuration is in `.streamlit/config.toml`:
- Theme colors
- Server settings
- Browser options

## Troubleshooting

### Module Not Found Errors

Make sure:
1. Virtual environment is activated
2. QuantLib is installed: `pip install -e .`
3. Streamlit dependencies are installed: `pip install streamlit plotly`

### Data Fetching Errors

- Check internet connection
- Yahoo Finance API may be temporarily unavailable
- Verify symbol is valid
- Ensure end date is not today (use yesterday or earlier)
- Try refreshing or waiting a moment if API errors occur

### Backtest Errors

- Ensure data is loaded first
- Check strategy parameters are valid
- Verify backtest configuration
- Check that symbol is selected
- Verify date range is valid

### Pages not loading

The app uses a custom navigation system. All pages are imported directly, so make sure:
- All files in `streamlit_app/` are present
- No syntax errors in page files
- QuantLib is properly installed

## Deployment

### Streamlit Cloud

1. Push code to GitHub
2. Connect repository to Streamlit Cloud
3. Set entry point: `streamlit_app/app.py`
4. Auto-deploy on push

### Local Network

Run with:
```bash
streamlit run streamlit_app/app.py --server.address 0.0.0.0
```

Access from other devices on your network.

## Advanced Features

### Benchmark Comparison

The backtest page now supports benchmark comparison:
- Default benchmark: SPY (S&P 500)
- Automatically fetches benchmark data for the same date range
- Calculates Alpha, Beta, and Information Ratio
- Displays benchmark overlay on equity curve chart
- Shows benchmark-relative metrics

### Built-in Strategies

1. **Moving Average Crossover**: Uses short and long moving averages
2. **RSI Momentum**: Uses RSI indicator with oversold/overbought levels
3. **Bollinger Bands Mean Reversion**: Uses Bollinger Bands for mean reversion signals
4. **MACD Crossover**: Uses MACD line and signal line crossovers

## Future Enhancements

- Multiple strategy comparison
- Parameter optimization interface
- Real-time data feeds
- User authentication
- Saved backtest sessions
- Export to PDF reports
