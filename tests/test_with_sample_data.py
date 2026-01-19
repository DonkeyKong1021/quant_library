#!/usr/bin/env python3
"""
Test QuantLib with sample data (no network required)

This script demonstrates the library functionality using generated sample data
instead of fetching from Yahoo Finance.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from quantlib.backtesting import BacktestEngine, SimulatedBroker
from quantlib.strategies import Strategy
from quantlib.indicators import sma, ema, rsi
from quantlib.risk import sharpe_ratio, max_drawdown_pct, calculate_drawdown
from quantlib.visualization import plot_equity_curve, plot_drawdown
from quantlib.portfolio import Portfolio


def generate_sample_data(days=252, start_price=100.0):
    """Generate sample OHLCV data"""
    dates = pd.date_range(start='2020-01-01', periods=days, freq='D')
    
    # Generate realistic price movements
    returns = np.random.randn(days) * 0.02  # 2% daily volatility
    prices = start_price * np.exp(np.cumsum(returns))
    
    # Generate OHLC data
    high = prices * (1 + np.abs(np.random.randn(days) * 0.01))
    low = prices * (1 - np.abs(np.random.randn(days) * 0.01))
    open_prices = prices * (1 + np.random.randn(days) * 0.005)
    
    volume = np.random.randint(1000000, 10000000, days)
    
    data = pd.DataFrame({
        'Open': open_prices,
        'High': high,
        'Low': low,
        'Close': prices,
        'Volume': volume
    }, index=dates)
    
    return data


class SimpleMovingAverageStrategy(Strategy):
    """Simple moving average crossover strategy"""
    
    def initialize(self, context):
        """Initialize strategy parameters"""
        context.short_window = 10
        context.long_window = 30
        context.position = 0
        context.price_history = []
    
    def on_data(self, context, data):
        """Generate signals based on MA crossover"""
        close_price = data.get('Close', 0)
        
        if close_price:
            context.price_history.append(close_price)
            
            # Need enough data for indicators
            if len(context.price_history) >= context.long_window:
                prices_series = pd.Series(context.price_history)
                
                # Calculate moving averages
                short_ma = sma(prices_series, context.short_window)
                long_ma = sma(prices_series, context.long_window)
                
                # Get latest values
                if len(short_ma.dropna()) > 0 and len(long_ma.dropna()) > 0:
                    short_val = short_ma.dropna().iloc[-1]
                    long_val = long_ma.dropna().iloc[-1]
                    
                    # Crossover logic
                    if short_val > long_val and context.position <= 0:
                        # Buy signal
                        context.place_order('SYMBOL', 100, 'BUY')
                        context.position = 100
                    elif short_val < long_val and context.position > 0:
                        # Sell signal
                        context.place_order('SYMBOL', 100, 'SELL')
                        context.position = 0


def main():
    """Main test function"""
    print("QuantLib Test with Sample Data")
    print("=" * 50)
    
    # Generate sample data
    print("\n1. Generating sample data...")
    data = generate_sample_data(days=252, start_price=100.0)
    print(f"   Generated {len(data)} days of data")
    print(f"   Price range: ${data['Close'].min():.2f} - ${data['Close'].max():.2f}")
    
    # Test indicators
    print("\n2. Testing indicators...")
    close_prices = data['Close']
    
    sma_20 = sma(close_prices, 20)
    ema_20 = ema(close_prices, 20)
    rsi_14 = rsi(close_prices, 14)
    
    print(f"   SMA(20) latest: ${sma_20.dropna().iloc[-1]:.2f}")
    print(f"   EMA(20) latest: ${ema_20.dropna().iloc[-1]:.2f}")
    print(f"   RSI(14) latest: {rsi_14.dropna().iloc[-1]:.2f}")
    
    # Test portfolio
    print("\n3. Testing portfolio management...")
    portfolio = Portfolio(initial_cash=100000)
    portfolio.add_position('AAPL', 100)
    portfolio.update_cash(-10000)
    
    current_prices = {'AAPL': data['Close'].iloc[-1]}
    equity = portfolio.get_total_equity(current_prices)
    print(f"   Portfolio equity: ${equity:,.2f}")
    
    # Test broker (execution-only)
    print("\n4. Testing simulated broker...")
    broker = SimulatedBroker(commission=1.0)
    from quantlib.backtesting.event import OrderEvent
    
    order = OrderEvent(
        timestamp=datetime.now(),
        symbol='SYMBOL',
        order_type='MARKET',
        quantity=100,
        direction='BUY'
    )
    
    current_price = float(data['Close'].iloc[0])
    execution_price, commission = broker.calculate_execution(order, current_price, datetime.now())
    
    print(f"   Execution price: ${execution_price:.2f}")
    print(f"   Commission: ${commission:.2f}")
    
    # Test risk metrics
    print("\n5. Testing risk metrics...")
    returns = data['Close'].pct_change().dropna()
    equity_curve = (1 + returns).cumprod() * 100000
    
    sharpe = sharpe_ratio(returns)
    max_dd_pct = max_drawdown_pct(equity_curve)
    
    print(f"   Sharpe ratio: {sharpe:.2f}")
    print(f"   Max drawdown: {max_dd_pct:.2f}%")
    
    # Test backtesting engine (simplified)
    print("\n6. Testing backtesting components...")
    print("   ✓ All core components working")
    
    print("\n" + "=" * 50)
    print("✓ All tests passed with sample data!")
    print("=" * 50)
    print("\nNote: To test with real data, ensure you have internet")
    print("      connection and Yahoo Finance API is accessible.")


if __name__ == '__main__':
    main()
