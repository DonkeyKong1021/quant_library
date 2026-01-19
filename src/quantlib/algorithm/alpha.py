"""Alpha Models - Generate trading signals/insights"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Set
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
import pandas as pd


class InsightDirection(Enum):
    """Direction of trading insight"""
    UP = "up"  # Buy/long signal
    DOWN = "down"  # Sell/short signal
    FLAT = "flat"  # No position


@dataclass
class Insight:
    """Trading insight/signal"""
    symbol: str
    direction: InsightDirection
    magnitude: float = 1.0  # Signal strength (0-1)
    confidence: float = 1.0  # Confidence level (0-1)
    source_model: str = "default"  # Which alpha model generated this
    weight: Optional[float] = None  # Optional weight for portfolio construction
    
    def __post_init__(self):
        """Validate insight data"""
        self.magnitude = max(0.0, min(1.0, self.magnitude))
        self.confidence = max(0.0, min(1.0, self.confidence))


class AlphaModel(ABC):
    """Base class for alpha models that generate trading insights"""
    
    @abstractmethod
    def update(self, context: Any, data: Dict[str, pd.DataFrame]) -> List[Insight]:
        """
        Generate insights for the current time period.
        
        Args:
            context: Algorithm context
            data: Market data for universe symbols
            
        Returns:
            List of Insight objects
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
