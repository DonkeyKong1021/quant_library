"""Tests for data module"""

import pytest
import pandas as pd
from quantlib.data.preprocessing import clean_data, calculate_returns, normalize
from quantlib.utils.datetime import normalize_date_range, to_datetime


def test_clean_data_forward_fill():
    """Test forward fill cleaning method"""
    data = pd.DataFrame({
        'Close': [100, None, 102, None, 104],
        'Volume': [1000, 2000, None, 3000, 4000]
    })
    
    cleaned = clean_data(data, method='forward_fill')
    
    assert cleaned['Close'].iloc[1] == 100  # Forward filled
    assert cleaned['Close'].iloc[3] == 102  # Forward filled


def test_calculate_returns_simple():
    """Test simple returns calculation"""
    prices = pd.Series([100, 105, 110, 108, 112])
    returns = calculate_returns(prices, method='simple')
    
    assert len(returns) == len(prices)
    assert pd.isna(returns.iloc[0])  # First value should be NaN
    assert abs(returns.iloc[1] - 0.05) < 0.001  # (105-100)/100 = 0.05


def test_calculate_returns_log():
    """Test log returns calculation"""
    prices = pd.Series([100, 105, 110])
    returns = calculate_returns(prices, method='log')
    
    assert len(returns) == len(prices)
    assert pd.isna(returns.iloc[0])  # First value should be NaN


def test_normalize_min_max():
    """Test min-max normalization"""
    data = pd.Series([10, 20, 30, 40, 50])
    normalized = normalize(data, method='min_max')
    
    assert normalized.min() == 0.0
    assert normalized.max() == 1.0


def test_normalize_z_score():
    """Test z-score normalization"""
    data = pd.Series([10, 20, 30, 40, 50])
    normalized = normalize(data, method='z_score')
    
    # Mean should be approximately 0
    assert abs(normalized.mean()) < 0.001
    # Std should be approximately 1
    assert abs(normalized.std() - 1.0) < 0.001


def test_to_datetime():
    """Test datetime conversion"""
    date_str = '2020-01-01'
    result = to_datetime(date_str)
    
    assert isinstance(result, pd.Timestamp)
    assert result.year == 2020
    assert result.month == 1
    assert result.day == 1


def test_normalize_date_range():
    """Test date range normalization"""
    start, end = normalize_date_range('2020-01-01', '2020-12-31')
    
    assert isinstance(start, pd.Timestamp)
    assert isinstance(end, pd.Timestamp)
    assert start < end


def test_normalize_date_range_invalid():
    """Test date range with invalid order"""
    with pytest.raises(ValueError):
        normalize_date_range('2020-12-31', '2020-01-01')
