"""Option security class"""

from typing import Optional, Dict, Any
from datetime import datetime
from quantlib.securities.security import Security, SecurityType


class Option(Security):
    """Option contract security"""
    
    def __init__(
        self,
        underlying_symbol: str,
        expiry: datetime,
        strike: float,
        option_type: str,  # 'CALL' or 'PUT'
        exchange: Optional[str] = None,
        currency: str = "USD",
        contract_size: int = 100,  # Standard option contract size
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize option contract.
        
        Args:
            underlying_symbol: Underlying asset symbol (e.g., 'AAPL')
            expiry: Expiration date
            strike: Strike price
            option_type: 'CALL' or 'PUT'
            exchange: Exchange name
            currency: Currency code (default: 'USD')
            contract_size: Contract size (default: 100 shares)
            metadata: Additional metadata
        """
        # Option symbol format: UNDERLYING_YYMMDD_TYPE_STRIKE
        # Simplified format for now
        symbol = f"{underlying_symbol.upper()}_{expiry.strftime('%y%m%d')}_{option_type}_{strike}"
        super().__init__(symbol, SecurityType.OPTION, exchange, currency, contract_size, metadata)
        self.underlying_symbol = underlying_symbol.upper()
        self.expiry = expiry
        self.strike = strike
        self.option_type = option_type.upper()
        self.contract_size = contract_size
        
        if metadata:
            self.metadata.update(metadata)
        self.metadata['underlying'] = underlying_symbol
        self.metadata['expiry'] = expiry.isoformat()
        self.metadata['strike'] = strike
        self.metadata['option_type'] = option_type
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Option':
        """Create Option from dictionary"""
        metadata = data.get('metadata', {})
        
        return cls(
            underlying_symbol=metadata.get('underlying', data['symbol'].split('_')[0]),
            expiry=datetime.fromisoformat(metadata.get('expiry')),
            strike=metadata.get('strike', 0.0),
            option_type=metadata.get('option_type', 'CALL'),
            exchange=data.get('exchange'),
            currency=data.get('currency', 'USD'),
            contract_size=data.get('lot_size', 100),
            metadata=metadata
        )
