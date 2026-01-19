"""
Bollinger Bands Mean Reversion Strategy Example

This example demonstrates a mean reversion strategy using Bollinger Bands:
1. Fetch data
2. Calculate Bollinger Bands (upper, middle, lower)
3. Implement mean reversion strategy (buy on lower band, sell on upper band)
4. Run backtest
5. Analyze performance
6. Visualize results
"""

from quantlib.data import YahooFinanceFetcher, DataStore
from quantlib.backtesting import BacktestEngine
from quantlib.strategies import Strategy
from quantlib.indicators import bollinger_bands
from quantlib.risk import sharpe_ratio, max_drawdown_pct, calmar_ratio
from quantlib.visualization import create_tear_sheet
import pandas as pd


class BollingerBandsStrategy(Strategy):
    """Bollinger Bands mean reversion strategy"""
    
    def initialize(self, context):
        """Initialize strategy parameters"""
        context.bb_period = 20
        context.bb_std = 2.0
        context.position = 0
        context.prices = []
    
    def on_data(self, context, data):
        """
        Generate signals based on Bollinger Bands.
        
        Strategy logic:
        - Buy when price touches or crosses below the lower band (oversold)
        - Sell when price touches or crosses above the upper band (overbought)
        """
        close_price = data.get('Close', 0)
        if close_price:
            context.prices.append(close_price)
            
            # Need enough data for Bollinger Bands calculation
            if len(context.prices) >= context.bb_period:
                prices_series = pd.Series(context.prices)
                bb = bollinger_bands(prices_series, context.bb_period, context.bb_std)
                
                if len(bb) > 0:
                    current_price = prices_series.iloc[-1]
                    upper_band = bb['upper'].iloc[-1]
                    lower_band = bb['lower'].iloc[-1]
                    middle_band = bb['middle'].iloc[-1]
                    
                    # Buy signal: price touches or crosses below lower band
                    if current_price <= lower_band and context.position <= 0:
                        context.place_order('SYMBOL', 100, 'BUY')
                        context.position = 100
                    
                    # Sell signal: price touches or crosses above upper band
                    elif current_price >= upper_band and context.position > 0:
                        context.place_order('SYMBOL', 100, 'SELL')
                        context.position = 0


def main():
    """Main example function"""
    print("Bollinger Bands Mean Reversion Strategy")
    print("=" * 50)
    
    # Fetch data
    print("\n1. Fetching data from Yahoo Finance...")
    fetcher = YahooFinanceFetcher()
    store = DataStore()
    
    symbol = 'SPY'  # Using SPY as it's less volatile, better for mean reversion
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
    print("\n2. Running backtest with Bollinger Bands strategy...")
    strategy = BollingerBandsStrategy()
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
        max_dd_pct = max_drawdown_pct(equity_curve)
        calmar = calmar_ratio(returns, max_dd_pct)
        
        print(f"   Sharpe ratio: {sharpe:.2f}")
        print(f"   Max drawdown: {max_dd_pct:.2f}%")
        print(f"   Calmar ratio: {calmar:.2f}")
    
    # Visualize results
    print("\n4. Creating visualizations...")
    try:
        fig = create_tear_sheet(results, save_path='bollinger_bands_results.png')
        print("   Saved tear sheet to bollinger_bands_results.png")
    except Exception as e:
        print(f"   Error creating visualization: {e}")
        import traceback
        traceback.print_exc()
    
    print("\nExample complete!")


if __name__ == '__main__':
    main()
