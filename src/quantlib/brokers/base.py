"""Base broker interface for live trading"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional
from datetime import datetime
from enum import Enum


class OrderStatus(Enum):
    """Order status enumeration"""
    PENDING = "pending"
    SUBMITTED = "submitted"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class Broker(ABC):
    """Abstract base class for broker integrations"""
    
    @abstractmethod
    async def connect(self) -> bool:
        """Connect to broker API. Returns True if successful."""
        pass
    
    @abstractmethod
    async def disconnect(self) -> None:
        """Disconnect from broker API"""
        pass
    
    @abstractmethod
    async def submit_order(
        self,
        symbol: str,
        quantity: int,
        side: str,  # 'buy' or 'sell'
        order_type: str = 'market',
        limit_price: Optional[float] = None,
        stop_price: Optional[float] = None
    ) -> str:
        """
        Submit an order to the broker.
        
        Returns:
            Order ID
        """
        pass
    
    @abstractmethod
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel an order. Returns True if successful."""
        pass
    
    @abstractmethod
    async def get_order_status(self, order_id: str) -> OrderStatus:
        """Get order status"""
        pass
    
    @abstractmethod
    async def get_positions(self) -> Dict[str, int]:
        """Get current positions. Returns dict of symbol -> quantity"""
        pass
    
    @abstractmethod
    async def get_balance(self) -> float:
        """Get account balance (cash)"""
        pass
    
    @abstractmethod
    async def get_equity(self) -> float:
        """Get total account equity (cash + positions)"""
        pass


# Alias for backward compatibility
BrokerOrderStatus = OrderStatus
