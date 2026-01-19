"""MACD Crossover Strategy - Library version"""

from quantlib.strategies import Strategy
from quantlib.indicators import macd


class MACDStrategy(Strategy):
    """MACD Crossover Strategy"""
    
    def __init__(self, params):
        self.macd_fast = params.get('macd_fast', 12)
        self.macd_slow = params.get('macd_slow', 26)
        self.macd_signal = params.get('macd_signal', 9)
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
            if len(self.prices) >= self.macd_slow + self.macd_signal:
                import pandas as pd
                prices_series = pd.Series(self.prices)
                macd_result = macd(prices_series, self.macd_fast, self.macd_slow, self.macd_signal)
                if len(macd_result['macd'].dropna()) > 0 and len(macd_result['signal'].dropna()) > 0:
                    current_macd = macd_result['macd'].dropna().iloc[-1]
                    current_signal = macd_result['signal'].dropna().iloc[-1]
                    prev_macd = macd_result['macd'].dropna().iloc[-2] if len(macd_result['macd'].dropna()) > 1 else current_macd
                    prev_signal = macd_result['signal'].dropna().iloc[-2] if len(macd_result['signal'].dropna()) > 1 else current_signal
                    if current_macd > current_signal and prev_macd <= prev_signal and self.position <= 0:
                        context.place_order(self.symbol, 100, 'BUY')
                        self.position = 100
                    elif current_macd < current_signal and prev_macd >= prev_signal and self.position > 0:
                        context.place_order(self.symbol, 100, 'SELL')
                        self.position = 0
