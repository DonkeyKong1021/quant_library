"""
Simple Strategy Example

This example demonstrates the basic usage of the quantlib library:
1. Fetch data
2. Define a simple strategy
3. Run backtest
4. Visualize results
"""

from quantlib.data import YahooFinanceFetcher
from quantlib.backtesting import BacktestEngine
from quantlib.strategies import Strategy
from quantlib.indicators import sma
from quantlib.risk import sharpe_ratio, max_drawdown
from quantlib.visualization import create_tear_sheet


class SimpleStrategy(Strategy):
    """A simple moving average crossover strategy"""
    
    def initialize(self, context):
        """Initialize strategy"""
        context.short_window = 20
        context.long_window = 50
    
    def on_data(self, context, data):
        """Called on each bar"""
        # Note: This is a simplified example
        # In a real implementation, you'd need historical data
        # to calculate indicators properly
        pass


def main():
    """Main example function"""
    print("QuantLib Simple Strategy Example")
    print("=" * 50)
    
    # Fetch data
    print("\n1. Fetching data...")
    fetcher = YahooFinanceFetcher()
    try:
        data = fetcher.fetch_ohlcv('AAPL', start='2020-01-01', end='2023-01-01')
        print(f"   Fetched {len(data)} bars")
    except Exception as e:
        print(f"   Error fetching data: {e}")
        return
    
    # Create strategy
    print("\n2. Creating strategy...")
    strategy = SimpleStrategy()
    
    # Run backtest
    print("\n3. Running backtest...")
    engine = BacktestEngine(initial_capital=100000)
    try:
        results = engine.run(strategy, data, start='2020-01-01', end='2023-01-01')
        print(f"   Backtest complete")
        print(f"   Total return: {results.get('total_return', 0)*100:.2f}%")
        print(f"   Number of trades: {results.get('num_trades', 0)}")
    except Exception as e:
        print(f"   Error running backtest: {e}")
        return
    
    # Calculate metrics
    print("\n4. Calculating metrics...")
    returns = results.get('returns', None)
    if returns is not None and len(returns) > 0:
        sharpe = sharpe_ratio(returns)
        max_dd = max_drawdown(results.get('equity_curve'))
        print(f"   Sharpe ratio: {sharpe:.2f}")
        print(f"   Max drawdown: {max_dd:.2f}")
    
    # Visualize
    print("\n5. Creating visualization...")
    try:
        fig = create_tear_sheet(results, save_path='simple_strategy_results.png')
        print("   Saved tear sheet to simple_strategy_results.png")
    except Exception as e:
        print(f"   Error creating visualization: {e}")
    
    print("\nExample complete!")


if __name__ == '__main__':
    main()
