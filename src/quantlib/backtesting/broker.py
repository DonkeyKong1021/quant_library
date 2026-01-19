"""Simulated broker for backtesting"""

from typing import Dict, Literal, Optional
from datetime import datetime
import pandas as pd
from quantlib.backtesting.event import FillEvent, OrderEvent


class SimulatedBroker:
    """Simulates broker behavior including commissions and slippage"""
    
    def __init__(
        self,
        initial_capital: float = 100000.0,
        commission_type: Literal['fixed', 'percentage'] = 'fixed',
        commission: float = 1.0,
        slippage: float = 0.0
    ):
        """
        Initialize simulated broker.
        
        Args:
            initial_capital: Starting capital
            commission_type: 'fixed' for $ per trade, 'percentage' for % of value
            commission: Commission amount (dollars or percentage)
            slippage: Slippage as fraction (e.g., 0.001 for 0.1%)
        """
        self.initial_capital = initial_capital
        self.cash = initial_capital
        self.positions: Dict[str, int] = {}  # symbol -> quantity
        self.commission_type = commission_type
        self.commission = commission
        self.slippage = slippage
        self.total_commission_paid = 0.0
    
    def execute_order(
        self,
        order: OrderEvent,
        current_price: float,
        current_time: datetime
    ) -> Optional[FillEvent]:
        """
        Execute an order and return fill event.
        
        Args:
            order: Order event to execute
            current_price: Current market price
            current_time: Current timestamp
            
        Returns:
            FillEvent if order executed, None if rejected
        """
        symbol = order.symbol
        quantity = order.quantity
        direction = order.direction
        
        # Apply slippage
        if direction == 'BUY':
            execution_price = current_price * (1 + self.slippage)
        else:  # SELL
            execution_price = current_price * (1 - self.slippage)
        
        # Calculate cost/value
        cost = quantity * execution_price
        
        # Check if we have enough cash/positions
        if direction == 'BUY':
            # Calculate commission
            if self.commission_type == 'fixed':
                commission = self.commission
            else:  # percentage
                commission = cost * (self.commission / 100.0)
            
            total_cost = cost + commission
            
            if self.cash < total_cost:
                # Insufficient funds
                return None
            
            # Execute buy order
            self.cash -= total_cost
            self.positions[symbol] = self.positions.get(symbol, 0) + quantity
            self.total_commission_paid += commission
            
            return FillEvent(
                timestamp=current_time,
                symbol=symbol,
                quantity=quantity,
                direction=direction,
                price=execution_price,
                commission=commission
            )
        
        else:  # SELL
            current_position = self.positions.get(symbol, 0)
            
            if current_position < quantity:
                # Insufficient position
                return None
            
            # Calculate commission
            if self.commission_type == 'fixed':
                commission = self.commission
            else:  # percentage
                commission = cost * (self.commission / 100.0)
            
            # Execute sell order
            self.cash += (cost - commission)
            self.positions[symbol] = current_position - quantity
            if self.positions[symbol] == 0:
                del self.positions[symbol]
            self.total_commission_paid += commission
            
            return FillEvent(
                timestamp=current_time,
                symbol=symbol,
                quantity=quantity,
                direction=direction,
                price=execution_price,
                commission=commission
            )
    
    def get_position(self, symbol: str) -> int:
        """Get current position for a symbol"""
        return self.positions.get(symbol, 0)
    
    def get_cash(self) -> float:
        """Get current cash balance"""
        return self.cash
    
    def get_total_equity(self, current_prices: Dict[str, float]) -> float:
        """
        Calculate total equity (cash + positions value).
        
        Args:
            current_prices: Dictionary of symbol -> current price
            
        Returns:
            Total equity
        """
        positions_value = sum(
            self.positions.get(symbol, 0) * price
            for symbol, price in current_prices.items()
        )
        return self.cash + positions_value
    
    def get_all_positions(self) -> Dict[str, int]:
        """Get all current positions"""
        return self.positions.copy()
    
    def reset(self):
        """Reset broker to initial state"""
        self.cash = self.initial_capital
        self.positions = {}
        self.total_commission_paid = 0.0
