"""RSI Momentum Strategy - Library version"""

from quantlib.strategies import Strategy
from quantlib.indicators import rsi


class RSIStrategy(Strategy):
    """RSI Momentum Strategy"""
    
    def __init__(self, params):
        self.rsi_window = params.get('rsi_window', 14)
        self.rsi_oversold = params.get('rsi_oversold', 30)
        self.rsi_overbought = params.get('rsi_overbought', 70)
        self.position = 0
        self.prices = []
    
    def initialize(self, context):
        if hasattr(context, 'symbol'):
            self.symbol = context.symbol
        else:
            self.symbol = 'SYMBOL'
    
    def on_data(self, context, data):
        close_price = data.get('Close', 0)
        if close_price:
            self.prices.append(close_price)
            if len(self.prices) >= self.rsi_window + 1:
                import pandas as pd
                prices_series = pd.Series(self.prices)
                rsi_val = rsi(prices_series, self.rsi_window)
                if len(rsi_val.dropna()) > 0:
                    current_rsi = rsi_val.dropna().iloc[-1]
                    if current_rsi < self.rsi_oversold and self.position <= 0:
                        context.place_order(self.symbol, 100, 'BUY')
                        self.position = 100
                    elif current_rsi > self.rsi_overbought and self.position > 0:
                        context.place_order(self.symbol, 100, 'SELL')
                        self.position = 0
