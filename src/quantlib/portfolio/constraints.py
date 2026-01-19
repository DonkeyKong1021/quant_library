"""Portfolio constraints and risk limits"""

from typing import Dict, Optional, List, Tuple
from dataclasses import dataclass
import numpy as np


@dataclass
class PortfolioConstraints:
    """
    Portfolio constraints and risk limits.
    
    Attributes:
        max_positions: Maximum number of positions (None for no limit)
        max_position_size: Maximum position size as fraction of portfolio (None for no limit)
        min_position_size: Minimum position size as fraction of portfolio (None for no limit)
        max_total_exposure: Maximum total exposure as multiple of equity (None for no limit)
        max_sector_exposure: Maximum exposure per sector as fraction of portfolio (None for no limit)
        min_cash_reserve: Minimum cash reserve as fraction of portfolio (None for no limit)
        max_leverage: Maximum leverage ratio (None for no limit)
        sectors: Dictionary mapping symbol -> sector (optional, for sector limits)
    """
    max_positions: Optional[int] = None
    max_position_size: Optional[float] = None
    min_position_size: Optional[float] = None
    max_total_exposure: Optional[float] = None
    max_sector_exposure: Optional[float] = None
    min_cash_reserve: Optional[float] = None
    max_leverage: Optional[float] = None
    sectors: Optional[Dict[str, str]] = None
    
    def validate_trade(
        self,
        symbol: str,
        quantity: int,
        price: float,
        direction: str,
        current_positions: Dict[str, int],
        current_prices: Dict[str, float],
        cash: float
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate if a trade would violate constraints.
        
        Args:
            symbol: Stock symbol
            quantity: Number of shares
            price: Execution price
            direction: 'BUY' or 'SELL'
            current_positions: Current positions dictionary
            current_prices: Current prices dictionary
            cash: Current cash balance
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        symbol_upper = symbol.upper()
        direction_upper = direction.upper()
        
        # Calculate current portfolio value
        current_portfolio_value = cash + sum(
            current_positions.get(s.upper(), 0) * p
            for s, p in current_prices.items()
        )
        
        if current_portfolio_value <= 0:
            return False, "Portfolio value must be positive"
        
        # Simulate the trade
        new_quantity = current_positions.get(symbol_upper, 0)
        if direction_upper == 'BUY':
            new_quantity += quantity
            trade_value = quantity * price
        else:  # SELL
            new_quantity -= quantity
            trade_value = quantity * price
        
        # Check if we'd exceed max positions (for new positions only)
        if self.max_positions is not None:
            current_num_positions = len([p for p in current_positions.values() if p != 0])
            if symbol_upper not in current_positions or current_positions.get(symbol_upper, 0) == 0:
                if new_quantity > 0 and current_num_positions >= self.max_positions:
                    return False, f"Would exceed maximum positions limit ({self.max_positions})"
        
        # Check position size limits
        if new_quantity > 0:  # Only check for long positions
            new_position_value = new_quantity * price
            new_position_weight = new_position_value / current_portfolio_value
            
            if self.max_position_size is not None:
                if new_position_weight > self.max_position_size:
                    return False, f"Position size ({new_position_weight:.2%}) would exceed maximum ({self.max_position_size:.2%})"
            
            if self.min_position_size is not None:
                if 0 < new_position_weight < self.min_position_size:
                    return False, f"Position size ({new_position_weight:.2%}) is below minimum ({self.min_position_size:.2%})"
        
        # Check cash reserve (for buy orders)
        if direction_upper == 'BUY':
            total_cost = trade_value  # Simplified, should include commission
            new_cash = cash - total_cost
            
            if self.min_cash_reserve is not None:
                min_cash_required = current_portfolio_value * self.min_cash_reserve
                if new_cash < min_cash_required:
                    return False, f"Trade would violate minimum cash reserve ({self.min_cash_reserve:.2%})"
            
            # Check if we have enough cash
            if new_cash < 0:
                return False, "Insufficient cash"
        
        # Check leverage (for buy orders)
        if direction_upper == 'BUY' and self.max_leverage is not None:
            # Calculate new gross exposure
            new_long_exposure = sum(
                (current_positions.get(s.upper(), 0) + (quantity if s.upper() == symbol_upper else 0)) * p
                for s, p in current_prices.items()
            )
            
            new_equity = current_portfolio_value - trade_value  # Simplified
            new_leverage = new_long_exposure / new_equity if new_equity > 0 else 0.0
            
            if new_leverage > self.max_leverage:
                return False, f"Trade would exceed maximum leverage ({self.max_leverage:.2f})"
        
        # Check sector exposure (if sectors are defined)
        if self.sectors is not None and self.max_sector_exposure is not None:
            if symbol_upper in self.sectors:
                sector = self.sectors[symbol_upper]
                
                # Calculate current sector exposure
                sector_exposure = sum(
                    current_positions.get(s.upper(), 0) * current_prices.get(s.upper(), 0)
                    for s in self.sectors
                    if self.sectors.get(s.upper()) == sector
                )
                
                # Add new position if it's a buy
                if direction_upper == 'BUY':
                    sector_exposure += trade_value
                
                sector_weight = sector_exposure / current_portfolio_value
                
                if sector_weight > self.max_sector_exposure:
                    return False, f"Sector exposure ({sector_weight:.2%}) would exceed maximum ({self.max_sector_exposure:.2%})"
        
        # Check total exposure
        if self.max_total_exposure is not None:
            # Calculate new gross exposure
            new_gross_exposure = sum(
                abs((current_positions.get(s.upper(), 0) + (quantity if s.upper() == symbol_upper and direction_upper == 'BUY' else 0))) * p
                for s, p in current_prices.items()
            )
            
            exposure_ratio = new_gross_exposure / current_portfolio_value if current_portfolio_value > 0 else 0.0
            
            if exposure_ratio > self.max_total_exposure:
                return False, f"Total exposure ({exposure_ratio:.2f}x) would exceed maximum ({self.max_total_exposure:.2f}x)"
        
        return True, None
    
    def check_position_limit(self, current_positions: Dict[str, int], new_symbol: str) -> Tuple[bool, Optional[str]]:
        """
        Check if adding a new position would exceed position limit.
        
        Args:
            current_positions: Current positions dictionary
            new_symbol: Symbol of new position
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if self.max_positions is None:
            return True, None
        
        current_num_positions = len([p for p in current_positions.values() if p != 0])
        new_symbol_upper = new_symbol.upper()
        
        # Only check if this is a new position
        if new_symbol_upper not in current_positions or current_positions.get(new_symbol_upper, 0) == 0:
            if current_num_positions >= self.max_positions:
                return False, f"Maximum positions limit ({self.max_positions}) reached"
        
        return True, None
    
    def check_exposure_limit(
        self,
        positions: Dict[str, int],
        current_prices: Dict[str, float],
        cash: float
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if current portfolio violates exposure limits.
        
        Args:
            positions: Current positions dictionary
            current_prices: Current prices dictionary
            cash: Current cash balance
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        portfolio_value = cash + sum(
            positions.get(symbol.upper(), 0) * price
            for symbol, price in current_prices.items()
        )
        
        if portfolio_value <= 0:
            return False, "Portfolio value must be positive"
        
        # Check leverage
        if self.max_leverage is not None:
            gross_exposure = sum(
                abs(positions.get(symbol.upper(), 0)) * price
                for symbol, price in current_prices.items()
            )
            leverage = gross_exposure / portfolio_value if portfolio_value > 0 else 0.0
            
            if leverage > self.max_leverage:
                return False, f"Leverage ({leverage:.2f}) exceeds maximum ({self.max_leverage:.2f})"
        
        # Check cash reserve
        if self.min_cash_reserve is not None:
            cash_pct = cash / portfolio_value if portfolio_value > 0 else 0.0
            min_cash = self.min_cash_reserve
            
            if cash_pct < min_cash:
                return False, f"Cash reserve ({cash_pct:.2%}) is below minimum ({min_cash:.2%})"
        
        # Check position sizes
        if self.max_position_size is not None:
            for symbol, quantity in positions.items():
                if quantity != 0 and symbol.upper() in current_prices:
                    position_value = quantity * current_prices[symbol.upper()]
                    position_weight = position_value / portfolio_value
                    
                    if position_weight > self.max_position_size:
                        return False, f"Position {symbol} weight ({position_weight:.2%}) exceeds maximum ({self.max_position_size:.2%})"
        
        # Check sector exposure
        if self.sectors is not None and self.max_sector_exposure is not None:
            sector_exposures = {}
            
            for symbol, quantity in positions.items():
                if quantity != 0 and symbol.upper() in current_prices:
                    sector = self.sectors.get(symbol.upper())
                    if sector:
                        position_value = quantity * current_prices[symbol.upper()]
                        sector_exposures[sector] = sector_exposures.get(sector, 0) + position_value
            
            for sector, exposure in sector_exposures.items():
                sector_weight = exposure / portfolio_value if portfolio_value > 0 else 0.0
                if sector_weight > self.max_sector_exposure:
                    return False, f"Sector {sector} exposure ({sector_weight:.2%}) exceeds maximum ({self.max_sector_exposure:.2%})"
        
        return True, None


def validate_trade(
    constraints: PortfolioConstraints,
    symbol: str,
    quantity: int,
    price: float,
    direction: str,
    current_positions: Dict[str, int],
    current_prices: Dict[str, float],
    cash: float
) -> Tuple[bool, Optional[str]]:
    """
    Convenience function to validate a trade against constraints.
    
    Args:
        constraints: PortfolioConstraints object
        symbol: Stock symbol
        quantity: Number of shares
        price: Execution price
        direction: 'BUY' or 'SELL'
        current_positions: Current positions dictionary
        current_prices: Current prices dictionary
        cash: Current cash balance
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    return constraints.validate_trade(
        symbol, quantity, price, direction,
        current_positions, current_prices, cash
    )