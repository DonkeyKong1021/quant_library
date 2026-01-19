"""Price and indicator charts"""

from typing import Optional, Dict
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates


def plot_price_data(
    ohlcv_data: pd.DataFrame,
    indicators: Optional[Dict[str, pd.Series]] = None,
    style: str = 'line'
) -> plt.Figure:
    """
    Plot price data with optional indicator overlays.
    
    Args:
        ohlcv_data: DataFrame with OHLCV data
        indicators: Dictionary of indicator name -> Series
        style: Chart style ('line' or 'candlestick')
        
    Returns:
        Matplotlib Figure
    """
    fig, ax = plt.subplots(figsize=(12, 6))
    
    if style == 'line':
        ax.plot(ohlcv_data.index, ohlcv_data['Close'], label='Close', linewidth=1.5)
    elif style == 'candlestick':
        # Simple candlestick approximation with line chart
        ax.plot(ohlcv_data.index, ohlcv_data['Close'], label='Close', linewidth=1.5)
    
    # Add indicators
    if indicators:
        for name, values in indicators.items():
            ax.plot(values.index, values, label=name, alpha=0.7)
    
    ax.set_xlabel('Date')
    ax.set_ylabel('Price')
    ax.set_title('Price Chart')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    # Format x-axis dates
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')
    
    plt.tight_layout()
    return fig


def plot_indicator(
    price_data: pd.Series,
    indicator: pd.Series,
    indicator_name: str,
    subplots: bool = True
) -> plt.Figure:
    """
    Plot price with indicator on separate subplot.
    
    Args:
        price_data: Price series
        indicator: Indicator series
        indicator_name: Name of indicator
        subplots: Whether to use subplots
        
    Returns:
        Matplotlib Figure
    """
    if subplots:
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8), sharex=True)
        
        ax1.plot(price_data.index, price_data.values, label='Price', linewidth=1.5)
        ax1.set_ylabel('Price')
        ax1.set_title('Price and Indicator')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        ax2.plot(indicator.index, indicator.values, label=indicator_name, color='orange', linewidth=1.5)
        ax2.set_ylabel(indicator_name)
        ax2.set_xlabel('Date')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        # Format x-axis dates
        ax2.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        plt.setp(ax2.xaxis.get_majorticklabels(), rotation=45, ha='right')
    else:
        fig, ax = plt.subplots(figsize=(12, 6))
        ax.plot(price_data.index, price_data.values, label='Price')
        ax.plot(indicator.index, indicator.values, label=indicator_name)
        ax.set_xlabel('Date')
        ax.set_ylabel('Value')
        ax.legend()
        ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    return fig


def plot_signals(
    ohlcv_data: pd.DataFrame,
    signals: pd.DataFrame,
    indicators: Optional[Dict[str, pd.Series]] = None
) -> plt.Figure:
    """
    Plot price data with signal markers.
    
    Args:
        ohlcv_data: DataFrame with OHLCV data
        signals: DataFrame with columns: timestamp, signal_type, symbol
        indicators: Optional indicators to overlay
        
    Returns:
        Matplotlib Figure
    """
    fig, ax = plt.subplots(figsize=(12, 6))
    
    ax.plot(ohlcv_data.index, ohlcv_data['Close'], label='Close', linewidth=1.5, color='black')
    
    # Plot signals
    if not signals.empty and 'timestamp' in signals.columns:
        buy_signals = signals[signals.get('signal_type', '') == 'BUY']
        sell_signals = signals[signals.get('signal_type', '') == 'SELL']
        
        if not buy_signals.empty:
            buy_times = pd.to_datetime(buy_signals['timestamp'])
            buy_prices = ohlcv_data.loc[buy_times, 'Close'] if len(buy_times) > 0 else pd.Series()
            ax.scatter(buy_times, buy_prices, color='green', marker='^', s=100, label='Buy', zorder=5)
        
        if not sell_signals.empty:
            sell_times = pd.to_datetime(sell_signals['timestamp'])
            sell_prices = ohlcv_data.loc[sell_times, 'Close'] if len(sell_times) > 0 else pd.Series()
            ax.scatter(sell_times, sell_prices, color='red', marker='v', s=100, label='Sell', zorder=5)
    
    # Add indicators
    if indicators:
        for name, values in indicators.items():
            ax.plot(values.index, values, label=name, alpha=0.7)
    
    ax.set_xlabel('Date')
    ax.set_ylabel('Price')
    ax.set_title('Price Chart with Signals')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    return fig


def plot_trade_history(
    ohlcv_data: pd.DataFrame,
    trades: pd.DataFrame,
    show_pnl: bool = True
) -> plt.Figure:
    """
    Plot price chart with trade markers.
    
    Args:
        ohlcv_data: DataFrame with OHLCV data
        trades: DataFrame with trade data
        show_pnl: Whether to show P&L annotations
        
    Returns:
        Matplotlib Figure
    """
    fig, ax = plt.subplots(figsize=(12, 6))
    
    ax.plot(ohlcv_data.index, ohlcv_data['Close'], label='Close', linewidth=1.5, color='black')
    
    if not trades.empty and 'timestamp' in trades.columns:
        entry_trades = trades[trades.get('direction', '') == 'BUY']
        exit_trades = trades[trades.get('direction', '') == 'SELL']
        
        if not entry_trades.empty:
            entry_times = pd.to_datetime(entry_trades['timestamp'])
            entry_prices = entry_trades['price']
            ax.scatter(entry_times, entry_prices, color='green', marker='^', s=100, label='Entry', zorder=5)
        
        if not exit_trades.empty:
            exit_times = pd.to_datetime(exit_trades['timestamp'])
            exit_prices = exit_trades['price']
            ax.scatter(exit_times, exit_prices, color='red', marker='v', s=100, label='Exit', zorder=5)
    
    ax.set_xlabel('Date')
    ax.set_ylabel('Price')
    ax.set_title('Trade History')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    return fig
