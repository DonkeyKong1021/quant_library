# Strategy Library Guide

## Overview

The Strategy Library is a curated collection of well-documented trading strategies. It provides:

- **Discoverability** - Easy to find strategies by category, tags, or search
- **Documentation** - Each strategy includes documentation, parameters, and examples
- **Metadata** - Rich metadata for filtering and organization
- **Consistency** - Standardized format for strategy information

## Browsing the Library

### Using the API

List all strategies:
```bash
GET /api/strategies/library
```

Get strategy details:
```bash
GET /api/strategies/library/{strategy_id}
```

Search strategies:
```bash
GET /api/strategies/library?search=moving+average
GET /api/strategies/library?category=momentum
GET /api/strategies/library?tags=trend,simple
```

Get categories:
```bash
GET /api/strategies/library/categories
```

### Using Python

```python
from quantlib.strategy_library import get_registry

registry = get_registry()

# List all strategies
strategies = registry.discover_strategies()

# Search strategies
strategies = registry.list_strategies(category='momentum', search='moving')

# Get strategy details
strategy = registry.get_strategy('moving_average_crossover')

# Get categories
categories = registry.get_categories()
```

## Strategy Metadata

Each strategy in the library includes:

- **Basic Information**: id, name, description, category
- **Parameters**: Definitions with types, defaults, ranges
- **Documentation**: Detailed description and usage
- **References**: Papers, articles, books
- **Tags**: Searchable keywords
- **Code**: Strategy implementation
- **Framework Information**: Whether it uses Algorithm Framework

## Strategy Categories

Strategies are organized by category:

- **momentum** - Trend-following strategies
- **mean_reversion** - Mean reversion strategies
- **factor** - Factor-based strategies
- **general** - Other strategies

## Available Strategies

### Momentum Strategies

- **moving_average_crossover** - Classic MA crossover (traditional Strategy)
- **ma_crossover_framework** - MA crossover using Algorithm Framework
- **rsi_strategy** - RSI-based momentum strategy
- **macd_strategy** - MACD crossover strategy

### Mean Reversion Strategies

- **bollinger_bands_strategy** - Bollinger Bands mean reversion

## Using Strategies from the Library

### Via API

```python
import requests

# Get strategy code
response = requests.get('http://localhost:8000/api/strategies/library/moving_average_crossover/code')
code = response.json()['code']

# Use in backtest
# (Implement strategy execution based on code)
```

### Via Python

```python
from quantlib.strategy_library import get_registry
import importlib.util

registry = get_registry()
strategy_meta = registry.get_strategy('moving_average_crossover')

# Load and execute strategy code
# (Implementation depends on your use case)
```

## Contributing Strategies

To add a strategy to the library:

1. **Create Strategy Code** - Write your strategy implementation
2. **Create Metadata File** - JSON or YAML file with strategy metadata
3. **Place in Library** - Put files in `src/quantlib/strategy_library/strategies/{category}/`
4. **Follow Format** - Use the StrategyMetadata schema

### Metadata File Format

```json
{
  "id": "my_strategy",
  "name": "My Strategy",
  "description": "Strategy description",
  "category": "momentum",
  "author": "Your Name",
  "version": "1.0.0",
  "parameters": [
    {
      "name": "param1",
      "type": "int",
      "default": 20,
      "description": "Parameter description",
      "min": 1,
      "max": 100
    }
  ],
  "code_file": "my_strategy.py",
  "documentation": "Detailed documentation...",
  "references": [],
  "tags": ["tag1", "tag2"],
  "uses_framework": false
}
```

## Strategy File Structure

```
strategy_library/strategies/
├── momentum/
│   ├── moving_average_crossover.json
│   ├── moving_average_crossover.py
│   └── ...
├── mean_reversion/
│   └── ...
└── factor/
    └── ...
```

## Framework vs Traditional Strategies

The library includes both:

- **Traditional Strategies** - Use the `Strategy` base class
- **Framework Strategies** - Use the `AlgorithmFramework` architecture

Both work with the backtesting engine. Framework strategies offer more modularity and reusability.

## Best Practices

1. **Document Thoroughly** - Include clear descriptions and examples
2. **Define Parameters** - Specify all parameters with types and ranges
3. **Add References** - Cite papers, books, or sources
4. **Use Tags** - Add relevant tags for discoverability
5. **Test Strategies** - Ensure strategies work before adding to library
6. **Version Control** - Use version numbers for strategy updates

## Integration with Backtesting

Strategies from the library can be used directly with the backtesting engine. The engine supports both traditional `Strategy` classes and `AlgorithmFramework` instances.

## Future Enhancements

- Database storage for strategies
- Strategy versioning
- Performance benchmarks
- Community contributions
- Strategy ratings/reviews
