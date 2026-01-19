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
