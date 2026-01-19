"""Position sizing strategies"""

from typing import Optional
import numpy as np


def fixed_dollar(portfolio_value: float, dollar_amount: float) -> float:
    """
    Fixed dollar amount per trade.
    
    Args:
        portfolio_value: Total portfolio value
        dollar_amount: Dollar amount to allocate
        
    Returns:
        Dollar amount to invest
    """
    return min(dollar_amount, portfolio_value)


def fixed_percent(portfolio_value: float, percent: float) -> float:
    """
    Fixed percentage of portfolio per trade.
    
    Args:
        portfolio_value: Total portfolio value
        percent: Percentage (0.0 to 1.0)
        
    Returns:
        Dollar amount to invest
    """
    if percent < 0 or percent > 1:
        raise ValueError("Percent must be between 0 and 1")
    return portfolio_value * percent


def kelly_criterion(win_rate: float, avg_win: float, avg_loss: float) -> float:
    """
    Kelly Criterion for optimal bet sizing.
    
    Args:
        win_rate: Win rate (0.0 to 1.0)
        avg_win: Average win amount
        avg_loss: Average loss amount (as positive number)
        
    Returns:
        Fraction of portfolio to bet (0.0 to 1.0)
    """
    if avg_loss == 0:
        return 0.0
    
    kelly = (win_rate * avg_win - (1 - win_rate) * avg_loss) / avg_win
    
    # Constrain to reasonable values
    return max(0.0, min(kelly, 1.0))


def volatility_based(
    portfolio_value: float,
    volatility: float,
    risk_target: float = 0.02
) -> float:
    """
    Volatility-based position sizing (ATR-based).
    
    Args:
        portfolio_value: Total portfolio value
        volatility: Volatility measure (e.g., ATR)
        risk_target: Target risk per trade (default 2%)
        
    Returns:
        Dollar amount to invest
    """
    if volatility == 0:
        return 0.0
    
    risk_amount = portfolio_value * risk_target
    position_size = risk_amount / volatility
    
    return min(position_size, portfolio_value)


def equal_weight(universe_size: int, portfolio_value: float) -> float:
    """
    Equal weight allocation across universe.
    
    Args:
        universe_size: Number of assets in universe
        portfolio_value: Total portfolio value
        
    Returns:
        Dollar amount per position
    """
    if universe_size == 0:
        return 0.0
    return portfolio_value / universe_size
