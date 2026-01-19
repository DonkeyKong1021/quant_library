"""Value at Risk (VaR) calculations"""

import pandas as pd
import numpy as np
from scipy import stats
from typing import Optional


def historical_var(
    returns: pd.Series,
    confidence_level: float = 0.95
) -> float:
    """
    Calculate Historical Value at Risk.
    
    Args:
        returns: Returns series
        confidence_level: Confidence level (e.g., 0.95 for 95%)
        
    Returns:
        VaR (negative value, represents loss)
    """
    if len(returns) == 0:
        return 0.0
    
    if confidence_level <= 0 or confidence_level >= 1:
        raise ValueError("confidence_level must be between 0 and 1")
    
    percentile = (1 - confidence_level) * 100
    var = np.percentile(returns, percentile)
    return var


def parametric_var(
    returns: pd.Series,
    confidence_level: float = 0.95
) -> float:
    """
    Calculate Parametric VaR (assumes normal distribution).
    
    Args:
        returns: Returns series
        confidence_level: Confidence level (e.g., 0.95 for 95%)
        
    Returns:
        VaR (negative value)
    """
    if len(returns) == 0:
        return 0.0
    
    if confidence_level <= 0 or confidence_level >= 1:
        raise ValueError("confidence_level must be between 0 and 1")
    
    mean_return = returns.mean()
    std_return = returns.std()
    
    if std_return == 0:
        return mean_return
    
    # Z-score for confidence level
    z_score = stats.norm.ppf(1 - confidence_level)
    
    var = mean_return + z_score * std_return
    return var


def monte_carlo_var(
    returns: pd.Series,
    confidence_level: float = 0.95,
    simulations: int = 10000,
    random_seed: Optional[int] = None
) -> float:
    """
    Calculate VaR using Monte Carlo simulation.
    
    Args:
        returns: Returns series
        confidence_level: Confidence level (e.g., 0.95 for 95%)
        simulations: Number of simulations
        random_seed: Optional random seed for reproducibility (None for random)
        
    Returns:
        VaR (negative value)
    """
    if len(returns) == 0:
        return 0.0
    
    if confidence_level <= 0 or confidence_level >= 1:
        raise ValueError("confidence_level must be between 0 and 1")
    
    if simulations <= 0:
        raise ValueError("simulations must be positive")
    
    mean_return = returns.mean()
    std_return = returns.std()
    
    if std_return == 0:
        return mean_return
    
    # Generate random returns
    if random_seed is not None:
        np.random.seed(random_seed)
    simulated_returns = np.random.normal(mean_return, std_return, simulations)
    
    percentile = (1 - confidence_level) * 100
    var = np.percentile(simulated_returns, percentile)
    
    return var


def cvar(
    returns: pd.Series,
    confidence_level: float = 0.95
) -> float:
    """
    Calculate Conditional VaR (Expected Shortfall).
    
    Args:
        returns: Returns series
        confidence_level: Confidence level (e.g., 0.95 for 95%)
        
    Returns:
        CVaR (negative value)
    """
    if len(returns) == 0:
        return 0.0
    
    if confidence_level <= 0 or confidence_level >= 1:
        raise ValueError("confidence_level must be between 0 and 1")
    
    var = historical_var(returns, confidence_level)
    
    # Average of returns worse than VaR
    tail_returns = returns[returns <= var]
    
    if len(tail_returns) == 0:
        return var
    
    cvar = tail_returns.mean()
    return cvar
