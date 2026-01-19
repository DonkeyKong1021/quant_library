"""
Strategy endpoints
"""

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from api.models.schemas import StrategyListResponse, StrategyParamsResponse

router = APIRouter()

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