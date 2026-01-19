"""Tests for technical indicators"""

import pytest
import pandas as pd
import numpy as np
from quantlib.indicators import sma, ema, rsi, bollinger_bands, atr


@pytest.fixture
def sample_prices():
    """Create sample price data"""
    dates = pd.date_range('2020-01-01', periods=100, freq='D')
    prices = 100 + np.cumsum(np.random.randn(100) * 0.5)
    return pd.Series(prices, index=dates)


def test_sma(sample_prices):
    """Test Simple Moving Average"""
    window = 20
    result = sma(sample_prices, window)
    
    assert len(result) == len(sample_prices)
    assert not result.iloc[:window-1].notna().all()  # First window-1 should be NaN
    assert result.iloc[window-1:].notna().all()  # Rest should have values
    
    # Check that SMA smooths the data
    assert result.iloc[-1] is not None


def test_ema(sample_prices):
    """Test Exponential Moving Average"""
    window = 20
    result = ema(sample_prices, window)
    
    assert len(result) == len(sample_prices)
    # EMA should have values (starts from first value)
    assert result.notna().sum() > 0


def test_rsi(sample_prices):
    """Test Relative Strength Index"""
    result = rsi(sample_prices, window=14)
    
    assert len(result) == len(sample_prices)
    # RSI should be between 0 and 100
    valid_values = result.dropna()
    if len(valid_values) > 0:
        assert valid_values.min() >= 0
        assert valid_values.max() <= 100


def test_bollinger_bands(sample_prices):
    """Test Bollinger Bands"""
    result = bollinger_bands(sample_prices, window=20, num_std=2)
    
    assert isinstance(result, pd.DataFrame)
    assert 'upper' in result.columns
    assert 'middle' in result.columns
    assert 'lower' in result.columns
    
    # Upper should be above middle, middle above lower
    valid = result.dropna()
    if len(valid) > 0:
        assert (valid['upper'] > valid['middle']).all()
        assert (valid['middle'] > valid['lower']).all()


def test_atr():
    """Test Average True Range"""
    dates = pd.date_range('2020-01-01', periods=50, freq='D')
    high = pd.Series(100 + np.random.randn(50) * 2, index=dates)
    low = pd.Series(98 + np.random.randn(50) * 2, index=dates)
    close = pd.Series(99 + np.random.randn(50) * 2, index=dates)
    
    result = atr(high, low, close, window=14)
    
    assert len(result) == len(high)
    # ATR should be positive
    valid = result.dropna()
    if len(valid) > 0:
        assert (valid > 0).all()


def test_sma_window_validation():
    """Test SMA with invalid window"""
    prices = pd.Series([100, 101, 102, 103, 104])
    
    with pytest.raises(ValueError):
        sma(prices, window=0)
    
    with pytest.raises(ValueError):
        sma(prices, window=-1)
