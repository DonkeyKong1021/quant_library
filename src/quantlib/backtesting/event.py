"""Event system for backtesting"""

from abc import ABC
from datetime import datetime
from typing import Literal, Optional
from enum import Enum


class OrderStatus(Enum):
    """Order status enumeration"""
    PENDING = "PENDING"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"


class TimeInForce(Enum):
    """Time-in-force options for orders"""
    GTC = "GTC"  # Good Till Cancelled
    DAY = "DAY"  # Day order
    IOC = "IOC"  # Immediate Or Cancel
    FOK = "FOK"  # Fill Or Kill


class Event(ABC):
    """Base class for all events"""
    
    def __init__(self, timestamp: datetime):
        """
        Initialize event.
        
        Args:
            timestamp: Event timestamp
        """
        self.timestamp = timestamp


class MarketEvent(Event):
    """Event representing new market data/bar available"""
    
    def __init__(self, timestamp: datetime):
        """
        Initialize market event.
        
        Args:
            timestamp: Event timestamp
        """
        super().__init__(timestamp)


class SignalEvent(Event):
    """Event representing a trading signal"""
    
    def __init__(
        self,
        timestamp: datetime,
        symbol: str,
        signal_type: Literal['BUY', 'SELL', 'HOLD'],
        strength: float = 1.0
    ):
        """
        Initialize signal event.
        
        Args:
            timestamp: Event timestamp
            symbol: Trading symbol
            signal_type: Type of signal (BUY, SELL, HOLD)
            strength: Signal strength (0.0 to 1.0)
        """
        super().__init__(timestamp)
        self.symbol = symbol
        self.signal_type = signal_type
        self.strength = strength
    
    def __repr__(self):
        return f"SignalEvent({self.timestamp}, {self.symbol}, {self.signal_type}, {self.strength})"


class OrderEvent(Event):
    """Event representing an order to be executed"""
    
    def __init__(
        self,
        timestamp: datetime,
        symbol: str,
        order_type: Literal['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'TRAILING_STOP'],
        quantity: int,
        direction: Literal['BUY', 'SELL'],
        limit_price: Optional[float] = None,
        stop_price: Optional[float] = None,
        trailing_amount: Optional[float] = None,
        trailing_percent: Optional[float] = None,
        time_in_force: TimeInForce = TimeInForce.GTC,
        order_id: Optional[str] = None
    ):
        """
        Initialize order event.
        
        Args:
            timestamp: Event timestamp
            symbol: Trading symbol
            order_type: Type of order (MARKET, LIMIT, STOP, STOP_LIMIT, TRAILING_STOP)
            quantity: Number of shares
            direction: Buy or sell
            limit_price: Limit price for LIMIT and STOP_LIMIT orders
            stop_price: Stop price for STOP and STOP_LIMIT orders
            trailing_amount: Trailing stop amount (dollar amount)
            trailing_percent: Trailing stop percentage (0.0 to 1.0)
            time_in_force: Time-in-force option (GTC, DAY, IOC, FOK)
            order_id: Optional order ID for tracking
        """
        super().__init__(timestamp)
        self.symbol = symbol
        self.order_type = order_type
        self.quantity = quantity
        self.direction = direction
        self.limit_price = limit_price
        self.stop_price = stop_price
        self.trailing_amount = trailing_amount
        self.trailing_percent = trailing_percent
        self.time_in_force = time_in_force
        self.order_id = order_id or f"{symbol}_{timestamp}_{order_type}"
        self.status = OrderStatus.PENDING
        self.filled_quantity = 0
        self.avg_fill_price = 0.0
        
        # Validate order parameters
        if order_type == 'LIMIT' and limit_price is None:
            raise ValueError("LIMIT orders require limit_price")
        if order_type in ('STOP', 'STOP_LIMIT') and stop_price is None:
            raise ValueError(f"{order_type} orders require stop_price")
        if order_type == 'STOP_LIMIT' and limit_price is None:
            raise ValueError("STOP_LIMIT orders require both stop_price and limit_price")
        if order_type == 'TRAILING_STOP':
            if trailing_amount is None and trailing_percent is None:
                raise ValueError("TRAILING_STOP orders require either trailing_amount or trailing_percent")
            if trailing_amount is not None and trailing_percent is not None:
                raise ValueError("TRAILING_STOP orders can use either trailing_amount OR trailing_percent, not both")
    
    def __repr__(self):
        params = f"{self.timestamp}, {self.symbol}, {self.order_type}, {self.quantity}, {self.direction}"
        if self.limit_price:
            params += f", limit={self.limit_price}"
        if self.stop_price:
            params += f", stop={self.stop_price}"
        if self.trailing_amount:
            params += f", trail_amt={self.trailing_amount}"
        if self.trailing_percent:
            params += f", trail_pct={self.trailing_percent}"
        return f"OrderEvent({params})"


class FillEvent(Event):
    """Event representing an executed order (fill)"""
    
    def __init__(
        self,
        timestamp: datetime,
        symbol: str,
        quantity: int,
        direction: Literal['BUY', 'SELL'],
        price: float,
        commission: float = 0.0
    ):
        """
        Initialize fill event.
        
        Args:
            timestamp: Event timestamp
            symbol: Trading symbol
            quantity: Number of shares
            direction: Buy or sell
            price: Execution price
            commission: Commission paid
        """
        super().__init__(timestamp)
        self.symbol = symbol
        self.quantity = quantity
        self.direction = direction
        self.price = price
        self.commission = commission
    
    def __repr__(self):
        return f"FillEvent({self.timestamp}, {self.symbol}, {self.quantity}, {self.direction}, {self.price:.2f}, {self.commission:.2f})"
