"""Risk metrics and analysis module"""

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
from quantlib.risk.monte_carlo import (
    monte_carlo_simulation,
    monte_carlo_metrics,
)
from quantlib.risk.calculator import RiskCalculator

__all__ = [
    # Performance metrics
    "sharpe_ratio",
    "sortino_ratio",
    "calmar_ratio",
    "information_ratio",
    "beta",
    "alpha",
    "jensen_alpha",
    "annualized_volatility",
    "omega_ratio",
    "tail_ratio",
    "skewness",
    "kurtosis",
    "win_rate",
    "profit_factor",
    "average_win_loss",
    # Drawdown
    "calculate_drawdown",
    "max_drawdown",
    "max_drawdown_pct",
    "drawdown_duration",
    "underwater_curve",
    "average_drawdown_duration",
    "drawdown_recovery_time",
    "ulcer_index",
    # VaR
    "historical_var",
    "parametric_var",
    "monte_carlo_var",
    "cvar",
    # Calculator
    "RiskCalculator",
    # Monte Carlo
    "monte_carlo_simulation",
    "monte_carlo_metrics",
]
