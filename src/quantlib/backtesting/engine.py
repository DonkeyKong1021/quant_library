"""Backtesting engine"""

from typing import Dict, List, Optional
from datetime import datetime
import pandas as pd
import numpy as np
from queue import PriorityQueue

from quantlib.backtesting.event import Event, MarketEvent, SignalEvent, OrderEvent, FillEvent
from quantlib.backtesting.broker import SimulatedBroker
from quantlib.portfolio import Portfolio


class BacktestEngine:
    """Event-driven backtesting engine"""
    
    def __init__(
        self,
        initial_capital: float = 100000.0,
        commission: float = 1.0,
        slippage: float = 0.0,
        commission_type: str = 'fixed'
    ):
        """
        Initialize backtesting engine.
        
        Args:
            initial_capital: Starting capital
            commission: Commission per trade (dollars or percentage)
            slippage: Slippage as fraction
            commission_type: 'fixed' for $ per trade, 'percentage' for % of value
        """
        self.initial_capital = initial_capital
        self.broker = SimulatedBroker(
            commission=commission,
            slippage=slippage,
            commission_type=commission_type
        )
        self.portfolio = Portfolio(initial_cash=initial_capital)
        self.events = PriorityQueue()
        self.data = None
        self.strategy = None
        self.current_time = None
        self.equity_curve = []
        self.trades = []
        self.positions_history = []
    
    def _add_event(self, event: Event):
        """Add event to queue (priority by timestamp)"""
        # Use a counter to break ties when timestamps are equal
        # This prevents comparison errors between different event types
        if not hasattr(self, '_event_counter'):
            self._event_counter = 0
        self._event_counter += 1
        self.events.put((event.timestamp, self._event_counter, event))
    
    def run(
        self,
        strategy,
        data: pd.DataFrame,
        start: Optional[str] = None,
        end: Optional[str] = None,
        symbol: Optional[str] = None
    ) -> Dict:
        """
        Run backtest.
        
        Args:
            strategy: Strategy object with on_data method
            data: OHLCV DataFrame
            start: Start date (optional, uses data start if None)
            end: End date (optional, uses data end if None)
            symbol: Trading symbol (optional, extracted from trades if not provided)
            
        Returns:
            Dictionary with backtest results
        """
        self.strategy = strategy
        self.data = data.copy()
        
        # Filter data by date range
        if start:
            self.data = self.data[self.data.index >= pd.Timestamp(start)]
        if end:
            self.data = self.data[self.data.index <= pd.Timestamp(end)]
        
        if self.data.empty:
            raise ValueError("No data available for the specified date range")
        
        # Store symbol for equity calculation
        self._symbol = symbol
        
        # Reset state
        self.portfolio = Portfolio(initial_cash=self.initial_capital)
        self.equity_curve = []
        self.trades = []
        self.positions_history = []
        self._event_counter = 0  # Reset event counter for tiebreaking
        self._all_symbols = set()  # Track all symbols encountered
        
        # Initialize strategy
        if hasattr(strategy, 'initialize'):
            context = self._create_context()
            strategy.initialize(context)
        
        # Process data bar by bar
        for timestamp, bar in self.data.iterrows():
            self.current_time = timestamp
            
            # Create market event
            market_event = MarketEvent(timestamp)
            self._add_event(market_event)
            
            # Process events for this timestamp
            self._process_events()
            
            # Call strategy
            context = self._create_context()
            if hasattr(strategy, 'on_data'):
                strategy.on_data(context, bar.to_dict())
            
            # Update equity curve
            # Build current prices dict (for now, assume single symbol or use bar Close for all)
            current_prices = {}
            close_price = bar['Close']
            
            # For single symbol backtests, use the symbol
            if self._symbol:
                current_prices[self._symbol] = close_price
            else:
                # Try to infer from portfolio positions
                positions = self.portfolio.get_positions()
                if positions:
                    # Use first position's symbol
                    first_symbol = list(positions.keys())[0]
                    current_prices[first_symbol] = close_price
                else:
                    # Fallback: if no positions, still track equity with placeholder
                    # (This shouldn't happen in normal operation)
                    if self._all_symbols:
                        current_prices[list(self._all_symbols)[0]] = close_price
                    else:
                        current_prices['SYMBOL'] = close_price
            
            equity = self.portfolio.get_total_equity(current_prices)
            
            # Update portfolio history
            self.portfolio.update_equity(timestamp, current_prices)
            
            self.equity_curve.append({
                'timestamp': timestamp,
                'equity': equity,
                'cash': self.portfolio.get_cash(),
                'positions': self.portfolio.get_positions()
            })
        
        # Calculate results
        return self._calculate_results()
    
    def _create_context(self):
        """Create context object for strategy"""
        class Context:
            def __init__(self, engine):
                self.engine = engine
                self.portfolio = engine.portfolio  # Use Portfolio instead of broker
                self.current_time = engine.current_time
            
            def place_order(self, symbol: str, quantity: int, direction: str):
                """Place an order"""
                order = OrderEvent(
                    timestamp=self.current_time,
                    symbol=symbol,
                    order_type='MARKET',
                    quantity=quantity,
                    direction=direction
                )
                self.engine._add_event(order)
        
        return Context(self)
    
    def _process_events(self):
        """Process all events in queue for current timestamp"""
        while not self.events.empty():
            timestamp, counter, event = self.events.get()
            
            # Only process events up to current time
            if timestamp > self.current_time:
                self.events.put((timestamp, counter, event))
                break
            
            if isinstance(event, SignalEvent):
                # Convert signal to order
                if event.signal_type == 'BUY':
                    order = OrderEvent(
                        timestamp=event.timestamp,
                        symbol=event.symbol,
                        order_type='MARKET',
                        quantity=int(100 * event.strength),  # Scale by strength
                        direction='BUY'
                    )
                    self._add_event(order)
                elif event.signal_type == 'SELL':
                    order = OrderEvent(
                        timestamp=event.timestamp,
                        symbol=event.symbol,
                        order_type='MARKET',
                        quantity=int(100 * event.strength),
                        direction='SELL'
                    )
                    self._add_event(order)
            
            elif isinstance(event, OrderEvent):
                # Execute order
                # Get current price from data
                if self.current_time in self.data.index:
                    bar = self.data.loc[self.current_time]
                    current_price = bar['Close']
                    
                    # Calculate execution price and commission (broker is execution-only)
                    execution_price, commission = self.broker.calculate_execution(
                        event, current_price, self.current_time
                    )
                    
                    # Check if we have enough cash/positions (validation)
                    symbol_upper = event.symbol.upper()
                    quantity = event.quantity
                    
                    if event.direction == 'BUY':
                        total_cost = quantity * execution_price + commission
                        if self.portfolio.get_cash() < total_cost:
                            # Insufficient funds - skip this order
                            continue
                    else:  # SELL
                        current_position = self.portfolio.get_position(symbol_upper)
                        if current_position < quantity:
                            # Insufficient position - skip this order
                            continue
                    
                    # Create fill event
                    fill = FillEvent(
                        timestamp=self.current_time,
                        symbol=event.symbol,
                        quantity=quantity,
                        direction=event.direction,
                        price=execution_price,
                        commission=commission
                    )
                    self._add_event(fill)
            
            elif isinstance(event, FillEvent):
                # Record trade in Portfolio and trades list
                symbol_upper = event.symbol.upper()
                self._all_symbols.add(symbol_upper)
                
                # Update portfolio
                if event.direction == 'BUY':
                    cost = event.quantity * event.price + event.commission
                    self.portfolio.update_cash(-cost)
                    self.portfolio.add_position(symbol_upper, event.quantity)
                else:  # SELL
                    proceeds = event.quantity * event.price - event.commission
                    self.portfolio.update_cash(proceeds)
                    self.portfolio.add_position(symbol_upper, -event.quantity)
                
                # Record transaction in portfolio
                self.portfolio.record_transaction(
                    symbol_upper,
                    event.quantity,
                    event.price,
                    event.direction,
                    event.timestamp,
                    event.commission
                )
                
                # Record trade for results
                self.trades.append({
                    'timestamp': event.timestamp,
                    'symbol': event.symbol,
                    'quantity': event.quantity,
                    'direction': event.direction,
                    'price': event.price,
                    'commission': event.commission
                })
    
    def _calculate_results(self) -> Dict:
        """Calculate backtest results"""
        if not self.equity_curve:
            return {}
        
        equity_df = pd.DataFrame(self.equity_curve)
        equity_df.set_index('timestamp', inplace=True)
        
        # Calculate returns
        equity_series = equity_df['equity']
        returns = equity_series.pct_change().dropna()
        
        # Calculate metrics
        total_return = (equity_series.iloc[-1] / equity_series.iloc[0]) - 1
        cumulative_returns = (1 + returns).cumprod() - 1
        
        # Calculate total commission from transactions
        total_commission = sum(t['commission'] for t in self.trades)
        
        results = {
            'equity_curve': equity_series,
            'returns': returns,
            'cumulative_returns': cumulative_returns,
            'total_return': total_return,
            'trades': pd.DataFrame(self.trades) if self.trades else pd.DataFrame(),
            'positions_history': equity_df[['cash', 'positions']],
            'initial_capital': self.initial_capital,
            'final_equity': equity_series.iloc[-1],
            'total_commission': total_commission,
            'num_trades': len(self.trades),
            'portfolio': self.portfolio  # Include portfolio for advanced analytics
        }
        
        return results
    
    def get_results(self) -> Dict:
        """Get backtest results"""
        return self._calculate_results()
    
    def get_trades(self) -> pd.DataFrame:
        """Get trades DataFrame"""
        if self.trades:
            return pd.DataFrame(self.trades)
        return pd.DataFrame()
    
    def get_positions(self) -> Dict:
        """Get final positions"""
        return self.portfolio.get_positions()
