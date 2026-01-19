# Quick Start Guide

## Installation

The library is installed in editable mode. If you need to reinstall:

```bash
pip install -e .
```

## Running Tests

### Basic Functionality Test (No Network Required)
```bash
python3 test_basic_functionality.py
```

### Test with Sample Data (No Network Required)
```bash
python3 test_with_sample_data.py
```

### Run All Unit Tests
```bash
pytest tests/ -v
```

### Run Tests with Coverage
```bash
pytest tests/ --cov=quantlib --cov-report=html
```

## Running Examples

### Simple Strategy Example
```bash
python3 examples/simple_strategy.py
```

### Moving Average Crossover Example
```bash
python3 examples/moving_average_crossover.py
```

**Note:** Examples require internet connection for Yahoo Finance data.

## Quick Python Test

Test that the library is installed correctly:

```python
python3 -c "import quantlib; print(f'QuantLib {quantlib.__version__} installed successfully')"
```

## Troubleshooting

### ModuleNotFoundError: No module named 'quantlib'

If you get this error, make sure:
1. The library is installed: `pip install -e .`
2. You're using the same Python interpreter that has the library installed
3. You're running scripts from the project root directory

### Yahoo Finance API Errors

If you see errors fetching data from Yahoo Finance:
- Check your internet connection
- Yahoo Finance API may be temporarily unavailable
- Try using the sample data test instead: `python3 test_with_sample_data.py`

### Import Errors

If imports fail:
```bash
# Verify installation
pip show quantlib

# Reinstall if needed
pip install -e . --force-reinstall
```
