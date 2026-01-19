# Data Setup Guide

## Overview

QuantLib does **not** include market data in the repository. All market data is fetched from external sources (primarily Yahoo Finance) and stored in your local PostgreSQL database. This guide explains how to set up and populate your database.

## What's Included vs. What You Need to Fetch

### Included in Repository ✅

- **`tickers.json`**: A reference file containing stock symbols organized by sector. This is just metadata (a list of symbols), not actual market data. It's used as a convenience feature for:
  - Symbol suggestions in the UI
  - Sector-based organization
  - Bulk fetching scripts

You can modify or replace `tickers.json` with your own list of symbols.

### Not Included ❌

- **Market data**: No historical price data is included. All market data must be fetched from external sources.
- **Database dumps**: The database starts empty and must be populated by you.

## Setting Up Your Database

### Step 1: Install and Configure PostgreSQL

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS
   brew install postgresql
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install postgresql
   
   # Windows: Download from https://www.postgresql.org/download/windows/
   ```

2. **Start PostgreSQL service**:
   ```bash
   # macOS/Linux
   brew services start postgresql  # or: sudo systemctl start postgresql
   ```

3. **Create the database**:
   ```bash
   createdb quant_library
   ```

4. **Set environment variable** (optional, has defaults):
   ```bash
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quant_library"
   ```

### Step 2: Initialize Database Schema

This creates the empty tables and indexes (no data yet):

```bash
python scripts/init_database.py
```

You should see:
```
============================================================
Database Initialization Script
============================================================

1. Verifying database connection...
   ✅ Database connection successful

2. Initializing database schema...
   
============================================================
✅ Database initialization complete!
============================================================
```

### Step 3: Populate Your Database

You have several options for fetching and storing market data:

#### Option A: Fetch Data On-Demand (Recommended for Getting Started)

Data is automatically fetched when you request it through:
- The Streamlit dashboard
- The React web app
- The FastAPI endpoints
- Python code using `YahooFinanceFetcher`

**Example using Python:**
```python
from quantlib.data import YahooFinanceFetcher, DataStore

# Fetch data
fetcher = YahooFinanceFetcher()
data = fetcher.fetch_ohlcv('AAPL', start='2020-01-01', end='2023-01-01')

# Save to database
store = DataStore()
store.save('AAPL', data)
```

**Example using Streamlit/React:**
- Navigate to the data fetching page
- Enter a symbol (e.g., 'AAPL')
- Select date range
- Click "Fetch Data"
- Data is automatically saved to the database

#### Option B: Bulk Fetch Using Script

Use the `fetch_all_tickers.py` script to fetch data for all symbols in `tickers.json`:

```bash
# Fetch 10 years of data for all symbols in tickers.json
python scripts/fetch_all_tickers.py

# Customize the date range (e.g., 5 years)
python scripts/fetch_all_tickers.py --years 5

# Skip symbols that already exist in database
python scripts/fetch_all_tickers.py --skip-existing

# Use custom tickers file
python scripts/fetch_all_tickers.py --tickers-file my_symbols.json

# Add delay between requests to be respectful
python scripts/fetch_all_tickers.py --delay 1.0
```

**Script Options:**
- `--years N`: Number of years of historical data (default: 10)
- `--skip-existing`: Skip symbols already in database
- `--tickers-file PATH`: Use custom tickers file (default: tickers.json)
- `--delay SECONDS`: Delay between requests (default: 0.5)
- `--verbose`: Print detailed information
- `--database-url URL`: Custom database connection URL

#### Option C: Use Your Own Data

If you have market data in other formats (CSV, Parquet, etc.), you can:

1. **Use the migration script** (for Parquet/Pickle files):
   ```bash
   # Place your .parquet or .pickle files in a data/ directory
   python scripts/migrate_to_database.py
   ```

2. **Import programmatically**:
   ```python
   from quantlib.data import DataStore
   import pandas as pd
   
   # Load your data
   data = pd.read_csv('my_data.csv', index_col='Date', parse_dates=True)
   
   # Ensure columns are: Open, High, Low, Close, Volume
   # Save to database
   store = DataStore()
   store.save('SYMBOL', data)
   ```

## Data Sources

QuantLib supports multiple data sources for fetching market data. You can configure your default source and select different sources per request.

### Available Data Sources

#### Yahoo Finance (Default)
- **Free**: No API key required
- **Historical data**: Available
- **Real-time data**: Available (with limitations)
- **Rate limits**: Be respectful with bulk fetches
- **Limitations**: Some symbols may be unavailable or delisted, data quality varies

#### Alpha Vantage
- **Free tier**: 5 calls/minute, 500 calls/day
- **API key required**: Get one at https://www.alphavantage.co/support/#api-key
- **Historical data**: Full history available
- **Intervals**: Daily only (`1d`)
- **Setup**: Set `ALPHA_VANTAGE_API_KEY` environment variable

#### Polygon.io
- **Free tier**: Available (see https://polygon.io/pricing)
- **API key required**: Get one at https://polygon.io/dashboard/signup
- **Historical data**: Available from September 2003
- **Intervals**: Supports daily, hourly, and minute-level data
- **Setup**: Set `POLYGON_API_KEY` environment variable

#### IEX Cloud (Deprecated)
- **Note**: IEX Cloud was shut down on August 31, 2024
- This fetcher is included for historical reference only and will not work

### Configuring Data Sources

#### Environment Variables

Add to your `.env` file (copy from `.env.example`):

```bash
# Default data source (yahoo, alpha_vantage, polygon, iex_cloud)
DEFAULT_DATA_SOURCE=yahoo

# Alpha Vantage API key
ALPHA_VANTAGE_API_KEY=your_api_key_here

# Polygon.io API key
POLYGON_API_KEY=your_api_key_here

# IEX Cloud API key (deprecated - for reference only)
IEX_CLOUD_API_KEY=your_api_key_here
```

#### Using in Code

```python
from quantlib.data.fetcher_registry import get_registry

# Create fetcher with default source (from DEFAULT_DATA_SOURCE env var or 'yahoo')
registry = get_registry()
fetcher = registry.create()

# Or specify a source explicitly
fetcher = registry.create(source='alpha_vantage')
fetcher = registry.create(source='polygon')
fetcher = registry.create(source='yahoo')  # Default

# Use the fetcher
data = fetcher.fetch_ohlcv('AAPL', start='2020-01-01', end='2023-12-31')
```

#### Using via API

Add `data_source` parameter to fetch requests:

```bash
curl -X POST http://localhost:8000/api/data/fetch \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "start_date": "2020-01-01",
    "end_date": "2023-12-31",
    "data_source": "alpha_vantage"
  }'
```

#### Using in UI

- **Streamlit**: Data source selection is available in the data fetcher component
- **React**: Use the "Data Source" dropdown in the data fetcher component

#### Using in Scripts

```bash
# Use default source
python scripts/fetch_all_tickers.py

# Specify a source
python scripts/fetch_all_tickers.py --data-source alpha_vantage
python scripts/fetch_all_tickers.py --data-source polygon
```

### Source Comparison

| Source | API Key Required | Free Tier | Rate Limits | Historical Data | Intervals |
|--------|-----------------|-----------|-------------|-----------------|-----------|
| Yahoo Finance | No | Yes | Informal | Extensive | All |
| Alpha Vantage | Yes | 500 calls/day | 5 calls/min | Full history | Daily only |
| Polygon.io | Yes | Varies by plan | Varies by plan | Since 2003 | Multiple |
| IEX Cloud | Yes | Deprecated | N/A | N/A | N/A |

### Custom Data Sources

You can extend QuantLib to use other data sources by:
1. Creating a custom fetcher class that implements `DataFetcher` interface
2. Registering it with the `FetcherRegistry`
3. Using it with `DataStore` for storage

See `src/quantlib/data/fetchers.py` for examples of fetcher implementations.

## Managing Your Data

### Check What's in Your Database

**Using Python:**
```python
from quantlib.data import DataStore

store = DataStore()

# List all symbols
symbols = store.list_symbols()
print(f"Symbols in database: {symbols}")

# Get metadata for a symbol
metadata = store.get_metadata('AAPL')
print(metadata)

# Check if symbol exists
if store.exists('AAPL'):
    print("AAPL data exists")
```

**Using API:**
```bash
# Get database statistics
curl http://localhost:8000/api/database/statistics

# List all symbols
curl http://localhost:8000/api/database/symbols
```

**Using Streamlit/React:**
- Navigate to the Dashboard page
- View database statistics and symbols

### Updating Data

Data can be refreshed in several ways:

1. **Force refresh via API/UI**: Use the "Force Refresh" option when fetching
2. **Replace all data for a symbol**:
   ```python
   store.save('AAPL', new_data, replace_all=True)
   ```
3. **Append/update date range**: New data automatically merges with existing data

## Best Practices

1. **Start Small**: Begin with a few symbols to test your setup
2. **Respect Rate Limits**: Use delays when bulk fetching (0.5-1.0 seconds between requests)
3. **Use Cache**: Enable caching to avoid re-fetching data unnecessarily
4. **Regular Updates**: Set up periodic data updates for active symbols
5. **Backup Your Database**: Regular PostgreSQL backups are recommended

## Troubleshooting

### "No data found for symbol"
- Symbol may be delisted or invalid
- Date range may be incorrect
- Yahoo Finance may not have data for that symbol
- Try a different symbol (e.g., 'AAPL') to test connectivity

### "Database connection failed"
- Ensure PostgreSQL is running
- Check DATABASE_URL environment variable
- Verify database exists: `psql -l | grep quant_library`
- Check credentials and permissions

### "Rate limit" or timeout errors
- Increase delay between requests (`--delay 1.0` or higher)
- Fetch fewer symbols at a time
- Use `--skip-existing` to avoid re-fetching

### Missing symbols in UI
- Ensure `tickers.json` exists (or create your own)
- Symbols in database are separate from `tickers.json`
- Database symbols appear automatically in the UI

## FAQ

**Q: Do I need to fetch all symbols at once?**  
A: No! Fetch data on-demand as you need it. The bulk script is optional.

**Q: Can I use my own symbol list?**  
A: Yes! Replace or modify `tickers.json`, or just fetch symbols directly without using the file.

**Q: How much storage do I need?**  
A: Depends on symbols and date range. Rough estimate: ~1-5 MB per symbol for 10 years of daily data.

**Q: Can I use a different database?**  
A: Currently PostgreSQL is required. SQLite support could be added in the future.

**Q: Is the data real-time?**  
A: Yahoo Finance provides recent data, but for true real-time data you'd need a paid service.

**Q: Can I share my database?**  
A: You can export/import PostgreSQL dumps, but be aware of data licensing terms from Yahoo Finance.
