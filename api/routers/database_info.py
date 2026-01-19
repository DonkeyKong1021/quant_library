"""
Database information endpoints

Shows which databases are configured, available, and active.
"""

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from quantlib.data.database import (
    get_database_url,
    get_database_url_yahoo,
    get_database_url_alphavantage,
    get_database_url_polygon,
    get_database_url_for_source,
    create_database_engine,
    verify_connection,
)
from sqlalchemy import text

router = APIRouter()


def check_database_status(url: str, name: str) -> Dict:
    """
    Check if a database is available and accessible.
    
    Args:
        url: Database connection URL
        name: Display name for the database
        
    Returns:
        Dictionary with status information
    """
    status = {
        "name": name,
        "url": url.split('@')[1] if '@' in url else url,  # Hide credentials
        "configured": True,
        "available": False,
        "error": None,
    }
    
    try:
        engine = create_database_engine(url=url)
        if verify_connection(engine):
            status["available"] = True
            
            # Try to get database name and size
            try:
                with engine.connect() as conn:
                    # Get database name
                    db_result = conn.execute(text("SELECT current_database()"))
                    db_name = db_result.scalar()
                    status["database_name"] = db_name
                    
                    # Get database size
                    try:
                        size_result = conn.execute(
                            text("SELECT pg_database_size(:db_name)"),
                            {"db_name": db_name}
                        )
                        size_bytes = size_result.scalar()
                        size_gb = size_bytes / (1024 ** 3)
                        status["size_gb"] = round(size_gb, 2)
                    except Exception:
                        pass
            except Exception as e:
                status["error"] = str(e)
    except Exception as e:
        status["error"] = str(e)
        status["available"] = False
    
    return status


@router.get("/databases")
async def get_database_info():
    """
    Get information about all configured databases.
    
    Shows which databases are configured, available, and their status.
    """
    databases = []
    
    # Default database (backtest results, API keys)
    default_url = get_database_url()
    databases.append(check_database_status(default_url, "Default (Backtests/API Keys)"))
    
    # Source-specific databases
    yahoo_url = get_database_url_yahoo()
    databases.append(check_database_status(yahoo_url, "Yahoo Finance"))
    
    alphavantage_url = get_database_url_alphavantage()
    databases.append(check_database_status(alphavantage_url, "Alpha Vantage"))
    
    polygon_url = get_database_url_polygon()
    databases.append(check_database_status(polygon_url, "Polygon.io"))
    
    return {
        "databases": databases,
        "summary": {
            "total_configured": len(databases),
            "total_available": sum(1 for db in databases if db["available"]),
            "total_unavailable": sum(1 for db in databases if not db["available"]),
        }
    }


@router.get("/databases/{source}")
async def get_database_info_for_source(source: str):
    """
    Get information about a specific source database.
    
    Args:
        source: Data source name ('yahoo', 'alpha_vantage', 'polygon')
    """
    try:
        url = get_database_url_for_source(source)
        display_name = source.replace('_', ' ').title()
        status = check_database_status(url, display_name)
        return status
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
