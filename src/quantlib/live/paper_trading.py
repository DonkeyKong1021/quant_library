"""Paper trading engine for simulated live trading"""

from typing import Dict, List, Optional
from datetime import datetime
import pandas as pd
from quantlib.backtesting.engine import BacktestEngine
from quantlib.backtesting.event import OrderEvent, FillEvent
from quantlib.live.data_stream import DataStream, SimulatedDataStream
from quantlib.portfolio import Portfolio


class PaperTradingEngine:
    """Paper trading engine for simulated live trading with real-time data"""
    
    def __init__(
        self,
        initial_capital: float = 100000.0,
        commission: float = 1.0,
        slippage: float = 0.0,
        data_stream: Optional[DataStream] = None
    ):
        """
        Initialize paper trading engine.
        
        Args:
            initial_capital: Starting capital
            commission: Commission per trade
            slippage: Slippage as fraction
            data_stream: Data stream instance (creates SimulatedDataStream if None)
        """
        self.initial_capital = initial_capital
        self.portfolio = Portfolio(initial_cash=initial_capital)
        self.commission = commission
        self.slippage = slippage
        self.data_stream = data_stream
        self.running = False
        self.trades: List[Dict] = []
        self.equity_history: List[Dict] = []
        self.positions: Dict[str, int] = {}
    
    async def start(
        self,
        strategy,
        symbols: List[str],
        historical_data: Optional[Dict[str, pd.DataFrame]] = None
    ) -> None:
        """
        Start paper trading.
        
        Args:
            strategy: Strategy object with initialize and on_data methods
            symbols: List of symbols to trade
            historical_data: Optional historical data for simulation (if data_stream is None)
        """
        self.running = True
        
        # Initialize data stream if not provided
        if self.data_stream is None:
            if historical_data is None:
                raise ValueError("Either data_stream or historical_data must be provided")
            self.data_stream = SimulatedDataStream(historical_data)
        
        # Initialize strategy
        context = self._create_context()
        if hasattr(strategy, 'initialize'):
            strategy.initialize(context)
        
        # Subscribe to data updates
        async def on_data_update(data: Dict):
            """Handle new data bar"""
            symbol = data.get('symbol', 'UNKNOWN')
            bar = {
                'Open': data['open'],
                'High': data['high'],
                'Low': data['low'],
                'Close': data['close'],
                'Volume': data['volume'],
            }
            
            # Update context with current symbol and data
            context.current_time = data['timestamp']
            context.symbol = symbol
            context.current_prices = {symbol: data['close']}
            
            # Call strategy
            if hasattr(strategy, 'on_data'):
                strategy.on_data(context, bar)
            
            # Update equity history
            equity = self.portfolio.get_total_equity(context.current_prices)
            self.equity_history.append({
                'timestamp': data['timestamp'],
                'equity': equity,
                'cash': self.portfolio.get_cash(),
                'positions': self.portfolio.get_positions().copy()
            })
        
        # Subscribe to all symbols
        for symbol in symbols:
            await self.data_stream.subscribe(symbol, on_data_update)
        
        # Start data stream
        await self.data_stream.start()
    
    async def stop(self) -> None:
        """Stop paper trading"""
        self.running = False
        if self.data_stream:
            await self.data_stream.stop()
    
    def _create_context(self):
        """Create context object for strategy"""
        engine = self
        
        class Context:
            def __init__(self, engine):
                self.engine = engine
                self.portfolio = engine.portfolio
                self.current_time = datetime.now()
                self.current_prices: Dict[str, float] = {}
                self.symbol = None  # Will be set dynamically for each symbol
            
            def place_order(
                self,
                symbol: str,
                quantity: int,
                direction: str,
                order_type: str = 'MARKET'
            ):
                """Place an order (simulated execution)"""
                # Create order event
                order = OrderEvent(
                    timestamp=self.current_time,
                    symbol=symbol,
                    order_type=order_type,
                    quantity=quantity,
                    direction=direction
                )
                
                # Simulate immediate execution for market orders
                if order_type == 'MARKET' and symbol in self.current_prices:
                    price = self.current_prices[symbol]
                    
                    # Apply slippage
                    if direction == 'BUY':
                        execution_price = price * (1 + engine.slippage)
                    else:
                        execution_price = price * (1 - engine.slippage)
                    
                    # Execute order
                    engine._execute_order(order, execution_price)
        
        return Context(self)
    
    def _execute_order(self, order: OrderEvent, price: float) -> None:
        """Execute an order and update portfolio"""
        symbol = order.symbol.upper()
        commission = self.commission
        
        if order.direction == 'BUY':
            cost = order.quantity * price + commission
            if self.portfolio.get_cash() >= cost:
                self.portfolio.update_cash(-cost)
                self.portfolio.add_position(symbol, order.quantity)
                
                # Record trade
                self.trades.append({
                    'timestamp': order.timestamp,
                    'symbol': symbol,
                    'quantity': order.quantity,
                    'direction': order.direction,
                    'price': price,
                    'commission': commission
                })
        else:  # SELL
            current_position = self.portfolio.get_position(symbol)
            if current_position >= order.quantity:
                proceeds = order.quantity * price - commission
                self.portfolio.update_cash(proceeds)
                self.portfolio.add_position(symbol, -order.quantity)
                
                # Record trade
                self.trades.append({
                    'timestamp': order.timestamp,
                    'symbol': symbol,
                    'quantity': order.quantity,
                    'direction': order.direction,
                    'price': price,
                    'commission': commission
                })
    
    def get_current_equity(self) -> float:
        """Get current portfolio equity"""
        if self.equity_history:
            return self.equity_history[-1]['equity']
        return self.initial_capital
    
    def get_trades(self) -> pd.DataFrame:
        """Get trade history as DataFrame"""
        if self.trades:
            return pd.DataFrame(self.trades)
        return pd.DataFrame()
    
    def get_equity_curve(self) -> pd.DataFrame:
        """Get equity curve as DataFrame"""
        if self.equity_history:
            return pd.DataFrame(self.equity_history)
        return pd.DataFrame()
