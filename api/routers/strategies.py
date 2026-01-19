"""
Strategy endpoints
"""

import sys
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

logger = logging.getLogger(__name__)

from api.models.schemas import (
    StrategyListResponse,
    StrategyParamsResponse,
    StrategyLibraryListResponse,
    StrategyLibraryDetailResponse,
    StrategyLibraryItem,
    AIStrategyGenerateRequest,
    AIStrategyGenerateResponse,
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


# ============================================================================
# AI Strategy Generation Endpoint
# ============================================================================

def _get_ai_client():
    """Get an AI client based on available API keys."""
    import os
    
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    if openai_key:
        try:
            from openai import OpenAI
            return OpenAI(api_key=openai_key), "openai"
        except ImportError:
            logger.warning("OpenAI package not installed")
            return None, None
    
    if anthropic_key:
        try:
            import anthropic
            return anthropic.Anthropic(api_key=anthropic_key), "anthropic"
        except ImportError:
            logger.warning("Anthropic package not installed")
            return None, None
    
    return None, None


def _get_strategy_generation_prompt() -> str:
    """Get the system prompt for strategy generation."""
    return """You are an expert quantitative trading strategy developer specializing in Python.

You write trading strategies that inherit from the QuantLib Strategy base class. Your strategies must:
1. Import from quantlib.strategies import Strategy
2. Define a class that inherits from Strategy
3. Implement an initialize method (optional but recommended)
4. Implement an on_data method (required) that receives context and data
5. Use context.order_target_percent(symbol, percentage) to place orders (0.0 = no position, 1.0 = 100% long, -1.0 = 100% short)
6. Use indicators from quantlib.indicators (sma, ema, rsi, bollinger_bands, macd, etc.)

Available indicators:
- sma(series, window) - Simple Moving Average
- ema(series, window) - Exponential Moving Average  
- rsi(series, window) - Relative Strength Index
- bollinger_bands(series, window, num_std) - Returns (upper, middle, lower)
- macd(series, fast, slow, signal) - Returns (macd_line, signal_line, histogram)

Context provides:
- context.symbol - The trading symbol
- context.order_target_percent(symbol, percentage) - Place orders
- context.portfolio - Portfolio state
- context.current_time - Current timestamp

Data is a pandas DataFrame with columns: Open, High, Low, Close, Volume

Write clean, well-commented Python code. Include proper error handling and data validation."""


def _call_ai_strategy_generation(client, provider: str, prompt: str, strategy_type: Optional[str] = None) -> dict:
    """Call AI API to generate strategy code."""
    import json
    import re
    
    system_prompt = _get_strategy_generation_prompt()
    
    user_prompt = f"""Generate a complete Python trading strategy based on this description:

{prompt}

{"Strategy type preference: " + strategy_type if strategy_type else ""}

Provide the code in this exact JSON format:
{{
    "name": "StrategyClassName",
    "description": "Brief description of what the strategy does",
    "code": "complete Python code here with proper imports and class definition"
}}

The code should be a complete, runnable strategy class that follows QuantLib conventions."""

    try:
        if provider == "openai":
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2000,
                timeout=30
            )
            content = response.choices[0].message.content
        else:  # anthropic
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=2000,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )
            content = response.content[0].text
        
        # Extract JSON from response
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```python" in content:
            # If code is in python block, extract it and build response
            code = content.split("```python")[1].split("```")[0].strip()
            # Try to extract class name
            class_match = re.search(r'class\s+(\w+)', code)
            class_name = class_match.group(1) if class_match else "GeneratedStrategy"
            # Convert CamelCase to readable name
            readable_name = re.sub(r'([A-Z])', r' \1', class_name.replace("Strategy", "")).strip()
            return {
                "name": readable_name or "Generated Strategy",
                "description": prompt[:100] + "...",
                "code": code
            }
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        
        result = json.loads(content.strip())
        return result
        
    except json.JSONDecodeError:
        # If JSON parsing fails, try to extract code directly
        code_match = re.search(r'(from quantlib\.strategies import Strategy.*?)(?=\n\n|\Z)', content, re.DOTALL)
        if code_match:
            code = code_match.group(1).strip()
            class_match = re.search(r'class\s+(\w+)', code)
            class_name = class_match.group(1) if class_match else "GeneratedStrategy"
            # Convert CamelCase to readable name
            readable_name = re.sub(r'([A-Z])', r' \1', class_name.replace("Strategy", "")).strip()
            return {
                "name": readable_name or "Generated Strategy",
                "description": prompt[:100] + "...",
                "code": code
            }
        raise


@router.post("/generate", response_model=AIStrategyGenerateResponse)
async def generate_strategy(request: AIStrategyGenerateRequest):
    """
    Generate a trading strategy using AI based on a natural language description.
    
    Requires either OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.
    """
    import json
    import re
    
    client, provider = _get_ai_client()
    
    if client is None:
        return AIStrategyGenerateResponse(
            code="",
            name="",
            description="",
            error="no_api_key",
            message="No AI API key configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to your .env file."
        )
    
    try:
        result = _call_ai_strategy_generation(client, provider, request.prompt, request.strategy_type)
        
        # Validate and clean the code
        code = result.get("code", "").strip()
        if not code:
            raise ValueError("Generated code is empty")
        
        # Ensure it has required imports
        if "from quantlib.strategies import Strategy" not in code:
            code = "from quantlib.strategies import Strategy\n\n" + code
        
        return AIStrategyGenerateResponse(
            code=code,
            name=result.get("name", "Generated Strategy"),
            description=result.get("description", request.prompt[:100]),
            error=None,
            message=None
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response: {e}")
        return AIStrategyGenerateResponse(
            code="",
            name="",
            description="",
            error="parse_error",
            message=f"Failed to parse AI response: {str(e)}"
        )
    except Exception as e:
        logger.error(f"AI API error: {e}")
        return AIStrategyGenerateResponse(
            code="",
            name="",
            description="",
            error="api_error",
            message=f"AI API error: {str(e)}"
        )