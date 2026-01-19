"""Base security class for asset class abstraction"""

from abc import ABC
from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime


class SecurityType(Enum):
    """Security type enumeration"""
    EQUITY = "equity"
    FOREX = "forex"
    CRYPTO = "crypto"
    OPTION = "option"
    FUTURE = "future"
    INDEX = "index"
    BOND = "bond"


class Security(ABC):
    """Base class for all securities"""
    
    def __init__(
        self,
        symbol: str,
        security_type: SecurityType,
        exchange: Optional[str] = None,
        currency: str = "USD",
        lot_size: int = 1,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize security.
        
        Args:
            symbol: Trading symbol
            security_type: Type of security (SecurityType enum)
            exchange: Exchange name (e.g., 'NYSE', 'NASDAQ')
            currency: Currency code (default: 'USD')
            lot_size: Minimum trading lot size (default: 1)
            metadata: Additional metadata dictionary
        """
        self.symbol = symbol.upper()
        self.security_type = security_type
        self.exchange = exchange
        self.currency = currency.upper()
        self.lot_size = lot_size
        self.metadata = metadata or {}
    
    def __repr__(self):
        return f"{self.__class__.__name__}(symbol={self.symbol}, type={self.security_type.value})"
    
    def __eq__(self, other):
        if not isinstance(other, Security):
            return False
        return self.symbol == other.symbol and self.security_type == other.security_type
    
    def __hash__(self):
        return hash((self.symbol, self.security_type))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert security to dictionary"""
        return {
            'symbol': self.symbol,
            'security_type': self.security_type.value,
            'exchange': self.exchange,
            'currency': self.currency,
            'lot_size': self.lot_size,
            'metadata': self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Security':
        """Create security from dictionary"""
        security_type = SecurityType(data['security_type'])
        
        # Map to appropriate subclass
        if security_type == SecurityType.EQUITY:
            from quantlib.securities.equity import Equity
            return Equity.from_dict(data)
        elif security_type == SecurityType.FOREX:
            from quantlib.securities.forex import Forex
            return Forex.from_dict(data)
        elif security_type == SecurityType.CRYPTO:
            from quantlib.securities.crypto import Crypto
            return Crypto.from_dict(data)
        elif security_type == SecurityType.OPTION:
            from quantlib.securities.option import Option
            return Option.from_dict(data)
        elif security_type == SecurityType.FUTURE:
            from quantlib.securities.future import Future
            return Future.from_dict(data)
        else:
            raise ValueError(f"Unsupported security type: {security_type}")
