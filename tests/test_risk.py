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
    annualized_volatility,
    omega_ratio,
    tail_ratio,
    skewness,
    kurtosis,
    ulcer_index,
    average_drawdown_duration,
    win_rate,
    profit_factor,
    average_win_loss,
    RiskCalculator,
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


def test_annualized_volatility(sample_returns):
    """Test annualized volatility calculation"""
    vol = annualized_volatility(sample_returns)
    
    assert isinstance(vol, (int, float))
    assert vol >= 0
    assert not np.isnan(vol)
    assert not np.isinf(vol)


def test_omega_ratio(sample_returns):
    """Test Omega ratio calculation"""
    omega = omega_ratio(sample_returns)
    
    assert isinstance(omega, (int, float))
    assert not np.isnan(omega)
    # Omega can be inf if no losses


def test_tail_ratio(sample_returns):
    """Test tail ratio calculation"""
    tail = tail_ratio(sample_returns)
    
    assert isinstance(tail, (int, float))
    assert tail >= 0
    assert not np.isnan(tail)


def test_skewness(sample_returns):
    """Test skewness calculation"""
    skew = skewness(sample_returns)
    
    assert isinstance(skew, (int, float))
    assert not np.isnan(skew)
    assert not np.isinf(skew)


def test_kurtosis(sample_returns):
    """Test kurtosis calculation"""
    kurt = kurtosis(sample_returns)
    
    assert isinstance(kurt, (int, float))
    assert not np.isnan(kurt)
    assert not np.isinf(kurt)


def test_ulcer_index(sample_equity):
    """Test Ulcer Index calculation"""
    ulcer = ulcer_index(sample_equity)
    
    assert isinstance(ulcer, (int, float))
    assert ulcer >= 0
    assert not np.isnan(ulcer)
    assert not np.isinf(ulcer)


def test_average_drawdown_duration(sample_equity):
    """Test average drawdown duration calculation"""
    avg_dd = average_drawdown_duration(sample_equity)
    
    assert isinstance(avg_dd, (int, float))
    assert avg_dd >= 0
    assert not np.isnan(avg_dd)
    assert not np.isinf(avg_dd)


def test_win_rate():
    """Test win rate calculation"""
    trades = pd.DataFrame({
        'pnl': [100, -50, 200, -30, 150, -20]
    })
    
    wr = win_rate(trades)
    
    assert isinstance(wr, (int, float))
    assert 0 <= wr <= 100
    assert wr == pytest.approx(66.67, rel=0.1)


def test_profit_factor():
    """Test profit factor calculation"""
    trades = pd.DataFrame({
        'pnl': [100, -50, 200, -30, 150, -20]
    })
    
    pf = profit_factor(trades)
    
    assert isinstance(pf, (int, float))
    assert pf >= 0
    assert not np.isnan(pf)
    # Should be positive since we have more profit than loss
    assert pf > 1


def test_average_win_loss():
    """Test average win/loss calculation"""
    trades = pd.DataFrame({
        'pnl': [100, -50, 200, -30, 150, -20]
    })
    
    stats = average_win_loss(trades)
    
    assert isinstance(stats, dict)
    assert 'avg_win' in stats
    assert 'avg_loss' in stats
    assert 'win_loss_ratio' in stats
    assert stats['avg_win'] > 0
    assert stats['avg_loss'] > 0
    assert stats['win_loss_ratio'] > 0


def test_risk_calculator_basic(sample_returns, sample_equity):
    """Test RiskCalculator basic functionality"""
    calculator = RiskCalculator(
        returns=sample_returns,
        equity_curve=sample_equity,
    )
    
    all_metrics = calculator.calculate_all()
    
    assert isinstance(all_metrics, dict)
    assert 'performance' in all_metrics
    assert 'drawdown' in all_metrics
    assert 'var' in all_metrics
    assert 'distribution' in all_metrics
    
    # Check performance metrics
    perf = all_metrics['performance']
    assert 'sharpe_ratio' in perf
    assert 'sortino_ratio' in perf
    assert 'annualized_volatility' in perf


def test_risk_calculator_with_benchmark(sample_returns, sample_equity):
    """Test RiskCalculator with benchmark"""
    benchmark_returns = sample_returns * 0.8  # Slightly different
    calculator = RiskCalculator(
        returns=sample_returns,
        equity_curve=sample_equity,
        benchmark_returns=benchmark_returns,
    )
    
    all_metrics = calculator.calculate_all()
    
    assert 'benchmark' in all_metrics
    bench_metrics = all_metrics['benchmark']
    assert 'beta' in bench_metrics
    assert 'alpha' in bench_metrics


def test_risk_calculator_with_trades(sample_returns, sample_equity):
    """Test RiskCalculator with trades"""
    trades = pd.DataFrame({
        'pnl': [100, -50, 200, -30, 150, -20],
        'timestamp': pd.date_range('2020-01-01', periods=6, freq='D')
    })
    
    calculator = RiskCalculator(
        returns=sample_returns,
        equity_curve=sample_equity,
        trades=trades,
    )
    
    all_metrics = calculator.calculate_all()
    
    assert 'trades' in all_metrics
    trade_metrics = all_metrics['trades']
    assert 'win_rate' in trade_metrics
    assert 'profit_factor' in trade_metrics


def test_risk_calculator_flat_metrics(sample_returns, sample_equity):
    """Test RiskCalculator get_flat_metrics"""
    calculator = RiskCalculator(
        returns=sample_returns,
        equity_curve=sample_equity,
    )
    
    flat_metrics = calculator.get_flat_metrics()
    
    assert isinstance(flat_metrics, dict)
    # Performance metrics should not have prefix
    assert 'sharpe_ratio' in flat_metrics
    assert 'sortino_ratio' in flat_metrics
    # Other metrics should have prefix
    assert 'drawdown_max_drawdown_pct' in flat_metrics or 'max_drawdown_pct' in flat_metrics
    assert 'var_historical_var' in flat_metrics


def test_risk_calculator_empty_returns():
    """Test RiskCalculator with empty returns raises error"""
    empty_returns = pd.Series(dtype=float)
    
    with pytest.raises(ValueError):
        RiskCalculator(returns=empty_returns)


def test_historical_var_invalid_confidence():
    """Test VaR with invalid confidence level"""
    returns = pd.Series([0.01, -0.02, 0.015])
    
    with pytest.raises(ValueError):
        historical_var(returns, confidence_level=1.5)
    
    with pytest.raises(ValueError):
        historical_var(returns, confidence_level=-0.1)
