"""Order manager for tracking and executing pending orders"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime
import pandas as pd

from quantlib.backtesting.event import OrderEvent, FillEvent, OrderStatus


class OrderManager:
    """Manages pending orders and checks for execution conditions"""
    
    def __init__(self):
        """Initialize order manager"""
        self.pending_orders: Dict[str, List[OrderEvent]] = {}  # symbol -> list of orders
        self.order_history: List[OrderEvent] = []
    
    def add_order(self, order: OrderEvent):
        """Add an order to the pending orders list"""
        symbol = order.symbol.upper()
        if symbol not in self.pending_orders:
            self.pending_orders[symbol] = []
        self.pending_orders[symbol].append(order)
        self.order_history.append(order)
    
    def cancel_order(self, order_id: str) -> bool:
        """Cancel a pending order by ID"""
        for symbol, orders in self.pending_orders.items():
            for order in orders:
                if order.order_id == order_id and order.status == OrderStatus.PENDING:
                    order.status = OrderStatus.CANCELLED
                    orders.remove(order)
                    return True
        return False
    
    def check_orders(
        self,
        symbol: str,
        high: float,
        low: float,
        close: float,
        current_time: datetime
    ) -> List[FillEvent]:
        """
        Check pending orders for execution conditions.
        
        Args:
            symbol: Trading symbol
            high: High price of current bar
            low: Low price of current bar
            close: Close price of current bar
            current_time: Current timestamp
            
        Returns:
            List of FillEvent objects for orders that should be executed
        """
        symbol_upper = symbol.upper()
        if symbol_upper not in self.pending_orders:
            return []
        
        fills = []
        orders_to_remove = []
        
        for order in self.pending_orders[symbol_upper]:
            if order.status != OrderStatus.PENDING:
                orders_to_remove.append(order)
                continue
            
            # Check time-in-force expiration (DAY orders expire at end of day)
            if order.time_in_force.value == 'DAY':
                # Simple check: if order timestamp is not same day as current_time, cancel
                if order.timestamp.date() != current_time.date():
                    order.status = OrderStatus.CANCELLED
                    orders_to_remove.append(order)
                    continue
            
            fill_event = self._check_order_execution(order, high, low, close, current_time)
            if fill_event:
                fills.append(fill_event)
                if order.filled_quantity >= order.quantity:
                    order.status = OrderStatus.FILLED
                    orders_to_remove.append(order)
        
        # Remove filled/cancelled orders
        for order in orders_to_remove:
            if order in self.pending_orders[symbol_upper]:
                self.pending_orders[symbol_upper].remove(order)
        
        return fills
    
    def _check_order_execution(
        self,
        order: OrderEvent,
        high: float,
        low: float,
        close: float,
        current_time: datetime
    ) -> Optional[FillEvent]:
        """Check if an order should be executed based on price conditions"""
        
        if order.order_type == 'MARKET':
            # Market orders execute immediately at current price
            execution_price = close
            return FillEvent(
                timestamp=current_time,
                symbol=order.symbol,
                quantity=order.quantity,
                direction=order.direction,
                price=execution_price,
                commission=0.0  # Commission calculated separately
            )
        
        elif order.order_type == 'LIMIT':
            # Limit orders execute if price touches limit
            execution_price = None
            if order.direction == 'BUY' and low <= order.limit_price:
                execution_price = min(order.limit_price, close)
            elif order.direction == 'SELL' and high >= order.limit_price:
                execution_price = max(order.limit_price, close)
            
            if execution_price:
                return FillEvent(
                    timestamp=current_time,
                    symbol=order.symbol,
                    quantity=order.quantity,
                    direction=order.direction,
                    price=execution_price,
                    commission=0.0
                )
        
        elif order.order_type == 'STOP':
            # Stop orders become market orders when stop price is hit
            triggered = False
            if order.direction == 'BUY' and high >= order.stop_price:
                triggered = True
            elif order.direction == 'SELL' and low <= order.stop_price:
                triggered = True
            
            if triggered:
                # Execute as market order at stop price (or better)
                if order.direction == 'BUY':
                    execution_price = max(order.stop_price, close)
                else:
                    execution_price = min(order.stop_price, close)
                
                return FillEvent(
                    timestamp=current_time,
                    symbol=order.symbol,
                    quantity=order.quantity,
                    direction=order.direction,
                    price=execution_price,
                    commission=0.0
                )
        
        elif order.order_type == 'STOP_LIMIT':
            # Stop-limit: first stop price triggers, then limit order
            triggered = False
            if order.direction == 'BUY' and high >= order.stop_price:
                triggered = True
            elif order.direction == 'SELL' and low <= order.stop_price:
                triggered = True
            
            if triggered:
                # Now check limit price
                execution_price = None
                if order.direction == 'BUY' and low <= order.limit_price:
                    execution_price = min(order.limit_price, close)
                elif order.direction == 'SELL' and high >= order.limit_price:
                    execution_price = max(order.limit_price, close)
                
                if execution_price:
                    return FillEvent(
                        timestamp=current_time,
                        symbol=order.symbol,
                        quantity=order.quantity,
                        direction=order.direction,
                        price=execution_price,
                        commission=0.0
                    )
        
        elif order.order_type == 'TRAILING_STOP':
            # Trailing stop: update stop price as price moves favorably
            # For simplicity, we check if the trailing stop would have been hit
            # In a real implementation, we'd track the highest/lowest price since order placement
            
            # Calculate current stop price based on trailing settings
            # This is simplified - real implementation would track price movement
            if order.direction == 'BUY':
                # For buy orders, stop price trails below current price
                if order.trailing_amount:
                    stop_price = close - order.trailing_amount
                elif order.trailing_percent:
                    stop_price = close * (1 - order.trailing_percent)
                else:
                    return None
                
                if low <= stop_price:
                    execution_price = max(stop_price, close)
                    return FillEvent(
                        timestamp=current_time,
                        symbol=order.symbol,
                        quantity=order.quantity,
                        direction=order.direction,
                        price=execution_price,
                        commission=0.0
                    )
            
            else:  # SELL
                # For sell orders, stop price trails above current price
                if order.trailing_amount:
                    stop_price = close + order.trailing_amount
                elif order.trailing_percent:
                    stop_price = close * (1 + order.trailing_percent)
                else:
                    return None
                
                if high >= stop_price:
                    execution_price = min(stop_price, close)
                    return FillEvent(
                        timestamp=current_time,
                        symbol=order.symbol,
                        quantity=order.quantity,
                        direction=order.direction,
                        price=execution_price,
                        commission=0.0
                    )
        
        return None
    
    def get_pending_orders(self, symbol: Optional[str] = None) -> List[OrderEvent]:
        """Get all pending orders, optionally filtered by symbol"""
        all_orders = []
        for orders in self.pending_orders.values():
            for order in orders:
                if order.status == OrderStatus.PENDING:
                    if symbol is None or order.symbol.upper() == symbol.upper():
                        all_orders.append(order)
        return all_orders
    
    def clear(self):
        """Clear all pending orders"""
        self.pending_orders.clear()
        self.order_history.clear()
