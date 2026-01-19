"""Helper functions for Streamlit app"""

import streamlit as st
from typing import Optional, Dict, List
import pandas as pd
import json
from pathlib import Path
from datetime import datetime
from quantlib.data import DataStore
from quantlib.data.database import verify_connection, create_database_engine
from sqlalchemy import text


def init_session_state():
    """Initialize session state variables"""
    if 'data' not in st.session_state:
        st.session_state.data = None
    if 'results' not in st.session_state:
        st.session_state.results = None
    if 'selected_symbol' not in st.session_state:
        st.session_state.selected_symbol = None
    if 'recent_symbols' not in st.session_state:
        st.session_state.recent_symbols = []
    if 'strategy_type' not in st.session_state:
        st.session_state.strategy_type = 'moving_average'
    if 'strategy_params' not in st.session_state:
        st.session_state.strategy_params = {}
    if 'backtest_config' not in st.session_state:
        st.session_state.backtest_config = {
            'initial_capital': 100000,
            'commission': 1.0,
            'slippage': 0.0,
            'use_benchmark': True,
            'benchmark_symbol': 'SPY'
        }


def display_data_preview(data: pd.DataFrame, max_rows: int = 10):
    """Display data preview in Streamlit"""
    if data is None or data.empty:
        st.info("No data loaded. Please fetch data first.")
        return
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Rows", len(data))
    with col2:
        st.metric("Start Date", data.index[0].strftime('%Y-%m-%d') if len(data) > 0 else "N/A")
    with col3:
        st.metric("End Date", data.index[-1].strftime('%Y-%m-%d') if len(data) > 0 else "N/A")
    
    st.subheader("Data Preview")
    st.dataframe(data.head(max_rows), use_container_width=True)
    
    with st.expander("Data Statistics"):
        st.dataframe(data.describe(), use_container_width=True)


def format_currency(value: float) -> str:
    """Format value as currency"""
    return f"${value:,.2f}"


def format_percentage(value: float) -> str:
    """Format value as percentage"""
    return f"{value:.2f}%"


def format_number(value: float) -> str:
    """Format number with commas"""
    return f"{value:,.2f}"


@st.cache_data(ttl=300)  # Cache for 5 minutes
def get_database_symbols() -> list:
    """
    Get list of all symbols available in the database.
    Cached to avoid repeated database queries.
    
    Returns:
        List of symbol strings
    """
    try:
        store = DataStore()
        symbols = store.list_symbols()
        return symbols
    except Exception:
        return []


def check_database_connection() -> tuple[bool, str]:
    """
    Check database connection status.
    
    Returns:
        Tuple of (is_connected: bool, message: str)
    """
    try:
        engine = create_database_engine()
        if verify_connection(engine):
            return True, "✅ Connected"
        else:
            return False, "❌ Connection failed"
    except Exception as e:
        return False, f"❌ Error: {str(e)[:50]}"


@st.cache_data(ttl=300)
def get_symbol_metadata(symbol: str) -> dict:
    """
    Get metadata for a symbol from database.
    Cached to avoid repeated database queries.
    
    Args:
        symbol: Stock symbol
        
    Returns:
        Dictionary with metadata
    """
    try:
        store = DataStore()
        metadata = store.get_metadata(symbol.upper())
        return metadata
    except Exception:
        return {}


@st.cache_data(ttl=300)
def get_database_size() -> dict:
    """
    Get database storage size information.
    Cached to avoid repeated database queries.
    
    Returns:
        Dictionary with size information:
        - total_size_bytes: Total database size in bytes
        - total_size_gb: Total database size in GB
        - ohlcv_table_size_bytes: ohlcv_data table size in bytes
        - ohlcv_table_size_gb: ohlcv_data table size in GB
        - metadata_table_size_bytes: symbol_metadata table size in bytes
        - metadata_table_size_gb: symbol_metadata table size in GB
    """
    try:
        engine = create_database_engine()
        
        with engine.connect() as conn:
            # Get current database name
            db_name_result = conn.execute(text("SELECT current_database()"))
            db_name = db_name_result.scalar()
            
            # Get total database size
            db_size_result = conn.execute(
                text("SELECT pg_database_size(:db_name)"),
                {'db_name': db_name}
            )
            total_size_bytes = db_size_result.scalar()
            total_size_gb = total_size_bytes / (1024 ** 3)
            
            # Get table sizes
            table_sizes_result = conn.execute(text("""
                SELECT 
                    tablename,
                    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
                FROM pg_tables
                WHERE schemaname = 'public'
                    AND tablename IN ('ohlcv_data', 'symbol_metadata')
                ORDER BY tablename
            """))
            
            ohlcv_size_bytes = 0
            metadata_size_bytes = 0
            
            for row in table_sizes_result:
                if row.tablename == 'ohlcv_data':
                    ohlcv_size_bytes = row.size_bytes
                elif row.tablename == 'symbol_metadata':
                    metadata_size_bytes = row.size_bytes
            
            return {
                'total_size_bytes': total_size_bytes,
                'total_size_gb': total_size_gb,
                'ohlcv_table_size_bytes': ohlcv_size_bytes,
                'ohlcv_table_size_gb': ohlcv_size_bytes / (1024 ** 3),
                'metadata_table_size_bytes': metadata_size_bytes,
                'metadata_table_size_gb': metadata_size_bytes / (1024 ** 3),
            }
    except Exception as e:
        return {
            'total_size_bytes': 0,
            'total_size_gb': 0,
            'ohlcv_table_size_bytes': 0,
            'ohlcv_table_size_gb': 0,
            'metadata_table_size_bytes': 0,
            'metadata_table_size_gb': 0,
            'error': str(e)
        }


@st.cache_data(ttl=300)
def get_database_statistics() -> dict:
    """
    Get comprehensive database statistics using all metadata.
    Cached to avoid repeated database queries.
    
    Returns:
        Dictionary with statistics including:
        - total_symbols: Total number of symbols
        - total_rows: Total number of data rows (sum of all rows_count)
        - earliest_date: Earliest start_date across all symbols
        - latest_date: Latest end_date across all symbols
        - avg_rows_per_symbol: Average rows per symbol
        - last_update: Most recent last_update timestamp
        - symbols_by_format: Count of symbols by storage format
    """
    try:
        store = DataStore()
        all_metadata = store.get_all_metadata()
        
        if not all_metadata:
            return {
                'total_symbols': 0,
                'total_rows': 0,
                'earliest_date': None,
                'latest_date': None,
                'avg_rows_per_symbol': 0,
                'last_update': None,
                'symbols_by_format': {}
            }
        
        total_symbols = len(all_metadata)
        total_rows = 0
        earliest_date = None
        latest_date = None
        last_update = None
        symbols_by_format = {}
        
        for symbol, metadata in all_metadata.items():
            # Sum row counts
            if metadata.get('rows_count'):
                total_rows += metadata.get('rows_count', 0)
            
            # Track date range
            start_date_str = metadata.get('start_date')
            end_date_str = metadata.get('end_date')
            
            if start_date_str:
                start_date = pd.to_datetime(start_date_str)
                if earliest_date is None or start_date < earliest_date:
                    earliest_date = start_date
            
            if end_date_str:
                end_date = pd.to_datetime(end_date_str)
                if latest_date is None or end_date > latest_date:
                    latest_date = end_date
            
            # Track last update
            update_str = metadata.get('last_update')
            if update_str:
                update_date = pd.to_datetime(update_str)
                if last_update is None or update_date > last_update:
                    last_update = update_date
            
            # Count by format
            fmt = metadata.get('format', 'unknown')
            symbols_by_format[fmt] = symbols_by_format.get(fmt, 0) + 1
        
        avg_rows_per_symbol = total_rows / total_symbols if total_symbols > 0 else 0
        
        return {
            'total_symbols': total_symbols,
            'total_rows': total_rows,
            'earliest_date': earliest_date,
            'latest_date': latest_date,
            'avg_rows_per_symbol': avg_rows_per_symbol,
            'last_update': last_update,
            'symbols_by_format': symbols_by_format
        }
    except Exception as e:
        return {
            'total_symbols': 0,
            'total_rows': 0,
            'earliest_date': None,
            'latest_date': None,
            'avg_rows_per_symbol': 0,
            'last_update': None,
            'symbols_by_format': {},
            'error': str(e)
        }


@st.cache_data(ttl=3600)  # Cache for 1 hour (file doesn't change often)
def load_tickers_json(tickers_file: Optional[Path] = None) -> Dict[str, List[str]]:
    """
    Load tickers from tickers.json file, organized by sector.
    Cached to avoid repeated file reads.
    
    Args:
        tickers_file: Path to tickers.json (defaults to project root/tickers.json)
        
    Returns:
        Dictionary mapping sector names to lists of symbols
    """
    if tickers_file is None:
        # Try to find tickers.json in project root
        project_root = Path(__file__).parent.parent.parent
        tickers_file = project_root / "tickers.json"
    
    try:
        if not tickers_file.exists():
            return {}
        
        with open(tickers_file, 'r') as f:
            data = json.load(f)
        
        return data
    except Exception:
        return {}


@st.cache_data(ttl=3600)
def get_all_tickers_list(tickers_file: Optional[Path] = None) -> List[str]:
    """
    Get all unique tickers from tickers.json as a flat sorted list.
    Cached to avoid repeated file reads.
    
    Args:
        tickers_file: Path to tickers.json (defaults to project root/tickers.json)
        
    Returns:
        Sorted list of unique ticker symbols
    """
    tickers_data = load_tickers_json(tickers_file)
    
    # Flatten the dictionary of sectors into a single list
    all_tickers = []
    for sector, tickers in tickers_data.items():
        all_tickers.extend(tickers)
    
    # Remove duplicates and sort
    unique_tickers = sorted(list(set(all_tickers)))
    return unique_tickers
