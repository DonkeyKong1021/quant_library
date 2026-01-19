"""Momentum indicators"""

import pandas as pd
import numpy as np


def rsi(series: pd.Series, window: int = 14) -> pd.Series:
    """
    Relative Strength Index.
    
    Args:
        series: Price series
        window: Window size
        
    Returns:
        RSI series (values between 0-100)
    """
    if window <= 0:
        raise ValueError("Window must be positive")
    
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    
    return rsi


def stochastic(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    k_window: int = 14,
    d_window: int = 3
) -> pd.DataFrame:
    """
    Stochastic Oscillator.
    
    Args:
        high: High prices
        low: Low prices
        close: Close prices
        k_window: %K window size
        d_window: %D window size (smoothing)
        
    Returns:
        DataFrame with columns: k_percent, d_percent
    """
    lowest_low = low.rolling(window=k_window).min()
    highest_high = high.rolling(window=k_window).max()
    
    k_percent = 100 * ((close - lowest_low) / (highest_high - lowest_low))
    d_percent = k_percent.rolling(window=d_window).mean()
    
    return pd.DataFrame({
        'k_percent': k_percent,
        'd_percent': d_percent
    })


def williams_r(high: pd.Series, low: pd.Series, close: pd.Series, window: int = 14) -> pd.Series:
    """
    Williams %R.
    
    Args:
        high: High prices
        low: Low prices
        close: Close prices
        window: Window size
        
    Returns:
        Williams %R series (values between -100 and 0)
    """
    highest_high = high.rolling(window=window).max()
    lowest_low = low.rolling(window=window).min()
    
    wr = -100 * ((highest_high - close) / (highest_high - lowest_low))
    
    return wr


def cci(high: pd.Series, low: pd.Series, close: pd.Series, window: int = 20) -> pd.Series:
    """
    Commodity Channel Index.
    
    Args:
        high: High prices
        low: Low prices
        close: Close prices
        window: Window size
        
    Returns:
        CCI series
    """
    tp = (high + low + close) / 3  # Typical Price
    sma_tp = tp.rolling(window=window).mean()
    mad = tp.rolling(window=window).apply(lambda x: np.mean(np.abs(x - x.mean())))
    
    cci = (tp - sma_tp) / (0.015 * mad)
    
    return cci


def roc(series: pd.Series, window: int = 10) -> pd.Series:
    """
    Rate of Change.
    
    Args:
        series: Price series
        window: Window size
        
    Returns:
        ROC series (percentage change)
    """
    return series.pct_change(periods=window) * 100
