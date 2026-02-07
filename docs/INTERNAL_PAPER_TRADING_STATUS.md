# Paper Trading Implementation Status

> **Note**: This document tracks the implementation status and requirements for the paper trading feature. Checkmarks (✅) indicate implemented components, while unchecked items (❌) indicate missing or incomplete functionality.

## Current State

### What Exists (✅ Implemented)

1. **PaperTradingEngine** (`src/quantlib/live/paper_trading.py`)
   - Basic engine structure with portfolio management
   - Trade execution logic
   - Equity tracking
   - Context object for strategies
   - Support for SimulatedDataStream

2. **DataStream Infrastructure** (`src/quantlib/live/data_stream.py`)
   - Abstract DataStream base class
   - SimulatedDataStream implementation (uses historical data)

3. **API Router Stub** (`api/routers/paper_trading.py`)
   - Basic endpoint structure
   - In-memory session storage
   - CRUD operations (start, stop, list, get)

4. **React UI** (`React_App/src/pages/PaperTrading.jsx`)
   - UI components for session management
   - Service layer for API calls

### What's Missing (❌ Not Implemented)

## Implementation Requirements

### 1. API Router Integration with PaperTradingEngine

**Current Issue**: The API router only stores session metadata in a dictionary but never actually creates or runs a `PaperTradingEngine` instance.

**What Needs to Be Done**:
- Import and instantiate `PaperTradingEngine` in the API router
- Create strategy instances from configuration (reuse `create_strategy` from backtest router)
- Fetch historical data for symbols (reuse data fetching logic)
- Run paper trading engine as a background task
- Store engine instances and manage their lifecycle

**Files to Modify**:
- `api/routers/paper_trading.py`

**Dependencies**:
- Need to import `create_strategy` from `api.routers.backtest`
- Need to import data fetching utilities
- Need background task management (FastAPI BackgroundTasks or asyncio)

### 2. Background Task Management

**Current Issue**: Paper trading sessions need to run continuously in the background, but there's no mechanism for this.

**What Needs to Be Done**:
- Use FastAPI's `BackgroundTasks` or `asyncio` to run paper trading sessions
- Store running engine instances in a way that allows concurrent sessions
- Handle graceful shutdown of background tasks
- Consider using a task queue (Celery) for production, but in-memory is fine for MVP

**Options**:
1. **Simple (MVP)**: Store engines in a global dict, run in background tasks
2. **Production**: Use Celery with Redis/RabbitMQ for distributed task management
3. **Alternative**: Use `asyncio.create_task` to run sessions concurrently

### 3. Data Integration

**Current Issue**: `PaperTradingEngine.start()` requires either a `DataStream` or `historical_data`, but the API router doesn't fetch data.

**What Needs to Be Done**:
- Fetch historical data for requested symbols using `DataStore` (similar to backtest router)
- Convert fetched data to the format expected by `SimulatedDataStream`
- Optionally: Implement real-time data stream (Polygon.io, Alpaca, etc.) for actual real-time paper trading

**Files to Modify**:
- `api/routers/paper_trading.py` - Add data fetching logic
- Consider: `src/quantlib/live/data_stream.py` - Add real-time data stream implementations

### 4. Strategy Interface Compatibility

**Current Issue**: `PaperTradingEngine` expects strategies with `initialize` and `on_data` methods, but the context object structure may not match what strategies expect.

**What Needs to Be Done**:
- Ensure `PaperTradingEngine._create_context()` provides the same interface as backtesting
- The context should have:
  - `portfolio` (Portfolio instance)
  - `current_time` (datetime)
  - `current_prices` (dict of symbol -> price)
  - `place_order(symbol, quantity, direction, order_type)` method
- Verify strategy compatibility (test with existing strategies)

**Files to Modify**:
- `src/quantlib/live/paper_trading.py` - Review and fix context object
- Test with existing strategies from `src/quantlib/strategy_library/`

### 5. Session Persistence

**Current Issue**: Sessions are stored in-memory, which means they're lost on server restart.

**What Needs to Be Done**:
- For MVP: In-memory is acceptable, but document this limitation
- For Production: Store sessions in database (similar to backtest results)
  - Session metadata (id, status, config, created_at, etc.)
  - Running state (can be recovered or marked as "lost" on restart)
  - Consider: Store trades and equity history in database for persistence

**Files to Consider**:
- Database schema similar to backtest results
- Migration script to add paper_trading_sessions table

### 6. Additional API Endpoints

**Current Issue**: Missing endpoints for:
- Get trades for a session
- Get equity curve for a session
- Get current positions
- Get performance metrics

**What Needs to Be Done**:
- Add endpoints:
  - `GET /api/paper-trading/sessions/{session_id}/trades`
  - `GET /api/paper-trading/sessions/{session_id}/equity`
  - `GET /api/paper-trading/sessions/{session_id}/positions`
  - `GET /api/paper-trading/sessions/{session_id}/metrics`

**Files to Modify**:
- `api/routers/paper_trading.py`

### 7. Error Handling and Validation

**Current Issue**: Limited error handling and validation.

**What Needs to Be Done**:
- Validate request payloads (strategy config, symbols, capital)
- Handle strategy creation errors gracefully
- Handle data fetching errors
- Handle engine errors during execution
- Provide meaningful error messages

### 8. Real-time Data Stream (Optional Enhancement)

**Current Issue**: Only `SimulatedDataStream` exists, which uses historical data.

**What Needs to Be Done** (Optional):
- Implement real-time data stream using:
  - Polygon.io WebSocket API
  - Alpaca Market Data API
  - Yahoo Finance (if real-time available)
- Add configuration option to choose between simulated and real-time

**Files to Modify**:
- `src/quantlib/live/data_stream.py` - Add real-time implementations
- `api/routers/paper_trading.py` - Add data source configuration

### 9. Performance Metrics Calculation

**Current Issue**: No metrics calculation for paper trading sessions (similar to backtests).

**What Needs to Be Done**:
- Calculate performance metrics using `RiskCalculator` (similar to backtest router)
- Return metrics in session status endpoint
- Include: Sharpe ratio, max drawdown, total return, win rate, etc.

**Files to Modify**:
- `api/routers/paper_trading.py` - Add metrics calculation

### 10. React UI Enhancements

**Current Issue**: UI exists but may need enhancements once backend is fully implemented.

**Potential Enhancements**:
- Real-time updates (WebSocket or polling)
- Trade history display
- Equity curve chart
- Position display
- Performance metrics display
- Strategy selection UI (reuse from backtest)

**Files to Modify**:
- `React_App/src/pages/PaperTrading.jsx`
- Consider new components:
  - `PaperTradingSessionDetails.jsx`
  - `PaperTradingChart.jsx`

## Implementation Priority

### Phase 1: Core Functionality (MVP)
1. ❌ Integrate PaperTradingEngine with API router
2. ❌ Background task management (simple asyncio approach)
3. ❌ Data fetching integration
4. ❌ Strategy creation integration
5. ❌ Basic error handling

### Phase 2: Enhanced Features
6. ❌ Additional API endpoints (trades, equity, positions, metrics)
7. ❌ Performance metrics calculation
8. ❌ React UI enhancements
9. ❌ Better error handling and validation

### Phase 3: Production Ready
10. ❌ Database persistence
11. ❌ Real-time data streams
12. ❌ Advanced task management (Celery)
13. ❌ Comprehensive testing

## Testing Requirements

1. **Unit Tests**:
   - Test PaperTradingEngine with mock data streams
   - Test context object interface
   - Test trade execution logic

2. **Integration Tests**:
   - Test API endpoints
   - Test strategy integration
   - Test data fetching integration

3. **End-to-End Tests**:
   - Test full paper trading session lifecycle
   - Test with multiple strategies
   - Test error scenarios

## Key Dependencies to Import

```python
# In api/routers/paper_trading.py
from quantlib.live.paper_trading import PaperTradingEngine
from quantlib.live.data_stream import SimulatedDataStream
from quantlib.data import DataStore
from api.routers.backtest import create_strategy
import asyncio
from datetime import datetime, timedelta
```

## Example Implementation Structure

```python
# Store running engines
paper_trading_engines: Dict[str, PaperTradingEngine] = {}

@router.post("/start")
async def start_paper_trading(request: Dict[str, Any]):
    session_id = str(uuid.uuid4())
    
    # Create strategy
    strategy = create_strategy(request.get('strategy'))
    
    # Fetch historical data
    symbols = request.get('symbols', [])
    historical_data = {}
    store = DataStore()
    for symbol in symbols:
        # Fetch recent data (e.g., last 30 days)
        data = store.load(symbol, ...)
        historical_data[symbol] = data
    
    # Create paper trading engine
    config = request.get('config', {})
    engine = PaperTradingEngine(
        initial_capital=request.get('initial_capital', 100000),
        commission=config.get('commission', 1.0),
        slippage=config.get('slippage', 0.0)
    )
    
    # Store engine
    paper_trading_engines[session_id] = engine
    
    # Start in background
    asyncio.create_task(engine.start(strategy, symbols, historical_data))
    
    return {'session_id': session_id, 'status': 'started'}
```

## Notes

- The `PaperTradingEngine` uses async methods, so background tasks should use `asyncio.create_task` or FastAPI's background tasks
- Consider rate limiting for data fetching if using external APIs
- Monitor memory usage with multiple concurrent sessions
- Consider session cleanup (timeout, max sessions, etc.)
