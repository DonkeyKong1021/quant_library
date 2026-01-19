"""Equity security class"""

from typing import Optional, Dict, Any
from quantlib.securities.security import Security, SecurityType


class Equity(Security):
    """Equity (stock) security"""
    
    def __init__(
        self,
        symbol: str,
        exchange: Optional[str] = None,
        currency: str = "USD",
        sector: Optional[str] = None,
        industry: Optional[str] = None,
        market_cap: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize equity security.
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL')
            exchange: Exchange name (e.g., 'NYSE', 'NASDAQ')
            currency: Currency code (default: 'USD')
            sector: Sector name (e.g., 'Technology')
            industry: Industry name
            market_cap: Market capitalization
            metadata: Additional metadata
        """
        super().__init__(symbol, SecurityType.EQUITY, exchange, currency, metadata=metadata)
        self.sector = sector
        self.industry = industry
        self.market_cap = market_cap
        
        if metadata:
            self.metadata.update(metadata)
        if sector:
            self.metadata['sector'] = sector
        if industry:
            self.metadata['industry'] = industry
        if market_cap:
            self.metadata['market_cap'] = market_cap
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Equity':
        """Create Equity from dictionary"""
        return cls(
            symbol=data['symbol'],
            exchange=data.get('exchange'),
            currency=data.get('currency', 'USD'),
            sector=data.get('metadata', {}).get('sector'),
            industry=data.get('metadata', {}).get('industry'),
            market_cap=data.get('metadata', {}).get('market_cap'),
            metadata=data.get('metadata', {})
        )
