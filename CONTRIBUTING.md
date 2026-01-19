# Contributing to QuantLib

Thank you for your interest in contributing to QuantLib! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Python 3.8 or higher
- PostgreSQL (for data storage)
- Node.js 16+ and npm (for React app development, if contributing to frontend)
- Git

### Getting Started

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/yourusername/quant_library.git
   cd quant_library
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   # Install library and dependencies
   pip install -r requirements.txt
   
   # Install in development mode
   pip install -e ".[dev]"
   ```

4. **Set up the database:**
   ```bash
   # Create PostgreSQL database
   createdb quant_library
   
   # Set environment variable
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quant_library"
   
   # Initialize database schema
   python scripts/init_database.py
   ```

5. **Run tests to verify setup:**
   ```bash
   pytest
   ```

### React App Setup (Optional)

If you're contributing to the React frontend:

```bash
cd React_App
npm install
npm run dev
```

## Code Style

### Python

- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Maximum line length: 100 characters
- Use descriptive variable and function names
- Add docstrings to all public functions, classes, and modules

**Example:**
```python
def calculate_sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.0) -> float:
    """
    Calculate the Sharpe ratio for a series of returns.
    
    Args:
        returns: Series of returns
        risk_free_rate: Risk-free rate (default: 0.0)
        
    Returns:
        Sharpe ratio as a float
    """
    # Implementation...
```

### JavaScript/React

- Follow ESLint rules (run `npm run lint` to check)
- Use functional components with hooks
- Use meaningful component and variable names
- Add JSDoc comments for complex functions

## Testing

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=quantlib --cov-report=html

# Run specific test file
pytest tests/test_indicators.py

# Run specific test
pytest tests/test_indicators.py::test_sma
```

### Writing Tests

- Write tests for all new features
- Aim for good test coverage (80%+)
- Use descriptive test names
- Test both success and failure cases
- Use fixtures for common test data

**Example:**
```python
def test_sma_calculation():
    """Test that SMA correctly calculates moving average."""
    dates = pd.date_range('2020-01-01', periods=100, freq='D')
    prices = pd.Series(range(100), index=dates)
    result = sma(prices, window=20)
    assert len(result) == len(prices)
    assert not result.iloc[:19].notna().any()  # First 19 should be NaN
```

## Pull Request Process

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes:**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation as needed
   - Ensure all tests pass

3. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add feature: brief description"
   ```
   
   Use clear, descriptive commit messages:
   - Start with a verb in imperative mood (Add, Fix, Update, Remove)
   - Keep the first line under 72 characters
   - Add more details in the body if needed

4. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request:**
   - Use the PR template (if available)
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure CI checks pass

### PR Checklist

Before submitting a PR, make sure:

- [ ] All tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] New features have tests
- [ ] Commit messages are clear
- [ ] No merge conflicts with main branch

## Project Structure

```
quant_library/
├── src/quantlib/        # Core library code
│   ├── data/           # Data fetching and storage
│   ├── indicators/     # Technical indicators
│   ├── backtesting/    # Backtesting engine
│   ├── portfolio/      # Portfolio management
│   ├── risk/           # Risk metrics
│   ├── strategies/     # Strategy framework
│   └── visualization/  # Charts and plots
├── api/                # FastAPI backend
├── React_App/          # React frontend
├── streamlit_app/      # Streamlit dashboard
├── tests/              # Test files
├── examples/           # Example scripts
└── docs/               # Documentation
```

## Areas for Contribution

We welcome contributions in many areas:

- **New Indicators**: Technical analysis indicators
- **Backtesting Features**: Enhanced simulation capabilities
- **Risk Metrics**: Additional risk calculations
- **Documentation**: Examples, tutorials, API docs
- **Testing**: Improve test coverage
- **Bug Fixes**: Identify and fix issues
- **Performance**: Optimize existing code
- **UI/UX**: Improve React app or Streamlit dashboard
- **Examples**: More strategy examples

## Getting Help

- Open an issue for questions or discussions
- Check existing issues and PRs before creating new ones
- Be respectful and constructive in all interactions

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful and inclusive in all interactions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to QuantLib! 🚀
