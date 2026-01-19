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
    
    def rebalance_portfolio(
        self,
        portfolio,
        current_prices: Dict[str, float],
        current_time: datetime,
        constraints: Optional = None,
        commission: float = 0.0
    ) -> bool:
        """
        Rebalance portfolio if needed.
        
        Args:
            portfolio: Portfolio object
            current_prices: Dictionary of symbol -> current price
            current_time: Current timestamp
            constraints: Optional PortfolioConstraints object
            commission: Commission per trade
            
        Returns:
            True if rebalancing occurred, False otherwise
        """
        # Get current weights
        current_weights = portfolio.get_weights(current_prices)
        portfolio_value = portfolio.get_total_equity(current_prices)
        
        # Check if we should rebalance
        if not self.should_rebalance(current_time, current_weights):
            return False
        
        # Calculate rebalance orders
        orders = self.calculate_rebalance_orders(current_weights, portfolio_value)
        
        # Apply constraints if provided
        if constraints:
            # Filter orders to respect constraints
            filtered_orders = {}
            for symbol, dollar_amount in orders.items():
                if dollar_amount == 0:
                    continue
                
                # Determine direction and quantity
                direction = 'BUY' if dollar_amount > 0 else 'SELL'
                quantity = abs(dollar_amount) / current_prices.get(symbol.upper(), 1.0)
                
                # Validate trade
                is_valid, error = constraints.validate_trade(
                    symbol,
                    int(quantity),
                    current_prices.get(symbol.upper(), 0.0),
                    direction,
                    portfolio.positions,
                    current_prices,
                    portfolio.cash
                )
                
                if is_valid:
                    filtered_orders[symbol] = dollar_amount
            orders = filtered_orders
        
        # Apply rebalancing
        if orders:
            portfolio.apply_rebalance(orders, current_prices, current_time, commission)
            self.mark_rebalanced(current_time)
            return True
        
        return False
    
    def calculate_rebalance_orders_with_costs(
        self,
        current_weights: Dict[str, float],
        portfolio_value: float,
        current_prices: Dict[str, float],
        transaction_cost_pct: float = 0.0
    ) -> Dict[str, float]:
        """
        Calculate rebalance orders with transaction cost awareness.
        Adjusts target to account for estimated transaction costs.
        
        Args:
            current_weights: Current portfolio weights
            portfolio_value: Total portfolio value
            current_prices: Current prices dictionary
            transaction_cost_pct: Estimated transaction cost as percentage
            
        Returns:
            Dictionary of symbol -> dollar amount to adjust
        """
        orders = self.calculate_rebalance_orders(current_weights, portfolio_value)
        
        if transaction_cost_pct > 0:
            # Adjust orders to account for transaction costs
            # For small adjustments, skip to avoid costs exceeding benefit
            adjusted_orders = {}
            for symbol, dollar_amount in orders.items():
                abs_amount = abs(dollar_amount)
                estimated_cost = abs_amount * transaction_cost_pct
                
                # Only rebalance if adjustment is significant relative to cost
                if abs_amount > estimated_cost * 2:  # At least 2x cost
                    adjusted_orders[symbol] = dollar_amount
            
            orders = adjusted_orders
        
        return orders
