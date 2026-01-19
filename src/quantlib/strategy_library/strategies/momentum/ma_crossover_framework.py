"""Moving Average Crossover Strategy using Algorithm Framework"""

from quantlib.algorithm import (
    AlgorithmFramework,
    ManualUniverse,
    AlphaModel,
    Insight,
    InsightDirection,
    EqualWeightingPortfolio,
    ImmediateExecutionModel,
)
from quantlib.indicators import sma
import pandas as pd
from typing import Dict, List, Any


class MovingAverageAlpha(AlphaModel):
    """Alpha model for moving average crossover signals"""
    
    def __init__(self, short_window: int = 20, long_window: int = 50):
        self.short_window = short_window
        self.long_window = long_window
        self.price_history: Dict[str, List[float]] = {}
    
    def update(self, context: Any, data: Dict[str, pd.DataFrame]) -> List[Insight]:
        """Generate insights based on moving average crossover"""
        insights = []
        
        for symbol, df in data.items():
            if df.empty:
                continue
            
            # Get latest close price
            latest_bar = df.iloc[-1]
            close_price = latest_bar['Close']
            
            # Track price history
            if symbol not in self.price_history:
                self.price_history[symbol] = []
            self.price_history[symbol].append(close_price)
            
            prices = self.price_history[symbol]
            
            if len(prices) < self.long_window:
                continue
            
            # Calculate moving averages
            prices_series = pd.Series(prices)
            short_ma = sma(prices_series, self.short_window)
            long_ma = sma(prices_series, self.long_window)
            
            if len(short_ma.dropna()) < 2 or len(long_ma.dropna()) < 2:
                continue
            
            short_ma_current = short_ma.dropna().iloc[-1]
            long_ma_current = long_ma.dropna().iloc[-1]
            short_ma_prev = short_ma.dropna().iloc[-2]
            long_ma_prev = long_ma.dropna().iloc[-2]
            
            # Generate insight on crossover
            if short_ma_prev <= long_ma_prev and short_ma_current > long_ma_current:
                # Golden cross - bullish signal
                insights.append(Insight(
                    symbol=symbol,
                    direction=InsightDirection.UP,
                    magnitude=1.0,
                    confidence=1.0,
                    source_model="MovingAverageAlpha"
                ))
            elif short_ma_prev >= long_ma_prev and short_ma_current < long_ma_current:
                # Death cross - bearish signal (or flat)
                insights.append(Insight(
                    symbol=symbol,
                    direction=InsightDirection.FLAT,
                    magnitude=1.0,
                    confidence=1.0,
                    source_model="MovingAverageAlpha"
                ))
        
        return insights
    
    def on_securities_changed(self, context: Any, added: set, removed: set):
        """Handle universe changes"""
        for symbol in removed:
            if symbol in self.price_history:
                del self.price_history[symbol]


def create_strategy(params: Dict[str, Any]):
    """Factory function to create strategy instance"""
    short_window = params.get('short_window', 20)
    long_window = params.get('long_window', 50)
    
    # For single symbol strategies, universe will be set by backtest
    # This is a placeholder - in practice, you'd pass the symbol
    universe = ManualUniverse(['SYMBOL'])  # Will be overridden in backtest
    alpha = MovingAverageAlpha(short_window=short_window, long_window=long_window)
    portfolio = EqualWeightingPortfolio()
    execution = ImmediateExecutionModel()
    
    return AlgorithmFramework(
        universe=universe,
        alpha=alpha,
        portfolio=portfolio,
        execution=execution
    )
