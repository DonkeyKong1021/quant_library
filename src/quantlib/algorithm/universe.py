"""Universe Selection Models - Define which securities to trade"""

from abc import ABC, abstractmethod
from typing import List, Set, Dict, Any
from datetime import datetime
import pandas as pd


class UniverseSelection(ABC):
    """Base class for universe selection models"""
    
    @abstractmethod
    def select(self, context: Any, time: datetime, data: Dict[str, pd.DataFrame]) -> Set[str]:
        """
        Select securities for the universe.
        
        Args:
            context: Algorithm context
            time: Current time
            data: Available market data (symbol -> DataFrame)
            
        Returns:
            Set of symbol strings to include in universe
        """
        pass
    
    def on_securities_changed(self, context: Any, added: Set[str], removed: Set[str]):
        """
        Called when securities are added/removed from universe.
        
        Args:
            context: Algorithm context
            added: Symbols added to universe
            removed: Symbols removed from universe
        """
        pass


class ManualUniverse(UniverseSelection):
    """Manual universe selection - specify symbols directly"""
    
    def __init__(self, symbols: List[str]):
        """
        Initialize manual universe.
        
        Args:
            symbols: List of symbols to include
        """
        self.symbols = set(s.upper() for s in symbols)
    
    def select(self, context: Any, time: datetime, data: Dict[str, pd.DataFrame]) -> Set[str]:
        """Return the manually specified symbols"""
        return self.symbols


class CoarseUniverse(UniverseSelection):
    """
    Coarse universe selection - filter by basic criteria.
    Simple implementation that filters by price and volume.
    """
    
    def __init__(
        self,
        min_price: float = 5.0,
        max_price: float = 1000.0,
        min_volume: float = 1000000.0,
        max_count: int = 500
    ):
        """
        Initialize coarse universe.
        
        Args:
            min_price: Minimum price filter
            max_price: Maximum price filter
            min_volume: Minimum daily volume
            max_count: Maximum number of securities to select
        """
        self.min_price = min_price
        self.max_price = max_price
        self.min_volume = min_volume
        self.max_count = max_count
    
    def select(self, context: Any, time: datetime, data: Dict[str, pd.DataFrame]) -> Set[str]:
        """
        Select securities based on price and volume filters.
        
        Args:
            context: Algorithm context
            time: Current time
            data: Available market data
            
        Returns:
            Set of filtered symbols
        """
        selected = set()
        
        for symbol, df in data.items():
            if df.empty or time not in df.index:
                continue
            
            try:
                # Get latest bar
                latest = df.loc[df.index <= time].iloc[-1]
                price = latest.get('Close', 0)
                volume = latest.get('Volume', 0)
                
                # Apply filters
                if (self.min_price <= price <= self.max_price and 
                    volume >= self.min_volume):
                    selected.add(symbol)
                
                if len(selected) >= self.max_count:
                    break
            except (IndexError, KeyError):
                continue
        
        return selected
