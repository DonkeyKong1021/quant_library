"""
Database status and statistics endpoints
"""

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from quantlib.data import DataStore
from quantlib.data.database import verify_connection, create_database_engine, get_database_url
from sqlalchemy import text
from api.models.schemas import DatabaseStatusResponse, DatabaseStatisticsResponse

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