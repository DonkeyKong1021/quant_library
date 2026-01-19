"""Performance visualization"""

from typing import Optional
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.gridspec import GridSpec


def plot_equity_curve(
    equity_curve: pd.Series,
    benchmark: Optional[pd.Series] = None,
    log_scale: bool = False
) -> plt.Figure:
    """
    Plot equity curve over time.
    
    Args:
        equity_curve: Equity series
        benchmark: Optional benchmark equity series
        log_scale: Whether to use log scale
        
    Returns:
        Matplotlib Figure
    """
    fig, ax = plt.subplots(figsize=(12, 6))
    
    ax.plot(equity_curve.index, equity_curve.values, label='Equity', linewidth=2)
    
    if benchmark is not None:
        ax.plot(benchmark.index, benchmark.values, label='Benchmark', linewidth=2, alpha=0.7)
    
    if log_scale:
        ax.set_yscale('log')
    
    ax.set_xlabel('Date')
    ax.set_ylabel('Equity')
    ax.set_title('Equity Curve')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    # Format x-axis dates
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')
    
    plt.tight_layout()
    return fig


def plot_drawdown(equity_curve: pd.Series, method: str = 'underwater') -> plt.Figure:
    """
    Plot drawdown chart.
    
    Args:
        equity_curve: Equity series
        method: Method ('underwater' for underwater curve)
        
    Returns:
        Matplotlib Figure
    """
    from quantlib.risk.drawdown import calculate_drawdown, underwater_curve
    
    fig, ax = plt.subplots(figsize=(12, 6))
    
    if method == 'underwater':
        underwater = underwater_curve(equity_curve)
        ax.fill_between(underwater.index, underwater.values, 0, alpha=0.3, color='red')
        ax.plot(underwater.index, underwater.values, linewidth=1.5, color='red')
        ax.axhline(y=0, color='black', linestyle='--', linewidth=1)
    else:
        drawdown = calculate_drawdown(equity_curve)
        ax.fill_between(drawdown.index, drawdown.values, 0, alpha=0.3, color='red')
        ax.plot(drawdown.index, drawdown.values, linewidth=1.5, color='red')
        ax.axhline(y=0, color='black', linestyle='--', linewidth=1)
    
    ax.set_xlabel('Date')
    ax.set_ylabel('Drawdown (%)' if method == 'underwater' else 'Drawdown')
    ax.set_title('Drawdown Chart')
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    return fig


def plot_returns_distribution(
    returns: pd.Series,
    benchmark_returns: Optional[pd.Series] = None
) -> plt.Figure:
    """
    Plot returns distribution histogram.
    
    Args:
        returns: Returns series
        benchmark_returns: Optional benchmark returns
        
    Returns:
        Matplotlib Figure
    """
    fig, ax = plt.subplots(figsize=(10, 6))
    
    ax.hist(returns.values * 100, bins=50, alpha=0.7, label='Strategy', edgecolor='black')
    
    if benchmark_returns is not None:
        ax.hist(benchmark_returns.values * 100, bins=50, alpha=0.7, label='Benchmark', edgecolor='black')
    
    ax.axvline(returns.mean() * 100, color='blue', linestyle='--', linewidth=2, label=f'Mean: {returns.mean()*100:.2f}%')
    ax.set_xlabel('Returns (%)')
    ax.set_ylabel('Frequency')
    ax.set_title('Returns Distribution')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    return fig


def plot_monthly_returns(returns: pd.Series, year_column: bool = True) -> plt.Figure:
    """
    Plot monthly returns heatmap.
    
    Args:
        returns: Returns series (daily)
        year_column: Whether to include year totals column
        
    Returns:
        Matplotlib Figure
    """
    # Resample to monthly
    monthly_returns = returns.resample('M').apply(lambda x: (1 + x).prod() - 1)
    
    # Create pivot table
    monthly_returns.index = pd.to_datetime(monthly_returns.index)
    monthly_returns_df = pd.DataFrame({
        'year': monthly_returns.index.year,
        'month': monthly_returns.index.month,
        'returns': monthly_returns.values
    })
    
    pivot = monthly_returns_df.pivot(index='year', columns='month', values='returns')
    pivot = pivot * 100  # Convert to percentage
    
    fig, ax = plt.subplots(figsize=(12, 8))
    
    im = ax.imshow(pivot.values, cmap='RdYlGn', aspect='auto', vmin=-10, vmax=10)
    
    # Set ticks
    ax.set_xticks(range(12))
    ax.set_xticklabels(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
    ax.set_yticks(range(len(pivot.index)))
    ax.set_yticklabels(pivot.index)
    
    # Add colorbar
    cbar = plt.colorbar(im, ax=ax)
    cbar.set_label('Returns (%)')
    
    ax.set_xlabel('Month')
    ax.set_ylabel('Year')
    ax.set_title('Monthly Returns Heatmap')
    
    plt.tight_layout()
    return fig


def create_tear_sheet(results: dict, benchmark: Optional[pd.Series] = None, save_path: Optional[str] = None) -> plt.Figure:
    """
    Create comprehensive performance tear sheet.
    
    Args:
        results: Backtest results dictionary
        benchmark: Optional benchmark equity series
        save_path: Optional path to save figure
        
    Returns:
        Matplotlib Figure
    """
    from quantlib.risk.metrics import sharpe_ratio
    from quantlib.risk.drawdown import max_drawdown_pct
    
    fig = plt.figure(figsize=(16, 12))
    gs = GridSpec(3, 2, figure=fig, hspace=0.3, wspace=0.3)
    
    equity_curve = results.get('equity_curve', pd.Series())
    returns = results.get('returns', pd.Series())
    
    # Equity curve
    ax1 = fig.add_subplot(gs[0, :])
    ax1.plot(equity_curve.index, equity_curve.values, label='Equity', linewidth=2)
    if benchmark is not None:
        ax1.plot(benchmark.index, benchmark.values, label='Benchmark', linewidth=2, alpha=0.7)
    ax1.set_title('Equity Curve')
    ax1.set_ylabel('Equity')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # Drawdown
    ax2 = fig.add_subplot(gs[1, 0])
    from quantlib.risk.drawdown import underwater_curve
    if not equity_curve.empty:
        underwater = underwater_curve(equity_curve)
        ax2.fill_between(underwater.index, underwater.values, 0, alpha=0.3, color='red')
        ax2.plot(underwater.index, underwater.values, linewidth=1.5, color='red')
    ax2.set_title('Drawdown')
    ax2.set_ylabel('Drawdown (%)')
    ax2.grid(True, alpha=0.3)
    
    # Returns distribution
    ax3 = fig.add_subplot(gs[1, 1])
    if not returns.empty:
        ax3.hist(returns.values * 100, bins=50, alpha=0.7, edgecolor='black')
        ax3.axvline(returns.mean() * 100, color='red', linestyle='--', linewidth=2)
    ax3.set_title('Returns Distribution')
    ax3.set_xlabel('Returns (%)')
    ax3.set_ylabel('Frequency')
    ax3.grid(True, alpha=0.3)
    
    # Metrics table
    ax4 = fig.add_subplot(gs[2, :])
    ax4.axis('off')
    
    if not returns.empty and not equity_curve.empty:
        sharpe = sharpe_ratio(returns)
        max_dd = max_drawdown_pct(equity_curve)
        total_return = results.get('total_return', 0) * 100
        
        metrics_text = f"""
        Performance Metrics
        {'='*50}
        Total Return: {total_return:.2f}%
        Sharpe Ratio: {sharpe:.2f}
        Max Drawdown: {max_dd:.2f}%
        Initial Capital: ${results.get('initial_capital', 0):,.2f}
        Final Equity: ${results.get('final_equity', 0):,.2f}
        Total Trades: {results.get('num_trades', 0)}
        Total Commission: ${results.get('total_commission', 0):,.2f}
        """
        ax4.text(0.1, 0.5, metrics_text, fontsize=12, verticalalignment='center', family='monospace')
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
    
    return fig
