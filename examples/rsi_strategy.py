"""
RSI Strategy Example

This example demonstrates a momentum strategy using the Relative Strength Index (RSI):
1. Fetch data
2. Calculate RSI indicator
3. Implement RSI-based trading strategy (oversold/overbought)
4. Run backtest
5. Analyze performance with risk metrics
6. Visualize results
"""

from quantlib.data import YahooFinanceFetcher, DataStore
from quantlib.backtesting import BacktestEngine
from quantlib.strategies import Strategy
from quantlib.indicators import rsi
from quantlib.risk import sharpe_ratio, max_drawdown_pct, sortino_ratio
from quantlib.visualization import create_tear_sheet
import pandas as pd


class RSIStrategy(Strategy):
    """RSI-based momentum strategy"""
    
    def initialize(self, context):
        """Initialize strategy parameters"""
        context.rsi_period = 14
        context.oversold_level = 30  # Buy when RSI < 30
        context.overbought_level = 70  # Sell when RSI > 70
        context.position = 0
        context.prices = []
    
    def on_data(self, context, data):
        """
        Generate signals based on RSI levels.
        
        Strategy logic:
        - Buy when RSI crosses below oversold level (30)
        - Sell when RSI crosses above overbought level (70)
        """
        close_price = data.get('Close', 0)
        if close_price:
            context.prices.append(close_price)
            
            # Need enough data for RSI calculation
            if len(context.prices) >= context.rsi_period + 1:
                prices_series = pd.Series(context.prices)
                rsi_values = rsi(prices_series, context.rsi_period)
                
                if len(rsi_values) > 0:
                    current_rsi = rsi_values.iloc[-1]
                    prev_rsi = rsi_values.iloc[-2] if len(rsi_values) > 1 else current_rsi
                    
                    # Buy signal: RSI crosses below oversold level (from above)
                    if (prev_rsi >= context.oversold_level and 
                        current_rsi < context.oversold_level and 
                        context.position <= 0):
                        context.place_order('SYMBOL', 100, 'BUY')
                        context.position = 100
                    
                    # Sell signal: RSI crosses above overbought level (from below)
                    elif (prev_rsi <= context.overbought_level and 
                          current_rsi > context.overbought_level and 
                          context.position > 0):
                        context.place_order('SYMBOL', 100, 'SELL')
                        context.position = 0


def main():
    """Main example function"""
    print("RSI Strategy Example")
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
    print("\n2. Running backtest with RSI strategy...")
    strategy = RSIStrategy()
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
    
    if returns is not None and len(returns) > 0:
        sharpe = sharpe_ratio(returns)
        sortino = sortino_ratio(returns)
        max_dd_pct = max_drawdown_pct(equity_curve)
        
        print(f"   Sharpe ratio: {sharpe:.2f}")
        print(f"   Sortino ratio: {sortino:.2f}")
        print(f"   Max drawdown: {max_dd_pct:.2f}%")
    
    # Visualize results
    print("\n4. Creating visualizations...")
    try:
        fig = create_tear_sheet(results, save_path='rsi_strategy_results.png')
        print("   Saved tear sheet to rsi_strategy_results.png")
    except Exception as e:
        print(f"   Error creating visualization: {e}")
        import traceback
        traceback.print_exc()
    
    print("\nExample complete!")


if __name__ == '__main__':
    main()
