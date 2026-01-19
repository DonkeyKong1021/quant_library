"""Portfolio Construction Models - Convert insights to target portfolio"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any
from quantlib.algorithm.alpha import Insight


class PortfolioConstructionModel(ABC):
    """Base class for portfolio construction models"""
    
    @abstractmethod
    def create_targets(self, context: Any, insights: List[Insight]) -> Dict[str, float]:
        """
        Create target portfolio from insights.
        
        Args:
            context: Algorithm context
            insights: List of insights from alpha models
            
        Returns:
            Dictionary mapping symbol -> target weight (0-1, where 1 = 100%)
        """
        pass


class EqualWeightingPortfolio(PortfolioConstructionModel):
    """Equal weighting - divide capital equally among all insights"""
    
    def create_targets(self, context: Any, insights: List[Insight]) -> Dict[str, float]:
        """
        Create equal-weighted targets.
        
        Args:
            context: Algorithm context
            insights: List of insights
            
        Returns:
            Dictionary of symbol -> weight (equal weights)
        """
        if not insights:
            return {}
        
        # Group insights by symbol (take most recent/strongest)
        symbol_insights = {}
        for insight in insights:
            if insight.direction.value == "flat":
                continue
            symbol = insight.symbol
            if symbol not in symbol_insights:
                symbol_insights[symbol] = insight
            else:
                # Keep insight with higher confidence
                if insight.confidence > symbol_insights[symbol].confidence:
                    symbol_insights[symbol] = insight
        
        # Equal weight each symbol
        n = len(symbol_insights)
        if n == 0:
            return {}
        
        weight = 1.0 / n
        targets = {}
        
        for symbol, insight in symbol_insights.items():
            # Apply direction
            if insight.direction.value == "down":
                targets[symbol] = -weight  # Short position
            else:
                targets[symbol] = weight  # Long position
        
        return targets


class TargetPercentPortfolio(PortfolioConstructionModel):
    """Target percent portfolio - use insight magnitude/weight as target"""
    
    def __init__(self, rebalance_period: int = 1):
        """
        Initialize target percent portfolio.
        
        Args:
            rebalance_period: How often to rebalance (in bars)
        """
        self.rebalance_period = rebalance_period
    
    def create_targets(self, context: Any, insights: List[Insight]) -> Dict[str, float]:
        """
        Create targets based on insight weights/magnitudes.
        
        Args:
            context: Algorithm context
            insights: List of insights
            
        Returns:
            Dictionary of symbol -> target weight
        """
        if not insights:
            return {}
        
        # Group insights by symbol
        symbol_insights = {}
        for insight in insights:
            if insight.direction.value == "flat":
                continue
            symbol = insight.symbol
            if symbol not in symbol_insights:
                symbol_insights[symbol] = []
            symbol_insights[symbol].append(insight)
        
        targets = {}
        
        # Normalize weights
        total_weight = sum(
            insight.weight if insight.weight is not None else insight.magnitude * insight.confidence
            for insights_list in symbol_insights.values()
            for insight in insights_list
        )
        
        if total_weight == 0:
            return {}
        
        # Create targets
        for symbol, insights_list in symbol_insights.items():
            # Sum weights for this symbol
            symbol_weight = sum(
                insight.weight if insight.weight is not None else insight.magnitude * insight.confidence
                for insight in insights_list
            )
            
            normalized_weight = symbol_weight / total_weight
            
            # Determine direction (use first insight's direction)
            direction = insights_list[0].direction
            if direction.value == "down":
                targets[symbol] = -normalized_weight
            else:
                targets[symbol] = normalized_weight
        
        return targets
