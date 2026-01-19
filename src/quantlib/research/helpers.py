"""
Helper functions for research notebooks

These functions make it easy to load data, run backtests, and visualize results
in Jupyter notebooks.
"""

from typing import Dict, Any, Optional
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime

from quantlib.data import DataStore
from quantlib.backtesting import BacktestEngine
from quantlib.risk import RiskCalculator
from quantlib.strategies import Strategy


def load_symbol(
    symbol: str,
    start: str,
    end: str,
    data_source: Optional[str] = None
) -> pd.DataFrame:
    """
    Load market data for a symbol.
    
    Convenience function for loading data in notebooks.
    
    Args:
        symbol: Stock symbol (e.g., 'AAPL')
        start: Start date (YYYY-MM-DD)
        end: End date (YYYY-MM-DD)
        data_source: Optional data source ('yahoo', 'alpha_vantage', 'polygon')
                    If None, uses default source
        
    Returns:
        DataFrame with OHLCV data indexed by date
        
    Example:
        >>> data = load_symbol('AAPL', '2020-01-01', '2023-01-01')
        >>> data.head()
    """
    store = DataStore()
    
    # Try to load from database first
    try:
        data = store.load(symbol, start=start, end=end)
        if not data.empty:
            return data
    except Exception:
        pass
    
    # If not in database, fetch from source
    from quantlib.data.fetcher_registry import get_registry
    registry = get_registry()
    
    if data_source:
        fetcher = registry.create(source=data_source)
    else:
        fetcher = registry.create()  # Use default
    
    data = fetcher.fetch_ohlcv(symbol, start, end)
    
    # Save to database for future use
    try:
        store.save(symbol, data)
    except Exception:
        pass  # Continue even if save fails
    
    return data


def run_backtest(
    strategy: Strategy,
    data: pd.DataFrame,
    symbol: str = 'SYMBOL',
    initial_capital: float = 100000.0,
    commission: float = 1.0,
    slippage: float = 0.0,
    commission_type: str = 'fixed',
    risk_free_rate: float = 0.0,
) -> Dict[str, Any]:
    """
    Run a backtest and return comprehensive results.
    
    Convenience function for running backtests in notebooks.
    
    Args:
        strategy: Strategy instance (must implement initialize and on_data)
        data: DataFrame with OHLCV data
        symbol: Trading symbol
        initial_capital: Starting capital
        commission: Commission per trade
        slippage: Slippage as fraction
        commission_type: 'fixed' or 'percentage'
        risk_free_rate: Risk-free rate for metrics calculation
        
    Returns:
        Dictionary with:
        - results: Backtest results dict
        - metrics: Performance metrics dict
        - equity_curve: Equity curve Series
        - trades: Trades DataFrame
        - returns: Returns Series
        
    Example:
        >>> from quantlib.strategies.examples import MovingAverageStrategy
        >>> strategy = MovingAverageStrategy({'short_window': 20, 'long_window': 50})
        >>> data = load_symbol('AAPL', '2020-01-01', '2023-01-01')
        >>> results = run_backtest(strategy, data, 'AAPL')
        >>> print(results['metrics']['sharpe_ratio'])
    """
    # Create and run backtest engine
    engine = BacktestEngine(
        initial_capital=initial_capital,
        commission=commission,
        slippage=slippage,
        commission_type=commission_type
    )
    
    engine._symbol = symbol
    backtest_results = engine.run(strategy, data, symbol=symbol)
    
    # Extract data for metrics
    returns = backtest_results.get('returns', pd.Series())
    equity_curve = backtest_results.get('equity_curve', pd.Series())
    trades_df = backtest_results.get('trades', pd.DataFrame())
    
    # Calculate comprehensive metrics
    metrics = {}
    if len(returns) > 0:
        try:
            calculator = RiskCalculator(
                returns=returns,
                equity_curve=equity_curve if len(equity_curve) > 0 else None,
                trades=trades_df if not trades_df.empty else None,
                risk_free_rate=risk_free_rate,
                periods=252,  # Daily data
            )
            metrics = calculator.get_flat_metrics()
        except Exception as e:
            print(f"Warning: Error calculating metrics: {e}")
    
    return {
        'results': backtest_results,
        'metrics': metrics,
        'equity_curve': equity_curve,
        'trades': trades_df,
        'returns': returns,
    }


def plot_equity_curve(
    equity_curve: pd.Series,
    title: str = "Equity Curve",
    figsize: tuple = (12, 6)
) -> None:
    """
    Plot equity curve.
    
    Args:
        equity_curve: Equity curve Series (indexed by date)
        title: Plot title
        figsize: Figure size tuple
        
    Example:
        >>> results = run_backtest(strategy, data, 'AAPL')
        >>> plot_equity_curve(results['equity_curve'])
    """
    fig, ax = plt.subplots(figsize=figsize)
    equity_curve.plot(ax=ax, title=title, label='Equity')
    ax.set_xlabel('Date')
    ax.set_ylabel('Equity ($)')
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.show()


def plot_trades(
    data: pd.DataFrame,
    trades: pd.DataFrame,
    equity_curve: Optional[pd.Series] = None,
    title: str = "Price Chart with Trades",
    figsize: tuple = (14, 8)
) -> None:
    """
    Plot price chart with buy/sell markers.
    
    Args:
        data: OHLCV DataFrame
        trades: Trades DataFrame with columns: timestamp, symbol, quantity, direction, price
        equity_curve: Optional equity curve for subplot
        title: Plot title
        figsize: Figure size tuple
        
    Example:
        >>> results = run_backtest(strategy, data, 'AAPL')
        >>> plot_trades(data, results['trades'], results['equity_curve'])
    """
    if equity_curve is not None:
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=figsize, sharex=True, height_ratios=[2, 1])
    else:
        fig, ax1 = plt.subplots(figsize=figsize)
        ax2 = None
    
    # Plot price
    if 'Close' in data.columns:
        data['Close'].plot(ax=ax1, label='Close Price', alpha=0.7)
    
    # Mark trades
    if not trades.empty and 'timestamp' in trades.columns:
        buy_trades = trades[trades['direction'] == 'BUY']
        sell_trades = trades[trades['direction'] == 'SELL']
        
        if not buy_trades.empty and 'price' in buy_trades.columns:
            buy_trades.set_index('timestamp')['price'].plot(
                ax=ax1, style='^', color='green', markersize=10, label='Buy'
            )
        
        if not sell_trades.empty and 'price' in sell_trades.columns:
            sell_trades.set_index('timestamp')['price'].plot(
                ax=ax1, style='v', color='red', markersize=10, label='Sell'
            )
    
    ax1.set_ylabel('Price ($)')
    ax1.set_title(title)
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # Plot equity curve if provided
    if ax2 is not None:
        equity_curve.plot(ax=ax2, label='Equity', color='blue')
        ax2.set_ylabel('Equity ($)')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.show()


def plot_drawdown(
    equity_curve: pd.Series,
    title: str = "Drawdown Chart",
    figsize: tuple = (12, 6)
) -> None:
    """
    Plot drawdown (underwater equity curve).
    
    Args:
        equity_curve: Equity curve Series
        title: Plot title
        figsize: Figure size tuple
        
    Example:
        >>> results = run_backtest(strategy, data, 'AAPL')
        >>> plot_drawdown(results['equity_curve'])
    """
    # Calculate drawdown
    peak = equity_curve.expanding().max()
    drawdown = (equity_curve - peak) / peak * 100
    
    fig, ax = plt.subplots(figsize=figsize)
    drawdown.plot(ax=ax, kind='area', color='red', alpha=0.3, title=title)
    ax.set_xlabel('Date')
    ax.set_ylabel('Drawdown (%)')
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.show()


def get_metrics_summary(metrics: Dict[str, Any]) -> pd.DataFrame:
    """
    Convert metrics dict to a formatted DataFrame for display.
    
    Args:
        metrics: Metrics dictionary from backtest results
        
    Returns:
        DataFrame with metric names and values
        
    Example:
        >>> results = run_backtest(strategy, data, 'AAPL')
        >>> summary = get_metrics_summary(results['metrics'])
        >>> display(summary)
    """
    # Common metrics to display
    common_metrics = [
        'total_return',
        'sharpe_ratio',
        'sortino_ratio',
        'max_drawdown',
        'max_drawdown_pct',
        'calmar_ratio',
        'num_trades',
        'final_equity',
        'initial_capital',
    ]
    
    metric_data = []
    for metric_name in common_metrics:
        if metric_name in metrics:
            metric_data.append({
                'Metric': metric_name.replace('_', ' ').title(),
                'Value': metrics[metric_name]
            })
    
    # Add any other metrics
    for key, value in metrics.items():
        if key not in common_metrics:
            metric_data.append({
                'Metric': key.replace('_', ' ').title(),
                'Value': value
            })
    
    df = pd.DataFrame(metric_data)
    return df
