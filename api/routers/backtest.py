"""
Backtesting endpoints
"""

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
import uuid

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from quantlib.backtesting import BacktestEngine
from quantlib.data import DataStore
from quantlib.data.fetcher_registry import get_registry
from quantlib.indicators import sma, rsi, bollinger_bands, macd
from quantlib.risk import RiskCalculator
from quantlib.risk.metrics import (
    sharpe_ratio,
    sortino_ratio,
    calmar_ratio,
    alpha,
    beta,
    information_ratio,
)
from quantlib.risk.drawdown import max_drawdown, max_drawdown_pct
from quantlib.strategies import Strategy
from api.models.schemas import (
    BacktestRequest,
    BacktestResponse,
    BacktestResultsListResponse,
    BacktestResultSummary,
    BacktestCompareRequest,
    BacktestCompareResponse,
    ComparisonMetric,
)

router = APIRouter()

# In-memory storage for backtest results (fallback if database not available)
backtest_results = {}

# Try to use database storage, fall back to in-memory if not available
try:
    from api.utils.backtest_storage import BacktestStorage
    backtest_storage = BacktestStorage()
    USE_DATABASE = True
except Exception as e:
    print(f"Warning: Could not initialize database storage for backtest results: {e}")
    print("Falling back to in-memory storage")
    backtest_storage = None
    USE_DATABASE = False


class MovingAverageStrategy(Strategy):
    """Moving Average Crossover Strategy"""
    def __init__(self, params: Dict[str, Any]):
        self.short_window = params.get('short_window', 20)
        self.long_window = params.get('long_window', 50)
        self.position = 0
        self.prices = []
    
    def initialize(self, context):
        if hasattr(context, 'symbol'):
            self.symbol = context.symbol
        else:
            self.symbol = 'SYMBOL'
    
    def on_data(self, context, data):
        close_price = data.get('Close', 0)
        if close_price:
            self.prices.append(close_price)
            if len(self.prices) >= self.long_window:
                prices_series = pd.Series(self.prices)
                short_ma = sma(prices_series, self.short_window)
                long_ma = sma(prices_series, self.long_window)
                if len(short_ma.dropna()) > 0 and len(long_ma.dropna()) > 0:
                    if short_ma.dropna().iloc[-1] > long_ma.dropna().iloc[-1] and self.position <= 0:
                        context.place_order(self.symbol, 100, 'BUY')
                        self.position = 100
                    elif short_ma.dropna().iloc[-1] < long_ma.dropna().iloc[-1] and self.position > 0:
                        context.place_order(self.symbol, 100, 'SELL')
                        self.position = 0


class RSIStrategy(Strategy):
    """RSI Momentum Strategy"""
    def __init__(self, params: Dict[str, Any]):
        self.rsi_window = params.get('rsi_window', 14)
        self.rsi_oversold = params.get('rsi_oversold', 30)
        self.rsi_overbought = params.get('rsi_overbought', 70)
        self.position = 0
        self.prices = []
    
    def initialize(self, context):
        if hasattr(context, 'symbol'):
            self.symbol = context.symbol
        else:
            self.symbol = 'SYMBOL'
    
    def on_data(self, context, data):
        close_price = data.get('Close', 0)
        if close_price:
            self.prices.append(close_price)
            if len(self.prices) >= self.rsi_window + 1:
                prices_series = pd.Series(self.prices)
                rsi_val = rsi(prices_series, self.rsi_window)
                if len(rsi_val.dropna()) > 0:
                    current_rsi = rsi_val.dropna().iloc[-1]
                    if current_rsi < self.rsi_oversold and self.position <= 0:
                        context.place_order(self.symbol, 100, 'BUY')
                        self.position = 100
                    elif current_rsi > self.rsi_overbought and self.position > 0:
                        context.place_order(self.symbol, 100, 'SELL')
                        self.position = 0


class BollingerBandsStrategy(Strategy):
    """Bollinger Bands Mean Reversion Strategy"""
    def __init__(self, params: Dict[str, Any]):
        self.bb_window = params.get('bb_window', 20)
        self.bb_std = params.get('bb_std', 2.0)
        self.position = 0
        self.prices = []
    
    def initialize(self, context):
        if hasattr(context, 'symbol'):
            self.symbol = context.symbol
        else:
            self.symbol = 'SYMBOL'
    
    def on_data(self, context, data):
        close_price = data.get('Close', 0)
        if close_price:
            self.prices.append(close_price)
            if len(self.prices) >= self.bb_window:
                prices_series = pd.Series(self.prices)
                bb = bollinger_bands(prices_series, self.bb_window, self.bb_std)
                if len(bb['lower'].dropna()) > 0 and len(bb['upper'].dropna()) > 0:
                    current_price = close_price
                    lower_band = bb['lower'].dropna().iloc[-1]
                    upper_band = bb['upper'].dropna().iloc[-1]
                    if current_price < lower_band and self.position <= 0:
                        context.place_order(self.symbol, 100, 'BUY')
                        self.position = 100
                    elif current_price > upper_band and self.position > 0:
                        context.place_order(self.symbol, 100, 'SELL')
                        self.position = 0


class MACDStrategy(Strategy):
    """MACD Crossover Strategy"""
    def __init__(self, params: Dict[str, Any]):
        self.macd_fast = params.get('macd_fast', 12)
        self.macd_slow = params.get('macd_slow', 26)
        self.macd_signal = params.get('macd_signal', 9)
        self.position = 0
        self.prices = []
    
    def initialize(self, context):
        if hasattr(context, 'symbol'):
            self.symbol = context.symbol
        else:
            self.symbol = 'SYMBOL'
    
    def on_data(self, context, data):
        close_price = data.get('Close', 0)
        if close_price:
            self.prices.append(close_price)
            if len(self.prices) >= self.macd_slow + self.macd_signal:
                prices_series = pd.Series(self.prices)
                macd_result = macd(prices_series, self.macd_fast, self.macd_slow, self.macd_signal)
                if len(macd_result['macd'].dropna()) > 0 and len(macd_result['signal'].dropna()) > 0:
                    current_macd = macd_result['macd'].dropna().iloc[-1]
                    current_signal = macd_result['signal'].dropna().iloc[-1]
                    prev_macd = macd_result['macd'].dropna().iloc[-2] if len(macd_result['macd'].dropna()) > 1 else current_macd
                    prev_signal = macd_result['signal'].dropna().iloc[-2] if len(macd_result['signal'].dropna()) > 1 else current_signal
                    if current_macd > current_signal and prev_macd <= prev_signal and self.position <= 0:
                        context.place_order(self.symbol, 100, 'BUY')
                        self.position = 100
                    elif current_macd < current_signal and prev_macd >= prev_signal and self.position > 0:
                        context.place_order(self.symbol, 100, 'SELL')
                        self.position = 0


def create_custom_strategy(code: str, params: Dict[str, Any] = None) -> Strategy:
    """Execute custom strategy code and return instance"""
    if params is None:
        params = {}
    
    # Create a restricted namespace for code execution
    namespace = {
        'Strategy': Strategy,
        'pd': pd,
        'np': np,
    }
    
    # Add quantlib imports that strategies commonly use
    try:
        from quantlib.indicators import sma, ema, rsi, macd, bollinger_bands
        namespace.update({
            'sma': sma,
            'ema': ema,
            'rsi': rsi,
            'macd': macd,
            'bollinger_bands': bollinger_bands,
        })
    except ImportError:
        pass
    
    try:
        # Compile the code to check for syntax errors
        compiled_code = compile(code, '<string>', 'exec')
        
        # Execute the code in the restricted namespace
        exec(compiled_code, namespace)
        
        # Find the Strategy subclass in the namespace
        strategy_class = None
        for obj_name, obj in namespace.items():
            if (isinstance(obj, type) and 
                issubclass(obj, Strategy) and 
                obj is not Strategy):
                strategy_class = obj
                break
        
        if strategy_class is None:
            raise ValueError(
                "Custom strategy code must define a class that inherits from Strategy. "
                "Example: class MyStrategy(Strategy): ..."
            )
        
        # Instantiate the strategy with params if it accepts them
        try:
            # Try instantiating with params first (most strategies use this)
            if params:
                strategy_instance = strategy_class(params)
            else:
                strategy_instance = strategy_class()
        except TypeError:
            # If params aren't accepted, try without
            strategy_instance = strategy_class()
        
        return strategy_instance
        
    except SyntaxError as e:
        raise ValueError(f"Syntax error in custom strategy code: {str(e)}")
    except ValueError as e:
        # Re-raise ValueError (already has good message)
        raise
    except Exception as e:
        raise ValueError(f"Error executing custom strategy code: {str(e)}")


def create_strategy(strategy_config: Dict[str, Any]) -> Strategy:
    """Create strategy instance from configuration"""
    strategy_type = strategy_config.get('type')
    params = strategy_config.get('params', {})
    
    if strategy_type == 'custom':
        code = strategy_config.get('code')
        if not code:
            raise ValueError("Custom strategy requires 'code' field")
        return create_custom_strategy(code, params)
    elif strategy_type == 'moving_average':
        return MovingAverageStrategy(params)
    elif strategy_type == 'rsi':
        return RSIStrategy(params)
    elif strategy_type == 'bollinger_bands':
        return BollingerBandsStrategy(params)
    elif strategy_type == 'macd':
        return MACDStrategy(params)
    else:
        raise ValueError(f"Unknown strategy type: {strategy_type}")


def dict_list_to_dataframe(data: list) -> pd.DataFrame:
    """Convert list of dictionaries to DataFrame"""
    df = pd.DataFrame(data)
    if 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'])
        df.set_index('Date', inplace=True)
    return df


def serialize_dataframe(df: pd.DataFrame) -> list:
    """Serialize DataFrame to list of dictionaries"""
    df = df.reset_index()
    if 'Date' in df.columns or df.index.name == 'Date':
        df['Date'] = df['Date'].astype(str)
    return df.to_dict('records')


@router.post("/run", response_model=BacktestResponse)
async def run_backtest(request: BacktestRequest):
    """Run backtest with strategy and configuration"""
    try:
        # Convert data from list of dicts to DataFrame
        data_df = dict_list_to_dataframe(request.data)
        
        if data_df.empty:
            raise HTTPException(status_code=400, detail="Data is empty")
        
        # Create strategy
        strategy = create_strategy(request.strategy)
        
        # Get backtest configuration
        config = request.config
        initial_capital = config.get('initial_capital', 100000)
        commission = config.get('commission', 1.0)
        slippage = config.get('slippage', 0.0)
        commission_type = config.get('commission_type', 'fixed')
        
        # Create and run backtest engine
        engine = BacktestEngine(
            initial_capital=initial_capital,
            commission=commission,
            slippage=slippage,
            commission_type=commission_type
        )
        
        # Store symbol in engine for context
        engine._symbol = request.symbol
        
        results = engine.run(strategy, data_df, symbol=request.symbol)
        
        # Extract data for metrics calculation
        returns = results.get('returns', pd.Series())
        equity_curve = results.get('equity_curve', pd.Series())
        trades_df = results.get('trades', pd.DataFrame())
        
        # Calculate comprehensive metrics using RiskCalculator
        metrics = {}
        if len(returns) > 0:
            try:
                # Prepare trades DataFrame with PnL if available
                trades_for_metrics = None
                if not trades_df.empty:
                    # Try to calculate PnL from trades if not present
                    if 'pnl' not in trades_df.columns and 'price' in trades_df.columns:
                        # Simple PnL calculation (can be enhanced)
                        trades_for_metrics = trades_df.copy()
                    elif 'pnl' in trades_df.columns:
                        trades_for_metrics = trades_df.copy()
                
                # Create risk calculator
                calculator = RiskCalculator(
                    returns=returns,
                    equity_curve=equity_curve if len(equity_curve) > 0 else None,
                    trades=trades_for_metrics,
                    risk_free_rate=config.get('risk_free_rate', 0.0),
                    periods=252,  # Daily data
                )
                
                # Get all metrics (flat structure for API)
                all_metrics = calculator.get_flat_metrics()
                metrics.update(all_metrics)
            except Exception as e:
                print(f"Warning: Error calculating comprehensive metrics: {e}")
                # Fall back to basic metrics
                if len(returns) > 0:
                    metrics['sharpe_ratio'] = float(sharpe_ratio(returns))
                    metrics['sortino_ratio'] = float(sortino_ratio(returns))
                    if len(equity_curve) > 0:
                        max_dd = max_drawdown(equity_curve)
                        max_dd_pct = max_drawdown_pct(equity_curve)
                        metrics['max_drawdown'] = float(max_dd)
                        metrics['max_drawdown_pct'] = float(max_dd_pct)
                        if max_dd_pct != 0:
                            metrics['calmar_ratio'] = float(calmar_ratio(returns, abs(max_dd_pct / 100)))
        
        # Add basic result metrics
        metrics['total_return'] = float(results.get('total_return', 0))
        metrics['num_trades'] = int(results.get('num_trades', 0))
        metrics['initial_capital'] = float(results.get('initial_capital', initial_capital))
        metrics['final_equity'] = float(results.get('final_equity', initial_capital))
        
        # Benchmark comparison
        benchmark_equity_curve_serialized = None
        benchmark_metrics = None
        
        use_benchmark = config.get('use_benchmark', False)
        benchmark_symbol = config.get('benchmark_symbol', 'SPY')
        
        if use_benchmark:
            try:
                # Get date range from input data
                start_date = data_df.index[0]
                end_date = data_df.index[-1]
                
                # Fetch benchmark data
                store = DataStore()
                
                # Create fetcher using registry (use default source for benchmark)
                try:
                    registry = get_registry()
                    fetcher = registry.create()
                except ValueError as e:
                    # Fall back to Yahoo Finance if registry fails
                    from quantlib.data import YahooFinanceFetcher
                    fetcher = YahooFinanceFetcher()
                
                benchmark_data = None
                try:
                    benchmark_data = store.load(benchmark_symbol, start=start_date, end=end_date)
                except Exception:
                    pass
                
                if benchmark_data is None or benchmark_data.empty:
                    benchmark_data = fetcher.fetch_ohlcv(
                        benchmark_symbol,
                        start=start_date.strftime('%Y-%m-%d') if hasattr(start_date, 'strftime') else str(start_date),
                        end=end_date.strftime('%Y-%m-%d') if hasattr(end_date, 'strftime') else str(end_date)
                    )
                    if benchmark_data is not None and not benchmark_data.empty:
                        try:
                            store.save(benchmark_symbol, benchmark_data)
                        except Exception:
                            pass
                
                if benchmark_data is not None and not benchmark_data.empty:
                    # Calculate benchmark returns
                    benchmark_close = benchmark_data['Close']
                    benchmark_returns = benchmark_close.pct_change().dropna()
                    
                    # Calculate benchmark equity curve (normalized to initial capital)
                    benchmark_equity_curve_series = initial_capital * (1 + benchmark_returns).cumprod()
                    
                    # Align to strategy equity curve dates (use same index)
                    if len(equity_curve) > 0:
                        benchmark_equity_aligned = benchmark_equity_curve_series.reindex(equity_curve.index, method='ffill')
                    else:
                        benchmark_equity_aligned = benchmark_equity_curve_series
                    
                    benchmark_equity_curve = benchmark_equity_aligned
                    
                    # Serialize benchmark equity curve
                    benchmark_equity_df = pd.DataFrame({
                        'timestamp': benchmark_equity_curve.index,
                        'equity': benchmark_equity_curve.values
                    })
                    benchmark_equity_curve_serialized = serialize_dataframe(benchmark_equity_df)
                    
                    # Align returns for comparison
                    common_index = returns.index.intersection(benchmark_returns.index)
                    if len(common_index) > 0:
                        strategy_ret_aligned = returns.loc[common_index]
                        bench_ret_aligned = benchmark_returns.loc[common_index]
                        
                        benchmark_metrics = {}
                        try:
                            # Use RiskCalculator for benchmark metrics
                            benchmark_calc = RiskCalculator(
                                returns=strategy_ret_aligned,
                                equity_curve=equity_curve.loc[common_index] if len(equity_curve) > 0 else None,
                                benchmark_returns=bench_ret_aligned,
                                risk_free_rate=config.get('risk_free_rate', 0.0),
                                periods=252,
                            )
                            bench_metrics = benchmark_calc.calculate_benchmark_metrics()
                            benchmark_metrics.update(bench_metrics)
                        except Exception as e:
                            print(f"Warning: Error calculating benchmark metrics with RiskCalculator: {e}")
                            # Fall back to individual calculations
                            try:
                                benchmark_metrics['alpha'] = float(alpha(strategy_ret_aligned, bench_ret_aligned))
                            except Exception:
                                benchmark_metrics['alpha'] = None
                            
                            try:
                                benchmark_metrics['beta'] = float(beta(strategy_ret_aligned, bench_ret_aligned))
                            except Exception:
                                benchmark_metrics['beta'] = None
                            
                            try:
                                benchmark_metrics['information_ratio'] = float(information_ratio(strategy_ret_aligned, bench_ret_aligned))
                            except Exception:
                                benchmark_metrics['information_ratio'] = None
                        
                        benchmark_total_return = ((benchmark_close.iloc[-1] / benchmark_close.iloc[0]) - 1) * 100
                        benchmark_metrics['total_return'] = float(benchmark_total_return)
            except Exception as e:
                print(f"Warning: Failed to calculate benchmark metrics: {e}")
                # Continue without benchmark data
        
        # Serialize equity curve and trades
        equity_curve_series = results.get('equity_curve', pd.Series())
        if len(equity_curve_series) > 0:
            equity_df = pd.DataFrame({
                'timestamp': equity_curve_series.index,
                'equity': equity_curve_series.values
            })
            equity_curve_serialized = serialize_dataframe(equity_df)
        else:
            equity_curve_serialized = []
        
        trades_df = results.get('trades', pd.DataFrame())
        if not trades_df.empty:
            trades_serialized = serialize_dataframe(trades_df)
        else:
            trades_serialized = []
        
        # Generate result ID
        result_id = str(uuid.uuid4())
        strategy_name = request.strategy.get('type', 'unknown')
        if strategy_name == 'custom':
            # Try to extract class name from custom code if available
            code = request.strategy.get('code', '')
            if code:
                # Simple extraction of class name
                import re
                match = re.search(r'class\s+(\w+)', code)
                if match:
                    strategy_name = f"custom_{match.group(1)}"
                else:
                    strategy_name = 'custom_strategy'
        
        # Serialize results dict - convert pandas objects to JSON-serializable types
        results_serialized = {}
        for key, value in results.items():
            if isinstance(value, (pd.Series, pd.DataFrame)):
                # Skip pandas objects - they're already serialized separately (equity_curve, trades)
                continue
            elif isinstance(value, (np.integer, np.int64, np.int32)):
                results_serialized[key] = int(value)
            elif isinstance(value, (np.floating, np.float64, np.float32)):
                results_serialized[key] = float(value)
            elif isinstance(value, np.ndarray):
                results_serialized[key] = value.tolist()
            elif isinstance(value, (int, float, str, bool, type(None))):
                results_serialized[key] = value
            else:
                # Convert other types to string as fallback
                try:
                    results_serialized[key] = float(value)
                except (ValueError, TypeError):
                    try:
                        results_serialized[key] = int(value)
                    except (ValueError, TypeError):
                        results_serialized[key] = str(value)
        
        # Extract dates from data
        start_date_str = None
        end_date_str = None
        if not data_df.empty:
            start_date_str = str(data_df.index[0].date()) if hasattr(data_df.index[0], 'date') else str(data_df.index[0])
            end_date_str = str(data_df.index[-1].date()) if hasattr(data_df.index[-1], 'date') else str(data_df.index[-1])
        
        # Prepare metadata
        metadata = {
            'start_date': start_date_str,
            'end_date': end_date_str,
            'initial_capital': float(initial_capital),
            'commission': float(commission),
            'slippage': float(slippage),
            'commission_type': commission_type,
        }
        
        # Store results
        if USE_DATABASE and backtest_storage:
            try:
                backtest_storage.save_result(
                    result_id=result_id,
                    symbol=request.symbol,
                    strategy_name=strategy_name,
                    results=results_serialized,
                    metrics=metrics,
                    equity_curve=equity_curve_serialized,
                    trades=trades_serialized,
                    metadata=metadata,
                )
            except Exception as e:
                # Fallback to in-memory if database fails
                print(f"Warning: Failed to save to database, using in-memory: {e}")
                backtest_results[result_id] = {
                    'symbol': request.symbol,
                    'results': results_serialized,
                    'metrics': metrics,
                }
        else:
            # In-memory storage (fallback)
            backtest_results[result_id] = {
                'symbol': request.symbol,
                'results': results_serialized,
                'metrics': metrics,
            }
        
        return BacktestResponse(
            result_id=result_id,
            symbol=request.symbol,
            results=results_serialized,
            equity_curve=equity_curve_serialized,
            trades=trades_serialized,
            metrics=metrics,
            benchmark_equity_curve=benchmark_equity_curve_serialized,
            benchmark_metrics=benchmark_metrics,
        )
    except HTTPException:
        raise
    except ValueError as e:
        # ValueError from create_strategy (e.g., invalid custom code)
        raise HTTPException(status_code=400, detail=f"Invalid strategy: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running backtest: {str(e)}")


@router.get("/results/{result_id}")
async def get_backtest_results(result_id: str):
    """Get backtest results by ID"""
    stored = None
    
    # Try database first
    if USE_DATABASE and backtest_storage:
        try:
            stored = backtest_storage.get_result(result_id)
        except Exception as e:
            print(f"Warning: Failed to get from database: {e}")
    
    # Fallback to in-memory
    if not stored and result_id in backtest_results:
        stored_data = backtest_results[result_id]
        stored = {
            'result_id': result_id,
            'symbol': stored_data['symbol'],
            'results': stored_data['results'],
            'metrics': stored_data['metrics'],
            'equity_curve': [],
            'trades': [],
        }
    
    if not stored:
        raise HTTPException(status_code=404, detail="Backtest result not found")
    
    return stored


@router.get("/results", response_model=BacktestResultsListResponse)
async def list_backtest_results(
    limit: int = 100,
    offset: int = 0,
    symbol: Optional[str] = None,
    strategy_name: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sort_by: str = 'created_at',
    sort_order: str = 'DESC'
):
    """List backtest results with filtering and sorting
    
    Query Parameters:
        limit: Maximum number of results to return (default: 100)
        offset: Number of results to skip (default: 0)
        symbol: Filter by symbol (case-insensitive partial match)
        strategy_name: Filter by strategy name (case-insensitive partial match)
        start_date: Filter by start_date in metrics (YYYY-MM-DD format)
        end_date: Filter by end_date in metrics (YYYY-MM-DD format)
        sort_by: Field to sort by - created_at, symbol, or strategy_name (default: created_at)
        sort_order: Sort order - ASC or DESC (default: DESC)
    """
    try:
        if USE_DATABASE and backtest_storage:
            results = backtest_storage.list_results(
                limit=limit,
                offset=offset,
                symbol=symbol,
                strategy_name=strategy_name,
                start_date=start_date,
                end_date=end_date,
                sort_by=sort_by,
                sort_order=sort_order
            )
            # Get total count with same filters
            total = backtest_storage.count_results(
                symbol=symbol,
                strategy_name=strategy_name,
                start_date=start_date,
                end_date=end_date,
            )
            return BacktestResultsListResponse(
                results=[BacktestResultSummary(**r) for r in results],
                total=total
            )
        else:
            # In-memory fallback (basic filtering)
            result_items = list(backtest_results.items())
            
            # Apply basic filtering
            if symbol:
                result_items = [(rid, data) for rid, data in result_items if symbol.upper() in data.get('symbol', '').upper()]
            if strategy_name:
                # In-memory doesn't have strategy_name stored, skip this filter
                pass
            
            # Sort and paginate
            result_items.sort(key=lambda x: x[0], reverse=(sort_order.upper() == 'DESC'))
            result_items = result_items[offset:offset + limit]
            
            results = [
                BacktestResultSummary(
                    result_id=result_id,
                    symbol=data['symbol'],
                    strategy_name='unknown',
                    created_at=None,
                    metrics=data.get('metrics', {})
                )
                for result_id, data in result_items
            ]
            return BacktestResultsListResponse(results=results, total=len(backtest_results))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing results: {str(e)}")


@router.delete("/results/{result_id}")
async def delete_backtest_result(result_id: str):
    """Delete backtest result"""
    try:
        if USE_DATABASE and backtest_storage:
            deleted = backtest_storage.delete_result(result_id)
            if not deleted:
                raise HTTPException(status_code=404, detail="Backtest result not found")
            return {"message": "Backtest result deleted successfully"}
        else:
            # In-memory fallback
            if result_id not in backtest_results:
                raise HTTPException(status_code=404, detail="Backtest result not found")
            del backtest_results[result_id]
            return {"message": "Backtest result deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting result: {str(e)}")


@router.post("/compare", response_model=BacktestCompareResponse)
async def compare_backtest_results(request: BacktestCompareRequest):
    """Compare multiple backtest results
    
    Returns comparison metrics, equity curves, and summary statistics
    """
    try:
        result_ids = request.result_ids
        comparisons = []
        equity_curves = {}
        all_results = []
        
        # Fetch all results
        for result_id in result_ids:
            stored = None
            
            if USE_DATABASE and backtest_storage:
                try:
                    stored = backtest_storage.get_result(result_id)
                except Exception as e:
                    print(f"Warning: Failed to get result {result_id} from database: {e}")
            
            if not stored and result_id in backtest_results:
                stored_data = backtest_results[result_id]
                stored = {
                    'result_id': result_id,
                    'symbol': stored_data['symbol'],
                    'metrics': stored_data.get('metrics', {}),
                    'equity_curve': [],
                }
            
            if not stored:
                raise HTTPException(
                    status_code=404,
                    detail=f"Backtest result {result_id} not found"
                )
            
            all_results.append(stored)
            equity_curves[result_id] = stored.get('equity_curve', [])
        
        # Extract metrics for comparison
        metric_names = set()
        for result in all_results:
            metrics = result.get('metrics', {})
            metric_names.update(metrics.keys())
        
        # Filter to relevant metrics for comparison
        comparison_metrics = [
            'total_return', 'sharpe_ratio', 'sortino_ratio', 'max_drawdown',
            'max_drawdown_pct', 'calmar_ratio', 'num_trades', 'final_equity',
        ]
        
        # Build comparison data
        for metric_name in comparison_metrics:
            if metric_name not in metric_names:
                continue
            
            values = {}
            best_id = None
            worst_id = None
            best_value = None
            worst_value = None
            
            for result in all_results:
                result_id = result['result_id']
                metrics = result.get('metrics', {})
                value = metrics.get(metric_name)
                
                if value is not None:
                    values[result_id] = float(value) if isinstance(value, (int, float)) else value
                    
                    # Determine best/worst (higher is better for most metrics, except drawdown)
                    if metric_name in ['max_drawdown', 'max_drawdown_pct']:
                        # For drawdown, lower is better (less negative)
                        if worst_value is None or values[result_id] > worst_value:
                            worst_value = values[result_id]
                            worst_id = result_id
                        if best_value is None or values[result_id] < best_value:
                            best_value = values[result_id]
                            best_id = result_id
                    else:
                        # For other metrics, higher is better
                        if best_value is None or values[result_id] > best_value:
                            best_value = values[result_id]
                            best_id = result_id
                        if worst_value is None or values[result_id] < worst_value:
                            worst_value = values[result_id]
                            worst_id = result_id
            
            if values:
                comparisons.append(ComparisonMetric(
                    metric_name=metric_name,
                    values=values,
                    best=best_id,
                    worst=worst_id,
                ))
        
        # Build summary
        summary = {
            'num_results': len(result_ids),
            'symbols': list(set(r.get('symbol', 'Unknown') for r in all_results)),
            'strategies': list(set(r.get('strategy_name', 'Unknown') for r in all_results if r.get('strategy_name'))),
        }
        
        return BacktestCompareResponse(
            result_ids=result_ids,
            comparisons=comparisons,
            equity_curves=equity_curves,
            summary=summary,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing results: {str(e)}")
