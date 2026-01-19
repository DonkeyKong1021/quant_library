"""
Moving Average Crossover Strategy Example

Demonstrates a complete backtest with:
- Data fetching and storage
- Indicator calculation
- Strategy implementation
- Backtesting
- Performance analysis
- Visualization
"""

from quantlib.data import YahooFinanceFetcher, DataStore
from quantlib.backtesting import BacktestEngine
from quantlib.strategies import Strategy
from quantlib.indicators import sma
from quantlib.risk import sharpe_ratio, max_drawdown_pct
from quantlib.visualization import create_tear_sheet, plot_equity_curve
import pandas as pd


class MovingAverageCrossover(Strategy):
    """Moving average crossover strategy"""
    
    def initialize(self, context):
        """Initialize strategy parameters"""
        context.short_window = 20
        context.long_window = 50
        context.position = 0
        context.prices = []
    
    def on_data(self, context, data):
        """
        Generate signals based on MA crossover.
        
        Note: This is a simplified version. In practice, you'd need
        access to historical data through the context to calculate
        indicators properly.
        """
        close_price = data.get('Close', 0)
        if close_price:
            context.prices.append(close_price)
            
            # Need enough data for indicators
            if len(context.prices) >= context.long_window:
                prices_series = pd.Series(context.prices)
                short_ma = sma(prices_series, context.short_window)
                long_ma = sma(prices_series, context.long_window)
                
                # Crossover logic
                if len(short_ma) > 0 and len(long_ma) > 0:
                    if short_ma.iloc[-1] > long_ma.iloc[-1] and context.position <= 0:
                        # Buy signal
                        context.place_order('AAPL', 100, 'BUY')
                        context.position = 100
                    elif short_ma.iloc[-1] < long_ma.iloc[-1] and context.position > 0:
                        # Sell signal
                        context.place_order('AAPL', 100, 'SELL')
                        context.position = 0


def main():
    """Main example function"""
    print("Moving Average Crossover Strategy")
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
        return
    
    # Create and run strategy
    print("\n2. Running backtest...")
    strategy = MovingAverageCrossover()
    engine = BacktestEngine(initial_capital=100000, commission=1.0)
    
    try:
        results = engine.run(strategy, data, start=start_date, end=end_date)
        
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
    
    if returns is not None and len(returns) > 0:
        sharpe = sharpe_ratio(returns)
        max_dd_pct = max_drawdown_pct(equity_curve)
        
        print(f"   Sharpe ratio: {sharpe:.2f}")
        print(f"   Max drawdown: {max_dd_pct:.2f}%")
    
    # Visualize results
    print("\n4. Creating visualizations...")
    try:
        fig = create_tear_sheet(results, save_path='ma_crossover_results.png')
        print("   Saved tear sheet to ma_crossover_results.png")
    except Exception as e:
        print(f"   Error creating visualization: {e}")
        import traceback
        traceback.print_exc()
    
    print("\nExample complete!")


if __name__ == '__main__':
    main()
