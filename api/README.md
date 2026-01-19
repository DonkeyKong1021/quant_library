# QuantLib API

FastAPI REST API backend for the QuantLib quantitative trading library.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quant_library"
```

3. Start the API server:
```bash
uvicorn api.main:app --reload
```

Or use Python directly:
```bash
python -m api.main
```

The API will be available at http://localhost:8000

API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

### Database
- `GET /api/database/status` - Database connection status
- `GET /api/database/symbols` - List all symbols in database
- `GET /api/database/statistics` - Database statistics (symbol count, date ranges, size, etc.)
- `POST /api/database/update-all` - Batch update all tickers from tickers.json

### Data
- `POST /api/data/fetch` - Fetch market data for a symbol
- `GET /api/data/preview/{symbol}` - Get data preview for a symbol
- `GET /api/data/symbols/all` - Get all symbols from all sources (database, tickers.json, common)
- `GET /api/data/symbols/sectors` - Get symbols organized by sectors
- `GET /api/data/metadata/{symbol}` - Get metadata for a symbol (date ranges, availability)
- `POST /api/data/symbols/recent` - Update recent symbols list

### Backtest
- `POST /api/backtest/run` - Run backtest with strategy and configuration
- `GET /api/backtest/results/{result_id}` - Get backtest results by ID
- `GET /api/backtest/results` - List all backtest results (with pagination)
- `PATCH /api/backtest/results/{result_id}` - Update backtest result (e.g., custom name)
- `DELETE /api/backtest/results/{result_id}` - Delete backtest result
- `POST /api/backtest/compare` - Compare multiple backtest results
- `POST /api/backtest/optimize` - Optimize strategy parameters using grid search
- `POST /api/backtest/walkforward` - Run walk-forward analysis
- `POST /api/backtest/insights` - Generate AI insights for backtest results

### Strategies
- `GET /api/strategies/list` - List available built-in strategies
- `GET /api/strategies/{name}/params` - Get strategy parameters definition
- `GET /api/strategies/library` - List all strategies from strategy library
- `GET /api/strategies/library/categories` - Get all strategy categories
- `GET /api/strategies/library/{strategy_id}` - Get detailed strategy information from library
- `GET /api/strategies/library/{strategy_id}/code` - Get strategy code from library
- `POST /api/strategies/generate` - Generate strategy code using AI

### Indicators
- `POST /api/indicators/calculate` - Calculate technical indicators for given data

### Settings
- `GET /api/settings/api-keys` - Get API keys status (masked for security)
- `POST /api/settings/api-keys` - Save API keys (Alpha Vantage, Polygon, OpenAI, Anthropic)

### Issues
- `POST /api/issues/log` - Log an issue to GitHub (requires GITHUB_TOKEN environment variable)

### Health
- `GET /api/health` - Health check endpoint
- `GET /` - API root endpoint