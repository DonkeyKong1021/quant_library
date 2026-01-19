"""Forex (currency pair) security class"""

from typing import Optional, Dict, Any
from quantlib.securities.security import Security, SecurityType


class Forex(Security):
    """Forex (foreign exchange) currency pair"""
    
    def __init__(
        self,
        base_currency: str,
        quote_currency: str,
        exchange: Optional[str] = None,
        lot_size: int = 100000,  # Standard forex lot
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize forex pair.
        
        Args:
            base_currency: Base currency (e.g., 'EUR')
            quote_currency: Quote currency (e.g., 'USD')
            exchange: Exchange name (optional, usually 'FOREX')
            lot_size: Standard lot size (default: 100,000 for forex)
            metadata: Additional metadata
        """
        # Forex symbol format: BASE/QUOTE (e.g., EUR/USD)
        symbol = f"{base_currency.upper()}/{quote_currency.upper()}"
        super().__init__(symbol, SecurityType.FOREX, exchange, quote_currency, lot_size, metadata)
        self.base_currency = base_currency.upper()
        self.quote_currency = quote_currency.upper()
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Forex':
        """Create Forex from dictionary"""
        # Parse symbol (BASE/QUOTE format)
        symbol = data['symbol']
        parts = symbol.split('/')
        if len(parts) != 2:
            raise ValueError(f"Invalid forex symbol format: {symbol}")
        
        return cls(
            base_currency=parts[0],
            quote_currency=parts[1],
            exchange=data.get('exchange'),
            lot_size=data.get('lot_size', 100000),
            metadata=data.get('metadata', {})
        )
