"""
Strategy endpoints
"""

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from api.models.schemas import (
    StrategyListResponse,
    StrategyParamsResponse,
    StrategyLibraryListResponse,
    StrategyLibraryDetailResponse,
    StrategyLibraryItem,
)

router = APIRouter()

# Try to import strategy library
try:
    from quantlib.strategy_library import get_registry
    STRATEGY_LIBRARY_AVAILABLE = True
except ImportError:
    STRATEGY_LIBRARY_AVAILABLE = False
    get_registry = None

# Strategy definitions
STRATEGIES = {
    "moving_average": {
        "name": "Moving Average Crossover",
        "description": "Uses short and long moving averages to generate buy/sell signals",
        "parameters": {
            "short_window": {"type": "int", "default": 20, "min": 5, "max": 200, "description": "Short moving average period"},
            "long_window": {"type": "int", "default": 50, "min": 10, "max": 200, "description": "Long moving average period"},
        }
    },
    "rsi": {
        "name": "RSI Momentum",
        "description": "Uses RSI indicator with oversold/overbought levels",
        "parameters": {
            "rsi_window": {"type": "int", "default": 14, "min": 5, "max": 50, "description": "RSI calculation period"},
            "rsi_oversold": {"type": "int", "default": 30, "min": 0, "max": 50, "description": "Oversold threshold"},
            "rsi_overbought": {"type": "int", "default": 70, "min": 50, "max": 100, "description": "Overbought threshold"},
        }
    },
    "bollinger_bands": {
        "name": "Bollinger Bands Mean Reversion",
        "description": "Uses Bollinger Bands for mean reversion signals",
        "parameters": {
            "bb_window": {"type": "int", "default": 20, "min": 5, "max": 200, "description": "Bollinger Bands period"},
            "bb_std": {"type": "float", "default": 2.0, "min": 1.0, "max": 5.0, "description": "Number of standard deviations"},
        }
    },
    "macd": {
        "name": "MACD Crossover",
        "description": "Uses MACD line and signal line crossovers",
        "parameters": {
            "macd_fast": {"type": "int", "default": 12, "min": 5, "max": 50, "description": "Fast EMA period"},
            "macd_slow": {"type": "int", "default": 26, "min": 10, "max": 100, "description": "Slow EMA period"},
            "macd_signal": {"type": "int", "default": 9, "min": 5, "max": 50, "description": "Signal line period"},
        }
    },
}


@router.get("/list", response_model=StrategyListResponse)
async def list_strategies():
    """Get list of available strategies"""
    strategy_names = list(STRATEGIES.keys())
    return StrategyListResponse(strategies=strategy_names)


@router.get("/{strategy_name}/params", response_model=StrategyParamsResponse)
async def get_strategy_params(strategy_name: str):
    """Get strategy parameters definition"""
    if strategy_name not in STRATEGIES:
        raise HTTPException(status_code=404, detail=f"Strategy '{strategy_name}' not found")
    
    strategy_def = STRATEGIES[strategy_name]
    
    # Convert parameters to simple dict format
    params_dict = {}
    for param_name, param_def in strategy_def["parameters"].items():
        params_dict[param_name] = {
            "default": param_def["default"],
            "min": param_def.get("min"),
            "max": param_def.get("max"),
            "type": param_def["type"],
            "description": param_def["description"],
        }
    
    return StrategyParamsResponse(
        name=strategy_name,
        parameters=params_dict,
        description=strategy_def["description"]
    )


# Strategy Library Endpoints

@router.get("/library", response_model=StrategyLibraryListResponse)
async def list_library_strategies(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in name, description, tags"),
    tags: Optional[str] = Query(None, description="Comma-separated list of tags to filter by")
):
    """List all strategies in the library"""
    if not STRATEGY_LIBRARY_AVAILABLE:
        return StrategyLibraryListResponse(
            strategies=[],
            categories=[],
            total=0
        )
    
    registry = get_registry()
    
    # Parse tags
    tag_list = [t.strip() for t in tags.split(',')] if tags else None
    
    # Get strategies
    strategies = registry.list_strategies(
        category=category,
        tags=tag_list,
        search=search
    )
    
    # Convert to response format
    strategy_items = [
        StrategyLibraryItem(
            id=s.id,
            name=s.name,
            description=s.description,
            category=s.category,
            tags=s.tags,
            uses_framework=s.uses_framework
        )
        for s in strategies
    ]
    
    # Get categories
    categories = list(registry.get_categories())
    
    return StrategyLibraryListResponse(
        strategies=strategy_items,
        categories=categories,
        total=len(strategy_items)
    )


@router.get("/library/categories")
async def get_library_categories():
    """Get all strategy categories"""
    if not STRATEGY_LIBRARY_AVAILABLE:
        return {"categories": []}
    
    registry = get_registry()
    categories = list(registry.get_categories())
    return {"categories": categories}


@router.get("/library/{strategy_id}", response_model=StrategyLibraryDetailResponse)
async def get_library_strategy(strategy_id: str):
    """Get detailed information about a strategy from the library"""
    if not STRATEGY_LIBRARY_AVAILABLE:
        raise HTTPException(status_code=503, detail="Strategy library not available")
    
    registry = get_registry()
    strategy = registry.get_strategy(strategy_id)
    
    if not strategy:
        raise HTTPException(status_code=404, detail=f"Strategy '{strategy_id}' not found in library")
    
    # Convert parameters to dict format
    params_list = [
        {
            "name": p.name,
            "type": p.type,
            "default": p.default,
            "description": p.description,
            "min": p.min,
            "max": p.max,
            "step": p.step,
            "choices": p.choices,
        }
        for p in strategy.parameters
    ]
    
    return StrategyLibraryDetailResponse(
        id=strategy.id,
        name=strategy.name,
        description=strategy.description,
        category=strategy.category,
        author=strategy.author,
        version=strategy.version,
        parameters=params_list,
        documentation=strategy.documentation,
        references=strategy.references,
        tags=strategy.tags,
        code=strategy.code,
        uses_framework=strategy.uses_framework,
        framework_components=strategy.framework_components
    )


@router.get("/library/{strategy_id}/code")
async def get_library_strategy_code(strategy_id: str):
    """Get strategy code from the library"""
    if not STRATEGY_LIBRARY_AVAILABLE:
        raise HTTPException(status_code=503, detail="Strategy library not available")
    
    registry = get_registry()
    strategy = registry.get_strategy(strategy_id)
    
    if not strategy:
        raise HTTPException(status_code=404, detail=f"Strategy '{strategy_id}' not found in library")
    
    if not strategy.code:
        raise HTTPException(status_code=404, detail=f"Code not available for strategy '{strategy_id}'")
    
    return {
        "id": strategy.id,
        "name": strategy.name,
        "code": strategy.code
    }