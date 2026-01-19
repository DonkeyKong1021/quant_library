"""
Unified risk metrics calculator.

Provides a comprehensive interface for calculating all risk and performance metrics.
"""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Any

from quantlib.risk.metrics import (
    sharpe_ratio,
    sortino_ratio,
    calmar_ratio,
    information_ratio,
    beta,
    alpha,
    jensen_alpha,
    annualized_volatility,
    omega_ratio,
    tail_ratio,
    skewness,
    kurtosis,
    win_rate,
    profit_factor,
    average_win_loss,
)
from quantlib.risk.drawdown import (
    calculate_drawdown,
    max_drawdown,
    max_drawdown_pct,
    drawdown_duration,
    underwater_curve,
    average_drawdown_duration,
    drawdown_recovery_time,
    ulcer_index,
)
from quantlib.risk.var import (
    historical_var,
    parametric_var,
    monte_carlo_var,
    cvar,
)


class RiskCalculator:
    """
    Unified calculator for risk and performance metrics.
    
    Provides methods to calculate comprehensive sets of metrics
    for portfolio/strategy evaluation.
    """
    
    def __init__(
        self,
        returns: pd.Series,
        equity_curve: Optional[pd.Series] = None,
        trades: Optional[pd.DataFrame] = None,
        benchmark_returns: Optional[pd.Series] = None,
        risk_free_rate: float = 0.0,
        periods: int = 252,
        var_confidence_level: float = 0.95,
        var_simulations: int = 10000,
        var_random_seed: Optional[int] = None,
    ):
        """
        Initialize RiskCalculator.
        
        Args:
            returns: Returns series (required)
            equity_curve: Equity/portfolio value over time (optional, for drawdown metrics)
            trades: DataFrame with trade data (optional, for trade statistics)
            benchmark_returns: Benchmark returns series (optional, for comparison metrics)
            risk_free_rate: Annual risk-free rate (default 0.0)
            periods: Number of periods per year (default 252 for daily)
            var_confidence_level: Confidence level for VaR calculations (default 0.95)
            var_simulations: Number of simulations for Monte Carlo VaR (default 10000)
            var_random_seed: Random seed for Monte Carlo VaR (default None)
        """
        if len(returns) == 0:
            raise ValueError("returns series cannot be empty")
        
        self.returns = returns
        self.equity_curve = equity_curve
        self.trades = trades
        self.benchmark_returns = benchmark_returns
        self.risk_free_rate = risk_free_rate
        self.periods = periods
        self.var_confidence_level = var_confidence_level
        self.var_simulations = var_simulations
        self.var_random_seed = var_random_seed
        
        # Align benchmark returns if provided
        if benchmark_returns is not None and len(benchmark_returns) > 0:
            common_index = returns.index.intersection(benchmark_returns.index)
            if len(common_index) > 0:
                self.returns_aligned = returns.loc[common_index]
                self.benchmark_returns_aligned = benchmark_returns.loc[common_index]
            else:
                self.returns_aligned = None
                self.benchmark_returns_aligned = None
        else:
            self.returns_aligned = None
            self.benchmark_returns_aligned = None
    
    def calculate_all(self) -> Dict[str, Any]:
        """
        Calculate comprehensive set of all available metrics.
        
        Returns:
            Dictionary containing all calculated metrics, organized by category
        """
        results = {}
        
        # Performance metrics
        results['performance'] = self.calculate_performance_metrics()
        
        # Drawdown metrics (if equity curve available)
        if self.equity_curve is not None:
            results['drawdown'] = self.calculate_drawdown_metrics()
        
        # VaR metrics
        results['var'] = self.calculate_var_metrics()
        
        # Trade statistics (if trades available)
        if self.trades is not None and not self.trades.empty:
            results['trades'] = self.calculate_trade_metrics()
        
        # Benchmark comparison (if benchmark available)
        if self.returns_aligned is not None:
            results['benchmark'] = self.calculate_benchmark_metrics()
        
        # Distribution statistics
        results['distribution'] = self.calculate_distribution_metrics()
        
        return results
    
    def calculate_performance_metrics(self) -> Dict[str, float]:
        """
        Calculate performance ratio metrics.
        
        Returns:
            Dictionary with performance metrics
        """
        metrics = {}
        
        try:
            metrics['sharpe_ratio'] = sharpe_ratio(
                self.returns,
                self.risk_free_rate,
                self.periods
            )
        except Exception:
            metrics['sharpe_ratio'] = 0.0
        
        try:
            metrics['sortino_ratio'] = sortino_ratio(
                self.returns,
                self.risk_free_rate,
                self.periods
            )
        except Exception:
            metrics['sortino_ratio'] = 0.0
        
        # Calmar ratio requires max drawdown
        if self.equity_curve is not None:
            try:
                max_dd_pct = max_drawdown_pct(self.equity_curve)
                if max_dd_pct != 0:
                    metrics['calmar_ratio'] = calmar_ratio(
                        self.returns,
                        abs(max_dd_pct / 100)
                    )
                else:
                    metrics['calmar_ratio'] = 0.0
            except Exception:
                metrics['calmar_ratio'] = 0.0
        
        try:
            metrics['annualized_volatility'] = annualized_volatility(
                self.returns,
                self.periods
            )
        except Exception:
            metrics['annualized_volatility'] = 0.0
        
        try:
            metrics['omega_ratio'] = omega_ratio(
                self.returns,
                self.risk_free_rate,
                self.periods
            )
        except Exception:
            metrics['omega_ratio'] = 0.0
        
        try:
            metrics['tail_ratio'] = tail_ratio(self.returns)
        except Exception:
            metrics['tail_ratio'] = 0.0
        
        return metrics
    
    def calculate_drawdown_metrics(self) -> Dict[str, Any]:
        """
        Calculate drawdown-related metrics.
        
        Returns:
            Dictionary with drawdown metrics
        """
        if self.equity_curve is None or len(self.equity_curve) == 0:
            return {}
        
        metrics = {}
        
        try:
            metrics['max_drawdown'] = float(max_drawdown(self.equity_curve))
            metrics['max_drawdown_pct'] = float(max_drawdown_pct(self.equity_curve))
        except Exception:
            metrics['max_drawdown'] = 0.0
            metrics['max_drawdown_pct'] = 0.0
        
        try:
            metrics['average_drawdown_duration'] = float(
                average_drawdown_duration(self.equity_curve)
            )
        except Exception:
            metrics['average_drawdown_duration'] = 0.0
        
        try:
            metrics['ulcer_index'] = float(ulcer_index(self.equity_curve))
        except Exception:
            metrics['ulcer_index'] = 0.0
        
        return metrics
    
    def calculate_var_metrics(self) -> Dict[str, float]:
        """
        Calculate Value at Risk metrics.
        
        Returns:
            Dictionary with VaR metrics
        """
        metrics = {}
        
        try:
            metrics['historical_var'] = float(
                historical_var(self.returns, self.var_confidence_level)
            )
        except Exception:
            metrics['historical_var'] = 0.0
        
        try:
            metrics['parametric_var'] = float(
                parametric_var(self.returns, self.var_confidence_level)
            )
        except Exception:
            metrics['parametric_var'] = 0.0
        
        try:
            metrics['monte_carlo_var'] = float(
                monte_carlo_var(
                    self.returns,
                    self.var_confidence_level,
                    self.var_simulations,
                    self.var_random_seed
                )
            )
        except Exception:
            metrics['monte_carlo_var'] = 0.0
        
        try:
            metrics['cvar'] = float(cvar(self.returns, self.var_confidence_level))
        except Exception:
            metrics['cvar'] = 0.0
        
        return metrics
    
    def calculate_trade_metrics(self) -> Dict[str, Any]:
        """
        Calculate trade statistics.
        
        Requires trades DataFrame with PnL column.
        
        Returns:
            Dictionary with trade metrics
        """
        if self.trades is None or self.trades.empty:
            return {}
        
        metrics = {}
        
        # Try to find PnL column
        pnl_column = None
        for col in ['pnl', 'PnL', 'profit_loss', 'profit', 'return']:
            if col in self.trades.columns:
                pnl_column = col
                break
        
        if pnl_column is None:
            return metrics
        
        try:
            metrics['win_rate'] = float(win_rate(self.trades, pnl_column))
        except Exception:
            metrics['win_rate'] = 0.0
        
        try:
            metrics['profit_factor'] = float(profit_factor(self.trades, pnl_column))
        except Exception:
            metrics['profit_factor'] = 0.0
        
        try:
            win_loss_stats = average_win_loss(self.trades, pnl_column)
            metrics.update(win_loss_stats)
        except Exception:
            pass
        
        try:
            metrics['num_trades'] = len(self.trades)
            metrics['total_trades'] = len(self.trades)
        except Exception:
            pass
        
        return metrics
    
    def calculate_benchmark_metrics(self) -> Dict[str, float]:
        """
        Calculate benchmark comparison metrics.
        
        Returns:
            Dictionary with benchmark comparison metrics
        """
        if self.returns_aligned is None:
            return {}
        
        metrics = {}
        
        try:
            metrics['beta'] = float(beta(
                self.returns_aligned,
                self.benchmark_returns_aligned
            ))
        except Exception:
            metrics['beta'] = 0.0
        
        try:
            metrics['alpha'] = float(alpha(
                self.returns_aligned,
                self.benchmark_returns_aligned,
                self.risk_free_rate
            ))
        except Exception:
            metrics['alpha'] = 0.0
        
        try:
            metrics['jensen_alpha'] = float(jensen_alpha(
                self.returns_aligned,
                self.benchmark_returns_aligned,
                self.risk_free_rate
            ))
        except Exception:
            metrics['jensen_alpha'] = 0.0
        
        try:
            metrics['information_ratio'] = float(information_ratio(
                self.returns_aligned,
                self.benchmark_returns_aligned
            ))
        except Exception:
            metrics['information_ratio'] = 0.0
        
        return metrics
    
    def calculate_distribution_metrics(self) -> Dict[str, float]:
        """
        Calculate return distribution statistics.
        
        Returns:
            Dictionary with distribution metrics
        """
        metrics = {}
        
        try:
            metrics['skewness'] = float(skewness(self.returns))
        except Exception:
            metrics['skewness'] = 0.0
        
        try:
            metrics['kurtosis'] = float(kurtosis(self.returns))
        except Exception:
            metrics['kurtosis'] = 0.0
        
        try:
            metrics['mean_return'] = float(self.returns.mean())
            metrics['std_return'] = float(self.returns.std())
        except Exception:
            metrics['mean_return'] = 0.0
            metrics['std_return'] = 0.0
        
        return metrics
    
    def get_flat_metrics(self) -> Dict[str, float]:
        """
        Get all metrics as a flat dictionary (for API responses).
        
        Returns:
            Flat dictionary with all metric values
        """
        all_metrics = self.calculate_all()
        flat = {}
        
        for category, metrics in all_metrics.items():
            if isinstance(metrics, dict):
                for key, value in metrics.items():
                    # Performance metrics don't get a prefix for backward compatibility
                    if category == 'performance':
                        flat[key] = value
                    else:
                        flat[f"{category}_{key}"] = value
        
        return flat
