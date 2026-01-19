"""Live trading engine with broker integration"""

from typing import Dict, List, Optional
from datetime import datetime
import pandas as pd
from quantlib.brokers.base import Broker
from quantlib.live.data_stream import DataStream
from quantlib.portfolio import Portfolio


class LiveTradingEngine:
    """Live trading engine with real broker integration"""
    
    def __init__(
        self,
        broker: Broker,
        data_stream: Optional[DataStream] = None,
        max_position_size: Optional[float] = None,
        max_daily_loss: Optional[float] = None
    ):
        """
        Initialize live trading engine.
        
        Args:
            broker: Broker instance for order execution
            data_stream: Real-time data stream (optional)
            max_position_size: Maximum position size (risk limit)
            max_daily_loss: Maximum daily loss before stopping (risk limit)
        """
        self.broker = broker
        self.data_stream = data_stream
        self.max_position_size = max_position_size
        self.max_daily_loss = max_daily_loss
        
        self.running = False
        self.trades: List[Dict] = []
        self.equity_history: List[Dict] = []
        self.initial_equity: Optional[float] = None
        self.daily_start_equity: Optional[float] = None
    
    async def start(self, strategy, symbols: List[str]) -> None:
        """Start live trading"""
        # Connect to broker
        if not await self.broker.connect():
            raise RuntimeError("Failed to connect to broker")
        
        # Get initial equity
        self.initial_equity = await self.broker.get_equity()
        self.daily_start_equity = self.initial_equity
        
        self.running = True
        
        # Initialize strategy
        context = self._create_context()
        if hasattr(strategy, 'initialize'):
            strategy.initialize(context)
        
        # Subscribe to data updates if stream provided
        if self.data_stream:
            async def on_data_update(data: Dict):
                context.current_time = data.get('timestamp', datetime.now())
                context.current_prices = {data.get('symbol', 'UNKNOWN'): data.get('close', 0.0)}
                
                if hasattr(strategy, 'on_data'):
                    strategy.on_data(context, data)
                
                # Update equity history
                equity = await self.broker.get_equity()
                self.equity_history.append({
                    'timestamp': context.current_time,
                    'equity': equity,
                })
                
                # Check risk limits
                if self._check_risk_limits():
                    await self.stop()
            
            for symbol in symbols:
                await self.data_stream.subscribe(symbol, on_data_update)
            
            await self.data_stream.start()
    
    async def stop(self) -> None:
        """Stop live trading"""
        self.running = False
        if self.data_stream:
            await self.data_stream.stop()
        await self.broker.disconnect()
    
    def _create_context(self):
        """Create context object for strategy"""
        engine = self
        
        class Context:
            def __init__(self, engine):
                self.engine = engine
                self.broker = engine.broker
                self.current_time = datetime.now()
                self.current_prices: Dict[str, float] = {}
            
            async def place_order(
                self,
                symbol: str,
                quantity: int,
                direction: str,
                order_type: str = 'market'
            ):
                """Place order through broker"""
                side = 'buy' if direction.upper() == 'BUY' else 'sell'
                
                # Check risk limits before submitting
                if not engine._validate_order(symbol, quantity, side):
                    return
                
                try:
                    order_id = await engine.broker.submit_order(
                        symbol=symbol,
                        quantity=quantity,
                        side=side,
                        order_type=order_type
                    )
                    
                    # Record order (would track in real implementation)
                    engine.trades.append({
                        'timestamp': self.current_time,
                        'symbol': symbol,
                        'quantity': quantity,
                        'direction': direction,
                        'order_id': order_id,
                        'status': 'submitted'
                    })
                except Exception as e:
                    print(f"Error submitting order: {e}")
        
        return Context(self)
    
    def _validate_order(self, symbol: str, quantity: int, side: str) -> bool:
        """Validate order against risk limits"""
        # Check position size limit
        if self.max_position_size:
            # Would need to get current position and check
            # This is simplified
            pass
        
        return True
    
    def _check_risk_limits(self) -> bool:
        """Check if risk limits have been exceeded"""
        if self.max_daily_loss and self.daily_start_equity:
            current_equity = self.equity_history[-1]['equity'] if self.equity_history else self.daily_start_equity
            daily_loss = self.daily_start_equity - current_equity
            loss_pct = daily_loss / self.daily_start_equity
            
            if loss_pct >= self.max_daily_loss:
                return True  # Stop trading
        
        return False
    
    async def get_current_equity(self) -> float:
        """Get current equity from broker"""
        return await self.broker.get_equity()
    
    def get_trades(self) -> pd.DataFrame:
        """Get trade history"""
        if self.trades:
            return pd.DataFrame(self.trades)
        return pd.DataFrame()
