"""Risk metrics and analysis module"""

from quantlib.risk.metrics import (
    sharpe_ratio,
    sortino_ratio,
    calmar_ratio,
    information_ratio,
    beta,
    alpha,
    jensen_alpha,
)
from quantlib.risk.drawdown import (
    calculate_drawdown,
    max_drawdown,
    max_drawdown_pct,
    drawdown_duration,
    underwater_curve,
)
from quantlib.risk.var import (
    historical_var,
    parametric_var,
    monte_carlo_var,
    cvar,
)

__all__ = [
    # Performance metrics
    "sharpe_ratio",
    "sortino_ratio",
    "calmar_ratio",
    "information_ratio",
    "beta",
    "alpha",
    "jensen_alpha",
    # Drawdown
    "calculate_drawdown",
    "max_drawdown",
    "max_drawdown_pct",
    "drawdown_duration",
    "underwater_curve",
    # VaR
    "historical_var",
    "parametric_var",
    "monte_carlo_var",
    "cvar",
]
