"""Portfolio state management"""

from typing import Dict, Optional, List
from datetime import datetime
import pandas as pd
import numpy as np


class Portfolio:
    """Track portfolio state over time with comprehensive transaction and P&L tracking"""
    
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
        
        # Enhanced tracking
        self.transactions: List[Dict] = []  # List of all transactions
        self.cost_basis: Dict[str, float] = {}  # symbol -> average cost basis per share
        self.total_cost: Dict[str, float] = {}  # symbol -> total cost basis (for weighted avg calculation)
        self.realized_pnl: Dict[str, float] = {}  # symbol -> cumulative realized P&L (for closed positions)
        self.position_metadata: Dict[str, Dict] = {}  # symbol -> metadata (entry_date, last_trade_date, num_trades)
    
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
    
    def record_transaction(
        self,
        symbol: str,
        quantity: int,
        price: float,
        direction: str,
        timestamp: datetime,
        commission: float = 0.0
    ):
        """
        Record a transaction (buy or sell) and update cost basis.
        
        Args:
            symbol: Stock symbol
            quantity: Number of shares
            price: Execution price per share
            direction: 'BUY' or 'SELL'
            timestamp: Transaction timestamp
            commission: Commission paid
        """
        symbol = symbol.upper()
        direction = direction.upper()
        
        # Record transaction
        transaction = {
            'timestamp': timestamp,
            'symbol': symbol,
            'quantity': quantity,
            'price': price,
            'direction': direction,
            'commission': commission,
            'total_value': quantity * price
        }
        self.transactions.append(transaction)
        
        # Update cost basis (weighted average method)
        if direction == 'BUY':
            if symbol not in self.total_cost:
                self.total_cost[symbol] = 0.0
                self.cost_basis[symbol] = 0.0
                self.position_metadata[symbol] = {
                    'entry_date': timestamp,
                    'last_trade_date': timestamp,
                    'num_trades': 0
                }
            
            # Weighted average cost basis
            old_total_cost = self.total_cost[symbol]
            old_quantity = self.positions.get(symbol, 0)
            new_quantity = quantity
            new_cost = quantity * price + commission
            
            self.total_cost[symbol] = old_total_cost + new_cost
            new_total_quantity = old_quantity + new_quantity
            
            if new_total_quantity > 0:
                self.cost_basis[symbol] = self.total_cost[symbol] / new_total_quantity
            
            # Update metadata
            self.position_metadata[symbol]['last_trade_date'] = timestamp
            self.position_metadata[symbol]['num_trades'] += 1
            
        elif direction == 'SELL':
            if symbol not in self.total_cost:
                # Selling something we don't have (shouldn't happen, but handle gracefully)
                return
            
            current_quantity = self.positions.get(symbol, 0)
            if current_quantity > 0:
                # Calculate realized P&L for the portion being sold
                avg_cost = self.cost_basis.get(symbol, 0.0)
                realized_pnl = (price - avg_cost) * quantity - commission
                
                if symbol not in self.realized_pnl:
                    self.realized_pnl[symbol] = 0.0
                self.realized_pnl[symbol] += realized_pnl
                
                # Update cost basis (reduce total cost proportionally)
                cost_per_share = avg_cost
                cost_being_sold = cost_per_share * quantity
                self.total_cost[symbol] = max(0.0, self.total_cost[symbol] - cost_being_sold)
                
                # Update metadata
                if symbol in self.position_metadata:
                    self.position_metadata[symbol]['last_trade_date'] = timestamp
                    self.position_metadata[symbol]['num_trades'] += 1
    
    def get_cost_basis(self, symbol: str) -> float:
        """
        Get average cost basis for a position.
        
        Args:
            symbol: Stock symbol
            
        Returns:
            Average cost basis per share, or 0.0 if no position
        """
        return self.cost_basis.get(symbol.upper(), 0.0)
    
    def get_unrealized_pnl(self, current_prices: Dict[str, float]) -> Dict[str, float]:
        """
        Calculate unrealized P&L for all open positions.
        
        Args:
            current_prices: Dictionary of symbol -> current price
            
        Returns:
            Dictionary of symbol -> unrealized P&L
        """
        unrealized = {}
        for symbol in self.positions:
            symbol_upper = symbol.upper()
            quantity = self.positions[symbol]
            if quantity > 0 and symbol_upper in current_prices:
                current_price = current_prices[symbol_upper]
                cost_basis = self.cost_basis.get(symbol_upper, 0.0)
                unrealized[symbol_upper] = (current_price - cost_basis) * quantity
        
        return unrealized
    
    def get_total_unrealized_pnl(self, current_prices: Dict[str, float]) -> float:
        """
        Calculate total unrealized P&L across all positions.
        
        Args:
            current_prices: Dictionary of symbol -> current price
            
        Returns:
            Total unrealized P&L
        """
        unrealized = self.get_unrealized_pnl(current_prices)
        return sum(unrealized.values())
    
    def get_realized_pnl(self, symbol: Optional[str] = None) -> float:
        """
        Get realized P&L for a symbol or all symbols.
        
        Args:
            symbol: Stock symbol (optional, if None returns total)
            
        Returns:
            Realized P&L for symbol or total realized P&L
        """
        if symbol is None:
            return sum(self.realized_pnl.values())
        return self.realized_pnl.get(symbol.upper(), 0.0)
    
    def get_position_metrics(self, symbol: str, current_price: Optional[float] = None) -> Dict:
        """
        Get comprehensive metrics for a position.
        
        Args:
            symbol: Stock symbol
            current_price: Current price (optional, for P&L calculation)
            
        Returns:
            Dictionary with position metrics
        """
        symbol_upper = symbol.upper()
        quantity = self.positions.get(symbol_upper, 0)
        cost_basis = self.cost_basis.get(symbol_upper, 0.0)
        total_cost = self.total_cost.get(symbol_upper, 0.0)
        realized_pnl = self.realized_pnl.get(symbol_upper, 0.0)
        metadata = self.position_metadata.get(symbol_upper, {})
        
        metrics = {
            'symbol': symbol_upper,
            'quantity': quantity,
            'cost_basis': cost_basis,
            'total_cost': total_cost,
            'realized_pnl': realized_pnl,
            'entry_date': metadata.get('entry_date'),
            'last_trade_date': metadata.get('last_trade_date'),
            'num_trades': metadata.get('num_trades', 0)
        }
        
        if current_price is not None and quantity > 0:
            current_value = quantity * current_price
            unrealized_pnl = (current_price - cost_basis) * quantity
            metrics['current_price'] = current_price
            metrics['current_value'] = current_value
            metrics['unrealized_pnl'] = unrealized_pnl
            metrics['total_pnl'] = realized_pnl + unrealized_pnl
            metrics['return_pct'] = (current_price / cost_basis - 1.0) * 100.0 if cost_basis > 0 else 0.0
        
        return metrics
    
    def get_transaction_history(self, symbol: Optional[str] = None) -> pd.DataFrame:
        """
        Get transaction history as DataFrame.
        
        Args:
            symbol: Filter by symbol (optional)
            
        Returns:
            DataFrame with transaction history
        """
        if not self.transactions:
            return pd.DataFrame()
        
        df = pd.DataFrame(self.transactions)
        
        if symbol is not None:
            df = df[df['symbol'] == symbol.upper()]
        
        if not df.empty:
            df.set_index('timestamp', inplace=True)
        
        return df
    
    def get_weights(self, current_prices: Dict[str, float]) -> Dict[str, float]:
        """
        Get current portfolio weights.
        
        Args:
            current_prices: Dictionary of symbol -> current price
            
        Returns:
            Dictionary of symbol -> weight (0.0 to 1.0)
        """
        total_value = self.get_total_equity(current_prices)
        
        if total_value == 0:
            return {}
        
        weights = {}
        for symbol in self.positions:
            symbol_upper = symbol.upper()
            quantity = self.positions[symbol]
            if quantity > 0 and symbol_upper in current_prices:
                position_value = quantity * current_prices[symbol_upper]
                weights[symbol_upper] = position_value / total_value
        
        return weights
    
    def get_portfolio_stats(self, current_prices: Dict[str, float]) -> Dict:
        """
        Get comprehensive portfolio statistics.
        
        Args:
            current_prices: Dictionary of symbol -> current price
            
        Returns:
            Dictionary with portfolio statistics
        """
        from quantlib.portfolio.analytics import calculate_portfolio_metrics
        
        total_equity = self.get_total_equity(current_prices)
        weights = self.get_weights(current_prices)
        unrealized_pnl = self.get_unrealized_pnl(current_prices)
        total_unrealized_pnl = sum(unrealized_pnl.values())
        total_realized_pnl = self.get_realized_pnl()
        
        # Calculate analytics
        metrics = calculate_portfolio_metrics(self.positions, current_prices, self.cash, weights)
        
        # Position-level summary
        position_summary = []
        for symbol in self.positions:
            symbol_upper = symbol.upper()
            if self.positions[symbol] > 0:
                metrics_pos = self.get_position_metrics(symbol_upper, current_prices.get(symbol_upper))
                position_summary.append(metrics_pos)
        
        stats = {
            'total_equity': total_equity,
            'cash': self.cash,
            'cash_pct': (self.cash / total_equity * 100) if total_equity > 0 else 0.0,
            'total_realized_pnl': total_realized_pnl,
            'total_unrealized_pnl': total_unrealized_pnl,
            'total_pnl': total_realized_pnl + total_unrealized_pnl,
            'return_pct': ((total_equity / self.initial_cash) - 1.0) * 100.0 if self.initial_cash > 0 else 0.0,
            'num_positions': len([p for p in self.positions.values() if p > 0]),
            'weights': weights,
            **metrics,
            'positions': position_summary
        }
        
        return stats
    
    def apply_rebalance(
        self,
        rebalance_orders: Dict[str, float],
        current_prices: Dict[str, float],
        timestamp: datetime,
        commission: float = 0.0
    ):
        """
        Apply rebalancing orders to portfolio.
        
        Args:
            rebalance_orders: Dictionary of symbol -> dollar amount to adjust (positive = buy, negative = sell)
            current_prices: Dictionary of symbol -> current price
            timestamp: Timestamp for transactions
            commission: Commission per trade (simplified)
        """
        for symbol, dollar_amount in rebalance_orders.items():
            symbol_upper = symbol.upper()
            if dollar_amount == 0 or symbol_upper not in current_prices:
                continue
            
            current_price = current_prices[symbol_upper]
            if current_price == 0:
                continue
            
            # Calculate quantity (round to nearest integer)
            quantity = int(round(dollar_amount / current_price))
            
            if quantity == 0:
                continue
            
            # Determine direction
            if quantity > 0:
                direction = 'BUY'
            else:
                direction = 'SELL'
                quantity = abs(quantity)
            
            # Record transaction
            self.record_transaction(
                symbol_upper,
                quantity,
                current_price,
                direction,
                timestamp,
                commission
            )
            
            # Update position and cash
            if direction == 'BUY':
                self.add_position(symbol_upper, quantity)
                cost = quantity * current_price + commission
                self.update_cash(-cost)
            else:  # SELL
                self.add_position(symbol_upper, -quantity)
                proceeds = quantity * current_price - commission
                self.update_cash(proceeds)
    
    def validate_constraints(
        self,
        constraints,
        symbol: str,
        quantity: int,
        price: float,
        direction: str,
        current_prices: Dict[str, float]
    ) -> tuple:
        """
        Validate if a trade would violate constraints.
        
        Args:
            constraints: PortfolioConstraints object
            symbol: Stock symbol
            quantity: Number of shares
            price: Execution price
            direction: 'BUY' or 'SELL'
            current_prices: Current prices dictionary
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        from quantlib.portfolio.constraints import validate_trade
        
        return validate_trade(
            constraints,
            symbol,
            quantity,
            price,
            direction,
            self.positions,
            current_prices,
            self.cash
        )
