"""Base strategy class"""

from abc import ABC, abstractmethod
from typing import Dict, Any


class Strategy(ABC):
    """Abstract base class for trading strategies"""
    
    def __init__(self):
        """Initialize strategy"""
        pass
    
    @abstractmethod
    def initialize(self, context):
        """
        Initialize strategy (called once at start).
        
        Args:
            context: Context object with portfolio, data access, etc.
        """
        pass
    
    @abstractmethod
    def on_data(self, context, data: Dict[str, Any]):
        """
        Called on each bar/data point.
        
        Args:
            context: Context object
            data: Current bar data (dictionary with OHLCV values)
        """
        pass
    
    def generate_signals(self, context, data: Dict[str, Any]) -> Dict:
        """
        Generate trading signals (optional, can be called from on_data).
        
        Args:
            context: Context object
            data: Current bar data
            
        Returns:
            Dictionary with signal information
        """
        return {}
