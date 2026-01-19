"""Moving Average Crossover Strategy - Library version"""

from quantlib.strategies import Strategy
from quantlib.indicators import sma


class MovingAverageCrossover(Strategy):
    """Moving Average Crossover Strategy"""
    
    def __init__(self, params):
        self.short_window = params.get('short_window', 20)
        self.long_window = params.get('long_window', 50)
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
            if len(self.prices) >= self.long_window:
                import pandas as pd
                prices_series = pd.Series(self.prices)
                short_ma = sma(prices_series, self.short_window)
                long_ma = sma(prices_series, self.long_window)
                if len(short_ma.dropna()) > 0 and len(long_ma.dropna()) > 0:
                    if short_ma.dropna().iloc[-1] > long_ma.dropna().iloc[-1] and self.position <= 0:
                        context.place_order(self.symbol, 100, 'BUY')
                        self.position = 100
                    elif short_ma.dropna().iloc[-1] < long_ma.dropna().iloc[-1] and self.position > 0:
                        context.place_order(self.symbol, 100, 'SELL')
                        self.position = 0
