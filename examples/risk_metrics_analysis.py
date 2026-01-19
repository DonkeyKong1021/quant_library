"""
Risk Metrics Analysis Example

This example demonstrates comprehensive risk analysis:
1. Fetch data and run backtest
2. Calculate various risk metrics (Sharpe, Sortino, VaR, drawdown, etc.)
3. Analyze risk-adjusted returns
4. Generate risk report
"""

from quantlib.data import YahooFinanceFetcher, DataStore
from quantlib.backtesting import BacktestEngine
from quantlib.strategies import Strategy
from quantlib.indicators import sma
from quantlib.risk import (
    sharpe_ratio,
    sortino_ratio,
    calmar_ratio,
    max_drawdown_pct,
    calculate_drawdown,
    historical_var,
    cvar,
    annualized_volatility,
    win_rate,
    profit_factor,
    RiskCalculator
)
from quantlib.visualization import create_tear_sheet
import pandas as pd
import numpy as np


class SimpleMAStrategy(Strategy):
    """Simple moving average crossover for risk analysis"""
    
    def initialize(self, context):
        context.short_window = 20
        context.long_window = 50
        context.position = 0
        context.prices = []
    
    def on_data(self, context, data):
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


def main():
    """Main example function"""
    print("Risk Metrics Analysis Example")
    print("=" * 50)
    
    # Fetch data
    print("\n1. Fetching data from Yahoo Finance...")
    fetcher = YahooFinanceFetcher()
    store = DataStore()
    
    symbol = 'AAPL'
    start_date = '2020-01-01'
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
    
    # Run backtest
    print("\n2. Running backtest...")
    strategy = SimpleMAStrategy()
    engine = BacktestEngine(initial_capital=100000, commission=1.0)
    
    try:
        results = engine.run(strategy, data, start=start_date, end=end_date, symbol=symbol)
        print(f"   Backtest complete")
    except Exception as e:
        print(f"   Error running backtest: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Calculate risk metrics
    print("\n3. Calculating comprehensive risk metrics...")
    returns = results.get('returns')
    equity_curve = results.get('equity_curve')
    trades = results.get('trades', [])
    
    if returns is None or len(returns) == 0:
        print("   No returns data available")
        return
    
    # Convert to Series if needed
    if isinstance(returns, list):
        returns = pd.Series(returns)
    if isinstance(equity_curve, list):
        equity_curve = pd.Series(equity_curve)
    
    # Basic performance metrics
    total_return = results.get('total_return', 0)
    num_trades = results.get('num_trades', 0)
    
    # Risk-adjusted returns
    sharpe = sharpe_ratio(returns)
    sortino = sortino_ratio(returns)
    max_dd_pct = max_drawdown_pct(equity_curve)
    calmar = calmar_ratio(returns, max_dd_pct)
    ann_vol = annualized_volatility(returns)
    
    # Drawdown analysis
    drawdown_series = calculate_drawdown(equity_curve)
    max_dd = drawdown_series.max()
    
    # Value at Risk (VaR) and Conditional VaR (CVaR)
    var_95 = historical_var(returns, confidence_level=0.95)
    var_99 = historical_var(returns, confidence_level=0.99)
    cvar_95 = cvar(returns, confidence_level=0.95)
    
    # Trade statistics
    if trades and len(trades) > 0:
        trades_df = pd.DataFrame(trades)
        wr = win_rate(trades_df)
        pf = profit_factor(trades_df)
    else:
        wr = 0.0
        pf = 0.0
    
    # Print comprehensive report
    print("\n" + "=" * 50)
    print("RISK METRICS REPORT")
    print("=" * 50)
    
    print("\nPerformance Metrics:")
    print(f"  Total Return: {total_return*100:.2f}%")
    print(f"  Number of Trades: {num_trades}")
    print(f"  Win Rate: {wr*100:.2f}%")
    print(f"  Profit Factor: {pf:.2f}")
    
    print("\nRisk-Adjusted Returns:")
    print(f"  Sharpe Ratio: {sharpe:.2f}")
    print(f"  Sortino Ratio: {sortino:.2f}")
    print(f"  Calmar Ratio: {calmar:.2f}")
    
    print("\nVolatility & Drawdown:")
    print(f"  Annualized Volatility: {ann_vol*100:.2f}%")
    print(f"  Maximum Drawdown: {max_dd_pct:.2f}%")
    print(f"  Maximum Drawdown (absolute): {max_dd:.2f}")
    
    print("\nValue at Risk (VaR):")
    print(f"  95% VaR (daily): {var_95*100:.2f}%")
    print(f"  99% VaR (daily): {var_99*100:.2f}%")
    print(f"  95% CVaR (Expected Shortfall): {cvar_95*100:.2f}%")
    
    # Use RiskCalculator for additional metrics
    print("\n4. Using RiskCalculator for additional analysis...")
    try:
        calculator = RiskCalculator(returns=returns, equity_curve=equity_curve)
        risk_report = calculator.calculate_all_metrics()
        
        print("\nAdditional Metrics from RiskCalculator:")
        if 'alpha' in risk_report:
            print(f"  Alpha: {risk_report['alpha']:.4f}")
        if 'beta' in risk_report:
            print(f"  Beta: {risk_report['beta']:.2f}")
        if 'information_ratio' in risk_report:
            print(f"  Information Ratio: {risk_report['information_ratio']:.2f}")
    except Exception as e:
        print(f"   Note: Some metrics unavailable ({e})")
    
    # Visualize results
    print("\n5. Creating visualizations...")
    try:
        fig = create_tear_sheet(results, save_path='risk_metrics_results.png')
        print("   Saved tear sheet to risk_metrics_results.png")
    except Exception as e:
        print(f"   Error creating visualization: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 50)
    print("Analysis complete!")
    print("=" * 50)


if __name__ == '__main__':
    main()
