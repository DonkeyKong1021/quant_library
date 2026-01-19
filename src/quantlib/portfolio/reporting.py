"""Portfolio reporting utilities"""

from typing import Dict, Optional
import pandas as pd
from datetime import datetime


def generate_portfolio_summary(
    portfolio,
    current_prices: Dict[str, float],
    include_positions: bool = True
) -> Dict:
    """
    Generate a comprehensive portfolio summary report.
    
    Args:
        portfolio: Portfolio object
        current_prices: Dictionary of symbol -> current price
        include_positions: Whether to include detailed position information
        
    Returns:
        Dictionary with portfolio summary
    """
    stats = portfolio.get_portfolio_stats(current_prices)
    
    summary = {
        'portfolio_value': stats['total_equity'],
        'cash': stats['cash'],
        'cash_percentage': stats['cash_pct'],
        'total_return_pct': stats['return_pct'],
        'total_pnl': stats['total_pnl'],
        'realized_pnl': stats['total_realized_pnl'],
        'unrealized_pnl': stats['total_unrealized_pnl'],
        'num_positions': stats['num_positions'],
        'initial_capital': portfolio.initial_cash,
        'diversification': {
            'effective_num_positions': stats.get('effective_num_positions', 0),
            'concentration_index': stats.get('concentration_index', 0),
            'max_weight': stats.get('max_weight', 0)
        },
        'exposure': {
            'leverage_ratio': stats.get('leverage_ratio', 0),
            'long_exposure_pct': stats.get('long_exposure_pct', 0),
            'cash_pct': stats.get('cash_pct', 0)
        }
    }
    
    if include_positions:
        summary['positions'] = stats.get('positions', [])
    
    return summary


def generate_position_report(
    portfolio,
    symbol: str,
    current_price: float
) -> Dict:
    """
    Generate a detailed report for a specific position.
    
    Args:
        portfolio: Portfolio object
        symbol: Stock symbol
        current_price: Current price
        
    Returns:
        Dictionary with position report
    """
    metrics = portfolio.get_position_metrics(symbol, current_price)
    
    report = {
        'symbol': metrics['symbol'],
        'quantity': metrics['quantity'],
        'cost_basis': metrics['cost_basis'],
        'current_price': metrics.get('current_price', 0),
        'current_value': metrics.get('current_value', 0),
        'total_cost': metrics['total_cost'],
        'unrealized_pnl': metrics.get('unrealized_pnl', 0),
        'realized_pnl': metrics['realized_pnl'],
        'total_pnl': metrics.get('total_pnl', metrics['realized_pnl']),
        'return_pct': metrics.get('return_pct', 0),
        'entry_date': metrics['entry_date'],
        'last_trade_date': metrics['last_trade_date'],
        'num_trades': metrics['num_trades']
    }
    
    return report


def generate_performance_attribution_report(
    portfolio,
    current_prices: Dict[str, float],
    portfolio_return: float
) -> pd.DataFrame:
    """
    Generate performance attribution report as DataFrame.
    
    Args:
        portfolio: Portfolio object
        current_prices: Dictionary of symbol -> current price
        portfolio_return: Total portfolio return (as decimal)
        
    Returns:
        DataFrame with performance attribution
    """
    from quantlib.portfolio.analytics import performance_attribution
    
    attribution = performance_attribution(
        portfolio.positions,
        portfolio.cost_basis,
        current_prices,
        portfolio_return
    )
    
    if not attribution:
        return pd.DataFrame()
    
    df = pd.DataFrame(attribution).T
    df.index.name = 'symbol'
    df = df.sort_values('contribution_to_return', ascending=False)
    
    return df


def generate_turnover_report(
    portfolio,
    portfolio_values: pd.Series,
    method: str = 'absolute'
) -> Dict:
    """
    Generate portfolio turnover report.
    
    Args:
        portfolio: Portfolio object
        portfolio_values: Series of portfolio values over time
        method: Turnover calculation method
        
    Returns:
        Dictionary with turnover metrics
    """
    from quantlib.portfolio.analytics import calculate_turnover
    
    transactions = portfolio.get_transaction_history()
    
    if transactions.empty:
        return {
            'turnover_rate': 0.0,
            'turnover_ratio': 0.0,
            'total_turnover': 0.0,
            'message': 'No transactions recorded'
        }
    
    turnover_metrics = calculate_turnover(transactions, portfolio_values, method)
    
    return turnover_metrics


def export_portfolio_to_dataframe(
    portfolio,
    current_prices: Dict[str, float]
) -> pd.DataFrame:
    """
    Export portfolio state to DataFrame for analysis.
    
    Args:
        portfolio: Portfolio object
        current_prices: Dictionary of symbol -> current price
        
    Returns:
        DataFrame with portfolio information
    """
    positions_data = []
    
    for symbol in portfolio.positions:
        symbol_upper = symbol.upper()
        quantity = portfolio.positions[symbol]
        
        if quantity == 0:
            continue
        
        metrics = portfolio.get_position_metrics(symbol_upper, current_prices.get(symbol_upper))
        
        positions_data.append({
            'symbol': symbol_upper,
            'quantity': quantity,
            'cost_basis': metrics['cost_basis'],
            'current_price': metrics.get('current_price', 0),
            'current_value': metrics.get('current_value', 0),
            'unrealized_pnl': metrics.get('unrealized_pnl', 0),
            'realized_pnl': metrics['realized_pnl'],
            'weight': metrics.get('current_value', 0) / portfolio.get_total_equity(current_prices) if portfolio.get_total_equity(current_prices) > 0 else 0
        })
    
    if not positions_data:
        return pd.DataFrame()
    
    df = pd.DataFrame(positions_data)
    df.set_index('symbol', inplace=True)
    df = df.sort_values('current_value', ascending=False)
    
    return df


def generate_portfolio_report(
    portfolio,
    current_prices: Dict[str, float],
    portfolio_values: Optional[pd.Series] = None,
    include_detailed: bool = True
) -> Dict:
    """
    Generate a comprehensive portfolio report with all metrics.
    
    Args:
        portfolio: Portfolio object
        current_prices: Dictionary of symbol -> current price
        portfolio_values: Optional Series of portfolio values over time (for turnover)
        include_detailed: Whether to include detailed position and transaction data
        
    Returns:
        Dictionary with comprehensive portfolio report
    """
    # Summary
    summary = generate_portfolio_summary(portfolio, current_prices, include_detailed)
    
    # Performance attribution
    portfolio_return = summary['total_return_pct'] / 100.0
    attribution_df = generate_performance_attribution_report(
        portfolio, current_prices, portfolio_return
    )
    
    report = {
        'summary': summary,
        'performance_attribution': attribution_df.to_dict('index') if not attribution_df.empty else {}
    }
    
    # Turnover report if portfolio values provided
    if portfolio_values is not None:
        turnover = generate_turnover_report(portfolio, portfolio_values)
        report['turnover'] = turnover
    
    # Detailed exports
    if include_detailed:
        report['positions_dataframe'] = export_portfolio_to_dataframe(portfolio, current_prices)
        
        # Transaction history
        transactions = portfolio.get_transaction_history()
        if not transactions.empty:
            report['transactions'] = transactions.to_dict('index')
        else:
            report['transactions'] = {}
    
    return report
