"""Portfolio rebalancing strategies"""

from typing import Dict, Optional
from datetime import datetime, timedelta
import pandas as pd


class Rebalancer:
    """Manage portfolio rebalancing"""
    
    def __init__(
        self,
        rebalance_frequency: Optional[str] = None,
        threshold: float = 0.05
    ):
        """
        Initialize rebalancer.
        
        Args:
            rebalance_frequency: Frequency ('daily', 'weekly', 'monthly', None for threshold-based)
            threshold: Threshold for drift-based rebalancing (if frequency is None)
        """
        self.rebalance_frequency = rebalance_frequency
        self.threshold = threshold
        self.target_allocation: Dict[str, float] = {}
        self.last_rebalance: Optional[datetime] = None
    
    def set_target_allocation(self, allocation: Dict[str, float]):
        """
        Set target allocation weights.
        
        Args:
            allocation: Dictionary of symbol -> target weight (0.0 to 1.0)
        """
        total = sum(allocation.values())
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"Target allocation weights must sum to 1.0, got {total}")
        self.target_allocation = allocation.copy()
    
    def should_rebalance(
        self,
        current_time: datetime,
        current_weights: Dict[str, float]
    ) -> bool:
        """
        Determine if portfolio should be rebalanced.
        
        Args:
            current_time: Current timestamp
            current_weights: Current portfolio weights
            
        Returns:
            True if should rebalance
        """
        if not self.target_allocation:
            return False
        
        if self.rebalance_frequency:
            # Time-based rebalancing
            if self.last_rebalance is None:
                return True
            
            if self.rebalance_frequency == 'daily':
                return (current_time - self.last_rebalance).days >= 1
            elif self.rebalance_frequency == 'weekly':
                return (current_time - self.last_rebalance).days >= 7
            elif self.rebalance_frequency == 'monthly':
                return (current_time - self.last_rebalance).days >= 30
            else:
                return False
        else:
            # Threshold-based rebalancing
            max_drift = 0.0
            for symbol in self.target_allocation:
                target = self.target_allocation[symbol]
                current = current_weights.get(symbol, 0.0)
                drift = abs(current - target)
                max_drift = max(max_drift, drift)
            
            return max_drift >= self.threshold
    
    def calculate_rebalance_orders(
        self,
        current_weights: Dict[str, float],
        portfolio_value: float
    ) -> Dict[str, float]:
        """
        Calculate orders needed to rebalance.
        
        Args:
            current_weights: Current portfolio weights
            portfolio_value: Total portfolio value
            
        Returns:
            Dictionary of symbol -> dollar amount to adjust (positive = buy, negative = sell)
        """
        if not self.target_allocation:
            return {}
        
        orders = {}
        for symbol in self.target_allocation:
            target_weight = self.target_allocation[symbol]
            current_weight = current_weights.get(symbol, 0.0)
            
            target_value = portfolio_value * target_weight
            current_value = portfolio_value * current_weight
            
            orders[symbol] = target_value - current_value
        
        return orders
    
    def mark_rebalanced(self, timestamp: datetime):
        """Mark that rebalancing occurred"""
        self.last_rebalance = timestamp
