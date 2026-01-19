"""Trend indicators"""

from typing import Optional
import pandas as pd
import numpy as np


def sma(series: pd.Series, window: int) -> pd.Series:
    """
    Simple Moving Average.
    
    Args:
        series: Price series
        window: Window size
        
    Returns:
        SMA series
    """
    if window <= 0:
        raise ValueError("Window must be positive")
    return series.rolling(window=window).mean()


def ema(series: pd.Series, window: int, alpha: Optional[float] = None) -> pd.Series:
    """
    Exponential Moving Average.
    
    Args:
        series: Price series
        window: Window size
        alpha: Smoothing factor (if None, calculated from window)
        
    Returns:
        EMA series
    """
    if window <= 0:
        raise ValueError("Window must be positive")
    
    if alpha is None:
        alpha = 2.0 / (window + 1.0)
    
    return series.ewm(alpha=alpha, adjust=False).mean()


def macd(
    series: pd.Series,
    fast: int = 12,
    slow: int = 26,
    signal: int = 9
) -> pd.DataFrame:
    """
    Moving Average Convergence Divergence.
    
    Args:
        series: Price series
        fast: Fast EMA period
        slow: Slow EMA period
        signal: Signal line EMA period
        
    Returns:
        DataFrame with columns: macd, signal, histogram
    """
    ema_fast = ema(series, fast)
    ema_slow = ema(series, slow)
    macd_line = ema_fast - ema_slow
    signal_line = ema(macd_line, signal)
    histogram = macd_line - signal_line
    
    return pd.DataFrame({
        'macd': macd_line,
        'signal': signal_line,
        'histogram': histogram
    })


def adx(high: pd.Series, low: pd.Series, close: pd.Series, window: int = 14) -> pd.Series:
    """
    Average Directional Index.
    
    Args:
        high: High prices
        low: Low prices
        close: Close prices
        window: Window size
        
    Returns:
        ADX series
    """
    # Calculate True Range
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    # Calculate Directional Movement
    up_move = high - high.shift(1)
    down_move = low.shift(1) - low
    
    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0)
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0)
    
    plus_dm = pd.Series(plus_dm, index=high.index)
    minus_dm = pd.Series(minus_dm, index=high.index)
    
    # Smooth the values
    atr = tr.rolling(window=window).mean()
    plus_di = 100 * (plus_dm.rolling(window=window).mean() / atr)
    minus_di = 100 * (minus_dm.rolling(window=window).mean() / atr)
    
    # Calculate ADX
    dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di)
    adx = dx.rolling(window=window).mean()
    
    return adx


def ichimoku(high: pd.Series, low: pd.Series, close: pd.Series) -> pd.DataFrame:
    """
    Ichimoku Cloud.
    
    Args:
        high: High prices
        low: Low prices
        close: Close prices
        
    Returns:
        DataFrame with columns: tenkan, kijun, senkou_a, senkou_b, chikou
    """
    # Tenkan-sen (Conversion Line): (9-period high + 9-period low)/2
    period1_high = high.rolling(window=9).max()
    period1_low = low.rolling(window=9).min()
    tenkan = (period1_high + period1_low) / 2
    
    # Kijun-sen (Base Line): (26-period high + 26-period low)/2
    period2_high = high.rolling(window=26).max()
    period2_low = low.rolling(window=26).min()
    kijun = (period2_high + period2_low) / 2
    
    # Senkou Span A (Leading Span A): (Conversion Line + Base Line)/2
    senkou_a = ((tenkan + kijun) / 2).shift(26)
    
    # Senkou Span B (Leading Span B): (52-period high + 52-period low)/2
    period3_high = high.rolling(window=52).max()
    period3_low = low.rolling(window=52).min()
    senkou_b = ((period3_high + period3_low) / 2).shift(26)
    
    # Chikou Span (Lagging Span): Close price, shifted back 26 periods
    chikou = close.shift(-26)
    
    return pd.DataFrame({
        'tenkan': tenkan,
        'kijun': kijun,
        'senkou_a': senkou_a,
        'senkou_b': senkou_b,
        'chikou': chikou
    })
