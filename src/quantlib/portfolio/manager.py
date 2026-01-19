"""Portfolio state management"""

from typing import Dict, Optional
import pandas as pd
import numpy as np


class Portfolio:
    """Track portfolio state over time"""
    
    def __init__(self, initial_cash: float = 100000.0):
        """
        Initialize portfolio.
        
        Args:
            initial_cash: Starting cash balance
        """
        self.initial_cash = initial_cash
        self.cash = initial_cash
        self.positions: Dict[str, int] = {}  # symbol -> quantity
        self.history: list = []  # List of portfolio states over time
    
    def add_position(self, symbol: str, quantity: int):
        """
        Add to position.
        
        Args:
            symbol: Stock symbol
            quantity: Quantity to add (can be negative to reduce)
        """
        symbol = symbol.upper()
        current = self.positions.get(symbol, 0)
        new_quantity = current + quantity
        
        if new_quantity == 0:
            if symbol in self.positions:
                del self.positions[symbol]
        else:
            self.positions[symbol] = new_quantity
    
    def remove_position(self, symbol: str):
        """
        Remove position completely.
        
        Args:
            symbol: Stock symbol
        """
        symbol = symbol.upper()
        if symbol in self.positions:
            del self.positions[symbol]
    
    def update_position(self, symbol: str, quantity: int):
        """
        Set position to specific quantity.
        
        Args:
            symbol: Stock symbol
            quantity: New quantity
        """
        symbol = symbol.upper()
        if quantity == 0:
            self.remove_position(symbol)
        else:
            self.positions[symbol] = quantity
    
    def get_position(self, symbol: str) -> int:
        """
        Get current position for symbol.
        
        Args:
            symbol: Stock symbol
            
        Returns:
            Position quantity
        """
        return self.positions.get(symbol.upper(), 0)
    
    def get_positions(self) -> Dict[str, int]:
        """Get all current positions"""
        return self.positions.copy()
    
    def get_cash(self) -> float:
        """Get current cash balance"""
        return self.cash
    
    def update_cash(self, amount: float):
        """
        Update cash balance.
        
        Args:
            amount: Amount to add (negative to subtract)
        """
        self.cash += amount
    
    def get_total_equity(self, current_prices: Dict[str, float]) -> float:
        """
        Calculate total equity (cash + positions value).
        
        Args:
            current_prices: Dictionary of symbol -> current price
            
        Returns:
            Total equity
        """
        positions_value = sum(
            self.positions.get(symbol.upper(), 0) * price
            for symbol, price in current_prices.items()
        )
        return self.cash + positions_value
    
    def update_equity(self, timestamp: pd.Timestamp, current_prices: Dict[str, float]):
        """
        Record portfolio state at a timestamp.
        
        Args:
            timestamp: Timestamp
            current_prices: Current prices for all positions
        """
        equity = self.get_total_equity(current_prices)
        
        self.history.append({
            'timestamp': timestamp,
            'cash': self.cash,
            'equity': equity,
            'positions': self.positions.copy()
        })
    
    def get_equity_curve(self) -> pd.Series:
        """
        Get equity curve as pandas Series.
        
        Returns:
            Series with equity over time
        """
        if not self.history:
            return pd.Series(dtype=float)
        
        df = pd.DataFrame(self.history)
        df.set_index('timestamp', inplace=True)
        return df['equity']
    
    def get_history(self) -> pd.DataFrame:
        """
        Get full portfolio history.
        
        Returns:
            DataFrame with portfolio state over time
        """
        if not self.history:
            return pd.DataFrame()
        
        return pd.DataFrame(self.history)
