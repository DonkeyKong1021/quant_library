"""
Data fetching endpoints
"""

import sys
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import Optional
import pandas as pd

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from quantlib.data import DataStore
from quantlib.data.fetcher_registry import get_registry
from quantlib.utils.datetime import normalize_date_range
from api.models.schemas import (
    DataFetchRequest,
    DataFetchResponse,
    AllSymbolsResponse,
    SymbolMetadata,
    SectorsResponse,
    SymbolMetadataResponse,
    RecentSymbolsRequest,
)

router = APIRouter()

# In-memory storage for recent symbols (in production, use database or user preferences)
recent_symbols = []

# Cache for tickers.json (loaded once, can be refreshed)
_tickers_cache = None


def load_tickers_json() -> dict:
    """Load tickers.json file, with caching"""
    global _tickers_cache
    if _tickers_cache is not None:
        return _tickers_cache

    tickers_file = project_root / "tickers.json"
    try:
        if tickers_file.exists():
            with open(tickers_file, "r") as f:
                _tickers_cache = json.load(f)
            return _tickers_cache
    except Exception:
        pass

    return {}


def get_all_symbols_with_metadata() -> list:
    """Get all symbols from all sources with metadata (aggregated across all source databases)"""
    symbols_dict = {}
    common_symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "SPY"]

    # Add common symbols
    for sym in common_symbols:
        symbols_dict[sym.upper()] = {"source": "Common", "sector": None, "in_database": False, "data_sources": []}

    # Query all source databases for symbols
    data_sources = ['yahoo', 'alpha_vantage', 'polygon']
    for source in data_sources:
        try:
            store = DataStore(data_source=source)
            db_symbols = store.list_symbols()
            for sym in db_symbols:
                sym_upper = sym.upper()
                if sym_upper not in symbols_dict:
                    symbols_dict[sym_upper] = {"source": "DB", "sector": None, "in_database": True, "data_sources": [source]}
                else:
                    symbols_dict[sym_upper]["source"] = "DB"
                    symbols_dict[sym_upper]["in_database"] = True
                    if source not in symbols_dict[sym_upper]["data_sources"]:
                        symbols_dict[sym_upper]["data_sources"].append(source)
        except Exception:
            # Skip this source if database doesn't exist or connection fails
            pass

    # Add tickers from tickers.json
    tickers_data = load_tickers_json()
    if tickers_data:
        for sector, tickers in tickers_data.items():
            for ticker in tickers:
                ticker_upper = ticker.upper()
                if ticker_upper not in symbols_dict:
                    symbols_dict[ticker_upper] = {
                        "source": "Ticker",
                        "sector": sector,
                        "in_database": False,
                    }
                elif symbols_dict[ticker_upper]["source"] == "Common":
                    symbols_dict[ticker_upper]["source"] = "Ticker"
                    symbols_dict[ticker_upper]["sector"] = sector

    # Convert to list of SymbolMetadata
    result = []
    for symbol, metadata in symbols_dict.items():
        result.append(
            SymbolMetadata(
                symbol=symbol,
                source=metadata["source"],
                sector=metadata.get("sector"),
                in_database=metadata.get("in_database", False),
            )
        )

    return sorted(result, key=lambda x: x.symbol)


def dataframe_to_dict_list(df: pd.DataFrame) -> list:
    """Convert DataFrame to list of dictionaries for JSON serialization"""
    df = df.reset_index()  # Include index as column
    # Rename index column to 'Date' if it exists
    if df.index.name:
        df.rename(columns={df.index.name: "Date"}, inplace=True)
    elif "Date" not in df.columns and len(df.columns) > 0:
        # If no index name but we have datetime index, use first column
        first_col = df.columns[0]
        if pd.api.types.is_datetime64_any_dtype(df[first_col]):
            df.rename(columns={first_col: "Date"}, inplace=True)
    # Convert Date column to string if it exists
    if "Date" in df.columns:
        df["Date"] = df["Date"].astype(str)
    return df.to_dict("records")


@router.get("/symbols/all", response_model=AllSymbolsResponse)
async def get_all_symbols():
    """Get all symbols from all sources with metadata"""
    try:
        symbols = get_all_symbols_with_metadata()
        common = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "SPY"]

        return AllSymbolsResponse(symbols=symbols, common=common, recent=recent_symbols)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching symbols: {str(e)}")


@router.get("/symbols/sectors", response_model=SectorsResponse)
async def get_symbols_by_sectors():
    """Get symbols organized by sectors from tickers.json"""
    try:
        tickers_data = load_tickers_json()
        return SectorsResponse(sectors=tickers_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sectors: {str(e)}")


@router.get("/metadata/{symbol}", response_model=SymbolMetadataResponse)
async def get_symbol_metadata(symbol: str):
    """Get metadata for a symbol (date ranges, availability)"""
    try:
        symbol = symbol.upper()
        store = DataStore()

        metadata_response = SymbolMetadataResponse(symbol=symbol, in_database=False)

        try:
            metadata = store.get_metadata(symbol)
            if metadata:
                metadata_response.in_database = True
                if metadata.get("start_date") and metadata.get("end_date"):
                    metadata_response.available_date_range = {
                        "start": str(metadata["start_date"]),
                        "end": str(metadata["end_date"]),
                    }
                metadata_response.row_count = metadata.get("rows_count")
                if metadata.get("last_update"):
                    metadata_response.last_update = str(metadata["last_update"])
        except Exception:
            pass  # Symbol not in database

        return metadata_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching metadata: {str(e)}")


@router.post("/symbols/recent")
async def update_recent_symbols(request: RecentSymbolsRequest):
    """Update recent symbols list"""
    global recent_symbols
    recent_symbols = [s.upper() for s in request.symbols[:10]]  # Keep last 10
    return {"recent": recent_symbols}


@router.post("/fetch", response_model=DataFetchResponse)
async def fetch_data(request: DataFetchRequest):
    """Fetch market data for a symbol"""
    try:
        symbol = request.symbol.upper()
        start_date = request.start_date
        end_date = request.end_date

        # Validate date range before proceeding
        try:
            normalize_date_range(start_date, end_date)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Determine data source (default to 'yahoo')
        data_source = request.data_source or 'yahoo'
        
        # Create DataStore for the specific data source
        store = DataStore(data_source=data_source)
        
        # Create fetcher using registry
        try:
            registry = get_registry()
            fetcher = registry.create(source=data_source)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Track as recent symbol
        global recent_symbols
        if symbol not in recent_symbols:
            recent_symbols.insert(0, symbol)
            recent_symbols = recent_symbols[:10]  # Keep last 10

        cached = False
        data = None

        # Check if data exists in database and use_cache is True
        # Skip cache check if force_refresh or force_refresh_all is requested
        interval = request.interval if request.interval else '1d'
        if request.use_cache and not request.force_refresh and not request.force_refresh_all:
            try:
                data = store.load(symbol, start=start_date, end=end_date, interval=interval)
                if data is not None and not data.empty:
                    cached = True
            except Exception:
                pass  # Data not in cache, fetch from source

        # Fetch from source if not cached, force_refresh, or force_refresh_all
        interval = request.interval if request.interval else '1d'
        if data is None or data.empty or request.force_refresh or request.force_refresh_all:
            try:
                data = fetcher.fetch_ohlcv(symbol, start=start_date, end=end_date, interval=interval)
                cached = False
                # Save to database with appropriate replace strategy
                # replace_all=True deletes ALL existing data before inserting
                # replace_all=False (default) only replaces data in the date range
                store.save(symbol, data, interval=interval, replace_all=request.force_refresh_all)
            except Exception as e:
                # Log error but don't fail the request if we have data
                print(f"Warning: Failed to save data to database: {e}")
                # Re-raise if we don't have data to return
                if data is None or data.empty:
                    raise

        if data is None or data.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for symbol {symbol} between {start_date} and {end_date}",
            )

        # Get metadata
        metadata = None
        try:
            db_metadata = store.get_metadata(symbol)
            if db_metadata:
                metadata = {
                    "start_date": str(db_metadata.get("start_date", "")),
                    "end_date": str(db_metadata.get("end_date", "")),
                    "row_count": db_metadata.get("rows_count"),
                    "last_update": str(db_metadata.get("last_update", "")),
                }
        except Exception:
            pass

        # Convert DataFrame to JSON-serializable format
        data_dict = dataframe_to_dict_list(data)

        return DataFetchResponse(
            symbol=symbol,
            data=data_dict,
            start_date=start_date,
            end_date=end_date,
            row_count=len(data),
            cached=cached,
            metadata=metadata,
        )
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        # Provide specific error messages
        if "No data found" in error_msg or "Invalid symbol" in error_msg:
            raise HTTPException(status_code=404, detail=error_msg)
        elif "No timezone found" in error_msg or "delisted" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail=f"Invalid symbol: {symbol}. Symbol may be delisted or invalid.",
            )
        elif "Expecting value" in error_msg or "JSON" in error_msg or "JSONDecodeError" in error_msg:
            raise HTTPException(
                status_code=503,
                detail="Yahoo Finance API error. Please try again in a moment.",
            )
        elif "connection" in error_msg.lower() or "timeout" in error_msg.lower():
            raise HTTPException(
                status_code=503,
                detail="Network error. Please check your connection and try again.",
            )
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")


@router.get("/preview/{symbol}")
async def get_data_preview(symbol: str, data_source: Optional[str] = None):
    """Get data preview for a symbol (latest data from database)
    
    Args:
        symbol: Stock symbol
        data_source: Data source to query ('yahoo', 'alpha_vantage', 'polygon'). Defaults to 'yahoo'.
    """
    try:
        data_source = data_source or 'yahoo'
        store = DataStore(data_source=data_source)
        # Get metadata to find date range
        metadata = store.get_metadata(symbol.upper())
        if not metadata or not metadata.get("start_date"):
            raise HTTPException(status_code=404, detail=f"No data found for symbol {symbol}")

        start_date = metadata.get("start_date")
        end_date = metadata.get("end_date")

        # Load a sample of data (last 100 rows)
        data = store.load(symbol.upper(), start=start_date, end=end_date)
        if data is None or data.empty:
            raise HTTPException(status_code=404, detail=f"No data found for symbol {symbol}")

        # Return last 100 rows
        preview_data = data.tail(100)
        data_dict = dataframe_to_dict_list(preview_data)

        return {
            "symbol": symbol.upper(),
            "preview": data_dict,
            "total_rows": len(data),
            "start_date": str(data.index[0]),
            "end_date": str(data.index[-1]),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching preview: {str(e)}")