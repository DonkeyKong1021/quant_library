"""Future contract security class"""

from typing import Optional, Dict, Any
from datetime import datetime
from quantlib.securities.security import Security, SecurityType


class Future(Security):
    """Future contract security"""
    
    def __init__(
        self,
        underlying_symbol: str,
        expiry: datetime,
        exchange: Optional[str] = None,
        currency: str = "USD",
        contract_size: float = 1.0,  # Contract multiplier
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize future contract.
        
        Args:
            underlying_symbol: Underlying asset symbol (e.g., 'ES' for S&P 500)
            expiry: Expiration date
            exchange: Exchange name (e.g., 'CME')
            currency: Currency code (default: 'USD')
            contract_size: Contract size/multiplier (e.g., 50 for ES futures)
            metadata: Additional metadata
        """
        # Future symbol format: UNDERLYING_YYMMDD
        symbol = f"{underlying_symbol.upper()}_{expiry.strftime('%y%m%d')}"
        super().__init__(symbol, SecurityType.FUTURE, exchange, currency, int(contract_size), metadata)
        self.underlying_symbol = underlying_symbol.upper()
        self.expiry = expiry
        self.contract_size = contract_size
        
        if metadata:
            self.metadata.update(metadata)
        self.metadata['underlying'] = underlying_symbol
        self.metadata['expiry'] = expiry.isoformat()
        self.metadata['contract_size'] = contract_size
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Future':
        """Create Future from dictionary"""
        metadata = data.get('metadata', {})
        
        return cls(
            underlying_symbol=metadata.get('underlying', data['symbol'].split('_')[0]),
            expiry=datetime.fromisoformat(metadata.get('expiry')),
            exchange=data.get('exchange'),
            currency=data.get('currency', 'USD'),
            contract_size=metadata.get('contract_size', 1.0),
            metadata=metadata
        )
