"""Value at Risk (VaR) calculations"""

import pandas as pd
import numpy as np
from scipy import stats


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
        confidence_level: Confidence level
        
    Returns:
        VaR (negative value)
    """
    if len(returns) == 0:
        return 0.0
    
    mean_return = returns.mean()
    std_return = returns.std()
    
    # Z-score for confidence level
    z_score = stats.norm.ppf(1 - confidence_level)
    
    var = mean_return + z_score * std_return
    return var


def monte_carlo_var(
    returns: pd.Series,
    confidence_level: float = 0.95,
    simulations: int = 10000
) -> float:
    """
    Calculate VaR using Monte Carlo simulation.
    
    Args:
        returns: Returns series
        confidence_level: Confidence level
        simulations: Number of simulations
        
    Returns:
        VaR (negative value)
    """
    if len(returns) == 0:
        return 0.0
    
    mean_return = returns.mean()
    std_return = returns.std()
    
    # Generate random returns
    np.random.seed(42)  # For reproducibility
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
        confidence_level: Confidence level
        
    Returns:
        CVaR (negative value)
    """
    if len(returns) == 0:
        return 0.0
    
    var = historical_var(returns, confidence_level)
    
    # Average of returns worse than VaR
    tail_returns = returns[returns <= var]
    
    if len(tail_returns) == 0:
        return var
    
    cvar = tail_returns.mean()
    return cvar
