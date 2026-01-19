"""Fundamental data endpoints"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
import logging
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from quantlib.data.fundamental_fetcher import FundamentalDataFetcher

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/{symbol}")
async def get_fundamental_data(symbol: str):
    """
    Get fundamental data for a symbol.
    
    Returns company fundamentals including:
    - Sector, industry
    - Market cap
    - P/E ratio
    - Earnings per share
    - Dividend yield
    - Financial metrics
    """
    try:
        symbol = symbol.upper()
        
        # Fetch fundamental data using Yahoo Finance
        fetcher = FundamentalDataFetcher()
        fundamentals_obj = fetcher.fetch_fundamentals(symbol)
        
        if fundamentals_obj is None:
            # Return structure with None values if data not available
            fundamentals = {
                'symbol': symbol,
                'sector': None,
                'industry': None,
                'market_cap': None,
                'pe_ratio': None,
                'earnings_per_share': None,
                'dividend_yield': None,
                'revenue': None,
                'net_income': None,
                'total_assets': None,
                'cash': None,
                'last_updated': None,
            }
        else:
            # Convert CompanyFundamentals to dict
            fundamentals = fundamentals_obj.to_dict()
        
        return fundamentals
    except Exception as e:
        logger.error(f"Error fetching fundamental data for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/financial-statements")
async def get_financial_statements(symbol: str, statement_type: str = 'income'):
    """
    Get financial statements for a symbol.
    
    Args:
        symbol: Stock symbol
        statement_type: 'income', 'balance_sheet', or 'cash_flow'
    """
    try:
        symbol = symbol.upper()
        
        # Stub implementation
        return {
            'symbol': symbol,
            'statement_type': statement_type,
            'data': [],
            'periods': [],
        }
    except Exception as e:
        logger.error(f"Error fetching financial statements: {e}")
        raise HTTPException(status_code=500, detail=str(e))
