"""Backtesting engine"""

from typing import Dict, List, Optional
from datetime import datetime
import pandas as pd
import numpy as np
from queue import PriorityQueue

from quantlib.backtesting.event import Event, MarketEvent, SignalEvent, OrderEvent, FillEvent
from quantlib.backtesting.broker import SimulatedBroker


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
            initial_capital=initial_capital,
            commission=commission,
            slippage=slippage,
            commission_type=commission_type
        )
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
        self.broker.reset()
        self.equity_curve = []
        self.trades = []
        self.positions_history = []
        self._event_counter = 0  # Reset event counter for tiebreaking
        
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
            # Extract symbol from broker positions if not provided, or use default
            if self._symbol is None:
                # Try to get symbol from broker positions
                positions = self.broker.get_all_positions()
                if positions:
                    self._symbol = list(positions.keys())[0]
                else:
                    self._symbol = 'SYMBOL'  # Default fallback
            
            equity = self.broker.get_total_equity({self._symbol: bar['Close']})
            
            self.equity_curve.append({
                'timestamp': timestamp,
                'equity': equity,
                'cash': self.broker.get_cash(),
                'positions': self.broker.get_all_positions()
            })
        
        # Calculate results
        return self._calculate_results()
    
    def _create_context(self):
        """Create context object for strategy"""
        class Context:
            def __init__(self, engine):
                self.engine = engine
                self.portfolio = engine.broker
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
                    
                    fill = self.broker.execute_order(event, current_price, self.current_time)
                    if fill:
                        self._add_event(fill)
            
            elif isinstance(event, FillEvent):
                # Record trade
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
        
        results = {
            'equity_curve': equity_series,
            'returns': returns,
            'cumulative_returns': cumulative_returns,
            'total_return': total_return,
            'trades': pd.DataFrame(self.trades) if self.trades else pd.DataFrame(),
            'positions_history': equity_df[['cash', 'positions']],
            'initial_capital': self.initial_capital,
            'final_equity': equity_series.iloc[-1],
            'total_commission': self.broker.total_commission_paid,
            'num_trades': len(self.trades)
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
        return self.broker.get_all_positions()
