"""Algorithm runner for deployed algorithms"""

from typing import Dict, Optional, Callable
from datetime import datetime
import asyncio
from quantlib.backtesting.engine import BacktestEngine
from quantlib.live.paper_trading import PaperTradingEngine
from quantlib.live.live_trading import LiveTradingEngine


class AlgorithmRunner:
    """Manages running deployed algorithms"""
    
    def __init__(
        self,
        algorithm_id: str,
        algorithm_code: str,
        mode: str = 'paper',  # 'paper', 'live', 'backtest'
        config: Optional[Dict] = None
    ):
        """
        Initialize algorithm runner.
        
        Args:
            algorithm_id: Algorithm identifier
            algorithm_code: Python code for the algorithm
            mode: Running mode ('paper', 'live', 'backtest')
            config: Configuration dictionary
        """
        self.algorithm_id = algorithm_id
        self.algorithm_code = algorithm_code
        self.mode = mode
        self.config = config or {}
        
        self.running = False
        self.engine = None
        self.performance_log: List[Dict] = []
        self.error_log: List[Dict] = []
    
    async def start(self) -> None:
        """Start running the algorithm"""
        # Compile and load algorithm code
        algorithm = self._load_algorithm()
        
        if self.mode == 'backtest':
            # Run backtest
            engine = BacktestEngine(
                initial_capital=self.config.get('initial_capital', 100000),
                commission=self.config.get('commission', 1.0),
                slippage=self.config.get('slippage', 0.0)
            )
            # Would run backtest here
            self.engine = engine
        
        elif self.mode == 'paper':
            engine = PaperTradingEngine(
                initial_capital=self.config.get('initial_capital', 100000),
                commission=self.config.get('commission', 1.0),
                slippage=self.config.get('slippage', 0.0)
            )
            symbols = self.config.get('symbols', [])
            await engine.start(algorithm, symbols)
            self.engine = engine
        
        elif self.mode == 'live':
            from quantlib.brokers.base import Broker
            broker = self.config.get('broker')  # Should be Broker instance
            if not broker:
                raise ValueError("Live mode requires broker instance")
            
            engine = LiveTradingEngine(
                broker=broker,
                max_position_size=self.config.get('max_position_size'),
                max_daily_loss=self.config.get('max_daily_loss')
            )
            symbols = self.config.get('symbols', [])
            await engine.start(algorithm, symbols)
            self.engine = engine
        
        self.running = True
    
    async def stop(self) -> None:
        """Stop running the algorithm"""
        self.running = False
        
        if self.engine:
            if hasattr(self.engine, 'stop'):
                await self.engine.stop()
            elif hasattr(self.engine, 'disconnect'):
                await self.engine.disconnect()
    
    def _load_algorithm(self):
        """Load algorithm from code string"""
        # In a real implementation, would safely compile and execute code
        # This is a stub - would use exec() or importlib in practice
        # with proper sandboxing/security
        namespace = {}
        try:
            exec(self.algorithm_code, namespace)
            # Assume algorithm class is defined in the code
            # This is simplified - real implementation would be more robust
            return namespace.get('Algorithm') or namespace.get('Strategy')
        except Exception as e:
            self.error_log.append({
                'timestamp': datetime.now(),
                'error': str(e),
                'type': 'load_error'
            })
            raise
    
    def get_performance_metrics(self) -> Dict:
        """Get current performance metrics"""
        if not self.engine:
            return {}
        
        metrics = {}
        
        if hasattr(self.engine, 'get_current_equity'):
            metrics['current_equity'] = self.engine.get_current_equity()
        
        if hasattr(self.engine, 'get_trades'):
            trades = self.engine.get_trades()
            metrics['num_trades'] = len(trades) if not trades.empty else 0
        
        return metrics
    
    def get_logs(self, log_type: str = 'performance') -> List[Dict]:
        """Get logs (performance or errors)"""
        if log_type == 'performance':
            return self.performance_log
        elif log_type == 'error':
            return self.error_log
        return []
