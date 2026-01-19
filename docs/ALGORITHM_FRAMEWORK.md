# Algorithm Framework Guide

## Overview

The Algorithm Framework provides a modular architecture for building trading strategies, inspired by QuantConnect's approach. It separates concerns into distinct components, making strategies more maintainable, testable, and reusable.

## Architecture

The framework consists of five main components:

1. **Universe Selection** - Defines which securities to trade
2. **Alpha Models** - Generate trading signals/insights
3. **Portfolio Construction** - Converts insights to target portfolio weights
4. **Execution Models** - Define how to execute portfolio targets
5. **Risk Management** - Apply risk controls and constraints

### Framework Flow

```
Market Data → Universe Selection → Alpha Models → Portfolio Construction → Risk Management → Execution → Orders
```

## Components

### Universe Selection

Universe selection models define which securities should be included in your strategy.

**Base Class:** `UniverseSelection`

**Available Implementations:**
- `ManualUniverse` - Manually specify symbols
- `CoarseUniverse` - Filter by basic criteria (price, volume)

**Example:**
```python
from quantlib.algorithm import ManualUniverse

universe = ManualUniverse(['AAPL', 'MSFT', 'GOOGL'])
```

### Alpha Models

Alpha models generate trading insights (signals) for securities.

**Base Class:** `AlphaModel`

**Key Concepts:**
- `Insight` objects represent trading signals
- Insights have direction (UP, DOWN, FLAT), magnitude, and confidence
- Multiple insights can be generated per bar

**Example:**
```python
from quantlib.algorithm import AlphaModel, Insight, InsightDirection

class MyAlpha(AlphaModel):
    def update(self, context, data):
        insights = []
        # Generate insights based on your logic
        insights.append(Insight(
            symbol='AAPL',
            direction=InsightDirection.UP,
            magnitude=1.0,
            confidence=0.8
        ))
        return insights
```

### Portfolio Construction

Portfolio construction models convert insights into target portfolio weights.

**Base Class:** `PortfolioConstructionModel`

**Available Implementations:**
- `EqualWeightingPortfolio` - Equal weights for all insights
- `TargetPercentPortfolio` - Use insight weights/magnitudes

**Example:**
```python
from quantlib.algorithm import EqualWeightingPortfolio

portfolio = EqualWeightingPortfolio()
```

### Execution Models

Execution models generate orders to achieve portfolio targets.

**Base Class:** `ExecutionModel`

**Available Implementations:**
- `ImmediateExecutionModel` - Execute immediately at market price

**Example:**
```python
from quantlib.algorithm import ImmediateExecutionModel

execution = ImmediateExecutionModel()
```

### Risk Management

Risk management models apply constraints and risk controls.

**Base Class:** `RiskManagementModel`

**Available Implementations:**
- `MaximumDrawdownPercent` - Reduce positions on drawdown
- `MaximumLeverage` - Limit total leverage
- `StopLossModel` - Exit positions at stop-loss

**Example:**
```python
from quantlib.algorithm import MaximumDrawdownPercent

risk = MaximumDrawdownPercent(max_drawdown_pct=0.20)
```

## Using the Framework

### Creating a Framework-Based Strategy

```python
from quantlib.algorithm import (
    AlgorithmFramework,
    ManualUniverse,
    AlphaModel,
    Insight,
    InsightDirection,
    EqualWeightingPortfolio,
    ImmediateExecutionModel,
)

# Define your alpha model
class MyAlpha(AlphaModel):
    def update(self, context, data):
        # Your signal generation logic
        return [Insight(symbol='AAPL', direction=InsightDirection.UP)]

# Assemble the framework
framework = AlgorithmFramework(
    universe=ManualUniverse(['AAPL']),
    alpha=MyAlpha(),
    portfolio=EqualWeightingPortfolio(),
    execution=ImmediateExecutionModel(),
)

# Use with backtesting engine
from quantlib.backtesting import BacktestEngine

engine = BacktestEngine(initial_capital=100000)
results = engine.run(framework, data, symbol='AAPL')
```

### Backtesting with Framework

The backtesting engine automatically detects `AlgorithmFramework` instances and handles them appropriately:

```python
from quantlib.backtesting import BacktestEngine
from quantlib.algorithm import AlgorithmFramework, ManualUniverse, ...

# Create your framework
framework = AlgorithmFramework(...)

# Run backtest (same API as traditional Strategy)
engine = BacktestEngine()
results = engine.run(framework, data, symbol='AAPL')
```

## Migration from Traditional Strategy

### Before (Traditional Strategy)

```python
from quantlib.strategies import Strategy

class MyStrategy(Strategy):
    def initialize(self, context):
        self.symbol = 'AAPL'
    
    def on_data(self, context, data):
        # All logic in one method
        price = data['Close']
        # ... signal generation ...
        # ... portfolio construction ...
        # ... risk management ...
        context.place_order(self.symbol, 100, 'BUY')
```

### After (Framework-Based)

```python
from quantlib.algorithm import (
    AlgorithmFramework,
    ManualUniverse,
    AlphaModel,
    Insight,
    InsightDirection,
    EqualWeightingPortfolio,
)

class MyAlpha(AlphaModel):
    def update(self, context, data):
        # Signal generation only
        return [Insight(symbol='AAPL', direction=InsightDirection.UP)]

framework = AlgorithmFramework(
    universe=ManualUniverse(['AAPL']),
    alpha=MyAlpha(),
    portfolio=EqualWeightingPortfolio(),
)
```

## Benefits

1. **Separation of Concerns** - Each component has a single responsibility
2. **Reusability** - Components can be shared across strategies
3. **Testability** - Components can be tested independently
4. **Flexibility** - Easy to swap components (e.g., different execution models)
5. **Maintainability** - Clear structure makes code easier to understand and modify

## Backward Compatibility

The framework is **optional**. Existing `Strategy` classes continue to work unchanged. You can:

- Continue using traditional `Strategy` classes
- Migrate to framework gradually
- Mix framework and traditional strategies
- Use `FrameworkAdapter` to wrap traditional strategies in framework context

## Best Practices

1. **Keep Alpha Models Focused** - Alpha models should only generate signals, not manage positions
2. **Use Appropriate Portfolio Models** - Choose portfolio construction that matches your strategy's needs
3. **Apply Risk Management** - Always use risk management for production strategies
4. **Handle Universe Changes** - Implement `on_securities_changed` when needed
5. **Document Components** - Document what each component does and why

## Examples

See the strategy library for complete examples:
- `ma_crossover_framework` - Moving average crossover using framework
- Additional examples in `src/quantlib/strategy_library/strategies/`

## Advanced Topics

### Custom Components

You can create custom components by subclassing the base classes:

```python
class MyCustomAlpha(AlphaModel):
    def update(self, context, data):
        # Your custom logic
        pass
```

### Multiple Alpha Models

The framework supports combining multiple alpha models (extend the framework or combine insights before portfolio construction).

### Dynamic Universe

Implement custom universe selection that changes based on market conditions.

## Further Reading

- Strategy Library documentation
- QuantConnect Algorithm Framework documentation (for reference)
- Framework examples in the strategy library
