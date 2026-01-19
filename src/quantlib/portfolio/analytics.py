"""Portfolio analytics and metrics"""

from typing import Dict, Optional, List
import pandas as pd
import numpy as np


def calculate_turnover(
    transactions: pd.DataFrame,
    portfolio_values: pd.Series,
    method: str = 'absolute'
) -> Dict[str, float]:
    """
    Calculate portfolio turnover metrics.
    
    Args:
        transactions: DataFrame with transaction history (must have 'total_value' column)
        portfolio_values: Series of portfolio values over time
        method: 'absolute' for sum of buy+sell, 'one_way' for just buys, 'gross' for max(buys, sells)
        
    Returns:
        Dictionary with turnover metrics
    """
    if transactions.empty or portfolio_values.empty:
        return {
            'turnover_rate': 0.0,
            'turnover_ratio': 0.0,
            'total_turnover': 0.0,
            'avg_portfolio_value': 0.0
        }
    
    # Calculate buy and sell volumes
    buys = transactions[transactions['direction'] == 'BUY']['total_value'].sum()
    sells = transactions[transactions['direction'] == 'SELL']['total_value'].sum()
    
    if method == 'absolute':
        total_turnover = buys + sells
    elif method == 'one_way':
        total_turnover = buys
    elif method == 'gross':
        total_turnover = max(buys, sells)
    else:
        total_turnover = buys + sells
    
    # Average portfolio value
    avg_portfolio_value = portfolio_values.mean()
    
    # Turnover ratio (turnover / average portfolio value)
    turnover_ratio = total_turnover / avg_portfolio_value if avg_portfolio_value > 0 else 0.0
    
    # Annualized turnover rate (assuming daily data)
    num_periods = len(portfolio_values)
    if num_periods > 0:
        # Approximate annualization (252 trading days)
        annualized_turnover_rate = turnover_ratio * (252 / num_periods) if num_periods < 252 else turnover_ratio
    else:
        annualized_turnover_rate = 0.0
    
    return {
        'turnover_rate': annualized_turnover_rate,
        'turnover_ratio': turnover_ratio,
        'total_turnover': total_turnover,
        'buy_volume': buys,
        'sell_volume': sells,
        'avg_portfolio_value': avg_portfolio_value
    }


def calculate_diversification(
    positions: Dict[str, int],
    current_prices: Dict[str, float],
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, float]:
    """
    Calculate portfolio diversification metrics.
    
    Args:
        positions: Dictionary of symbol -> quantity
        current_prices: Dictionary of symbol -> current price
        weights: Optional pre-calculated weights (if None, calculated from positions and prices)
        
    Returns:
        Dictionary with diversification metrics
    """
    if not positions or not current_prices:
        return {
            'num_positions': 0,
            'effective_num_positions': 0.0,
            'concentration_index': 0.0,
            'max_weight': 0.0
        }
    
    # Calculate weights if not provided
    if weights is None:
        total_value = sum(
            positions.get(symbol.upper(), 0) * price
            for symbol, price in current_prices.items()
        )
        
        if total_value == 0:
            return {
                'num_positions': len([p for p in positions.values() if p != 0]),
                'effective_num_positions': 0.0,
                'concentration_index': 0.0,
                'max_weight': 0.0
            }
        
        weights = {
            symbol.upper(): (positions.get(symbol.upper(), 0) * price) / total_value
            for symbol, price in current_prices.items()
            if positions.get(symbol.upper(), 0) != 0
        }
    
    # Filter out zero weights
    weights = {k: v for k, v in weights.items() if v > 0}
    
    if not weights:
        return {
            'num_positions': 0,
            'effective_num_positions': 0.0,
            'concentration_index': 0.0,
            'max_weight': 0.0
        }
    
    # Number of positions
    num_positions = len(weights)
    
    # Herfindahl index (sum of squared weights)
    herfindahl_index = sum(w ** 2 for w in weights.values())
    
    # Effective number of positions (inverse of Herfindahl index)
    effective_num_positions = 1.0 / herfindahl_index if herfindahl_index > 0 else 0.0
    
    # Maximum weight
    max_weight = max(weights.values()) if weights else 0.0
    
    return {
        'num_positions': num_positions,
        'effective_num_positions': effective_num_positions,
        'concentration_index': herfindahl_index,
        'max_weight': max_weight,
        'weights': weights
    }


def calculate_concentration(
    positions: Dict[str, int],
    current_prices: Dict[str, float],
    top_n: int = 5
) -> Dict[str, float]:
    """
    Calculate concentration metrics (top N positions).
    
    Args:
        positions: Dictionary of symbol -> quantity
        current_prices: Dictionary of symbol -> current price
        top_n: Number of top positions to analyze
        
    Returns:
        Dictionary with concentration metrics
    """
    if not positions or not current_prices:
        return {
            f'top_{top_n}_concentration': 0.0,
            'top_positions': []
        }
    
    # Calculate position values and weights
    total_value = sum(
        positions.get(symbol.upper(), 0) * price
        for symbol, price in current_prices.items()
    )
    
    if total_value == 0:
        return {
            f'top_{top_n}_concentration': 0.0,
            'top_positions': []
        }
    
    # Calculate weights
    position_values = {
        symbol.upper(): positions.get(symbol.upper(), 0) * current_prices.get(symbol.upper(), 0)
        for symbol in positions
        if positions.get(symbol.upper(), 0) > 0
    }
    
    weights = {symbol: value / total_value for symbol, value in position_values.items()}
    
    # Sort by weight (descending)
    sorted_weights = sorted(weights.items(), key=lambda x: x[1], reverse=True)
    
    # Top N concentration
    top_n_weights = sorted_weights[:top_n]
    top_n_concentration = sum(w for _, w in top_n_weights)
    
    return {
        f'top_{top_n}_concentration': top_n_concentration,
        'top_positions': [
            {'symbol': symbol, 'weight': weight, 'value': position_values.get(symbol, 0)}
            for symbol, weight in top_n_weights
        ]
    }


def analyze_exposure(
    positions: Dict[str, int],
    current_prices: Dict[str, float],
    cash: float
) -> Dict[str, float]:
    """
    Analyze portfolio exposure and leverage.
    
    Args:
        positions: Dictionary of symbol -> quantity
        current_prices: Dictionary of symbol -> current price
        cash: Current cash balance
        
    Returns:
        Dictionary with exposure metrics
    """
    # Calculate position values
    long_positions_value = sum(
        positions.get(symbol.upper(), 0) * price
        for symbol, price in current_prices.items()
        if positions.get(symbol.upper(), 0) > 0
    )
    
    # For now, assume all positions are long (short positions would have negative quantities)
    short_positions_value = abs(sum(
        positions.get(symbol.upper(), 0) * price
        for symbol, price in current_prices.items()
        if positions.get(symbol.upper(), 0) < 0
    ))
    
    total_equity = cash + long_positions_value - short_positions_value
    gross_exposure = long_positions_value + short_positions_value
    net_exposure = long_positions_value - short_positions_value
    
    # Leverage ratio (gross exposure / equity)
    leverage_ratio = gross_exposure / total_equity if total_equity > 0 else 0.0
    
    # Exposure percentages
    long_exposure_pct = (long_positions_value / total_equity * 100) if total_equity > 0 else 0.0
    short_exposure_pct = (short_positions_value / total_equity * 100) if total_equity > 0 else 0.0
    cash_pct = (cash / total_equity * 100) if total_equity > 0 else 0.0
    
    return {
        'total_equity': total_equity,
        'long_exposure': long_positions_value,
        'short_exposure': short_positions_value,
        'gross_exposure': gross_exposure,
        'net_exposure': net_exposure,
        'leverage_ratio': leverage_ratio,
        'long_exposure_pct': long_exposure_pct,
        'short_exposure_pct': short_exposure_pct,
        'cash_pct': cash_pct,
        'cash': cash
    }


def performance_attribution(
    positions: Dict[str, int],
    cost_basis: Dict[str, float],
    current_prices: Dict[str, float],
    portfolio_return: float
) -> Dict[str, Dict]:
    """
    Attribute portfolio performance to individual positions.
    
    Args:
        positions: Dictionary of symbol -> quantity
        cost_basis: Dictionary of symbol -> cost basis per share
        current_prices: Dictionary of symbol -> current price
        portfolio_return: Total portfolio return (as decimal, e.g., 0.10 for 10%)
        
    Returns:
        Dictionary with performance attribution metrics per position
    """
    if not positions:
        return {}
    
    # Calculate total portfolio value
    total_portfolio_value = sum(
        positions.get(symbol.upper(), 0) * current_prices.get(symbol.upper(), 0)
        for symbol in positions
    )
    
    if total_portfolio_value == 0:
        return {}
    
    attribution = {}
    
    for symbol in positions:
        symbol_upper = symbol.upper()
        quantity = positions.get(symbol_upper, 0)
        
        if quantity == 0:
            continue
        
        current_price = current_prices.get(symbol_upper, 0)
        basis = cost_basis.get(symbol_upper, 0)
        
        if basis == 0:
            continue
        
        # Position metrics
        position_value = quantity * current_price
        position_weight = position_value / total_portfolio_value if total_portfolio_value > 0 else 0.0
        position_return = (current_price / basis - 1.0) if basis > 0 else 0.0
        position_pnl = (current_price - basis) * quantity
        
        # Contribution to portfolio return
        contribution_to_return = position_return * position_weight
        
        attribution[symbol_upper] = {
            'weight': position_weight,
            'return': position_return,
            'contribution_to_return': contribution_to_return,
            'pnl': position_pnl,
            'value': position_value
        }
    
    return attribution


def calculate_portfolio_metrics(
    positions: Dict[str, int],
    current_prices: Dict[str, float],
    cash: float,
    weights: Optional[Dict[str, float]] = None
) -> Dict:
    """
    Calculate comprehensive portfolio metrics (convenience function).
    
    Args:
        positions: Dictionary of symbol -> quantity
        current_prices: Dictionary of symbol -> current price
        cash: Current cash balance
        weights: Optional pre-calculated weights
        
    Returns:
        Dictionary with all portfolio metrics
    """
    diversification = calculate_diversification(positions, current_prices, weights)
    concentration = calculate_concentration(positions, current_prices)
    exposure = analyze_exposure(positions, current_prices, cash)
    
    return {
        **diversification,
        **concentration,
        **exposure
    }