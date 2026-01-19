/**
 * Strategy templates for the Strategy Builder
 */

export const strategyTemplates = {
  simple: {
    name: 'Simple Strategy',
    description: 'A basic strategy template to get started',
    code: `from quantlib.strategies import Strategy

class MyStrategy(Strategy):
    def initialize(self, context):
        """Initialize strategy parameters"""
        # Add your initialization code here
        pass
    
    def on_data(self, context, data):
        """Process market data and generate signals"""
        # Get current price
        current_price = data['Close'].iloc[-1]
        
        # Add your trading logic here
        # Example: Buy if price > threshold
        # if current_price > threshold:
        #     context.order_target_percent(context.symbol, 1.0)  # 100% long
        
        pass
`,
  },
  moving_average: {
    name: 'Moving Average Crossover',
    description: 'Buy when short MA crosses above long MA, sell when it crosses below',
    code: `from quantlib.strategies import Strategy
from quantlib.indicators import sma

class MovingAverageStrategy(Strategy):
    def initialize(self, context):
        """Initialize strategy parameters"""
        self.short_window = 20
        self.long_window = 50
    
    def on_data(self, context, data):
        """Process market data and generate signals"""
        if len(data) < self.long_window:
            return
        
        # Calculate moving averages
        short_ma = sma(data['Close'], self.short_window)
        long_ma = sma(data['Close'], self.long_window)
        
        current_short = short_ma.iloc[-1]
        current_long = long_ma.iloc[-1]
        prev_short = short_ma.iloc[-2] if len(short_ma) > 1 else current_short
        prev_long = long_ma.iloc[-2] if len(long_ma) > 1 else current_long
        
        # Buy signal: short MA crosses above long MA
        if prev_short <= prev_long and current_short > current_long:
            context.order_target_percent(context.symbol, 1.0)  # 100% long
        
        # Sell signal: short MA crosses below long MA
        elif prev_short >= prev_long and current_short < current_long:
            context.order_target_percent(context.symbol, 0.0)  # 0% position (sell)
`,
  },
  rsi: {
    name: 'RSI Strategy',
    description: 'Buy when RSI is oversold (<30), sell when overbought (>70)',
    code: `from quantlib.strategies import Strategy
from quantlib.indicators import rsi

class RSIStrategy(Strategy):
    def initialize(self, context):
        """Initialize strategy parameters"""
        self.rsi_window = 14
        self.oversold = 30
        self.overbought = 70
    
    def on_data(self, context, data):
        """Process market data and generate signals"""
        if len(data) < self.rsi_window + 1:
            return
        
        # Calculate RSI
        rsi_values = rsi(data['Close'], self.rsi_window)
        current_rsi = rsi_values.iloc[-1]
        
        # Buy signal: RSI oversold
        if current_rsi < self.oversold:
            context.order_target_percent(context.symbol, 1.0)  # 100% long
        
        # Sell signal: RSI overbought
        elif current_rsi > self.overbought:
            context.order_target_percent(context.symbol, 0.0)  # 0% position (sell)
`,
  },
  bollinger_bands: {
    name: 'Bollinger Bands Strategy',
    description: 'Buy when price touches lower band, sell when it touches upper band',
    code: `from quantlib.strategies import Strategy
from quantlib.indicators import bollinger_bands

class BollingerBandsStrategy(Strategy):
    def initialize(self, context):
        """Initialize strategy parameters"""
        self.window = 20
        self.num_std = 2.0
    
    def on_data(self, context, data):
        """Process market data and generate signals"""
        if len(data) < self.window:
            return
        
        # Calculate Bollinger Bands
        upper, middle, lower = bollinger_bands(data['Close'], self.window, self.num_std)
        
        current_price = data['Close'].iloc[-1]
        current_upper = upper.iloc[-1]
        current_lower = lower.iloc[-1]
        
        # Buy signal: price touches lower band
        if current_price <= current_lower:
            context.order_target_percent(context.symbol, 1.0)  # 100% long
        
        # Sell signal: price touches upper band
        elif current_price >= current_upper:
            context.order_target_percent(context.symbol, 0.0)  # 0% position (sell)
`,
  },
  macd: {
    name: 'MACD Strategy',
    description: 'Buy when MACD line crosses above signal line, sell when it crosses below',
    code: `from quantlib.strategies import Strategy
from quantlib.indicators import macd

class MACDStrategy(Strategy):
    def initialize(self, context):
        """Initialize strategy parameters"""
        self.fast_period = 12
        self.slow_period = 26
        self.signal_period = 9
    
    def on_data(self, context, data):
        """Process market data and generate signals"""
        if len(data) < self.slow_period + self.signal_period:
            return
        
        # Calculate MACD
        macd_line, signal_line, histogram = macd(
            data['Close'],
            self.fast_period,
            self.slow_period,
            self.signal_period
        )
        
        current_macd = macd_line.iloc[-1]
        current_signal = signal_line.iloc[-1]
        prev_macd = macd_line.iloc[-2] if len(macd_line) > 1 else current_macd
        prev_signal = signal_line.iloc[-2] if len(signal_line) > 1 else current_signal
        
        # Buy signal: MACD crosses above signal
        if prev_macd <= prev_signal and current_macd > current_signal:
            context.order_target_percent(context.symbol, 1.0)  # 100% long
        
        # Sell signal: MACD crosses below signal
        elif prev_macd >= prev_signal and current_macd < current_signal:
            context.order_target_percent(context.symbol, 0.0)  # 0% position (sell)
`,
  },
}

export const getTemplate = (templateName) => {
  return strategyTemplates[templateName] || strategyTemplates.simple
}

export const getAllTemplates = () => {
  return Object.keys(strategyTemplates).map((key) => ({
    id: key,
    ...strategyTemplates[key],
  }))
}
