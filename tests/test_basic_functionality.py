#!/usr/bin/env python3
"""
Basic functionality test script

This script tests basic library functionality without requiring network access.
Run this to verify the library is working correctly.
"""

import sys
import pandas as pd
import numpy as np

print("QuantLib Basic Functionality Test")
print("=" * 50)

# Test 1: Import all modules
print("\n1. Testing imports...")
try:
    import quantlib
    from quantlib.indicators import sma, ema, rsi, bollinger_bands
    from quantlib.risk import sharpe_ratio, max_drawdown, calculate_drawdown
    from quantlib.data.preprocessing import calculate_returns, clean_data
    from quantlib.portfolio import Portfolio
    from quantlib.backtesting import SimulatedBroker
    print("   ✓ All imports successful")
except ImportError as e:
    print(f"   ✗ Import error: {e}")
    sys.exit(1)

# Test 2: Indicators
print("\n2. Testing indicators...")
try:
    dates = pd.date_range('2020-01-01', periods=100, freq='D')
    prices = 100 + np.cumsum(np.random.randn(100) * 0.5)
    price_series = pd.Series(prices, index=dates)
    
    sma_result = sma(price_series, window=20)
    ema_result = ema(price_series, window=20)
    rsi_result = rsi(price_series, window=14)
    bb_result = bollinger_bands(price_series, window=20)
    
    assert len(sma_result) == len(price_series)
    assert len(ema_result) == len(price_series)
    assert len(rsi_result) == len(price_series)
    assert isinstance(bb_result, pd.DataFrame)
    print("   ✓ All indicators working")
except Exception as e:
    print(f"   ✗ Indicator error: {e}")
    sys.exit(1)

# Test 3: Risk metrics
print("\n3. Testing risk metrics...")
try:
    dates = pd.date_range('2020-01-01', periods=252, freq='D')
    returns = pd.Series(np.random.randn(252) * 0.01, index=dates)
    equity = (1 + returns).cumprod() * 100000
    equity.iloc[0] = 100000
    
    sharpe = sharpe_ratio(returns)
    max_dd = max_drawdown(equity)
    drawdown = calculate_drawdown(equity)
    
    assert not np.isnan(sharpe)
    assert max_dd <= 0
    assert len(drawdown) == len(equity)
    print(f"   ✓ Risk metrics working (Sharpe: {sharpe:.2f}, Max DD: {max_dd:.2f})")
except Exception as e:
    print(f"   ✗ Risk metrics error: {e}")
    sys.exit(1)

# Test 4: Portfolio
print("\n4. Testing portfolio management...")
try:
    portfolio = Portfolio(initial_cash=100000)
    portfolio.add_position('AAPL', 100)
    portfolio.update_cash(-10000)
    
    positions = portfolio.get_positions()
    cash = portfolio.get_cash()
    
    assert positions['AAPL'] == 100
    assert cash == 90000
    print("   ✓ Portfolio management working")
except Exception as e:
    print(f"   ✗ Portfolio error: {e}")
    sys.exit(1)

# Test 5: Broker
print("\n5. Testing simulated broker...")
try:
    broker = SimulatedBroker(initial_capital=100000, commission=1.0)
    from quantlib.backtesting.event import OrderEvent
    from datetime import datetime
    
    order = OrderEvent(
        timestamp=datetime.now(),
        symbol='AAPL',
        order_type='MARKET',
        quantity=100,
        direction='BUY'
    )
    
    fill = broker.execute_order(order, current_price=150.0, current_time=datetime.now())
    
    assert fill is not None
    assert broker.get_position('AAPL') == 100
    assert broker.get_cash() < 100000  # Cash reduced by purchase
    print("   ✓ Simulated broker working")
except Exception as e:
    print(f"   ✗ Broker error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 6: Data preprocessing
print("\n6. Testing data preprocessing...")
try:
    dates = pd.date_range('2020-01-01', periods=50, freq='D')
    data = pd.DataFrame({
        'Close': 100 + np.cumsum(np.random.randn(50) * 0.5),
        'Volume': np.random.randint(1000, 10000, 50)
    }, index=dates)
    
    # Add some missing values
    data.loc[data.index[10:15], 'Close'] = np.nan
    
    cleaned = clean_data(data, method='forward_fill')
    assert cleaned['Close'].isna().sum() == 0
    
    returns = calculate_returns(cleaned['Close'])
    assert len(returns) == len(cleaned)
    print("   ✓ Data preprocessing working")
except Exception as e:
    print(f"   ✗ Data preprocessing error: {e}")
    sys.exit(1)

print("\n" + "=" * 50)
print("✓ All basic functionality tests passed!")
print("=" * 50)
