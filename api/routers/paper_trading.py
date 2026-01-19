"""Paper trading endpoints"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional, List
import logging
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory storage for paper trading sessions (would use database in production)
paper_trading_sessions: Dict[str, Dict[str, Any]] = {}


@router.post("/start")
async def start_paper_trading(request: Dict[str, Any]):
    """
    Start a paper trading session.
    
    Request body:
    - strategy: Strategy configuration
    - symbols: List of symbols to trade
    - initial_capital: Starting capital
    - config: Additional configuration
    """
    try:
        session_id = str(uuid.uuid4())
        
        # Store session (stub - would create actual paper trading engine)
        paper_trading_sessions[session_id] = {
            'session_id': session_id,
            'status': 'running',
            'strategy': request.get('strategy'),
            'symbols': request.get('symbols', []),
            'initial_capital': request.get('initial_capital', 100000),
            'config': request.get('config', {}),
            'trades': [],
            'equity_history': [],
        }
        
        return {
            'session_id': session_id,
            'status': 'started',
            'message': 'Paper trading session started'
        }
    except Exception as e:
        logger.error(f"Error starting paper trading: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}")
async def get_paper_trading_session(session_id: str):
    """Get paper trading session status"""
    if session_id not in paper_trading_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return paper_trading_sessions[session_id]


@router.post("/sessions/{session_id}/stop")
async def stop_paper_trading(session_id: str):
    """Stop a paper trading session"""
    if session_id not in paper_trading_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    paper_trading_sessions[session_id]['status'] = 'stopped'
    
    return {
        'session_id': session_id,
        'status': 'stopped',
        'message': 'Paper trading session stopped'
    }


@router.get("/sessions")
async def list_paper_trading_sessions():
    """List all paper trading sessions"""
    sessions = list(paper_trading_sessions.values())
    return {
        'sessions': sessions,
        'total': len(sessions)
    }
