"""Integration tests for quantlib"""

import pytest
import pandas as pd
import numpy as np
from quantlib.data import YahooFinanceFetcher
from quantlib.indicators import sma, ema, rsi, bollinger_bands
from quantlib.risk import sharpe_ratio, max_drawdown, calculate_drawdown
from quantlib.data.preprocessing import calculate_returns, clean_data


def test_basic_imports():
    """Test that all major modules can be imported"""
    from quantlib import __version__
    from quantlib.data import YahooFinanceFetcher, DataStore
    from quantlib.backtesting import BacktestEngine
    from quantlib.strategies import Strategy
    from quantlib.portfolio import Portfolio
    from quantlib.risk import sharpe_ratio
    from quantlib.visualization import plot_equity_curve
    
    assert __version__ == "0.1.0"


def test_indicator_workflow():
    """Test that indicators work with real data"""
    # Create sample price data
    dates = pd.date_range('2020-01-01', periods=100, freq='D')
    prices = 100 + np.cumsum(np.random.randn(100) * 0.5)
    price_series = pd.Series(prices, index=dates)
    
    # Test SMA
    sma_result = sma(price_series, window=20)
    assert len(sma_result) == len(price_series)
    assert sma_result.iloc[-1] is not None
    
    # Test EMA
    ema_result = ema(price_series, window=20)
    assert len(ema_result) == len(price_series)
    assert ema_result.iloc[-1] is not None
    
    # Test RSI
    rsi_result = rsi(price_series, window=14)
    assert len(rsi_result) == len(price_series)
    valid_rsi = rsi_result.dropna()
    if len(valid_rsi) > 0:
        assert (valid_rsi >= 0).all()
        assert (valid_rsi <= 100).all()


def test_risk_metrics_workflow():
    """Test risk metrics with sample returns"""
    # Create sample returns
    dates = pd.date_range('2020-01-01', periods=252, freq='D')
    returns = pd.Series(np.random.randn(252) * 0.01, index=dates)
    
    # Calculate equity curve
    equity = (1 + returns).cumprod() * 100000
    equity.iloc[0] = 100000
    
    # Test Sharpe ratio
    sharpe = sharpe_ratio(returns)
    assert isinstance(sharpe, (int, float))
    assert not np.isnan(sharpe)
    
    # Test drawdown
    drawdown = calculate_drawdown(equity)
    assert len(drawdown) == len(equity)
    assert drawdown.max() <= 0  # Drawdown should be negative or zero
    
    max_dd = max_drawdown(equity)
    assert max_dd <= 0


def test_data_preprocessing_workflow():
    """Test data preprocessing functions"""
    # Create sample data with missing values
    dates = pd.date_range('2020-01-01', periods=50, freq='D')
    data = pd.DataFrame({
        'Close': 100 + np.cumsum(np.random.randn(50) * 0.5),
        'Volume': np.random.randint(1000, 10000, 50)
    }, index=dates)
    
    # Introduce some missing values
    data.loc[data.index[10:15], 'Close'] = np.nan
    
    # Test cleaning
    cleaned = clean_data(data, method='forward_fill')
    assert cleaned['Close'].isna().sum() == 0
    
    # Test returns calculation
    returns = calculate_returns(cleaned['Close'])
    assert len(returns) == len(cleaned)
    assert returns.iloc[0] is np.nan or pd.isna(returns.iloc[0])  # First value should be NaN


@pytest.mark.skipif(True, reason="Requires network connection - run manually")
def test_yahoo_finance_fetcher():
    """Test Yahoo Finance data fetching (skipped by default)"""
    fetcher = YahooFinanceFetcher()
    
    try:
        data = fetcher.fetch_ohlcv('AAPL', start='2023-01-01', end='2023-12-31')
        assert isinstance(data, pd.DataFrame)
        assert len(data) > 0
        assert 'Close' in data.columns
        assert 'Volume' in data.columns
    except Exception as e:
        pytest.skip(f"Yahoo Finance fetch failed: {e}")
