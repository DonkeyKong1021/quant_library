"""Real-time data streaming for paper trading and live trading"""

from typing import Callable, Optional, Dict
from datetime import datetime
import asyncio
import pandas as pd
from abc import ABC, abstractmethod


class DataStream(ABC):
    """Abstract base class for real-time data streaming"""
    
    @abstractmethod
    async def subscribe(self, symbol: str, callback: Callable) -> None:
        """
        Subscribe to real-time data for a symbol.
        
        Args:
            symbol: Trading symbol
            callback: Function to call with new data (receives dict with OHLCV)
        """
        pass
    
    @abstractmethod
    async def unsubscribe(self, symbol: str) -> None:
        """Unsubscribe from symbol updates"""
        pass
    
    @abstractmethod
    async def start(self) -> None:
        """Start the data stream"""
        pass
    
    @abstractmethod
    async def stop(self) -> None:
        """Stop the data stream"""
        pass


class SimulatedDataStream(DataStream):
    """Simulated data stream for paper trading (uses historical data in real-time)"""
    
    def __init__(self, historical_data: Dict[str, pd.DataFrame]):
        """
        Initialize simulated data stream.
        
        Args:
            historical_data: Dictionary of symbol -> DataFrame with historical data
        """
        self.historical_data = historical_data
        self.subscriptions: Dict[str, Callable] = {}
        self.running = False
        self.current_index: Dict[str, int] = {}
        
        # Initialize indices
        for symbol in historical_data.keys():
            self.current_index[symbol] = 0
    
    async def subscribe(self, symbol: str, callback: Callable) -> None:
        """Subscribe to symbol updates"""
        symbol_upper = symbol.upper()
        if symbol_upper not in self.historical_data:
            raise ValueError(f"No historical data available for {symbol_upper}")
        
        self.subscriptions[symbol_upper] = callback
        if symbol_upper not in self.current_index:
            self.current_index[symbol_upper] = 0
    
    async def unsubscribe(self, symbol: str) -> None:
        """Unsubscribe from symbol updates"""
        symbol_upper = symbol.upper()
        if symbol_upper in self.subscriptions:
            del self.subscriptions[symbol_upper]
    
    async def start(self) -> None:
        """Start streaming data"""
        self.running = True
        
        # In a real implementation, this would stream data in real-time
        # For simulation, we'll emit data at regular intervals
        while self.running:
            for symbol, callback in self.subscriptions.items():
                if symbol in self.historical_data:
                    data = self.historical_data[symbol]
                    idx = self.current_index[symbol]
                    
                    if idx < len(data):
                        bar = data.iloc[idx]
                        bar_dict = {
                            'timestamp': data.index[idx],
                            'open': float(bar['Open']),
                            'high': float(bar['High']),
                            'low': float(bar['Low']),
                            'close': float(bar['Close']),
                            'volume': int(bar['Volume']),
                        }
                        
                        try:
                            if asyncio.iscoroutinefunction(callback):
                                await callback(bar_dict)
                            else:
                                callback(bar_dict)
                        except Exception as e:
                            print(f"Error in callback for {symbol}: {e}")
                        
                        self.current_index[symbol] += 1
                    else:
                        # End of data
                        await self.unsubscribe(symbol)
            
            # Wait before next update (simulate real-time)
            await asyncio.sleep(1)  # 1 second between updates
    
    async def stop(self) -> None:
        """Stop streaming data"""
        self.running = False
