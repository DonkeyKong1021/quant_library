"""
Monte Carlo simulation for risk analysis

Monte Carlo simulation generates multiple scenarios by sampling from historical returns
to estimate the distribution of potential outcomes.
"""

from typing import Dict, Any, Optional
import pandas as pd
import numpy as np
from scipy import stats


def monte_carlo_simulation(
    returns: pd.Series,
    n_simulations: int = 1000,
    n_periods: Optional[int] = None,
    initial_value: float = 1.0,
    random_seed: Optional[int] = None
) -> Dict[str, Any]:
    """
    Run Monte Carlo simulation on returns.
    
    Args:
        returns: Historical returns series
        n_simulations: Number of simulations to run (default: 1000)
        n_periods: Number of periods to simulate (default: length of returns)
        initial_value: Starting value (default: 1.0)
        random_seed: Random seed for reproducibility
        
    Returns:
        Dictionary with simulation results including:
        - simulations: Array of simulated paths (n_simulations x n_periods)
        - final_values: Array of final values for each simulation
        - percentiles: Dictionary with percentile values (5th, 25th, 50th, 75th, 95th)
        - statistics: Dictionary with mean, std, min, max
    """
    if len(returns) == 0:
        raise ValueError("Returns series cannot be empty")
    
    if random_seed is not None:
        np.random.seed(random_seed)
    
    n_periods = n_periods if n_periods is not None else len(returns)
    
    # Bootstrap sampling from historical returns
    returns_array = returns.values
    
    # Generate simulations
    simulations = []
    for _ in range(n_simulations):
        # Sample returns with replacement
        sampled_returns = np.random.choice(returns_array, size=n_periods, replace=True)
        
        # Calculate cumulative returns
        cumulative = (1 + sampled_returns).cumprod() * initial_value
        simulations.append(cumulative)
    
    simulations = np.array(simulations)
    final_values = simulations[:, -1]
    
    # Calculate percentiles
    percentiles = {
        'p5': float(np.percentile(final_values, 5)),
        'p25': float(np.percentile(final_values, 25)),
        'p50': float(np.percentile(final_values, 50)),
        'p75': float(np.percentile(final_values, 75)),
        'p95': float(np.percentile(final_values, 95)),
    }
    
    # Calculate statistics
    statistics = {
        'mean': float(np.mean(final_values)),
        'std': float(np.std(final_values)),
        'min': float(np.min(final_values)),
        'max': float(np.max(final_values)),
        'median': float(np.median(final_values)),
    }
    
    return {
        'simulations': simulations.tolist(),  # Convert to list for JSON serialization
        'final_values': final_values.tolist(),
        'percentiles': percentiles,
        'statistics': statistics,
        'n_simulations': n_simulations,
        'n_periods': n_periods,
        'initial_value': initial_value,
    }


def monte_carlo_metrics(
    equity_curve: pd.Series,
    n_simulations: int = 1000,
    random_seed: Optional[int] = None
) -> Dict[str, Any]:
    """
    Run Monte Carlo simulation on equity curve and calculate metrics.
    
    This function simulates multiple scenarios of the strategy's performance
    to estimate confidence intervals for various metrics.
    
    Args:
        equity_curve: Equity curve series
        n_simulations: Number of simulations (default: 1000)
        random_seed: Random seed for reproducibility
        
    Returns:
        Dictionary with Monte Carlo results for:
        - final_equity: Distribution of final equity values
        - total_return: Distribution of total returns
        - max_drawdown: Distribution of maximum drawdowns
        - sharpe_ratio: Distribution of Sharpe ratios (if returns can be calculated)
    """
    if len(equity_curve) == 0:
        raise ValueError("Equity curve cannot be empty")
    
    # Calculate returns from equity curve
    returns = equity_curve.pct_change().dropna()
    
    if len(returns) == 0:
        raise ValueError("Cannot calculate returns from equity curve")
    
    initial_value = equity_curve.iloc[0]
    
    if random_seed is not None:
        np.random.seed(random_seed)
    
    # Run simulations
    final_equities = []
    total_returns = []
    max_drawdowns = []
    sharpe_ratios = []
    
    returns_array = returns.values
    
    for _ in range(n_simulations):
        # Sample returns
        sampled_returns = np.random.choice(returns_array, size=len(returns), replace=True)
        
        # Calculate equity curve
        equity_sim = (1 + sampled_returns).cumprod() * initial_value
        
        # Calculate metrics
        final_equity = equity_sim.iloc[-1]
        total_return = (final_equity / initial_value) - 1
        
        # Calculate drawdown
        peak = equity_sim.expanding().max()
        drawdown = (equity_sim - peak) / peak
        max_drawdown = float(drawdown.min())
        
        # Calculate Sharpe ratio
        sharpe = float(np.mean(sampled_returns) / np.std(sampled_returns) * np.sqrt(252)) if np.std(sampled_returns) > 0 else 0.0
        
        final_equities.append(float(final_equity))
        total_returns.append(float(total_return))
        max_drawdowns.append(max_drawdown)
        sharpe_ratios.append(sharpe)
    
    # Calculate percentiles for each metric
    def calculate_percentiles(values):
        return {
            'p5': float(np.percentile(values, 5)),
            'p25': float(np.percentile(values, 25)),
            'p50': float(np.percentile(values, 50)),
            'p75': float(np.percentile(values, 75)),
            'p95': float(np.percentile(values, 95)),
            'mean': float(np.mean(values)),
            'std': float(np.std(values)),
        }
    
    return {
        'final_equity': calculate_percentiles(final_equities),
        'total_return': calculate_percentiles(total_returns),
        'max_drawdown': calculate_percentiles(max_drawdowns),
        'sharpe_ratio': calculate_percentiles(sharpe_ratios),
        'n_simulations': n_simulations,
        'initial_value': float(initial_value),
    }
