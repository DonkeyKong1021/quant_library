"""
MACD Strategy Example

This example demonstrates a trend-following strategy using MACD (Moving Average Convergence Divergence):
1. Fetch data
2. Calculate MACD indicator (MACD line, signal line, histogram)
3. Implement MACD crossover strategy
4. Run backtest
5. Analyze performance
6. Visualize results
"""

from quantlib.data import YahooFinanceFetcher, DataStore
from quantlib.backtesting import BacktestEngine
from quantlib.strategies import Strategy
from quantlib.indicators import macd
from quantlib.risk import sharpe_ratio, max_drawdown_pct, win_rate
from quantlib.visualization import create_tear_sheet
import pandas as pd
import numpy as np


class MACDStrategy(Strategy):
    """MACD crossover strategy"""
    
    def initialize(self, context):
        """Initialize strategy parameters"""
        context.fast_period = 12
        context.slow_period = 26
        context.signal_period = 9
        context.position = 0
        context.prices = []
        context.last_signal = None
    
    def on_data(self, context, data):
        """
        Generate signals based on MACD crossover.
        
        Strategy logic:
        - Buy when MACD line crosses above signal line (bullish crossover)
        - Sell when MACD line crosses below signal line (bearish crossover)
        """
        close_price = data.get('Close', 0)
        if close_price:
            context.prices.append(close_price)
            
            # Need enough data for MACD calculation
            if len(context.prices) >= context.slow_period + context.signal_period:
                prices_series = pd.Series(context.prices)
                macd_result = macd(prices_series, context.fast_period, context.slow_period, context.signal_period)
                
                if len(macd_result) > 0 and not macd_result['macd'].iloc[-1:].isna().all():
                    current_macd = macd_result['macd'].iloc[-1]
                    current_signal = macd_result['signal'].iloc[-1]
                    current_hist = macd_result['histogram'].iloc[-1]
                    
                    # Skip if NaN values
                    if pd.isna(current_macd) or pd.isna(current_signal):
                        return
                    
                    # Buy signal: MACD crosses above signal line (histogram becomes positive)
                    if (context.last_signal is not None and 
                        context.last_signal <= 0 and 
                        current_hist > 0 and 
                        context.position <= 0):
                        context.place_order('SYMBOL', 100, 'BUY')
                        context.position = 100
                        context.last_signal = 1
                    
                    # Sell signal: MACD crosses below signal line (histogram becomes negative)
                    elif (context.last_signal is not None and 
                          context.last_signal >= 0 and 
                          current_hist < 0 and 
                          context.position > 0):
                        context.place_order('SYMBOL', 100, 'SELL')
                        context.position = 0
                        context.last_signal = -1
                    
                    # Update last signal state
                    if context.last_signal is None:
                        context.last_signal = 1 if current_hist > 0 else -1


def main():
    """Main example function"""
    print("MACD Strategy Example")
    print("=" * 50)
    
    # Fetch data
    print("\n1. Fetching data from Yahoo Finance...")
    fetcher = YahooFinanceFetcher()
    store = DataStore()
    
    symbol = 'AAPL'
    start_date = '2020-01-01'
    end_date = '2023-01-01'
    
    try:
        # Check if data exists in cache
        if store.exists(symbol):
            print(f"   Loading {symbol} from cache...")
            data = store.load(symbol, start=start_date, end=end_date)
        else:
            print(f"   Fetching {symbol} from Yahoo Finance...")
            data = fetcher.fetch_ohlcv(symbol, start=start_date, end=end_date)
            store.save(symbol, data)
        
        print(f"   Data range: {data.index[0]} to {data.index[-1]}")
        print(f"   Total bars: {len(data)}")
    except Exception as e:
        print(f"   Error: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Create and run strategy
    print("\n2. Running backtest with MACD strategy...")
    strategy = MACDStrategy()
    engine = BacktestEngine(initial_capital=100000, commission=1.0)
    
    try:
        results = engine.run(strategy, data, start=start_date, end=end_date, symbol=symbol)
        
        print(f"   Initial capital: ${results['initial_capital']:,.2f}")
        print(f"   Final equity: ${results['final_equity']:,.2f}")
        print(f"   Total return: {results['total_return']*100:.2f}%")
        print(f"   Number of trades: {results['num_trades']}")
        print(f"   Total commission: ${results['total_commission']:,.2f}")
    except Exception as e:
        print(f"   Error running backtest: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Calculate performance metrics
    print("\n3. Calculating performance metrics...")
    returns = results.get('returns')
    equity_curve = results.get('equity_curve')
    trades = results.get('trades', [])
    
    if returns is not None and len(returns) > 0:
        sharpe = sharpe_ratio(returns)
        max_dd_pct = max_drawdown_pct(equity_curve)
        wr = win_rate(trades) if trades else 0.0
        
        print(f"   Sharpe ratio: {sharpe:.2f}")
        print(f"   Max drawdown: {max_dd_pct:.2f}%")
        print(f"   Win rate: {wr*100:.2f}%")
    
    # Visualize results
    print("\n4. Creating visualizations...")
    try:
        fig = create_tear_sheet(results, save_path='macd_strategy_results.png')
        print("   Saved tear sheet to macd_strategy_results.png")
    except Exception as e:
        print(f"   Error creating visualization: {e}")
        import traceback
        traceback.print_exc()
    
    print("\nExample complete!")


if __name__ == '__main__':
    main()
