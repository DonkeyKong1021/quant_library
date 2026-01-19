# QuantLib - Quantitative Trading Library

A comprehensive Python library for building and backtesting trading algorithms.

## Quick Setup with Setup Assistant

This repository includes a **Setup Assistant agent** that provides complete setup instructions in one comprehensive guide. If you're using Cursor IDE, you can quickly get all setup steps by mentioning the agent:

**To use the Setup Assistant:**
1. In Cursor chat, simply ask: "Use the setup-assistant to help me set up the codebase"
2. Or mention: "I need setup instructions - use setup-assistant"
3. The agent will provide step-by-step instructions covering:
   - PostgreSQL installation and database setup
   - Python virtual environment and dependencies
   - Database initialization for all data sources
   - React frontend setup
   - API backend configuration
   - Optional configurations (API keys, data fetching)
   - Troubleshooting guidance

The setup assistant agent is located at `.cursor/agents/setup-assistant.md` and can be shared with your team through version control.

**Manual setup:** If you prefer to follow setup instructions manually, continue reading the sections below.

## Features

- **Data Management**: Fetch and store market data from multiple sources (Yahoo Finance, Alpha Vantage, Polygon.io)
- **Technical Indicators**: 30+ technical indicators (trend, momentum, volatility, volume)
- **Backtesting Engine**: Event-driven backtesting framework with realistic simulation
- **Portfolio Management**: Position sizing, rebalancing, and portfolio tracking
- **Risk Metrics**: Comprehensive risk analysis (Sharpe, Sortino, VaR, drawdown, etc.)
- **Visualization**: Performance charts, equity curves, and trading visualizations
- **Strategy Framework**: Extensible strategy base class for custom algorithms
- **Strategy Library**: Curated collection of well-documented trading strategies
- **AI Features**: AI-powered strategy generation and backtest insights (requires API key)
- **Parameter Optimization**: Grid search and optimization for strategy parameters
- **Walk-Forward Analysis**: Test strategies for overfitting with walk-forward validation
- **Modern Web Interface**: React-based UI with FastAPI backend (recommended)
- **Alternative Interface**: Streamlit dashboard for Python-based workflow

## Installation

### Prerequisites

1. **Install PostgreSQL** (if not already installed):
   - macOS: `brew install postgresql` or download from [postgresql.org](https://www.postgresql.org/download/)
   - Linux: `sudo apt-get install postgresql` (Ubuntu/Debian) or use your distribution's package manager
   - Windows: Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)

2. **Create Database**:
   ```bash
   # Start PostgreSQL service (if not running)
   # macOS/Linux:
   brew services start postgresql  # or: sudo systemctl start postgresql
   
   # Create database
   createdb quant_library
   # Or using psql:
   # psql postgres
   # CREATE DATABASE quant_library;
   # \q
   ```

### Development Installation

```bash
# Clone the repository
cd quant_library

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install in development mode
pip install -e .

# Set up PostgreSQL database (see Prerequisites above)
createdb quant_library

# Initialize database schema (creates empty tables)
python scripts/init_database.py

# Fetch market data (see Data Setup Guide for options)
# Option 1: Fetch on-demand as you use the library
# Option 2: Bulk fetch using the script
python scripts/fetch_all_tickers.py  # Fetches data for symbols in tickers.json
```

### Requirements

- Python 3.8+
- PostgreSQL (for data storage)
- pandas >= 1.5.0
- numpy >= 1.21.0
- matplotlib >= 3.5.0
- yfinance >= 0.2.0
- scipy >= 1.9.0
- sqlalchemy >= 2.0.0
- psycopg2-binary >= 2.9.0

## Quick Start

### Using the React Web Application (Recommended)

The modern web interface provides the best user experience.

**Prerequisites:**
- Node.js 16+ and npm
- Python 3.8+ (for the API backend)
- PostgreSQL database

**Setup:**

1. **Start the API backend** (from project root):
   ```bash
   # Install API dependencies (if not already installed)
   cd api
   pip install -r requirements.txt
   
   # Start the API server
   uvicorn api.main:app --reload
   ```
   The API will be available at `http://localhost:8000`

2. **Start the React frontend** (in a new terminal):
   ```bash
   cd React_App
   npm install
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

See the [React App README](React_App/README.md) for detailed setup instructions.

### Using the Python Library

See [Quick Start Guide](docs/QUICK_START.md) for detailed examples.

```python
from quantlib.data.fetcher_registry import get_registry
from quantlib.strategies import Strategy
from quantlib.indicators import sma
from quantlib.backtesting import BacktestEngine
from quantlib.visualization import create_tear_sheet

# Fetch data (uses default source or specify: 'yahoo', 'alpha_vantage', 'polygon')
registry = get_registry()
fetcher = registry.create(source='yahoo')  # or omit to use default
data = fetcher.fetch_ohlcv('AAPL', start='2020-01-01', end='2023-01-01')

# Define strategy
class MovingAverageStrategy(Strategy):
    def initialize(self, context):
        context.short_window = 20
        context.long_window = 50
    
    def on_data(self, context, data):
        prices = data['close']
        short_ma = sma(prices, context.short_window)
        long_ma = sma(prices, context.long_window)
        
        if short_ma.iloc[-1] > long_ma.iloc[-1]:
            context.place_order('AAPL', 100, 'BUY')
        elif short_ma.iloc[-1] < long_ma.iloc[-1]:
            context.place_order('AAPL', 100, 'SELL')

# Run backtest
engine = BacktestEngine(initial_capital=100000)
strategy = MovingAverageStrategy()
results = engine.run(strategy, data, start='2020-01-01', end='2023-01-01')

# Visualize results
create_tear_sheet(results, save_path='backtest_results.png')
```

## Documentation

- [Quick Start Guide](docs/QUICK_START.md) - Getting started with the Python library
- [Data Setup Guide](docs/DATA_SETUP.md) - How to set up and populate your database
- [React App README](React_App/README.md) - Modern web interface setup and usage
- [Streamlit Dashboard README](streamlit_app/README.md) - Alternative Streamlit interface (legacy)
- `examples/` directory - Complete examples and usage patterns

## Data and Database

**Important**: This repository does **not** include market data. The database starts empty and must be populated by fetching data from external sources. QuantLib supports multiple data sources including Yahoo Finance (default), Alpha Vantage, and Polygon.io. See [Data Setup Guide](docs/DATA_SETUP.md) for configuration details.

- **`tickers.json`**: A reference file containing stock symbols organized by sector (metadata only, not market data). This is used for symbol suggestions and bulk fetching scripts. You can modify or replace it with your own symbol list.

See the [Data Setup Guide](docs/DATA_SETUP.md) for complete instructions on:
- Setting up PostgreSQL
- Initializing the database schema
- Fetching and storing market data
- Managing your database

## Configuration

### Database Configuration

The library uses PostgreSQL with **separate databases for each data source**. Configure database connections using environment variables:

```bash
# Source-specific databases (market data)
export DATABASE_URL_YAHOO="postgresql://postgres:postgres@localhost:5432/quant_library_yahoo"
export DATABASE_URL_ALPHA_VANTAGE="postgresql://postgres:postgres@localhost:5432/quant_library_alphavantage"
export DATABASE_URL_POLYGON="postgresql://postgres:postgres@localhost:5432/quant_library_polygon"

# Default database (backtest results, API keys)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quant_library"
```

**Setup databases:**
```bash
# Create and initialize all source databases
python scripts/create_source_databases.py

# Or initialize individually
python scripts/init_database.py --all-sources
```

**DataStore usage:**
```python
from quantlib.data import DataStore

# Use source-specific database
store = DataStore(data_source='yahoo')  # Routes to quant_library_yahoo
store = DataStore(data_source='alpha_vantage')  # Routes to quant_library_alphavantage
store = DataStore(data_source='polygon')  # Routes to quant_library_polygon

# Or use custom database URL (backward compatibility)
store = DataStore(database_url="postgresql://user:pass@host:port/db")
```

### Data Source Configuration

QuantLib supports multiple data sources for fetching market data:

- **Yahoo Finance** (default): Free, no API key required
- **Alpha Vantage**: Free tier available, requires API key
- **Polygon.io**: Free tier available, requires API key

Configure your data source using environment variables (see `.env.example`):

```bash
# Set default data source
export DEFAULT_DATA_SOURCE=yahoo  # Options: yahoo, alpha_vantage, polygon

# Set API keys for paid/free-tier sources
export ALPHA_VANTAGE_API_KEY=your_key_here
export POLYGON_API_KEY=your_key_here
```

You can also specify the source per request in code, API calls, or UI. See the [Data Setup Guide](docs/DATA_SETUP.md) for detailed information about each data source and configuration options.

### Database Setup

1. **Initialize schema** (creates empty tables and indexes):
   ```bash
   python scripts/init_database.py
   ```

2. **Populate your database** with market data:
   
   See the [Data Setup Guide](docs/DATA_SETUP.md) for detailed instructions.
   
   **Quick options:**
   - **On-demand fetching**: Data is automatically fetched when you request it via the UI or API
   - **Bulk fetch**: Use `python scripts/fetch_all_tickers.py` to fetch data for all symbols in `tickers.json`
   - **Custom data**: Import your own data using the migration script or programmatically

   **Note**: No market data is included in this repository. All data must be fetched from external sources. QuantLib supports multiple data sources (Yahoo Finance, Alpha Vantage, Polygon.io). See [Data Setup Guide](docs/DATA_SETUP.md) for details.

3. **Migrate existing data** (if you have parquet files from previous versions):
   ```bash
   python scripts/migrate_to_database.py
   ```

## Architecture

The library is organized into modular components:

- **src/quantlib/**: Core Python library
  - **data/**: Data fetching, storage, and preprocessing (PostgreSQL-backed)
  - **indicators/**: Technical analysis indicators
  - **backtesting/**: Backtesting engine and event system
  - **portfolio/**: Portfolio management and position sizing
  - **risk/**: Risk metrics and analysis
  - **strategies/**: Strategy framework and examples
  - **visualization/**: Charting and performance visualization
- **api/**: FastAPI REST API backend
- **React_App/**: Modern React web frontend (recommended)
- **streamlit_app/**: Alternative Streamlit dashboard interface

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=quantlib --cov-report=html
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
