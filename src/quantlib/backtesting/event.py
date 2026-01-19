"""Event system for backtesting"""

from abc import ABC
from datetime import datetime
from typing import Literal


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
        order_type: Literal['MARKET', 'LIMIT'],
        quantity: int,
        direction: Literal['BUY', 'SELL']
    ):
        """
        Initialize order event.
        
        Args:
            timestamp: Event timestamp
            symbol: Trading symbol
            order_type: Type of order (MARKET, LIMIT)
            quantity: Number of shares
            direction: Buy or sell
        """
        super().__init__(timestamp)
        self.symbol = symbol
        self.order_type = order_type
        self.quantity = quantity
        self.direction = direction
    
    def __repr__(self):
        return f"OrderEvent({self.timestamp}, {self.symbol}, {self.order_type}, {self.quantity}, {self.direction})"


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
