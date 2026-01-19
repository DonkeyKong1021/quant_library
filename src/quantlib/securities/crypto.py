"""Cryptocurrency security class"""

from typing import Optional, Dict, Any
from quantlib.securities.security import Security, SecurityType


class Crypto(Security):
    """Cryptocurrency security"""
    
    def __init__(
        self,
        base_currency: str,
        quote_currency: str = "USD",
        exchange: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize cryptocurrency.
        
        Args:
            base_currency: Cryptocurrency symbol (e.g., 'BTC', 'ETH')
            quote_currency: Quote currency (default: 'USD')
            exchange: Exchange name (optional)
            metadata: Additional metadata
        """
        # Crypto symbol format: BASE-QUOTE (e.g., BTC-USD)
        symbol = f"{base_currency.upper()}-{quote_currency.upper()}"
        super().__init__(symbol, SecurityType.CRYPTO, exchange, quote_currency, metadata=metadata)
        self.base_currency = base_currency.upper()
        self.quote_currency = quote_currency.upper()
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Crypto':
        """Create Crypto from dictionary"""
        # Parse symbol (BASE-QUOTE format)
        symbol = data['symbol']
        parts = symbol.split('-')
        if len(parts) != 2:
            raise ValueError(f"Invalid crypto symbol format: {symbol}")
        
        return cls(
            base_currency=parts[0],
            quote_currency=parts[1],
            exchange=data.get('exchange'),
            metadata=data.get('metadata', {})
        )
