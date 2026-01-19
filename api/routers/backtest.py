"""
Backtesting endpoints
"""

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List
import uuid
from itertools import product
from scipy.optimize import minimize
import logging

# Set up logger
logger = logging.getLogger(__name__)

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
    OptimizationRequest,
    OptimizationResponse,
    OptimizationResult,
    ParameterRange,
    WalkForwardRequest,
    WalkForwardResponse,
    WalkForwardWindow,
    BacktestUpdateRequest,
)

router = APIRouter()

# In-memory storage for backtest results (fallback if database not available)
backtest_results = {}

# Try to use database storage, fall back to in-memory if not available
try:
    from api.utils.backtest_storage import BacktestStorage
    logger.info("[Backtest] Initializing BacktestStorage...")
    backtest_storage = BacktestStorage()
    USE_DATABASE = True
    logger.info("[Backtest] ✅ BacktestStorage initialized successfully, using database storage")
except Exception as e:
    logger.warning(f"[Backtest] ⚠️ Could not initialize database storage for backtest results: {type(e).__name__}: {e}")
    logger.warning(f"[Backtest] Falling back to in-memory storage")
    import traceback
    logger.warning(f"[Backtest] Traceback: {traceback.format_exc()}")
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
    """Serialize DataFrame to list of dictionaries, converting datetime columns to strings"""
    df = df.reset_index()
    
    # Convert any datetime columns (including index) to strings
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].astype(str)
    
    # Also handle index name if it's datetime
    if df.index.name and pd.api.types.is_datetime64_any_dtype(df.index):
        df.index = df.index.astype(str)
    
    return df.to_dict('records')


def run_single_backtest(
    data_df: pd.DataFrame,
    strategy_config: Dict[str, Any],
    config: Dict[str, Any],
    symbol: str
) -> Dict[str, Any]:
    """
    Run a single backtest with given parameters and return metrics.
    
    Args:
        data_df: DataFrame with OHLCV data
        strategy_config: Strategy configuration dict (type and params)
        config: Backtest configuration dict
        symbol: Trading symbol
        
    Returns:
        Dictionary with metrics and result_id
    """
    # Create strategy
    strategy = create_strategy(strategy_config)
    
    # Get backtest configuration
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
    engine._symbol = symbol
    
    results = engine.run(strategy, data_df, symbol=symbol)
    
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
                if 'pnl' not in trades_df.columns and 'price' in trades_df.columns:
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
    
    return {
        'metrics': metrics,
        'results': results,
    }


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
        logger.info(f"[Backtest] Preparing to save backtest result: result_id={result_id}, name={request.name}, symbol={request.symbol}, strategy={strategy_name}")
        logger.info(f"[Backtest] USE_DATABASE={USE_DATABASE}, backtest_storage={backtest_storage is not None}")
        
        if USE_DATABASE and backtest_storage:
            try:
                logger.info(f"[Backtest] Attempting to save to database...")
                backtest_storage.save_result(
                    result_id=result_id,
                    symbol=request.symbol,
                    strategy_name=strategy_name,
                    custom_name=request.name,
                    results=results_serialized,
                    metrics=metrics,
                    equity_curve=equity_curve_serialized,
                    trades=trades_serialized,
                    metadata=metadata,
                )
                logger.info(f"[Backtest] ✅ Backtest result {result_id} saved to database successfully")
            except Exception as e:
                # Fallback to in-memory if database fails
                logger.warning(f"[Backtest] ⚠️ Failed to save to database, using in-memory storage: {type(e).__name__}: {e}")
                logger.warning(f"[Backtest] Error details: {str(e)}")
                import traceback
                logger.warning(f"[Backtest] Traceback: {traceback.format_exc()}")
                backtest_results[result_id] = {
                    'symbol': request.symbol,
                    'results': results_serialized,
                    'metrics': metrics,
                }
                logger.info(f"[Backtest] Saved to in-memory storage as fallback")
        else:
            # In-memory storage (fallback)
            logger.info(f"[Backtest] Using in-memory storage (database not available)")
            backtest_results[result_id] = {
                'symbol': request.symbol,
                'results': results_serialized,
                'metrics': metrics,
            }
            logger.info(f"[Backtest] Saved to in-memory storage")
        
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
                    custom_name=None,
                    created_at=None,
                    metrics=data.get('metrics', {})
                )
                for result_id, data in result_items
            ]
            return BacktestResultsListResponse(results=results, total=len(backtest_results))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing results: {str(e)}")


@router.patch("/results/{result_id}")
async def update_backtest_result(result_id: str, request: BacktestUpdateRequest):
    """Update backtest result (e.g., custom name)"""
    try:
        if USE_DATABASE and backtest_storage:
            logger.info(f"[Backtest] Updating backtest result {result_id}: custom_name={request.custom_name}")
            updated = backtest_storage.update_custom_name(result_id, request.custom_name)
            if not updated:
                raise HTTPException(status_code=404, detail="Backtest result not found")
            return {"message": "Backtest result updated successfully"}
        else:
            # In-memory fallback - custom_name not stored in memory, so skip
            raise HTTPException(status_code=400, detail="Update not supported with in-memory storage")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Backtest] Error updating result {result_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating result: {str(e)}")


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


@router.post("/optimize", response_model=OptimizationResponse)
async def optimize_parameters(request: OptimizationRequest):
    """Optimize strategy parameters using grid search or scipy.optimize
    
    Supports grid search for discrete parameters and scipy.optimize.minimize for continuous optimization.
    """
    try:
        # Convert data from list of dicts to DataFrame
        data_df = dict_list_to_dataframe(request.data)
        
        if data_df.empty:
            raise HTTPException(status_code=400, detail="Data is empty")
        
        # Get base strategy config (without optimized parameters)
        base_strategy = request.strategy.copy()
        base_params = base_strategy.get('params', {}).copy()
        
        # Extract parameter names and ranges
        param_names = list(request.parameter_ranges.keys())
        if not param_names:
            raise HTTPException(status_code=400, detail="No parameters specified for optimization")
        
        optimization_id = str(uuid.uuid4())
        all_results = []
        
        if request.optimization_type == 'grid':
            # Grid search optimization
            param_values = {}
            for param_name, param_range in request.parameter_ranges.items():
                param_type = param_range.type
                min_val = param_range.min
                max_val = param_range.max
                step = param_range.step if param_range.step else (1.0 if param_type == 'int' else 0.1)
                
                if param_type == 'int':
                    # Integer range
                    values = list(range(int(min_val), int(max_val) + 1, int(step)))
                else:
                    # Float range
                    values = np.arange(min_val, max_val + step, step).tolist()
                
                param_values[param_name] = values
            
            # Generate all combinations
            param_combinations = list(product(*[param_values[name] for name in param_names]))
            
            # Limit combinations if too many
            if len(param_combinations) > request.max_combinations:
                raise HTTPException(
                    status_code=400,
                    detail=f"Too many parameter combinations ({len(param_combinations)}). "
                           f"Maximum allowed: {request.max_combinations}. "
                           f"Reduce parameter ranges or increase max_combinations."
                )
            
            # Run backtests for each combination
            for param_combo in param_combinations:
                # Create params dict for this combination
                test_params = base_params.copy()
                for i, param_name in enumerate(param_names):
                    test_params[param_name] = param_combo[i]
                
                # Update strategy config with test parameters
                test_strategy_config = base_strategy.copy()
                test_strategy_config['params'] = test_params
                
                try:
                    # Run backtest
                    result = run_single_backtest(
                        data_df=data_df,
                        strategy_config=test_strategy_config,
                        config=request.config,
                        symbol=request.symbol
                    )
                    
                    # Get objective value
                    metrics = result['metrics']
                    objective_value = metrics.get(request.objective, float('-inf'))
                    
                    # Generate result ID
                    result_id = str(uuid.uuid4())
                    
                    # Store result (optional - could skip to save space for large optimizations)
                    # For now, we'll just store in memory/database if enabled
                    
                    all_results.append({
                        'parameters': test_params.copy(),
                        'metrics': metrics,
                        'result_id': result_id,
                        'objective_value': float(objective_value) if objective_value is not None else float('-inf'),
                    })
                    
                except Exception as e:
                    print(f"Warning: Error running backtest with params {test_params}: {e}")
                    # Continue with next combination
                    continue
        
        elif request.optimization_type == 'minimize':
            # Continuous optimization using scipy.optimize
            # This is more complex and requires converting params to a vector
            # For now, we'll implement a simplified version
            
            # Define objective function
            def objective_function(param_vector):
                # Map vector back to param dict
                test_params = base_params.copy()
                for i, param_name in enumerate(param_names):
                    param_range = request.parameter_ranges[param_name]
                    if param_range.type == 'int':
                        test_params[param_name] = int(param_vector[i])
                    else:
                        test_params[param_name] = float(param_vector[i])
                
                # Update strategy config
                test_strategy_config = base_strategy.copy()
                test_strategy_config['params'] = test_params
                
                try:
                    result = run_single_backtest(
                        data_df=data_df,
                        strategy_config=test_strategy_config,
                        config=request.config,
                        symbol=request.symbol
                    )
                    
                    metrics = result['metrics']
                    objective_value = metrics.get(request.objective, float('-inf'))
                    
                    # Negate for minimization (scipy minimizes, so negate to maximize)
                    return -float(objective_value) if objective_value is not None else float('inf')
                except Exception as e:
                    print(f"Warning: Error in optimization: {e}")
                    return float('inf')
            
            # Set up bounds
            bounds = []
            initial_guess = []
            for param_name in param_names:
                param_range = request.parameter_ranges[param_name]
                bounds.append((param_range.min, param_range.max))
                initial_guess.append((param_range.min + param_range.max) / 2.0)
            
            # Run optimization
            opt_result = minimize(
                objective_function,
                x0=initial_guess,
                method='L-BFGS-B',  # Bounded optimization
                bounds=bounds,
                options={'maxiter': 50}  # Limit iterations
            )
            
            # Extract best parameters
            best_params = base_params.copy()
            for i, param_name in enumerate(param_names):
                param_range = request.parameter_ranges[param_name]
                if param_range.type == 'int':
                    best_params[param_name] = int(opt_result.x[i])
                else:
                    best_params[param_name] = float(opt_result.x[i])
            
            # Run final backtest with best parameters
            best_strategy_config = base_strategy.copy()
            best_strategy_config['params'] = best_params
            
            result = run_single_backtest(
                data_df=data_df,
                strategy_config=best_strategy_config,
                config=request.config,
                symbol=request.symbol
            )
            
            metrics = result['metrics']
            objective_value = metrics.get(request.objective, float('-inf'))
            
            result_id = str(uuid.uuid4())
            
            all_results.append({
                'parameters': best_params,
                'metrics': metrics,
                'result_id': result_id,
                'objective_value': float(objective_value) if objective_value is not None else float('-inf'),
            })
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown optimization type: {request.optimization_type}. Must be 'grid' or 'minimize'"
            )
        
        if not all_results:
            raise HTTPException(status_code=500, detail="No successful backtests in optimization")
        
        # Find best result based on objective
        best_result_data = max(all_results, key=lambda x: x['objective_value'])
        
        # Sort all results by objective (descending)
        all_results_sorted = sorted(all_results, key=lambda x: x['objective_value'], reverse=True)
        
        # Convert to response format
        best_result = OptimizationResult(
            parameters=best_result_data['parameters'],
            metrics=best_result_data['metrics'],
            result_id=best_result_data['result_id'],
            objective_value=best_result_data['objective_value']
        )
        
        all_results_response = [
            OptimizationResult(
                parameters=r['parameters'],
                metrics=r['metrics'],
                result_id=r['result_id'],
                objective_value=r['objective_value']
            )
            for r in all_results_sorted
        ]
        
        # Get strategy name
        strategy_name = base_strategy.get('type', 'unknown')
        if strategy_name == 'custom':
            strategy_name = 'Custom Strategy'
        else:
            # Get friendly name from strategies dict
            try:
                from api.routers.strategies import STRATEGIES
                if strategy_name in STRATEGIES:
                    strategy_name = STRATEGIES[strategy_name]['name']
            except:
                pass
        
        return OptimizationResponse(
            optimization_id=optimization_id,
            symbol=request.symbol,
            strategy_name=strategy_name,
            best_result=best_result,
            all_results=all_results_response,
            total_runs=len(all_results),
            optimization_type=request.optimization_type,
            objective=request.objective,
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid optimization request: {str(e)}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error running optimization: {str(e)}")


@router.post("/walkforward", response_model=WalkForwardResponse)
async def walkforward_analysis(request: WalkForwardRequest):
    """Run walk-forward analysis to test for overfitting
    
    Walk-forward analysis splits data into training and testing periods,
    optimizes parameters on training data, then tests on out-of-sample data.
    This helps detect overfitting by comparing in-sample vs out-of-sample performance.
    """
    try:
        from quantlib.backtesting.walkforward import WalkForwardAnalyzer
        
        # Convert data from list of dicts to DataFrame
        data_df = dict_list_to_dataframe(request.data)
        
        if data_df.empty:
            raise HTTPException(status_code=400, detail="Data is empty")
        
        # Create strategy factory function
        base_strategy = request.strategy.copy()
        
        def strategy_factory(params: Dict[str, Any]) -> Strategy:
            strategy_config = base_strategy.copy()
            strategy_config['params'] = params
            return create_strategy(strategy_config)
        
        # Convert parameter ranges format
        param_ranges = {}
        for param_name, param_range in request.parameter_ranges.items():
            param_ranges[param_name] = {
                'min': param_range.min,
                'max': param_range.max,
                'step': param_range.step if param_range.step else (1.0 if param_range.type == 'int' else 0.1),
                'type': param_range.type,
            }
        
        # Get backtest configuration
        config = request.config
        initial_capital = config.get('initial_capital', 100000)
        commission = config.get('commission', 1.0)
        slippage = config.get('slippage', 0.0)
        commission_type = config.get('commission_type', 'fixed')
        risk_free_rate = config.get('risk_free_rate', 0.0)
        
        # Create walk-forward analyzer
        analyzer = WalkForwardAnalyzer(
            train_size=request.train_size,
            test_size=request.test_size,
            step_size=request.step_size,
            anchor=request.anchor
        )
        
        # Run walk-forward analysis
        wf_results = analyzer.run_analysis(
            strategy_factory=strategy_factory,
            data=data_df,
            symbol=request.symbol,
            parameter_ranges=param_ranges,
            optimization_objective=request.objective,
            initial_capital=initial_capital,
            commission=commission,
            slippage=slippage,
            commission_type=commission_type,
            risk_free_rate=risk_free_rate,
        )
        
        # Convert to response format
        walkforward_id = str(uuid.uuid4())
        
        windows_response = [
            WalkForwardWindow(
                window=w['window'],
                train_start_date=str(w['train_start_date']),
                train_end_date=str(w['train_end_date']),
                test_start_date=str(w['test_start_date']),
                test_end_date=str(w['test_end_date']),
                optimized_parameters=w['optimized_parameters'],
                train_metrics=w['train_metrics'],
                test_metrics=w['test_metrics'],
            )
            for w in wf_results['windows']
        ]
        
        # Get strategy name
        strategy_name = base_strategy.get('type', 'unknown')
        if strategy_name == 'custom':
            strategy_name = 'Custom Strategy'
        else:
            try:
                from api.routers.strategies import STRATEGIES
                if strategy_name in STRATEGIES:
                    strategy_name = STRATEGIES[strategy_name]['name']
            except:
                pass
        
        return WalkForwardResponse(
            walkforward_id=walkforward_id,
            symbol=request.symbol,
            strategy_name=strategy_name,
            windows=windows_response,
            summary=wf_results['summary'],
            train_size=wf_results['train_size'],
            test_size=wf_results['test_size'],
            step_size=wf_results['step_size'],
            anchor=wf_results['anchor'],
            total_windows=wf_results['total_windows'],
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid walk-forward request: {str(e)}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error running walk-forward analysis: {str(e)}")


# ============================================================================
# AI Insights Endpoint
# ============================================================================

from pydantic import BaseModel

class AIInsightsRequest(BaseModel):
    """Request model for AI insights generation."""
    metrics: Dict[str, Any]
    strategy_name: str = "Unknown Strategy"
    symbol: str = "Unknown"
    trades_summary: Optional[Dict[str, Any]] = None


class AIInsightsResponse(BaseModel):
    """Response model for AI insights."""
    summary: Optional[str] = None
    strengths: List[str] = []
    concerns: List[str] = []
    suggestions: List[str] = []
    error: Optional[str] = None
    message: Optional[str] = None


def _get_ai_client():
    """Get an AI client based on available API keys."""
    import os
    
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    if openai_key:
        try:
            from openai import OpenAI
            return OpenAI(api_key=openai_key), "openai"
        except ImportError:
            logger.warning("OpenAI package not installed")
            return None, None
    
    if anthropic_key:
        try:
            import anthropic
            return anthropic.Anthropic(api_key=anthropic_key), "anthropic"
        except ImportError:
            logger.warning("Anthropic package not installed")
            return None, None
    
    return None, None


def _build_metrics_summary(
    metrics: Dict[str, Any],
    strategy_name: str,
    symbol: str,
    trades_summary: Optional[Dict[str, Any]] = None
) -> str:
    """Build a structured summary of metrics for the AI prompt."""
    summary_parts = [
        f"Strategy: {strategy_name}",
        f"Symbol: {symbol}",
        "",
        "=== Performance Metrics ===",
        f"Total Return: {metrics.get('total_return', 0) * 100:.2f}%",
        f"Sharpe Ratio: {metrics.get('sharpe_ratio', 0):.2f}",
        f"Sortino Ratio: {metrics.get('sortino_ratio', 0):.2f}",
        f"Calmar Ratio: {metrics.get('calmar_ratio', 0):.2f}",
        "",
        "=== Risk Metrics ===",
        f"Max Drawdown: {metrics.get('max_drawdown_pct', 0):.2f}%",
        f"Annualized Volatility: {metrics.get('volatility', 0) * 100:.2f}%",
        f"Historical VaR (95%): {metrics.get('var_historical', 0) * 100:.4f}%",
        f"CVaR (Expected Shortfall): {metrics.get('cvar', 0) * 100:.4f}%",
        "",
        "=== Distribution ===",
        f"Skewness: {metrics.get('skewness', 0):.4f}",
        f"Kurtosis: {metrics.get('kurtosis', 0):.4f}",
    ]
    
    if trades_summary:
        summary_parts.extend([
            "",
            "=== Trade Statistics ===",
            f"Total Trades: {trades_summary.get('num_trades', 0)}",
            f"Win Rate: {trades_summary.get('win_rate', 0):.2f}%",
            f"Profit Factor: {trades_summary.get('profit_factor', 0):.2f}",
            f"Average Win: ${trades_summary.get('avg_win', 0):.2f}",
            f"Average Loss: ${trades_summary.get('avg_loss', 0):.2f}",
        ])
    
    if 'initial_capital' in metrics and 'final_equity' in metrics:
        summary_parts.extend([
            "",
            "=== Capital ===",
            f"Initial Capital: ${metrics.get('initial_capital', 0):,.2f}",
            f"Final Equity: ${metrics.get('final_equity', 0):,.2f}",
        ])
    
    return "\n".join(summary_parts)


def _get_system_prompt() -> str:
    """Get the system prompt for backtest analysis."""
    return """You are a quantitative finance expert analyzing backtest results. 
Provide clear, actionable insights in a structured format.

Be concise and specific. Focus on:
1. What the numbers actually mean for the trader
2. Potential risks or red flags
3. Practical suggestions for improvement

Avoid generic advice. Base all observations on the specific metrics provided.
Use plain language that a retail trader can understand."""


def _get_user_prompt(metrics_summary: str) -> str:
    """Get the user prompt for backtest analysis."""
    return f"""Analyze these backtest results and provide insights:

{metrics_summary}

Respond in this exact JSON format:
{{
    "summary": "2-3 sentence overview of performance",
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "concerns": ["concern 1", "concern 2"],
    "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}}

Keep each bullet point to 1 sentence. Be specific to these metrics."""


def _call_openai(client, system_prompt: str, user_prompt: str) -> dict:
    """Call OpenAI API and parse response."""
    import json
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3,
        max_tokens=500,
        timeout=15
    )
    
    content = response.choices[0].message.content
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]
    
    return json.loads(content.strip())


def _call_anthropic(client, system_prompt: str, user_prompt: str) -> dict:
    """Call Anthropic API and parse response."""
    import json
    
    response = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=500,
        system=system_prompt,
        messages=[
            {"role": "user", "content": user_prompt}
        ]
    )
    
    content = response.content[0].text
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]
    
    return json.loads(content.strip())


@router.post("/insights", response_model=AIInsightsResponse)
async def generate_ai_insights(request: AIInsightsRequest):
    """
    Generate AI-powered insights for backtest results.
    
    Requires either OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.
    """
    import json
    
    client, provider = _get_ai_client()
    
    if client is None:
        return AIInsightsResponse(
            error="no_api_key",
            message="No AI API key configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to your .env file."
        )
    
    try:
        metrics_summary = _build_metrics_summary(
            request.metrics, 
            request.strategy_name, 
            request.symbol, 
            request.trades_summary
        )
        system_prompt = _get_system_prompt()
        user_prompt = _get_user_prompt(metrics_summary)
        
        if provider == "openai":
            result = _call_openai(client, system_prompt, user_prompt)
        else:
            result = _call_anthropic(client, system_prompt, user_prompt)
        
        # Validate response structure
        required_keys = ["summary", "strengths", "concerns", "suggestions"]
        for key in required_keys:
            if key not in result:
                result[key] = [] if key != "summary" else "Analysis completed."
        
        return AIInsightsResponse(
            summary=result.get("summary"),
            strengths=result.get("strengths", []),
            concerns=result.get("concerns", []),
            suggestions=result.get("suggestions", []),
            error=None,
            message=None
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response: {e}")
        return AIInsightsResponse(
            error="parse_error",
            message=f"Failed to parse AI response: {str(e)}"
        )
    except Exception as e:
        logger.error(f"AI API error: {e}")
        return AIInsightsResponse(
            error="api_error",
            message=f"AI API error: {str(e)}"
        )
