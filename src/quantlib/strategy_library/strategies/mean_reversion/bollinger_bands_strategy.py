"""Bollinger Bands Mean Reversion Strategy - Library version"""

from quantlib.strategies import Strategy
from quantlib.indicators import bollinger_bands


class BollingerBandsStrategy(Strategy):
    """Bollinger Bands Mean Reversion Strategy"""
    
    def __init__(self, params):
        self.bb_window = params.get('bb_window', 20)
        self.bb_std = params.get('bb_std', 2.0)
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
            if len(self.prices) >= self.bb_window:
                import pandas as pd
                prices_series = pd.Series(self.prices)
                bb = bollinger_bands(prices_series, self.bb_window, self.bb_std)
                if len(bb['lower'].dropna()) > 0 and len(bb['upper'].dropna()) > 0:
                    current_price = close_price
                    lower_band = bb['lower'].dropna().iloc[-1]
                    upper_band = bb['upper'].dropna().iloc[-1]
                    if current_price < lower_band and self.position <= 0:
                        context.place_order(self.symbol, 100, 'BUY')
                        self.position = 100
                    elif current_price > upper_band and self.position > 0:
                        context.place_order(self.symbol, 100, 'SELL')
                        self.position = 0
