"""Simulated broker for backtesting"""

from typing import Dict, Literal, Optional, Tuple
from datetime import datetime
import pandas as pd
from quantlib.backtesting.event import FillEvent, OrderEvent


class SimulatedBroker:
    """
    Simulates broker behavior including commissions and slippage.
    Execution-only: calculates execution prices and commissions but does not maintain state.
    """
    
    def __init__(
        self,
        commission_type: Literal['fixed', 'percentage'] = 'fixed',
        commission: float = 1.0,
        slippage: float = 0.0
    ):
        """
        Initialize simulated broker.
        
        Args:
            commission_type: 'fixed' for $ per trade, 'percentage' for % of value
            commission: Commission amount (dollars or percentage)
            slippage: Slippage as fraction (e.g., 0.001 for 0.1%)
        """
        self.commission_type = commission_type
        self.commission = commission
        self.slippage = slippage
    
    def calculate_execution(
        self,
        order: OrderEvent,
        current_price: float,
        current_time: datetime
    ) -> Tuple[float, float]:
        """
        Calculate execution price and commission for an order (execution-only, no state changes).
        
        Args:
            order: Order event to execute
            current_price: Current market price
            current_time: Current timestamp (for consistency)
            
        Returns:
            Tuple of (execution_price, commission)
        """
        direction = order.direction
        
        # Apply slippage
        if direction == 'BUY':
            execution_price = current_price * (1 + self.slippage)
        else:  # SELL
            execution_price = current_price * (1 - self.slippage)
        
        # Calculate cost/value
        cost = order.quantity * execution_price
        
        # Calculate commission
        if self.commission_type == 'fixed':
            commission = self.commission
        else:  # percentage
            commission = cost * (self.commission / 100.0)
        
        return execution_price, commission
    
    def execute_order(
        self,
        order: OrderEvent,
        current_price: float,
        current_time: datetime
    ) -> Optional[FillEvent]:
        """
        Execute an order and return fill event (for backward compatibility).
        Note: This method is deprecated - use calculate_execution instead for execution-only behavior.
        
        Args:
            order: Order event to execute
            current_price: Current market price
            current_time: Current timestamp
            
        Returns:
            FillEvent with execution details
        """
        execution_price, commission = self.calculate_execution(order, current_price, current_time)
        
        return FillEvent(
            timestamp=current_time,
            symbol=order.symbol,
            quantity=order.quantity,
            direction=order.direction,
            price=execution_price,
            commission=commission
        )
