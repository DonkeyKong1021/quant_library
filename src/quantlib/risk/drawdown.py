"""Drawdown calculations"""

import pandas as pd
import numpy as np


def calculate_drawdown(equity_curve: pd.Series) -> pd.Series:
    """
    Calculate running drawdown from peak.
    
    Args:
        equity_curve: Equity/portfolio value over time
        
    Returns:
        Drawdown series (negative values)
    """
    running_max = equity_curve.expanding().max()
    drawdown = equity_curve - running_max
    return drawdown


def max_drawdown(equity_curve: pd.Series) -> float:
    """
    Calculate maximum drawdown.
    
    Args:
        equity_curve: Equity/portfolio value over time
        
    Returns:
        Maximum drawdown (negative value)
    """
    drawdown = calculate_drawdown(equity_curve)
    return drawdown.min()


def max_drawdown_pct(equity_curve: pd.Series) -> float:
    """
    Calculate maximum drawdown as percentage.
    
    Args:
        equity_curve: Equity/portfolio value over time
        
    Returns:
        Maximum drawdown percentage (negative value)
    """
    if len(equity_curve) == 0:
        return 0.0
    
    max_dd = max_drawdown(equity_curve)
    peak = equity_curve.expanding().max().iloc[-1]
    
    if peak == 0:
        return 0.0
    
    return (max_dd / peak) * 100


def drawdown_duration(equity_curve: pd.Series) -> pd.Series:
    """
    Calculate duration of drawdown periods.
    
    Args:
        equity_curve: Equity/portfolio value over time
        
    Returns:
        Series with duration (in periods) for each point in drawdown
    """
    drawdown = calculate_drawdown(equity_curve)
    is_drawdown = drawdown < 0
    
    duration = pd.Series(0, index=equity_curve.index)
    current_duration = 0
    
    for i in range(len(is_drawdown)):
        if is_drawdown.iloc[i]:
            current_duration += 1
            duration.iloc[i] = current_duration
        else:
            current_duration = 0
    
    return duration


def underwater_curve(equity_curve: pd.Series) -> pd.Series:
    """
    Calculate underwater curve (drawdown from peak as percentage).
    
    Args:
        equity_curve: Equity/portfolio value over time
        
    Returns:
        Underwater curve (percentage drawdown from peak)
    """
    drawdown = calculate_drawdown(equity_curve)
    peak = equity_curve.expanding().max()
    
    # Avoid division by zero
    underwater = pd.Series(0.0, index=equity_curve.index)
    mask = peak != 0
    underwater[mask] = (drawdown[mask] / peak[mask]) * 100
    
    return underwater
