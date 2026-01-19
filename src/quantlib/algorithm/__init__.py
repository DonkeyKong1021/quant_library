"""Algorithm Framework - Modular architecture for building trading algorithms"""

from quantlib.algorithm.algorithm import AlgorithmFramework
from quantlib.algorithm.universe import (
    UniverseSelection,
    ManualUniverse,
    CoarseUniverse,
)
from quantlib.algorithm.alpha import (
    AlphaModel,
    Insight,
)
from quantlib.algorithm.portfolio import (
    PortfolioConstructionModel,
    EqualWeightingPortfolio,
    TargetPercentPortfolio,
)
from quantlib.algorithm.execution import (
    ExecutionModel,
    ImmediateExecutionModel,
)
from quantlib.algorithm.risk import (
    RiskManagementModel,
    MaximumDrawdownPercent,
    MaximumLeverage,
    StopLossModel,
)

__all__ = [
    "AlgorithmFramework",
    "UniverseSelection",
    "ManualUniverse",
    "CoarseUniverse",
    "AlphaModel",
    "Insight",
    "PortfolioConstructionModel",
    "EqualWeightingPortfolio",
    "TargetPercentPortfolio",
    "ExecutionModel",
    "ImmediateExecutionModel",
    "RiskManagementModel",
    "MaximumDrawdownPercent",
    "MaximumLeverage",
    "StopLossModel",
]
