# Data Source Architecture & Database Design

## Overview

QuantLib uses **separate PostgreSQL databases for each data source**. This architecture provides complete data isolation, clear data provenance, and prevents conflicts between different data sources.

## Current Architecture

### Multiple Databases Per Source

**Separate database per data source:**
- `quant_library_yahoo` - Yahoo Finance data
- `quant_library_alphavantage` - Alpha Vantage data
- `quant_library_polygon` - Polygon.io data
- `quant_library` - Default database (backtest results, API keys, metadata)

### Database Schema

Each source database uses the same schema:

```sql
ohlcv_data (
    symbol TEXT,
    timestamp TIMESTAMP,
    interval TEXT,  -- '1d', '1h', '1m', etc.
    open NUMERIC,
    high NUMERIC,
    low NUMERIC,
    close NUMERIC,
    volume BIGINT,
    PRIMARY KEY (symbol, timestamp, interval)
)
```

**Key Points:**
- One row per symbol/timestamp/interval combination within each database
- Each data source has its own isolated database
- Data from different sources cannot conflict with each other
- Clear data provenance - you know exactly which database contains which source's data

### How Data Flows

```
┌─────────────┐
│ Data Source │ (Yahoo Finance, Alpha Vantage, Polygon.io)
└──────┬──────┘
       │ fetch_ohlcv(symbol, start, end)
       ▼
┌─────────────────┐
│ DataStore.save() │ (with data_source parameter)
└────────┬─────────┘
         │
         │ Routes to source-specific database
         │ Upsert strategy:
         │ - Delete existing data in date range
         │ - Insert new data
         ▼
┌──────────────────┐
│  quant_library_*  │
│  (source DB)     │
│  ohlcv_data      │
└──────────────────┘
```

### Implementation

- `DataStore(data_source='yahoo')` routes to `quant_library_yahoo`
- `DataStore(data_source='alpha_vantage')` routes to `quant_library_alphavantage`
- `DataStore(data_source='polygon')` routes to `quant_library_polygon`
- Symbol listing aggregates across all source databases

## Architecture Benefits and Trade-offs

### Benefits

**Separate database per source:**
- `quant_library_yahoo` - Yahoo Finance data
- `quant_library_alphavantage` - Alpha Vantage data
- `quant_library_polygon` - Polygon.io data
- `quant_library` - Default database (backtest results, API keys)

- ✅ **Complete data separation**: Each source's data is isolated
- ✅ **No data conflicts**: Different sources can't overwrite each other's data
- ✅ **Source-specific optimization**: Can optimize each database independently
- ✅ **Clear data provenance**: Know exactly which database contains which source's data
- ✅ **Easier data management**: Backup/restore per source, different retention policies

### Trade-offs

- ⚠️ **Query complexity**: Symbol listing requires querying all databases
- ⚠️ **More connections**: Multiple database connections (but SQLAlchemy pools handle this)
- ⚠️ **Setup complexity**: Need to create and initialize multiple databases

## Alternative Architectures (Not Currently Used)

### Single Unified Database

This approach would store all data sources in one database:

**Pros:**
- Simplicity: One database to manage, one connection pool
- Easier queries: No joins needed to get data for a symbol
- Unified caching: All data sources benefit from the same cache
- Lower overhead: Single database connection

**Cons:**
- Data source ambiguity: Can't tell which source provided which data point
- Potential conflicts: If two sources have different values for the same timestamp, last write wins
- No source comparison: Can't easily compare data quality across sources

### Source-Tracked Single Database

This approach would add a `data_source` column to track the source:

**Pros:**
- Track which source provided each data point
- Compare data quality across sources
- Keep data from multiple sources without conflict

**Cons:**
- More complex queries (need to choose/filter by source)
- Larger database (duplicate data possible)
- More complex logic to merge/choose data

## Date Range Limitations by Source

### Yahoo Finance
- **Historical data**: Very extensive (decades for most symbols)
- **Real-time data**: Available (with some limitations)
- **Rate limits**: Informal (be respectful, no strict limits)
- **Date range**: Typically back to IPO date or early 1970s+
- **No explicit limits** on date ranges

### Alpha Vantage (Free Tier)
- **Historical data**: Last 100 data points only (`outputsize=compact`)
- **Premium tier**: Full history available (`outputsize=full`)
- **Rate limits**: 5 calls/minute, 500 calls/day
- **Date range**: ~100 trading days (about 5 months) on free tier
- **Intervals**: Daily (`1d`) only

### Polygon.io
- **Free tier**: Varies by plan (check current pricing)
- **Historical data**: Available from September 2003
- **Rate limits**: Varies by plan
- **Date range**: Since 2003 (extensive history)
- **Intervals**: Daily, hourly, minute-level data

## Configuration

**Environment variables:**
- `DATABASE_URL_YAHOO` - Yahoo Finance database
- `DATABASE_URL_ALPHA_VANTAGE` - Alpha Vantage database
- `DATABASE_URL_POLYGON` - Polygon.io database
- `DATABASE_URL` - Default database (backtest results, API keys)

**Setup:**
```bash
# Create and initialize all databases
python scripts/create_source_databases.py

# Or initialize individually
python scripts/init_database.py --source yahoo
python scripts/init_database.py --source alpha_vantage
python scripts/init_database.py --source polygon
```

### Best Practices

1. **Use Yahoo Finance as default** - best free option with extensive history
2. **Use Alpha Vantage/Polygon for specific needs:**
   - Alpha Vantage: When Yahoo Finance fails, need guaranteed API
   - Polygon: When you need intraday data or specific features
3. **Leverage caching**: The database cache works regardless of source
4. **Use `force_refresh_all=True`** when switching data sources to avoid mixing data

### Data Consistency Considerations

**Current behavior:**
- Each data source stores data in its own database
- Fetching AAPL from Yahoo Finance saves to `quant_library_yahoo`
- Fetching AAPL from Alpha Vantage saves to `quant_library_alphavantage`
- Data from different sources does not interact or conflict

**Best Practices:**
- Use `data_source` parameter when creating DataStore to ensure data goes to the correct database
- When switching data sources, be aware that you're switching to a different database
- Symbol listing aggregates across all databases, so you can see all available symbols regardless of source
