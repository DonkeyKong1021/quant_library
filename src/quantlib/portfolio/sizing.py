"""Position sizing strategies"""

from typing import Optional, Dict
import numpy as np


def fixed_dollar(portfolio_value: float, dollar_amount: float) -> float:
    """
    Fixed dollar amount per trade.
    
    Args:
        portfolio_value: Total portfolio value
        dollar_amount: Dollar amount to allocate
        
    Returns:
        Dollar amount to invest
    """
    return min(dollar_amount, portfolio_value)


def fixed_percent(portfolio_value: float, percent: float) -> float:
    """
    Fixed percentage of portfolio per trade.
    
    Args:
        portfolio_value: Total portfolio value
        percent: Percentage (0.0 to 1.0)
        
    Returns:
        Dollar amount to invest
    """
    if percent < 0 or percent > 1:
        raise ValueError("Percent must be between 0 and 1")
    return portfolio_value * percent


def kelly_criterion(win_rate: float, avg_win: float, avg_loss: float) -> float:
    """
    Kelly Criterion for optimal bet sizing.
    
    Args:
        win_rate: Win rate (0.0 to 1.0)
        avg_win: Average win amount
        avg_loss: Average loss amount (as positive number)
        
    Returns:
        Fraction of portfolio to bet (0.0 to 1.0)
    """
    if avg_loss == 0:
        return 0.0
    
    kelly = (win_rate * avg_win - (1 - win_rate) * avg_loss) / avg_win
    
    # Constrain to reasonable values
    return max(0.0, min(kelly, 1.0))


def volatility_based(
    portfolio_value: float,
    volatility: float,
    risk_target: float = 0.02
) -> float:
    """
    Volatility-based position sizing (ATR-based).
    
    Args:
        portfolio_value: Total portfolio value
        volatility: Volatility measure (e.g., ATR)
        risk_target: Target risk per trade (default 2%)
        
    Returns:
        Dollar amount to invest
    """
    if volatility == 0:
        return 0.0
    
    risk_amount = portfolio_value * risk_target
    position_size = risk_amount / volatility
    
    return min(position_size, portfolio_value)


def equal_weight(universe_size: int, portfolio_value: float) -> float:
    """
    Equal weight allocation across universe.
    
    Args:
        universe_size: Number of assets in universe
        portfolio_value: Total portfolio value
        
    Returns:
        Dollar amount per position
    """
    if universe_size == 0:
        return 0.0
    return portfolio_value / universe_size


def portfolio_aware_sizing(
    portfolio_value: float,
    symbol: str,
    current_positions: Dict[str, int],
    current_prices: Dict[str, float],
    target_weight: float,
    constraints: Optional = None
) -> float:
    """
    Calculate position size considering existing portfolio positions.
    
    Args:
        portfolio_value: Total portfolio value
        symbol: Stock symbol
        current_positions: Current positions dictionary
        current_prices: Current prices dictionary
        target_weight: Target weight for this position (0.0 to 1.0)
        constraints: Optional PortfolioConstraints object
        
    Returns:
        Dollar amount to invest (may be adjusted for constraints)
    """
    symbol_upper = symbol.upper()
    current_price = current_prices.get(symbol_upper, 0.0)
    
    if current_price == 0:
        return 0.0
    
    # Calculate target value
    target_value = portfolio_value * target_weight
    
    # Get current position value
    current_quantity = current_positions.get(symbol_upper, 0)
    current_value = current_quantity * current_price
    
    # Calculate needed adjustment
    adjustment = target_value - current_value
    
    # Apply constraint limits if provided
    if constraints and constraints.max_position_size is not None:
        max_position_value = portfolio_value * constraints.max_position_size
        if target_value > max_position_value:
            adjustment = max_position_value - current_value
    
    # Ensure we don't exceed available cash (simplified check)
    # More sophisticated checks should be done at trade validation time
    if adjustment < 0:
        # Selling - no cash constraint
        return adjustment
    
    return max(0.0, adjustment)


def risk_parity_sizing(
    portfolio_value: float,
    symbol: str,
    volatility: float,
    portfolio_volatility: float,
    target_risk_contribution: float = 0.1
) -> float:
    """
    Risk parity position sizing - size positions to contribute equal risk.
    
    Args:
        portfolio_value: Total portfolio value
        symbol: Stock symbol (for consistency, not used in calculation)
        volatility: Asset volatility (annualized)
        portfolio_volatility: Target portfolio volatility
        target_risk_contribution: Target risk contribution per position
        
    Returns:
        Dollar amount to invest
    """
    if volatility == 0 or portfolio_volatility == 0:
        return 0.0
    
    # Risk contribution = weight * volatility
    # To get equal risk contribution: weight = target_risk / volatility
    target_weight = target_risk_contribution / volatility
    
    # Clamp to reasonable values
    target_weight = max(0.0, min(target_weight, 1.0))
    
    return portfolio_value * target_weight


def adaptive_position_sizing(
    portfolio_value: float,
    symbol: str,
    current_positions: Dict[str, int],
    current_prices: Dict[str, float],
    base_size: float,
    volatility_adjustment: Optional[float] = None,
    constraints: Optional = None
) -> float:
    """
    Adaptive position sizing that considers portfolio state and constraints.
    
    Args:
        portfolio_value: Total portfolio value
        symbol: Stock symbol
        current_positions: Current positions dictionary
        current_prices: Current prices dictionary
        base_size: Base position size (from another sizing method)
        volatility_adjustment: Optional volatility adjustment factor
        constraints: Optional PortfolioConstraints object
        
    Returns:
        Adjusted dollar amount to invest
    """
    # Start with base size
    size = base_size
    
    # Apply volatility adjustment
    if volatility_adjustment is not None and volatility_adjustment > 0:
        size = size / volatility_adjustment
    
    # Get current position
    symbol_upper = symbol.upper()
    current_quantity = current_positions.get(symbol_upper, 0)
    current_price = current_prices.get(symbol_upper, 0.0)
    current_value = current_quantity * current_price
    
    # Calculate adjustment needed
    adjustment = size - current_value
    
    # Apply constraint limits
    if constraints:
        if constraints.max_position_size is not None:
            max_position_value = portfolio_value * constraints.max_position_size
            max_adjustment = max_position_value - current_value
            adjustment = min(adjustment, max_adjustment)
    
    return max(0.0, adjustment)
