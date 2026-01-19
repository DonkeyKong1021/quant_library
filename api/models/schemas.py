"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import date, datetime


class DatabaseStatusResponse(BaseModel):
    connected: bool
    message: str


class DatabaseStatisticsResponse(BaseModel):
    total_symbols: int = 0
    total_rows: Optional[int] = None
    avg_rows_per_symbol: Optional[float] = None
    earliest_date: Optional[str] = None
    latest_date: Optional[str] = None
    last_update: Optional[str] = None
    date_span_days: Optional[int] = None
    total_size_gb: Optional[float] = None


class DataFetchRequest(BaseModel):
    symbol: str = Field(..., description="Stock symbol (e.g., AAPL)")
    start_date: str = Field(..., description="Start date (YYYY-MM-DD)")
    end_date: str = Field(..., description="End date (YYYY-MM-DD)")
    use_cache: bool = Field(True, description="Use cached data if available")
    force_refresh: bool = Field(False, description="Force refresh from source (updates only the requested date range)")
    force_refresh_all: bool = Field(False, description="Force refresh ALL data for symbol (deletes all existing data before inserting new data)")
    data_source: Optional[str] = Field(None, description="Data source (yahoo, alpha_vantage, polygon, iex_cloud). Defaults to DEFAULT_DATA_SOURCE env var or 'yahoo'")
    interval: Optional[str] = Field('1d', description="Data interval ('1d', '1h', '1m', '5m', '15m', '30m', '60m', etc.). Default '1d'")


class DataFetchResponse(BaseModel):
    symbol: str
    data: List[Dict[str, Any]]  # DataFrame serialized as list of dicts
    start_date: str
    end_date: str
    row_count: int
    cached: Optional[bool] = None  # Whether data was from cache
    metadata: Optional[Dict[str, Any]] = None  # Additional metadata


class SymbolMetadata(BaseModel):
    symbol: str
    source: str  # "DB", "Ticker", "Common"
    sector: Optional[str] = None
    in_database: bool = False


class AllSymbolsResponse(BaseModel):
    symbols: List[SymbolMetadata]
    common: List[str]
    recent: List[str] = []


class SectorsResponse(BaseModel):
    sectors: Dict[str, List[str]]  # sector name -> list of symbols


class SymbolMetadataResponse(BaseModel):
    symbol: str
    in_database: bool
    available_date_range: Optional[Dict[str, str]] = None  # start, end
    row_count: Optional[int] = None
    last_update: Optional[str] = None


class BacktestRequest(BaseModel):
    data: List[Dict[str, Any]]  # DataFrame serialized as list of dicts
    strategy: Dict[str, Any]  # Strategy name and parameters (or type='custom' with code field)
    config: Dict[str, Any]  # Backtest configuration
    symbol: str


class BacktestResponse(BaseModel):
    result_id: str
    symbol: str
    results: Dict[str, Any]
    equity_curve: List[Dict[str, Any]]
    trades: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    benchmark_equity_curve: Optional[List[Dict[str, Any]]] = None
    benchmark_metrics: Optional[Dict[str, Any]] = None


class StrategyListResponse(BaseModel):
    strategies: List[str]


class StrategyParamsResponse(BaseModel):
    name: str
    parameters: Dict[str, Any]
    description: str


class RecentSymbolsRequest(BaseModel):
    symbols: List[str]


class BacktestResultSummary(BaseModel):
    result_id: str
    symbol: str
    strategy_name: Optional[str] = None
    created_at: Optional[str] = None
    metrics: Dict[str, Any] = {}


class BacktestResultsListResponse(BaseModel):
    results: List[BacktestResultSummary]
    total: int


class BacktestCompareRequest(BaseModel):
    result_ids: List[str] = Field(..., min_items=2, max_items=10, description="List of backtest result IDs to compare")


class ComparisonMetric(BaseModel):
    """Individual metric comparison across backtests"""
    metric_name: str
    values: Dict[str, float]  # result_id -> value
    best: Optional[str] = None  # result_id with best value
    worst: Optional[str] = None  # result_id with worst value


class BacktestCompareResponse(BaseModel):
    """Comparison results for multiple backtests"""
    result_ids: List[str]
    comparisons: List[ComparisonMetric]
    equity_curves: Dict[str, List[Dict[str, Any]]]  # result_id -> equity curve data
    summary: Dict[str, Any]  # Aggregate comparison metrics


class ParameterRange(BaseModel):
    """Parameter range definition for optimization"""
    min: float = Field(..., description="Minimum value")
    max: float = Field(..., description="Maximum value")
    step: Optional[float] = Field(None, description="Step size (for grid search, optional)")
    type: str = Field("float", description="Parameter type: 'int' or 'float'")


class OptimizationRequest(BaseModel):
    """Request for parameter optimization"""
    data: List[Dict[str, Any]]  # DataFrame serialized as list of dicts
    strategy: Dict[str, Any]  # Strategy configuration (type and base params)
    config: Dict[str, Any]  # Backtest configuration
    symbol: str
    parameter_ranges: Dict[str, ParameterRange] = Field(..., description="Parameter ranges to optimize")
    objective: str = Field("sharpe_ratio", description="Objective metric to optimize (sharpe_ratio, sortino_ratio, total_return, etc.)")
    optimization_type: str = Field("grid", description="Optimization type: 'grid' or 'minimize'")
    max_combinations: Optional[int] = Field(100, description="Maximum combinations for grid search")


class OptimizationResult(BaseModel):
    """Single optimization result"""
    parameters: Dict[str, Any]
    metrics: Dict[str, Any]
    result_id: str
    objective_value: float


class OptimizationResponse(BaseModel):
    """Response from parameter optimization"""
    optimization_id: str
    symbol: str
    strategy_name: str
    best_result: OptimizationResult
    all_results: List[OptimizationResult]
    total_runs: int
    optimization_type: str
    objective: str


class WalkForwardRequest(BaseModel):
    """Request for walk-forward analysis"""
    data: List[Dict[str, Any]]  # DataFrame serialized as list of dicts
    strategy: Dict[str, Any]  # Strategy configuration
    config: Dict[str, Any]  # Backtest configuration
    symbol: str
    parameter_ranges: Dict[str, ParameterRange] = Field(..., description="Parameter ranges to optimize")
    train_size: int = Field(252, description="Training period size (e.g., 252 for 1 year of daily data)")
    test_size: int = Field(63, description="Testing period size (e.g., 63 for 1 quarter)")
    step_size: Optional[int] = Field(None, description="Step size (default: test_size)")
    anchor: bool = Field(False, description="If True, expanding training window (anchor), else rolling (fixed)")
    objective: str = Field("sharpe_ratio", description="Objective metric to optimize")


class WalkForwardWindow(BaseModel):
    """Single walk-forward window result"""
    window: int
    train_start_date: str
    train_end_date: str
    test_start_date: str
    test_end_date: str
    optimized_parameters: Dict[str, Any]
    train_metrics: Dict[str, Any]
    test_metrics: Dict[str, Any]


class WalkForwardResponse(BaseModel):
    """Response from walk-forward analysis"""
    walkforward_id: str
    symbol: str
    strategy_name: str
    windows: List[WalkForwardWindow]
    summary: Dict[str, Any]
    train_size: int
    test_size: int
    step_size: int
    anchor: bool
    total_windows: int
