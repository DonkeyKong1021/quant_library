"""AI-powered backtest insights generation.

This module provides AI interpretation of backtest results, supporting
both OpenAI and Anthropic APIs.
"""

import os
import json
import hashlib
from typing import Optional

import streamlit as st


def _get_ai_client():
    """
    Get an AI client based on available API keys.
    
    Returns:
        tuple: (client, provider_name) or (None, None) if no API key found
    """
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    if openai_key:
        try:
            from openai import OpenAI
            return OpenAI(api_key=openai_key), "openai"
        except ImportError:
            return None, None
    
    if anthropic_key:
        try:
            import anthropic
            return anthropic.Anthropic(api_key=anthropic_key), "anthropic"
        except ImportError:
            return None, None
    
    return None, None


def _build_metrics_summary(
    metrics: dict,
    strategy_name: str,
    symbol: str,
    trades_summary: Optional[dict] = None
) -> str:
    """
    Build a structured summary of metrics for the AI prompt.
    
    Args:
        metrics: Dictionary of backtest metrics
        strategy_name: Name of the strategy
        symbol: Trading symbol
        trades_summary: Optional trade statistics
        
    Returns:
        Formatted string summary
    """
    summary_parts = [
        f"Strategy: {strategy_name}",
        f"Symbol: {symbol}",
        "",
        "=== Performance Metrics ===",
        f"Total Return: {metrics.get('total_return', 0) * 100:.2f}%",
        f"Sharpe Ratio: {metrics.get('sharpe_ratio', 0):.2f}",
        f"Sortino Ratio: {metrics.get('sortino_ratio', 0):.2f}",
        f"Calmar Ratio: {metrics.get('calmar_ratio', 0):.2f}",
        "",
        "=== Risk Metrics ===",
        f"Max Drawdown: {metrics.get('max_drawdown_pct', 0):.2f}%",
        f"Annualized Volatility: {metrics.get('volatility', 0) * 100:.2f}%",
        f"Historical VaR (95%): {metrics.get('var_historical', 0) * 100:.4f}%",
        f"CVaR (Expected Shortfall): {metrics.get('cvar', 0) * 100:.4f}%",
        "",
        "=== Distribution ===",
        f"Skewness: {metrics.get('skewness', 0):.4f}",
        f"Kurtosis: {metrics.get('kurtosis', 0):.4f}",
    ]
    
    if trades_summary:
        summary_parts.extend([
            "",
            "=== Trade Statistics ===",
            f"Total Trades: {trades_summary.get('num_trades', 0)}",
            f"Win Rate: {trades_summary.get('win_rate', 0):.2f}%",
            f"Profit Factor: {trades_summary.get('profit_factor', 0):.2f}",
            f"Average Win: ${trades_summary.get('avg_win', 0):.2f}",
            f"Average Loss: ${trades_summary.get('avg_loss', 0):.2f}",
        ])
    
    # Add capital info if available
    if 'initial_capital' in metrics and 'final_equity' in metrics:
        summary_parts.extend([
            "",
            "=== Capital ===",
            f"Initial Capital: ${metrics.get('initial_capital', 0):,.2f}",
            f"Final Equity: ${metrics.get('final_equity', 0):,.2f}",
        ])
    
    return "\n".join(summary_parts)


def _get_system_prompt() -> str:
    """Get the system prompt for backtest analysis."""
    return """You are a quantitative finance expert analyzing backtest results. 
Provide clear, actionable insights in a structured format.

Be concise and specific. Focus on:
1. What the numbers actually mean for the trader
2. Potential risks or red flags
3. Practical suggestions for improvement

Avoid generic advice. Base all observations on the specific metrics provided.
Use plain language that a retail trader can understand."""


def _get_user_prompt(metrics_summary: str) -> str:
    """Get the user prompt for backtest analysis."""
    return f"""Analyze these backtest results and provide insights:

{metrics_summary}

Respond in this exact JSON format:
{{
    "summary": "2-3 sentence overview of performance",
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "concerns": ["concern 1", "concern 2"],
    "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}}

Keep each bullet point to 1 sentence. Be specific to these metrics."""


def _generate_cache_key(
    metrics: dict,
    strategy_name: str,
    symbol: str,
    trades_summary: Optional[dict]
) -> str:
    """Generate a cache key for the insights request."""
    data = {
        "metrics": {k: float(v) if isinstance(v, (int, float)) else str(v) 
                   for k, v in metrics.items() if isinstance(v, (int, float, str))},
        "strategy": strategy_name,
        "symbol": symbol,
        "trades": trades_summary or {}
    }
    data_str = json.dumps(data, sort_keys=True)
    return hashlib.md5(data_str.encode()).hexdigest()


def _call_openai(client, system_prompt: str, user_prompt: str) -> dict:
    """Call OpenAI API and parse response."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3,
        max_tokens=500,
        timeout=15
    )
    
    content = response.choices[0].message.content
    # Extract JSON from response (handle markdown code blocks)
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]
    
    return json.loads(content.strip())


def _call_anthropic(client, system_prompt: str, user_prompt: str) -> dict:
    """Call Anthropic API and parse response."""
    response = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=500,
        system=system_prompt,
        messages=[
            {"role": "user", "content": user_prompt}
        ]
    )
    
    content = response.content[0].text
    # Extract JSON from response
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]
    
    return json.loads(content.strip())


@st.cache_data(ttl=3600, show_spinner=False)
def generate_backtest_insights(
    _cache_key: str,
    metrics: dict,
    strategy_name: str,
    symbol: str,
    trades_summary: Optional[dict] = None
) -> dict:
    """
    Generate AI insights from backtest results.
    
    Args:
        _cache_key: Cache key for Streamlit caching (underscore prefix = not hashed)
        metrics: Dictionary of backtest metrics
        strategy_name: Name of the strategy used
        symbol: Trading symbol
        trades_summary: Optional dictionary with trade statistics
        
    Returns:
        Dictionary with keys: summary, strengths, concerns, suggestions, error
    """
    client, provider = _get_ai_client()
    
    if client is None:
        return {
            "error": "no_api_key",
            "message": "No AI API key configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to your .env file."
        }
    
    try:
        metrics_summary = _build_metrics_summary(metrics, strategy_name, symbol, trades_summary)
        system_prompt = _get_system_prompt()
        user_prompt = _get_user_prompt(metrics_summary)
        
        if provider == "openai":
            result = _call_openai(client, system_prompt, user_prompt)
        else:
            result = _call_anthropic(client, system_prompt, user_prompt)
        
        # Validate response structure
        required_keys = ["summary", "strengths", "concerns", "suggestions"]
        for key in required_keys:
            if key not in result:
                result[key] = [] if key != "summary" else "Analysis completed."
        
        result["error"] = None
        return result
        
    except json.JSONDecodeError as e:
        return {
            "error": "parse_error",
            "message": f"Failed to parse AI response: {str(e)}"
        }
    except Exception as e:
        return {
            "error": "api_error",
            "message": f"AI API error: {str(e)}"
        }


def get_insights_for_results(
    results: dict,
    strategy_name: str = "Unknown Strategy",
    symbol: str = "Unknown"
) -> dict:
    """
    High-level function to get AI insights for backtest results.
    
    This extracts relevant metrics from the results dict and calls
    the insight generation function.
    
    Args:
        results: Full backtest results dictionary
        strategy_name: Name of the strategy
        symbol: Trading symbol
        
    Returns:
        Dictionary with AI insights or error information
    """
    # Extract metrics from results
    metrics = {
        "total_return": results.get("total_return", 0),
        "sharpe_ratio": results.get("sharpe_ratio", 0),
        "sortino_ratio": results.get("sortino_ratio", 0),
        "calmar_ratio": results.get("calmar_ratio", 0),
        "max_drawdown_pct": results.get("max_drawdown_pct", 0),
        "volatility": results.get("volatility", 0),
        "var_historical": results.get("var_historical", 0),
        "cvar": results.get("cvar", 0),
        "skewness": results.get("skewness", 0),
        "kurtosis": results.get("kurtosis", 0),
        "initial_capital": results.get("initial_capital", 0),
        "final_equity": results.get("final_equity", 0),
    }
    
    # Extract trade summary
    trades_summary = None
    num_trades = results.get("num_trades", 0)
    if num_trades > 0:
        trades_summary = {
            "num_trades": num_trades,
            "win_rate": results.get("win_rate", 0),
            "profit_factor": results.get("profit_factor", 0),
            "avg_win": results.get("avg_win", 0),
            "avg_loss": results.get("avg_loss", 0),
        }
    
    # Generate cache key
    cache_key = _generate_cache_key(metrics, strategy_name, symbol, trades_summary)
    
    return generate_backtest_insights(
        _cache_key=cache_key,
        metrics=metrics,
        strategy_name=strategy_name,
        symbol=symbol,
        trades_summary=trades_summary
    )
