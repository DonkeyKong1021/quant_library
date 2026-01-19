"""
Database status and statistics endpoints
"""

import sys
import json
from pathlib import Path
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from quantlib.data import DataStore
from quantlib.data.database import verify_connection, create_database_engine, get_database_url
from quantlib.data.fetcher_registry import get_registry
from sqlalchemy import text
from api.models.schemas import DatabaseStatusResponse, DatabaseStatisticsResponse, DatabaseBatchUpdateResponse

router = APIRouter()


@router.get("/status", response_model=DatabaseStatusResponse)
async def get_database_status():
    """Get database connection status"""
    try:
        engine = create_database_engine()
        if verify_connection(engine):
            return {"connected": True, "message": "✅ Connected"}
        else:
            return {"connected": False, "message": "❌ Connection failed"}
    except Exception as e:
        return {"connected": False, "message": f"❌ Error: {str(e)[:50]}"}


@router.get("/symbols")
async def get_database_symbols():
    """Get list of all symbols in database"""
    try:
        store = DataStore()
        symbols = store.list_symbols()
        return {"symbols": symbols}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching symbols: {str(e)}")


@router.get("/statistics", response_model=DatabaseStatisticsResponse)
async def get_database_statistics():
    """Get comprehensive database statistics"""
    try:
        store = DataStore()
        all_metadata = store.get_all_metadata()
        
        if not all_metadata:
            return DatabaseStatisticsResponse(total_symbols=0)
        
        # Calculate statistics
        total_symbols = len(all_metadata)
        total_rows = sum(m.get('rows_count', 0) for m in all_metadata.values())
        avg_rows = total_rows / total_symbols if total_symbols > 0 else 0
        
        # Get date ranges
        earliest_dates = [m.get('start_date') for m in all_metadata.values() if m.get('start_date')]
        latest_dates = [m.get('end_date') for m in all_metadata.values() if m.get('end_date')]
        
        earliest_date = min(earliest_dates) if earliest_dates else None
        latest_date = max(latest_dates) if latest_dates else None
        
        date_span_days = None
        if earliest_date and latest_date:
            from datetime import datetime
            if isinstance(earliest_date, str):
                earliest_date = datetime.fromisoformat(earliest_date.replace('Z', '+00:00'))
            if isinstance(latest_date, str):
                latest_date = datetime.fromisoformat(latest_date.replace('Z', '+00:00'))
            date_span_days = (latest_date - earliest_date).days
        
        # Get last update
        last_updates = [m.get('last_update') for m in all_metadata.values() if m.get('last_update')]
        last_update = max(last_updates) if last_updates else None
        
        # Get database size
        total_size_gb = 0
        try:
            engine = create_database_engine()
            with engine.connect() as conn:
                db_name_result = conn.execute(text("SELECT current_database()"))
                db_name = db_name_result.scalar()
                db_size_result = conn.execute(
                    text("SELECT pg_database_size(:db_name)"),
                    {'db_name': db_name}
                )
                total_size_bytes = db_size_result.scalar()
                total_size_gb = total_size_bytes / (1024 ** 3)
        except Exception:
            pass  # Size calculation is optional
        
        return DatabaseStatisticsResponse(
            total_symbols=total_symbols,
            total_rows=total_rows if total_rows > 0 else None,
            avg_rows_per_symbol=avg_rows if avg_rows > 0 else None,
            earliest_date=str(earliest_date) if earliest_date else None,
            latest_date=str(latest_date) if latest_date else None,
            last_update=str(last_update) if last_update else None,
            date_span_days=date_span_days,
            total_size_gb=total_size_gb if total_size_gb > 0 else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching statistics: {str(e)}")


@router.post("/update-all", response_model=DatabaseBatchUpdateResponse)
async def update_all_tickers():
    """Update database with all tickers from tickers.json using yfinance"""
    try:
        # Load tickers from tickers.json
        tickers_file = project_root / "tickers.json"
        if not tickers_file.exists():
            raise HTTPException(status_code=404, detail="tickers.json file not found")
        
        with open(tickers_file, 'r') as f:
            tickers_data = json.load(f)
        
        # Flatten tickers from all sectors
        all_tickers = []
        for sector, tickers in tickers_data.items():
            all_tickers.extend(tickers)
        
        # Remove duplicates and sort
        unique_tickers = sorted(list(set(ticker.upper() for ticker in all_tickers)))
        
        if not unique_tickers:
            return DatabaseBatchUpdateResponse(
                success=False,
                total_tickers=0,
                successful=0,
                failed=0,
                skipped=0,
                message="No tickers found in tickers.json"
            )
        
        # Calculate date range (10 years)
        today = datetime.now().date()
        REASONABLE_MAX_DATE = datetime(2026, 1, 1).date()
        if today > REASONABLE_MAX_DATE:
            today = REASONABLE_MAX_DATE
        
        end_date = (today - timedelta(days=1)).strftime('%Y-%m-%d')
        start_date = (today - timedelta(days=365 * 10)).strftime('%Y-%m-%d')
        
        # Initialize store and fetcher
        store = DataStore()
        registry = get_registry()
        fetcher = registry.create(source='yahoo')  # Use yfinance
        
        # Process tickers
        successful = 0
        failed = 0
        skipped = 0
        
        for ticker in unique_tickers:
            try:
                # Skip if already exists (to avoid re-fetching)
                if store.exists(ticker):
                    skipped += 1
                    continue
                
                # Fetch data
                data = fetcher.fetch_ohlcv(symbol=ticker, start=start_date, end=end_date)
                
                if data is None or data.empty:
                    failed += 1
                    continue
                
                # Save to database
                store.save(ticker, data)
                
                # Verify save
                if store.exists(ticker):
                    successful += 1
                else:
                    failed += 1
                    
            except Exception as e:
                # Log error but continue with other tickers
                print(f"Error processing {ticker}: {str(e)}")
                failed += 1
        
        return DatabaseBatchUpdateResponse(
            success=True,
            total_tickers=len(unique_tickers),
            successful=successful,
            failed=failed,
            skipped=skipped,
            message=f"Processed {len(unique_tickers)} tickers: {successful} successful, {failed} failed, {skipped} skipped"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating database: {str(e)}")