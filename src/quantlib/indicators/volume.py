"""Volume indicators"""

import pandas as pd
import numpy as np


def obv(close: pd.Series, volume: pd.Series) -> pd.Series:
    """
    On-Balance Volume.
    
    Args:
        close: Close prices
        volume: Volume series
        
    Returns:
        OBV series
    """
    obv = (np.sign(close.diff()) * volume).fillna(0).cumsum()
    return obv


def volume_sma(volume: pd.Series, window: int) -> pd.Series:
    """
    Volume Simple Moving Average.
    
    Args:
        volume: Volume series
        window: Window size
        
    Returns:
        Volume SMA series
    """
    return volume.rolling(window=window).mean()


def volume_profile(
    price: pd.Series,
    volume: pd.Series,
    bins: int = 20
) -> pd.DataFrame:
    """
    Volume Profile (Volume at Price).
    
    Args:
        price: Price series
        volume: Volume series
        bins: Number of price bins
        
    Returns:
        DataFrame with price bins and volume
    """
    price_min = price.min()
    price_max = price.max()
    bin_edges = np.linspace(price_min, price_max, bins + 1)
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
    
    volume_by_price = pd.Series(index=bin_centers, dtype=float)
    
    for i in range(len(price)):
        price_val = price.iloc[i]
        vol_val = volume.iloc[i]
        
        # Find which bin this price belongs to
        bin_idx = np.digitize(price_val, bin_edges) - 1
        bin_idx = max(0, min(bin_idx, len(bin_centers) - 1))
        
        volume_by_price.iloc[bin_idx] += vol_val
    
    return pd.DataFrame({
        'price': bin_centers,
        'volume': volume_by_price.values
    })


def vwap(high: pd.Series, low: pd.Series, close: pd.Series, volume: pd.Series) -> pd.Series:
    """
    Volume Weighted Average Price.
    
    Args:
        high: High prices
        low: Low prices
        close: Close prices
        volume: Volume series
        
    Returns:
        VWAP series
    """
    typical_price = (high + low + close) / 3
    vwap = (typical_price * volume).cumsum() / volume.cumsum()
    return vwap
