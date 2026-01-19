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


def annualized_volatility(
    returns: pd.Series,
    periods: int = 252
) -> float:
    """
    Calculate annualized volatility (standard deviation).
    
    Args:
        returns: Returns series
        periods: Number of periods per year (252 for daily)
        
    Returns:
        Annualized volatility
    """
    if len(returns) == 0:
        return 0.0
    
    return returns.std() * np.sqrt(periods)


def omega_ratio(
    returns: pd.Series,
    threshold: float = 0.0,
    periods: int = 252
) -> float:
    """
    Calculate Omega ratio (probability-weighted ratio of gains vs losses).
    
    Omega ratio measures the probability-weighted ratio of gains vs losses
    relative to a threshold (often the risk-free rate).
    
    Args:
        returns: Returns series
        threshold: Threshold return level (default 0.0)
        periods: Number of periods per year (for annualizing threshold)
        
    Returns:
        Omega ratio
    """
    if len(returns) == 0:
        return 0.0
    
    threshold_daily = threshold / periods
    excess_returns = returns - threshold_daily
    
    gains = excess_returns[excess_returns > 0].sum()
    losses = abs(excess_returns[excess_returns < 0].sum())
    
    if losses == 0:
        return np.inf if gains > 0 else 0.0
    
    return gains / losses


def tail_ratio(
    returns: pd.Series,
    upper_percentile: float = 95.0,
    lower_percentile: float = 5.0
) -> float:
    """
    Calculate tail ratio (ratio of upper percentile to lower percentile returns).
    
    Measures the asymmetry of tail returns. A ratio > 1 indicates more positive
    tail events, < 1 indicates more negative tail events.
    
    Args:
        returns: Returns series
        upper_percentile: Upper percentile (default 95th)
        lower_percentile: Lower percentile (default 5th)
        
    Returns:
        Tail ratio
    """
    if len(returns) == 0:
        return 0.0
    
    upper = np.percentile(returns, upper_percentile)
    lower = np.percentile(returns, lower_percentile)
    
    if abs(lower) < 1e-10:
        return 0.0 if upper == 0 else np.inf if upper > 0 else -np.inf
    
    return abs(upper / lower)


def skewness(returns: pd.Series) -> float:
    """
    Calculate skewness of returns distribution.
    
    Positive skewness indicates right tail (more positive outliers),
    negative indicates left tail (more negative outliers).
    
    Args:
        returns: Returns series
        
    Returns:
        Skewness
    """
    if len(returns) < 3:
        return 0.0
    
    return stats.skew(returns)


def kurtosis(returns: pd.Series) -> float:
    """
    Calculate excess kurtosis of returns distribution.
    
    Excess kurtosis = kurtosis - 3 (normal distribution has kurtosis = 3).
    Positive values indicate fat tails, negative indicate thin tails.
    
    Args:
        returns: Returns series
        
    Returns:
        Excess kurtosis
    """
    if len(returns) < 4:
        return 0.0
    
    return stats.kurtosis(returns, fisher=True)  # fisher=True returns excess kurtosis


def win_rate(trades: pd.DataFrame, pnl_column: str = 'pnl') -> float:
    """
    Calculate win rate (percentage of profitable trades).
    
    Args:
        trades: DataFrame with trade data
        pnl_column: Column name for PnL (profit/loss)
        
    Returns:
        Win rate as percentage (0-100)
    """
    if trades.empty or pnl_column not in trades.columns:
        return 0.0
    
    profitable = (trades[pnl_column] > 0).sum()
    total = len(trades)
    
    if total == 0:
        return 0.0
    
    return (profitable / total) * 100


def profit_factor(trades: pd.DataFrame, pnl_column: str = 'pnl') -> float:
    """
    Calculate profit factor (gross profit / gross loss).
    
    A profit factor > 1 indicates profitable strategy,
    < 1 indicates losing strategy.
    
    Args:
        trades: DataFrame with trade data
        pnl_column: Column name for PnL (profit/loss)
        
    Returns:
        Profit factor
    """
    if trades.empty or pnl_column not in trades.columns:
        return 0.0
    
    gross_profit = trades[trades[pnl_column] > 0][pnl_column].sum()
    gross_loss = abs(trades[trades[pnl_column] < 0][pnl_column].sum())
    
    if gross_loss == 0:
        return np.inf if gross_profit > 0 else 0.0
    
    return gross_profit / gross_loss


def average_win_loss(trades: pd.DataFrame, pnl_column: str = 'pnl') -> dict:
    """
    Calculate average winning trade and average losing trade.
    
    Args:
        trades: DataFrame with trade data
        pnl_column: Column name for PnL (profit/loss)
        
    Returns:
        Dictionary with 'avg_win', 'avg_loss', 'win_loss_ratio'
    """
    if trades.empty or pnl_column not in trades.columns:
        return {'avg_win': 0.0, 'avg_loss': 0.0, 'win_loss_ratio': 0.0}
    
    winning_trades = trades[trades[pnl_column] > 0][pnl_column]
    losing_trades = trades[trades[pnl_column] < 0][pnl_column]
    
    avg_win = winning_trades.mean() if len(winning_trades) > 0 else 0.0
    avg_loss = abs(losing_trades.mean()) if len(losing_trades) > 0 else 0.0
    
    win_loss_ratio = avg_win / avg_loss if avg_loss > 0 else (np.inf if avg_win > 0 else 0.0)
    
    return {
        'avg_win': float(avg_win),
        'avg_loss': float(avg_loss),
        'win_loss_ratio': float(win_loss_ratio)
    }
