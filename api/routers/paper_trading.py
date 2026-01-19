"""Paper trading endpoints"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional, List
import logging
import uuid
import asyncio
from datetime import datetime, timedelta
import pandas as pd
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from quantlib.live.paper_trading import PaperTradingEngine
from quantlib.data import DataStore
from api.routers.backtest import create_strategy
from quantlib.risk import RiskCalculator
from quantlib.risk.metrics import sharpe_ratio, sortino_ratio, calmar_ratio
from quantlib.risk.drawdown import max_drawdown, max_drawdown_pct

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory storage for paper trading sessions (would use database in production)
paper_trading_sessions: Dict[str, Dict[str, Any]] = {}
# Store running engine instances
paper_trading_engines: Dict[str, PaperTradingEngine] = {}


def fetch_historical_data(symbols: List[str], days: int = 90) -> Dict[str, pd.DataFrame]:
    """
    Fetch historical data for symbols from DataStore.
    
    Args:
        symbols: List of symbols to fetch
        days: Number of days of historical data to fetch (default: 90)
        
    Returns:
        Dictionary mapping symbol to DataFrame with OHLCV data
    """
    store = DataStore()
    historical_data = {}
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)
    
    for symbol in symbols:
        symbol_upper = symbol.upper()
        try:
            data = store.load(symbol_upper, start=str(start_date), end=str(end_date))
            if data is None or data.empty:
                raise ValueError(f"No data found for symbol {symbol_upper}")
            historical_data[symbol_upper] = data
        except Exception as e:
            logger.error(f"Error fetching data for {symbol_upper}: {e}")
            raise HTTPException(
                status_code=404,
                detail=f"Failed to fetch data for symbol {symbol_upper}: {str(e)}"
            )
    
    return historical_data


def serialize_dataframe(df: pd.DataFrame) -> list:
    """Serialize DataFrame to list of dictionaries, converting datetime columns to strings"""
    if df.empty:
        return []
    
    df = df.reset_index()
    
    # Convert any datetime columns (including index) to strings
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].astype(str)
    
    # Also handle index name if it's datetime
    if df.index.name and pd.api.types.is_datetime64_any_dtype(df.index):
        df.index = df.index.astype(str)
    
    return df.to_dict('records')


async def run_paper_trading_session(
    session_id: str,
    strategy,
    symbols: List[str],
    historical_data: Dict[str, pd.DataFrame],
    initial_capital: float,
    config: Dict[str, Any]
):
    """Run paper trading session in background"""
    try:
        engine = PaperTradingEngine(
            initial_capital=initial_capital,
            commission=config.get('commission', 1.0),
            slippage=config.get('slippage', 0.0)
        )
        
        # Store engine
        paper_trading_engines[session_id] = engine
        
        # Update session status
        paper_trading_sessions[session_id]['status'] = 'running'
        paper_trading_sessions[session_id]['started_at'] = datetime.now().isoformat()
        
        # Start engine (this runs until stopped)
        await engine.start(strategy, symbols, historical_data)
        
    except Exception as e:
        logger.error(f"Error in paper trading session {session_id}: {e}")
        paper_trading_sessions[session_id]['status'] = 'error'
        paper_trading_sessions[session_id]['error'] = str(e)
        if session_id in paper_trading_engines:
            del paper_trading_engines[session_id]


@router.post("/start")
async def start_paper_trading(request: Dict[str, Any]):
    """
    Start a paper trading session.
    
    Request body:
    - strategy: Strategy configuration
    - symbols: List of symbols to trade
    - initial_capital: Starting capital
    - config: Additional configuration (commission, slippage, etc.)
    """
    try:
        # Validate required fields
        if 'strategy' not in request:
            raise HTTPException(status_code=400, detail="Strategy configuration is required")
        
        symbols = request.get('symbols', [])
        if not symbols or not isinstance(symbols, list):
            raise HTTPException(status_code=400, detail="Symbols list is required and must be non-empty")
        
        initial_capital = request.get('initial_capital', 100000)
        if initial_capital <= 0:
            raise HTTPException(status_code=400, detail="Initial capital must be positive")
        
        session_id = str(uuid.uuid4())
        config = request.get('config', {})
        
        # Create strategy
        try:
            strategy = create_strategy(request['strategy'])
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid strategy configuration: {str(e)}")
        except Exception as e:
            logger.error(f"Error creating strategy: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create strategy: {str(e)}")
        
        # Fetch historical data
        try:
            historical_data = fetch_historical_data(symbols, days=config.get('data_days', 90))
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching historical data: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch historical data: {str(e)}")
        
        # Store session metadata
        paper_trading_sessions[session_id] = {
            'session_id': session_id,
            'status': 'starting',
            'strategy': request.get('strategy'),
            'symbols': symbols,
            'initial_capital': initial_capital,
            'config': config,
            'created_at': datetime.now().isoformat(),
        }
        
        # Start engine in background
        asyncio.create_task(run_paper_trading_session(
            session_id, strategy, symbols, historical_data, initial_capital, config
        ))
        
        return {
            'session_id': session_id,
            'status': 'starting',
            'message': 'Paper trading session is starting'
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting paper trading: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}")
async def get_paper_trading_session(session_id: str):
    """Get paper trading session status"""
    if session_id not in paper_trading_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = paper_trading_sessions[session_id].copy()
    
    # Get live data from engine if running
    if session_id in paper_trading_engines:
        engine = paper_trading_engines[session_id]
        session['current_equity'] = engine.get_current_equity()
        session['current_positions'] = engine.portfolio.get_positions()
        session['num_trades'] = len(engine.trades)
        session['cash'] = engine.portfolio.get_cash()
    
    return session


@router.post("/sessions/{session_id}/stop")
async def stop_paper_trading(session_id: str):
    """Stop a paper trading session"""
    if session_id not in paper_trading_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        # Stop engine if running
        if session_id in paper_trading_engines:
            engine = paper_trading_engines[session_id]
            await engine.stop()
            del paper_trading_engines[session_id]
        
        # Update session status
        paper_trading_sessions[session_id]['status'] = 'stopped'
        paper_trading_sessions[session_id]['stopped_at'] = datetime.now().isoformat()
        
        return {
            'session_id': session_id,
            'status': 'stopped',
            'message': 'Paper trading session stopped'
        }
    except Exception as e:
        logger.error(f"Error stopping session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to stop session: {str(e)}")


@router.get("/sessions")
async def list_paper_trading_sessions():
    """List all paper trading sessions"""
    sessions = list(paper_trading_sessions.values())
    return {
        'sessions': sessions,
        'total': len(sessions)
    }


@router.get("/sessions/{session_id}/trades")
async def get_session_trades(session_id: str):
    """Get trade history for a session"""
    if session_id not in paper_trading_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session_id not in paper_trading_engines:
        # Return empty trades if session is not running
        return {
            'session_id': session_id,
            'trades': [],
            'count': 0,
            'message': 'Session is not running'
        }
    
    try:
        engine = paper_trading_engines[session_id]
        trades_df = engine.get_trades()
        
        return {
            'session_id': session_id,
            'trades': serialize_dataframe(trades_df),
            'count': len(trades_df)
        }
    except Exception as e:
        logger.error(f"Error getting trades for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get trades: {str(e)}")


@router.get("/sessions/{session_id}/equity")
async def get_session_equity(session_id: str):
    """Get equity curve for a session"""
    if session_id not in paper_trading_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session_id not in paper_trading_engines:
        # Return empty equity if session is not running
        return {
            'session_id': session_id,
            'equity': [],
            'count': 0,
            'message': 'Session is not running'
        }
    
    try:
        engine = paper_trading_engines[session_id]
        equity_df = engine.get_equity_curve()
        
        return {
            'session_id': session_id,
            'equity': serialize_dataframe(equity_df),
            'count': len(equity_df)
        }
    except Exception as e:
        logger.error(f"Error getting equity for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get equity: {str(e)}")


@router.get("/sessions/{session_id}/positions")
async def get_session_positions(session_id: str):
    """Get current positions for a session"""
    if session_id not in paper_trading_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session_id not in paper_trading_engines:
        # Return empty positions if session is not running
        return {
            'session_id': session_id,
            'positions': [],
            'count': 0,
            'message': 'Session is not running'
        }
    
    try:
        engine = paper_trading_engines[session_id]
        positions = engine.portfolio.get_positions()
        
        # Calculate position values if we have current prices
        position_details = []
        for symbol, quantity in positions.items():
            position_details.append({
                'symbol': symbol,
                'quantity': quantity,
            })
        
        return {
            'session_id': session_id,
            'positions': position_details,
            'count': len(positions)
        }
    except Exception as e:
        logger.error(f"Error getting positions for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get positions: {str(e)}")


@router.get("/sessions/{session_id}/metrics")
async def get_session_metrics(session_id: str):
    """Get performance metrics for a session"""
    if session_id not in paper_trading_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session_id not in paper_trading_engines:
        raise HTTPException(status_code=400, detail="Session is not running")
    
    engine = paper_trading_engines[session_id]
    equity_df = engine.get_equity_curve()
    
    if equity_df.empty or len(equity_df) < 2:
        return {
            'session_id': session_id,
            'metrics': {},
            'message': 'Insufficient data for metrics calculation'
        }
    
    try:
        # Calculate returns from equity curve
        if 'equity' in equity_df.columns:
            equity_series = equity_df['equity']
        elif len(equity_df.columns) > 0:
            equity_series = equity_df.iloc[:, 0]
        else:
            return {
                'session_id': session_id,
                'metrics': {},
                'message': 'No equity data available'
            }
        returns = equity_series.pct_change().dropna()
        
        if len(returns) == 0:
            return {
                'session_id': session_id,
                'metrics': {},
                'message': 'Insufficient data for metrics calculation'
            }
        
        # Calculate metrics using RiskCalculator
        metrics = {}
        try:
            calculator = RiskCalculator(
                returns=returns,
                equity_curve=equity_series,
                risk_free_rate=0.0,
                periods=252,  # Daily data
            )
            metrics = calculator.get_flat_metrics()
        except Exception as e:
            logger.warning(f"Error calculating comprehensive metrics: {e}")
            # Fall back to basic metrics
            if len(returns) > 0:
                metrics['sharpe_ratio'] = float(sharpe_ratio(returns))
                metrics['sortino_ratio'] = float(sortino_ratio(returns))
                if len(equity_series) > 0:
                    max_dd = max_drawdown(equity_series)
                    max_dd_pct = max_drawdown_pct(equity_series)
                    metrics['max_drawdown'] = float(max_dd)
                    metrics['max_drawdown_pct'] = float(max_dd_pct)
                    if max_dd_pct != 0:
                        metrics['calmar_ratio'] = float(calmar_ratio(returns, abs(max_dd_pct / 100)))
        
        # Add basic metrics
        initial_capital = paper_trading_sessions[session_id]['initial_capital']
        current_equity = engine.get_current_equity()
        metrics['total_return'] = float((current_equity - initial_capital) / initial_capital * 100)
        metrics['total_return_pct'] = metrics['total_return']
        metrics['num_trades'] = len(engine.trades)
        metrics['initial_capital'] = float(initial_capital)
        metrics['final_equity'] = float(current_equity)
        
        return {
            'session_id': session_id,
            'metrics': metrics
        }
    except Exception as e:
        logger.error(f"Error calculating metrics for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate metrics: {str(e)}")
