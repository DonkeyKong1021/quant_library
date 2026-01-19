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


def average_drawdown_duration(equity_curve: pd.Series) -> float:
    """
    Calculate average drawdown duration (in periods).
    
    Args:
        equity_curve: Equity/portfolio value over time
        
    Returns:
        Average drawdown duration in periods
    """
    if len(equity_curve) == 0:
        return 0.0
    
    duration_series = drawdown_duration(equity_curve)
    drawdown_periods = duration_series[duration_series > 0]
    
    if len(drawdown_periods) == 0:
        return 0.0
    
    # Get maximum duration for each drawdown period
    # Each drawdown period starts at 1 and increments
    # We need to find the peaks (max duration of each drawdown)
    max_durations = []
    current_max = 0
    
    for i in range(len(duration_series)):
        if duration_series.iloc[i] > 0:
            if duration_series.iloc[i] > current_max:
                current_max = duration_series.iloc[i]
        else:
            if current_max > 0:
                max_durations.append(current_max)
                current_max = 0
    
    # Add the last drawdown if we ended in a drawdown
    if current_max > 0:
        max_durations.append(current_max)
    
    if len(max_durations) == 0:
        return 0.0
    
    return np.mean(max_durations)


def drawdown_recovery_time(equity_curve: pd.Series) -> pd.Series:
    """
    Calculate time to recover from each drawdown (in periods).
    
    Args:
        equity_curve: Equity/portfolio value over time
        
    Returns:
        Series with recovery time for each point (0 if not recovered)
    """
    if len(equity_curve) == 0:
        return pd.Series(dtype=float)
    
    drawdown = calculate_drawdown(equity_curve)
    running_max = equity_curve.expanding().max()
    recovery_time = pd.Series(0, index=equity_curve.index)
    
    # For each point in drawdown, find when it recovers
    for i in range(len(equity_curve)):
        if drawdown.iloc[i] < 0:
            # Find when equity recovers to the peak value at this point
            peak_value = running_max.iloc[i]
            future_equity = equity_curve.iloc[i:]
            
            recovery_idx = (future_equity >= peak_value).idxmax() if len(future_equity) > 0 else None
            
            if recovery_idx is not None and equity_curve.index.get_loc(recovery_idx) >= i:
                recovery_time.iloc[i] = equity_curve.index.get_loc(recovery_idx) - i
            else:
                # Not recovered within the data range
                recovery_time.iloc[i] = len(equity_curve) - i
    
    return recovery_time


def ulcer_index(equity_curve: pd.Series) -> float:
    """
    Calculate Ulcer Index.
    
    Ulcer Index measures the depth and duration of drawdowns.
    It is the square root of the average of squared percentage drawdowns.
    Lower values indicate better risk-adjusted performance.
    
    Args:
        equity_curve: Equity/portfolio value over time
        
    Returns:
        Ulcer Index
    """
    if len(equity_curve) == 0:
        return 0.0
    
    underwater = underwater_curve(equity_curve)
    
    # Square the underwater values (they're already negative percentages)
    squared_underwater = underwater ** 2
    
    # Average of squared drawdowns
    avg_squared_dd = squared_underwater.mean()
    
    # Square root to get Ulcer Index
    ulcer = np.sqrt(avg_squared_dd)
    
    return ulcer
