"""Performance and risk metrics"""

import pandas as pd
import numpy as np
from scipy import stats


def sharpe_ratio(
    returns: pd.Series,
    risk_free_rate: float = 0.0,
    periods: int = 252
) -> float:
    """
    Calculate annualized Sharpe ratio.
    
    Args:
        returns: Returns series
        risk_free_rate: Annual risk-free rate
        periods: Number of periods per year (252 for daily)
        
    Returns:
        Sharpe ratio
    """
    if len(returns) == 0 or returns.std() == 0:
        return 0.0
    
    excess_returns = returns - (risk_free_rate / periods)
    return np.sqrt(periods) * excess_returns.mean() / returns.std()


def sortino_ratio(
    returns: pd.Series,
    risk_free_rate: float = 0.0,
    periods: int = 252
) -> float:
    """
    Calculate annualized Sortino ratio (uses downside deviation).
    
    Args:
        returns: Returns series
        risk_free_rate: Annual risk-free rate
        periods: Number of periods per year
        
    Returns:
        Sortino ratio
    """
    if len(returns) == 0:
        return 0.0
    
    excess_returns = returns - (risk_free_rate / periods)
    downside_returns = returns[returns < 0]
    
    if len(downside_returns) == 0 or downside_returns.std() == 0:
        return 0.0
    
    downside_std = downside_returns.std()
    return np.sqrt(periods) * excess_returns.mean() / downside_std


def calmar_ratio(returns: pd.Series, max_drawdown: float) -> float:
    """
    Calculate Calmar ratio (annualized return / max drawdown).
    
    Args:
        returns: Returns series
        max_drawdown: Maximum drawdown (positive number)
        
    Returns:
        Calmar ratio
    """
    if max_drawdown == 0 or len(returns) == 0:
        return 0.0
    
    annual_return = returns.mean() * 252
    return annual_return / max_drawdown


def information_ratio(returns: pd.Series, benchmark_returns: pd.Series) -> float:
    """
    Calculate Information ratio.
    
    Args:
        returns: Strategy returns
        benchmark_returns: Benchmark returns
        
    Returns:
        Information ratio
    """
    if len(returns) != len(benchmark_returns):
        raise ValueError("Returns and benchmark must have same length")
    
    excess_returns = returns - benchmark_returns
    
    if excess_returns.std() == 0:
        return 0.0
    
    return excess_returns.mean() / excess_returns.std()


def beta(returns: pd.Series, benchmark_returns: pd.Series) -> float:
    """
    Calculate Beta (sensitivity to benchmark).
    
    Args:
        returns: Strategy returns
        benchmark_returns: Benchmark returns
        
    Returns:
        Beta
    """
    if len(returns) != len(benchmark_returns):
        raise ValueError("Returns and benchmark must have same length")
    
    if benchmark_returns.var() == 0:
        return 0.0
    
    covariance = returns.cov(benchmark_returns)
    variance = benchmark_returns.var()
    
    return covariance / variance


def alpha(
    returns: pd.Series,
    benchmark_returns: pd.Series,
    risk_free_rate: float = 0.0
) -> float:
    """
    Calculate Alpha (excess returns over benchmark).
    
    Args:
        returns: Strategy returns
        benchmark_returns: Benchmark returns
        risk_free_rate: Risk-free rate (annual)
        
    Returns:
        Alpha (annualized)
    """
    beta_val = beta(returns, benchmark_returns)
    excess_return = (returns.mean() - benchmark_returns.mean()) * 252
    alpha_val = excess_return - (beta_val * (benchmark_returns.mean() * 252 - risk_free_rate))
    
    return alpha_val


def jensen_alpha(
    returns: pd.Series,
    benchmark_returns: pd.Series,
    risk_free_rate: float = 0.0
) -> float:
    """
    Calculate Jensen's Alpha.
    
    Args:
        returns: Strategy returns
        benchmark_returns: Benchmark returns
        risk_free_rate: Risk-free rate (annual)
        
    Returns:
        Jensen's alpha (annualized)
    """
    beta_val = beta(returns, benchmark_returns)
    expected_return = risk_free_rate / 252 + beta_val * (benchmark_returns.mean() * 252 - risk_free_rate)
    actual_return = returns.mean() * 252
    
    return actual_return - expected_return
