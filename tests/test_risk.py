"""Tests for risk metrics"""

import pytest
import pandas as pd
import numpy as np
from quantlib.risk import (
    sharpe_ratio,
    sortino_ratio,
    max_drawdown,
    max_drawdown_pct,
    historical_var,
)


@pytest.fixture
def sample_returns():
    """Create sample returns data"""
    dates = pd.date_range('2020-01-01', periods=252, freq='D')
    returns = np.random.randn(252) * 0.01  # ~1% daily volatility
    return pd.Series(returns, index=dates)


@pytest.fixture
def sample_equity():
    """Create sample equity curve"""
    dates = pd.date_range('2020-01-01', periods=252, freq='D')
    # Create equity curve with some drawdown
    equity = 100000 + np.cumsum(np.random.randn(252) * 100)
    return pd.Series(equity, index=dates)


def test_sharpe_ratio(sample_returns):
    """Test Sharpe ratio calculation"""
    sharpe = sharpe_ratio(sample_returns)
    
    assert isinstance(sharpe, (int, float))
    assert not np.isnan(sharpe)
    assert not np.isinf(sharpe)


def test_sharpe_ratio_empty():
    """Test Sharpe ratio with empty returns"""
    empty_returns = pd.Series(dtype=float)
    sharpe = sharpe_ratio(empty_returns)
    assert sharpe == 0.0


def test_sortino_ratio(sample_returns):
    """Test Sortino ratio calculation"""
    sortino = sortino_ratio(sample_returns)
    
    assert isinstance(sortino, (int, float))
    assert not np.isnan(sortino)
    assert not np.isinf(sortino)


def test_max_drawdown(sample_equity):
    """Test maximum drawdown calculation"""
    max_dd = max_drawdown(sample_equity)
    
    assert isinstance(max_dd, (int, float))
    assert max_dd <= 0  # Drawdown should be negative or zero
    assert not np.isnan(max_dd)


def test_max_drawdown_pct(sample_equity):
    """Test maximum drawdown percentage"""
    max_dd_pct = max_drawdown_pct(sample_equity)
    
    assert isinstance(max_dd_pct, (int, float))
    assert max_dd_pct <= 0  # Should be negative or zero
    assert not np.isnan(max_dd_pct)


def test_historical_var(sample_returns):
    """Test Historical VaR calculation"""
    var = historical_var(sample_returns, confidence_level=0.95)
    
    assert isinstance(var, (int, float))
    assert not np.isnan(var)


def test_historical_var_empty():
    """Test VaR with empty returns"""
    empty_returns = pd.Series(dtype=float)
    var = historical_var(empty_returns)
    assert var == 0.0
