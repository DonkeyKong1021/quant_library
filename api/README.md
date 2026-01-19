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
- `GET /api/database/symbols` - List all symbols
- `GET /api/database/statistics` - Database statistics

### Data
- `POST /api/data/fetch` - Fetch market data
- `GET /api/data/preview/{symbol}` - Get data preview

### Backtest
- `POST /api/backtest/run` - Run backtest
- `GET /api/backtest/results/{result_id}` - Get backtest results

### Strategies
- `GET /api/strategies/list` - List available strategies
- `GET /api/strategies/{name}/params` - Get strategy parameters