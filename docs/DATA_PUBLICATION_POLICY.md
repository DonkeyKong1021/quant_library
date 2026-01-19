# Data Publication Policy

## Summary

**We are NOT publishing market data.** Only metadata/reference files are included in the repository.

## What's Included ✅

### `tickers.json`
- **Type**: Reference metadata (symbol list)
- **Size**: Small (~10-50 KB)
- **Purpose**: Convenience file containing stock symbols organized by sector
- **Usage**: 
  - Symbol suggestions in UI
  - Sector-based organization
  - Bulk fetching scripts (`fetch_all_tickers.py`)
- **Customizable**: Users can modify or replace with their own symbol list
- **Not Market Data**: This is just a list of symbols, not price/volume data

## What's NOT Included ❌

### Market Data
- **Historical price data**: Not included (too large, constantly changing, licensing issues)
- **Database dumps**: Not included (users must fetch their own data)
- **Sample data files**: Not included (users fetch from Yahoo Finance)

### Why Not?
1. **Size**: Market data for hundreds of symbols over years would be massive (GBs)
2. **Freshness**: Data becomes stale quickly; users need current data
3. **Licensing**: Yahoo Finance terms of service restrict redistribution
4. **Storage**: Git repositories aren't designed for large binary/time-series data
5. **Customization**: Users may want different symbols/date ranges

## User Data Setup Process

After cloning the repository, users must:

1. **Set up PostgreSQL database** (empty)
2. **Initialize database schema** (`scripts/init_database.py`) - creates empty tables
3. **Fetch their own data** from Yahoo Finance (or other sources) using:
   - On-demand fetching (via UI/API as needed)
   - Bulk fetching script (`scripts/fetch_all_tickers.py`)
   - Custom data import
   - Programmatic fetching via Python library

See [Data Setup Guide](DATA_SETUP.md) for detailed instructions.

## Data Source: Yahoo Finance

QuantLib fetches data from Yahoo Finance using the `yfinance` library:
- Free (no API key required)
- Public data source
- Terms of service apply
- Rate limiting applies

Users are responsible for:
- Respecting rate limits
- Complying with Yahoo Finance terms of service
- Managing their own database storage

## Recommendation

Keep `tickers.json` in the repository because:
- ✅ Small file (metadata only)
- ✅ Useful for new users (provides starting symbols)
- ✅ Convenience feature (no data fetching required to see symbol list)
- ✅ Customizable (users can modify or replace)
- ✅ Not actual market data (just a reference list)

## Alternative Approaches (Not Recommended)

If we wanted to include sample data, we could:
1. **Small sample dataset**: Include 1-2 symbols with limited date range
   - ❌ Still requires Yahoo Finance terms compliance
   - ❌ Not very useful (users need their own symbols)
   - ✅ Could be helpful for testing
   
2. **Database dump**: Include PostgreSQL dump file
   - ❌ Very large file size
   - ❌ Licensing/compliance issues
   - ❌ Becomes stale quickly
   - ❌ Hard to maintain/update
   
3. **Sample data directory**: Include CSV/Parquet samples
   - ❌ Same issues as database dump
   - ❌ Git LFS required for large files
   - ❌ Maintenance burden

**Current approach (fetch on-demand) is best practice** for open-source financial data libraries.
