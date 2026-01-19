"""
Walk-Forward Analysis Example

This example demonstrates walk-forward analysis for parameter optimization:
1. Fetch data
2. Define a parameterized strategy
3. Run walk-forward analysis (train on historical data, test on future data)
4. Analyze out-of-sample performance
5. Compare train vs test performance to detect overfitting
"""

from quantlib.data import YahooFinanceFetcher, DataStore
from quantlib.backtesting import BacktestEngine, WalkForwardAnalyzer
from quantlib.strategies import Strategy
from quantlib.indicators import sma
from quantlib.risk import sharpe_ratio, max_drawdown_pct
import pandas as pd
from typing import Dict, Any


class ParameterizedMAStrategy(Strategy):
    """Moving average crossover strategy with configurable parameters"""
    
    def initialize(self, context):
        """Initialize strategy parameters"""
        context.short_window = getattr(context, 'short_window', 20)
        context.long_window = getattr(context, 'long_window', 50)
        context.position = 0
        context.prices = []
    
    def on_data(self, context, data):
        """Generate signals based on MA crossover"""
        close_price = data.get('Close', 0)
        if close_price:
            context.prices.append(close_price)
            
            if len(context.prices) >= context.long_window:
                prices_series = pd.Series(context.prices)
                short_ma = sma(prices_series, context.short_window)
                long_ma = sma(prices_series, context.long_window)
                
                if len(short_ma.dropna()) > 0 and len(long_ma.dropna()) > 0:
                    if (short_ma.dropna().iloc[-1] > long_ma.dropna().iloc[-1] and 
                        context.position <= 0):
                        context.place_order('SYMBOL', 100, 'BUY')
                        context.position = 100
                    elif (short_ma.dropna().iloc[-1] < long_ma.dropna().iloc[-1] and 
                          context.position > 0):
                        context.place_order('SYMBOL', 100, 'SELL')
                        context.position = 0


def create_strategy(params: Dict[str, Any]) -> Strategy:
    """Factory function to create strategy with parameters"""
    strategy = ParameterizedMAStrategy()
    # Set parameters via context in initialize
    strategy._short_window = params.get('short_window', 20)
    strategy._long_window = params.get('long_window', 50)
    return strategy


def strategy_factory(params: Dict[str, Any]) -> Strategy:
    """Factory function that returns strategy with parameters"""
    class ParamStrategy(ParameterizedMAStrategy):
        def initialize(self, context):
            context.short_window = params.get('short_window', 20)
            context.long_window = params.get('long_window', 50)
            context.position = 0
            context.prices = []
    
    return ParamStrategy()


def main():
    """Main example function"""
    print("Walk-Forward Analysis Example")
    print("=" * 50)
    
    # Fetch data
    print("\n1. Fetching data from Yahoo Finance...")
    fetcher = YahooFinanceFetcher()
    store = DataStore()
    
    symbol = 'AAPL'
    start_date = '2018-01-01'  # Need longer history for walk-forward
    end_date = '2023-01-01'
    
    try:
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
    
    # Set up walk-forward analysis
    print("\n2. Setting up walk-forward analysis...")
    print("   Training window: 252 days (~1 year)")
    print("   Testing window: 63 days (~1 quarter)")
    print("   Step size: 63 days (rolling forward)")
    
    analyzer = WalkForwardAnalyzer(
        train_size=252,  # 1 year of daily data
        test_size=63,    # 1 quarter
        step_size=63,    # Step forward by 1 quarter
        anchor=False     # Rolling window (fixed training size)
    )
    
    # Define parameter ranges to optimize
    parameter_ranges = {
        'short_window': {'min': 10, 'max': 30, 'step': 5},
        'long_window': {'min': 40, 'max': 80, 'step': 10}
    }
    
    print("\n3. Running walk-forward analysis...")
    print("   This may take a few minutes...")
    
    try:
        results = analyzer.run_analysis(
            strategy_factory=strategy_factory,
            data=data,
            symbol=symbol,
            parameter_ranges=parameter_ranges,
            optimization_objective='sharpe_ratio',
            initial_capital=100000,
            commission=1.0
        )
        
        print("\n4. Walk-Forward Results:")
        print("=" * 50)
        
        windows = results.get('windows', [])
        print(f"   Number of walk-forward windows: {len(windows)}")
        
        # Summarize results
        train_sharpes = []
        test_sharpes = []
        train_returns = []
        test_returns = []
        
        for i, window_result in enumerate(windows):
            train_metrics = window_result.get('train_metrics', {})
            test_metrics = window_result.get('test_metrics', {})
            test_returns_series = window_result.get('test_returns', pd.Series())
            
            # Get metrics from RiskCalculator output
            train_sharpe = train_metrics.get('sharpe_ratio', 0)
            test_sharpe = test_metrics.get('sharpe_ratio', 0)
            train_ret = train_metrics.get('total_return', 0)
            test_ret = test_metrics.get('total_return', 0)
            
            if train_sharpe != 0:
                train_sharpes.append(train_sharpe)
            if test_sharpe != 0:
                test_sharpes.append(test_sharpe)
            
            if i < 3:  # Show first 3 windows
                print(f"\n   Window {i+1}:")
                print(f"     Train period: {window_result.get('train_start_date')} to {window_result.get('train_end_date')}")
                print(f"     Test period: {window_result.get('test_start_date')} to {window_result.get('test_end_date')}")
                if train_ret != 0:
                    print(f"     Train return: {train_ret*100:.2f}%")
                if test_ret != 0:
                    print(f"     Test return: {test_ret*100:.2f}%")
                if train_sharpe != 0:
                    print(f"     Train Sharpe: {train_sharpe:.2f}")
                if test_sharpe != 0:
                    print(f"     Test Sharpe: {test_sharpe:.2f}")
                print(f"     Optimized params: {window_result.get('optimized_parameters', {})}")
        
        # Summary statistics
        if train_sharpes and test_sharpes:
            avg_train_sharpe = sum(train_sharpes) / len(train_sharpes)
            avg_test_sharpe = sum(test_sharpes) / len(test_sharpes)
            
            print(f"\n   Summary:")
            print(f"     Average train Sharpe: {avg_train_sharpe:.2f}")
            print(f"     Average test Sharpe: {avg_test_sharpe:.2f}")
            print(f"     Degradation: {(avg_train_sharpe - avg_test_sharpe):.2f}")
            
            if avg_test_sharpe > 0:
                print(f"     Strategy shows consistent performance")
            else:
                print(f"     Warning: Strategy may be overfitted")
        
    except Exception as e:
        print(f"   Error running walk-forward analysis: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("\nExample complete!")


if __name__ == '__main__':
    main()
