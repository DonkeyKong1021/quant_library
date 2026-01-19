"""Execution Models - Define how to execute portfolio targets"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List
from quantlib.backtesting.event import OrderEvent
from datetime import datetime


class ExecutionModel(ABC):
    """Base class for execution models"""
    
    @abstractmethod
    def execute(self, context: Any, targets: Dict[str, float]) -> List[OrderEvent]:
        """
        Generate orders to execute portfolio targets.
        
        Args:
            context: Algorithm context
            targets: Dictionary of symbol -> target weight
            
        Returns:
            List of OrderEvent objects
        """
        pass


class ImmediateExecutionModel(ExecutionModel):
    """Immediate execution - execute all targets immediately at market price"""
    
    def execute(self, context: Any, targets: Dict[str, float]) -> List[OrderEvent]:
        """
        Generate market orders to immediately achieve targets.
        
        Args:
            context: Algorithm context
            targets: Dictionary of symbol -> target weight
            
        Returns:
            List of OrderEvent objects
        """
        orders = []
        portfolio = context.portfolio
        current_time = context.current_time
        
        # Get current portfolio value
        current_prices = getattr(context, 'current_prices', {})
        if not current_prices:
            return orders
        
        total_equity = portfolio.get_total_equity(current_prices)
        if total_equity <= 0:
            return orders
        
        # Get current positions
        current_positions = portfolio.get_positions()
        
        for symbol, target_weight in targets.items():
            if symbol not in current_prices:
                continue
            
            price = current_prices[symbol]
            if price <= 0:
                continue
            
            # Calculate target value (absolute value for position sizing)
            target_value = abs(target_weight) * total_equity
            target_shares = int(target_value / price)
            
            # Get current position
            current_shares = current_positions.get(symbol, 0)
            
            # For negative weights (short positions), use negative shares
            if target_weight < 0:
                target_shares = -target_shares
            
            # Calculate order quantity
            order_qty = target_shares - current_shares
            
            if order_qty == 0:
                continue
            
            # Create order
            direction = 'BUY' if order_qty > 0 else 'SELL'
            quantity = abs(order_qty)
            
            order = OrderEvent(
                timestamp=current_time,
                symbol=symbol,
                order_type='MARKET',
                quantity=quantity,
                direction=direction
            )
            orders.append(order)
        
        return orders
