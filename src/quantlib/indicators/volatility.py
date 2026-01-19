"""Volatility indicators"""

import pandas as pd
import numpy as np


def bollinger_bands(
    series: pd.Series,
    window: int = 20,
    num_std: float = 2.0
) -> pd.DataFrame:
    """
    Bollinger Bands.
    
    Args:
        series: Price series
        window: Window size
        num_std: Number of standard deviations
        
    Returns:
        DataFrame with columns: upper, middle, lower
    """
    middle = series.rolling(window=window).mean()
    std = series.rolling(window=window).std()
    
    upper = middle + (std * num_std)
    lower = middle - (std * num_std)
    
    return pd.DataFrame({
        'upper': upper,
        'middle': middle,
        'lower': lower
    })


def atr(high: pd.Series, low: pd.Series, close: pd.Series, window: int = 14) -> pd.Series:
    """
    Average True Range.
    
    Args:
        high: High prices
        low: Low prices
        close: Close prices
        window: Window size
        
    Returns:
        ATR series
    """
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))
    
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = tr.rolling(window=window).mean()
    
    return atr


def keltner_channels(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    window: int = 20,
    atr_mult: float = 2.0
) -> pd.DataFrame:
    """
    Keltner Channels.
    
    Args:
        high: High prices
        low: Low prices
        close: Close prices
        window: Window size
        atr_mult: ATR multiplier
        
    Returns:
        DataFrame with columns: upper, middle, lower
    """
    middle = close.ewm(span=window, adjust=False).mean()
    atr_val = atr(high, low, close, window)
    
    upper = middle + (atr_val * atr_mult)
    lower = middle - (atr_val * atr_mult)
    
    return pd.DataFrame({
        'upper': upper,
        'middle': middle,
        'lower': lower
    })


def donchian_channels(high: pd.Series, low: pd.Series, window: int = 20) -> pd.DataFrame:
    """
    Donchian Channels.
    
    Args:
        high: High prices
        low: Low prices
        window: Window size
        
    Returns:
        DataFrame with columns: upper, middle, lower
    """
    upper = high.rolling(window=window).max()
    lower = low.rolling(window=window).min()
    middle = (upper + lower) / 2
    
    return pd.DataFrame({
        'upper': upper,
        'middle': middle,
        'lower': lower
    })
