"""Algorithm Framework - Orchestrates all framework components"""

from typing import Dict, List, Optional, Set, Any
from datetime import datetime
import pandas as pd

from quantlib.algorithm.universe import UniverseSelection, ManualUniverse
from quantlib.algorithm.alpha import AlphaModel, Insight
from quantlib.algorithm.portfolio import PortfolioConstructionModel, EqualWeightingPortfolio
from quantlib.algorithm.execution import ExecutionModel, ImmediateExecutionModel
from quantlib.algorithm.risk import RiskManagementModel
from quantlib.backtesting.event import OrderEvent


class AlgorithmFramework:
    """
    Modular algorithm framework that separates concerns into:
    - Universe Selection
    - Alpha Models (signal generation)
    - Portfolio Construction
    - Execution
    - Risk Management
    """
    
    def __init__(
        self,
        universe: UniverseSelection,
        alpha: AlphaModel,
        portfolio: PortfolioConstructionModel,
        execution: Optional[ExecutionModel] = None,
        risk: Optional[RiskManagementModel] = None,
    ):
        """
        Initialize algorithm framework.
        
        Args:
            universe: Universe selection model
            alpha: Alpha model for generating insights
            portfolio: Portfolio construction model
            execution: Execution model (default: ImmediateExecutionModel)
            risk: Risk management model (optional)
        """
        self.universe = universe
        self.alpha = alpha
        self.portfolio = portfolio
        self.execution = execution if execution is not None else ImmediateExecutionModel()
        self.risk = risk
        
        # Track current universe
        self.current_universe: Set[str] = set()
        self.previous_universe: Set[str] = set()
    
    def initialize(self, context: Any):
        """
        Initialize the framework.
        
        Args:
            context: Algorithm context
        """
        # Initialize components
        if hasattr(self.universe, 'initialize'):
            self.universe.initialize(context)
        if hasattr(self.alpha, 'initialize'):
            self.alpha.initialize(context)
        if hasattr(self.portfolio, 'initialize'):
            self.portfolio.initialize(context)
        if self.execution and hasattr(self.execution, 'initialize'):
            self.execution.initialize(context)
        if self.risk and hasattr(self.risk, 'initialize'):
            self.risk.initialize(context)
    
    def on_data(self, context: Any, data: Dict[str, Any]):
        """
        Main framework logic called on each bar.
        
        Args:
            context: Algorithm context
            data: Current bar data (for single-symbol) or dict of symbol->bar (for multi-symbol)
        """
        # Convert single bar to dict format if needed
        if not isinstance(data, dict) or 'Close' in data:
            # Single symbol format - convert to dict
            if hasattr(context, 'symbol'):
                symbol = context.symbol
            else:
                # Try to infer from portfolio
                positions = context.portfolio.get_positions()
                if positions:
                    symbol = list(positions.keys())[0]
                else:
                    symbol = 'SYMBOL'
            
            # Create DataFrame-like structure for this symbol
            bar_data = {symbol: pd.DataFrame([data], index=[context.current_time])}
            data = bar_data
        
        # Step 1: Universe Selection
        universe_symbols = self.universe.select(context, context.current_time, data)
        
        # Check for universe changes
        added = universe_symbols - self.current_universe
        removed = self.current_universe - universe_symbols
        
        if added or removed:
            self.previous_universe = self.current_universe.copy()
            self.current_universe = universe_symbols
            self.universe.on_securities_changed(context, added, removed)
            self.alpha.on_securities_changed(context, added, removed)
        
        # Filter data to universe
        universe_data = {symbol: df for symbol, df in data.items() if symbol in universe_symbols}
        
        if not universe_data:
            return
        
        # Step 2: Generate Alpha Insights
        insights = self.alpha.update(context, universe_data)
        
        if not insights:
            return
        
        # Step 3: Portfolio Construction
        targets = self.portfolio.create_targets(context, insights)
        
        if not targets:
            return
        
        # Step 4: Risk Management
        if self.risk:
            targets = self.risk.manage_risk(context, targets)
        
        # Step 5: Execution
        orders = self.execution.execute(context, targets)
        
        # Place orders via context
        for order in orders:
            context.place_order(order.symbol, order.quantity, order.direction)


class FrameworkAdapter:
    """
    Adapter to use traditional Strategy class within framework context.
    Allows backward compatibility and gradual migration.
    """
    
    def __init__(self, strategy):
        """
        Initialize adapter with a Strategy instance.
        
        Args:
            strategy: Strategy instance with initialize() and on_data() methods
        """
        self.strategy = strategy
        # Create simple universe from strategy's symbol usage
        self.universe = ManualUniverse([])
    
    def initialize(self, context: Any):
        """Initialize the strategy"""
        if hasattr(self.strategy, 'initialize'):
            self.strategy.initialize(context)
    
    def on_data(self, context: Any, data: Dict[str, Any]):
        """Delegate to strategy's on_data method"""
        if hasattr(self.strategy, 'on_data'):
            # Convert data format if needed
            if isinstance(data, dict) and all(isinstance(v, pd.DataFrame) for v in data.values()):
                # Multi-symbol format - strategy expects single bar
                # Use first symbol's data
                if data:
                    first_symbol = list(data.keys())[0]
                    bar = data[first_symbol].iloc[-1].to_dict()
                    self.strategy.on_data(context, bar)
            else:
                self.strategy.on_data(context, data)
