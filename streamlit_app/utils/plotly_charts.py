"""Plotly chart creation functions for Streamlit"""

import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
from typing import Optional
from quantlib.risk.drawdown import calculate_drawdown, underwater_curve
from streamlit_app.utils.chart_utils import adaptive_sample


def plot_equity_curve_plotly(
    equity_curve: pd.Series,
    benchmark: Optional[pd.Series] = None,
    title: str = "Equity Curve",
    max_points: int = 2000
) -> go.Figure:
    """
    Create interactive equity curve chart with Plotly.
    
    Args:
        equity_curve: Equity series
        benchmark: Optional benchmark equity series
        title: Chart title
        max_points: Maximum data points before sampling (default: 2000)
        
    Returns:
        Plotly Figure
    """
    fig = go.Figure()
    
    # Sample data if needed for performance
    sampled_equity = adaptive_sample(equity_curve, max_points)
    
    # Main equity curve
    fig.add_trace(go.Scatter(
        x=sampled_equity.index,
        y=sampled_equity.values,
        mode='lines',
        name='Equity',
        line=dict(width=2, color='#1f77b4'),
        hovertemplate='Date: %{x}<br>Equity: $%{y:,.2f}<extra></extra>'
    ))
    
    # Benchmark if provided
    if benchmark is not None:
        sampled_benchmark = adaptive_sample(benchmark, max_points)
        fig.add_trace(go.Scatter(
            x=sampled_benchmark.index,
            y=sampled_benchmark.values,
            mode='lines',
            name='Benchmark',
            line=dict(width=2, color='#ff7f0e', dash='dash'),
            hovertemplate='Date: %{x}<br>Benchmark: $%{y:,.2f}<extra></extra>'
        ))
    
    fig.update_layout(
        title=title,
        xaxis_title="Date",
        yaxis_title="Equity ($)",
        hovermode='x unified',
        template='plotly_white',
        height=500
    )
    
    return fig


def plot_drawdown_plotly(equity_curve: pd.Series, title: str = "Drawdown", max_points: int = 2000) -> go.Figure:
    """
    Create interactive drawdown chart with Plotly.
    
    Args:
        equity_curve: Equity series
        title: Chart title
        max_points: Maximum data points before sampling (default: 2000)
        
    Returns:
        Plotly Figure
    """
    underwater = underwater_curve(equity_curve)
    
    # Sample data if needed for performance
    sampled_underwater = adaptive_sample(underwater, max_points)
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=sampled_underwater.index,
        y=sampled_underwater.values,
        fill='tozeroy',
        mode='lines',
        name='Drawdown',
        line=dict(color='red', width=2),
        fillcolor='rgba(255, 0, 0, 0.3)',
        hovertemplate='Date: %{x}<br>Drawdown: %{y:.2f}%<extra></extra>'
    ))
    
    # Add zero line
    fig.add_hline(y=0, line_dash="dash", line_color="black", opacity=0.5)
    
    fig.update_layout(
        title=title,
        xaxis_title="Date",
        yaxis_title="Drawdown (%)",
        hovermode='x unified',
        template='plotly_white',
        height=400
    )
    
    return fig


def plot_returns_distribution_plotly(
    returns: pd.Series,
    title: str = "Returns Distribution"
) -> go.Figure:
    """
    Create interactive returns distribution histogram with Plotly.
    
    Args:
        returns: Returns series
        title: Chart title
        
    Returns:
        Plotly Figure
    """
    fig = go.Figure()
    
    # For histograms, we don't need to sample - binning already reduces data
    fig.add_trace(go.Histogram(
        x=returns.values * 100,
        nbinsx=50,
        name='Returns',
        marker_color='#1f77b4',
        hovertemplate='Returns: %{x:.2f}%<br>Frequency: %{y}<extra></extra>'
    ))
    
    # Add mean line
    mean_return = returns.mean() * 100
    fig.add_vline(
        x=mean_return,
        line_dash="dash",
        line_color="red",
        annotation_text=f"Mean: {mean_return:.2f}%"
    )
    
    fig.update_layout(
        title=title,
        xaxis_title="Returns (%)",
        yaxis_title="Frequency",
        template='plotly_white',
        height=400
    )
    
    return fig


def plot_trades_on_chart(
    price_data: pd.Series,
    trades: pd.DataFrame,
    title: str = "Price Chart with Trades",
    max_points: int = 2000
) -> go.Figure:
    """
    Create interactive price chart with trade markers.
    
    Args:
        price_data: Price series
        trades: DataFrame with trade data (columns: timestamp, direction, price, quantity)
        title: Chart title
        max_points: Maximum data points before sampling (default: 2000)
        
    Returns:
        Plotly Figure
    """
    fig = go.Figure()
    
    # Sample price data if needed for performance
    sampled_price = adaptive_sample(price_data, max_points)
    
    # Price line
    fig.add_trace(go.Scatter(
        x=sampled_price.index,
        y=sampled_price.values,
        mode='lines',
        name='Price',
        line=dict(width=2, color='black'),
        hovertemplate='Date: %{x}<br>Price: $%{y:.2f}<extra></extra>'
    ))
    
    # Trade markers
    if not trades.empty and 'timestamp' in trades.columns:
        buy_trades = trades[trades.get('direction', '') == 'BUY']
        sell_trades = trades[trades.get('direction', '') == 'SELL']
        
        if not buy_trades.empty:
            buy_times = pd.to_datetime(buy_trades['timestamp'])
            buy_prices = buy_trades['price']
            fig.add_trace(go.Scatter(
                x=buy_times,
                y=buy_prices,
                mode='markers',
                name='Buy',
                marker=dict(symbol='triangle-up', size=10, color='green'),
                hovertemplate='Date: %{x}<br>Price: $%{y:.2f}<extra></extra>'
            ))
        
        if not sell_trades.empty:
            sell_times = pd.to_datetime(sell_trades['timestamp'])
            sell_prices = sell_trades['price']
            fig.add_trace(go.Scatter(
                x=sell_times,
                y=sell_prices,
                mode='markers',
                name='Sell',
                marker=dict(symbol='triangle-down', size=10, color='red'),
                hovertemplate='Date: %{x}<br>Price: $%{y:.2f}<extra></extra>'
            ))
    
    fig.update_layout(
        title=title,
        xaxis_title="Date",
        yaxis_title="Price ($)",
        hovermode='x unified',
        template='plotly_white',
        height=500
    )
    
    return fig


def plot_monthly_returns_plotly(
    returns: pd.Series,
    title: str = "Monthly Returns Heatmap"
) -> go.Figure:
    """
    Create interactive monthly returns heatmap with Plotly.
    
    Args:
        returns: Returns series (daily)
        title: Chart title
        
    Returns:
        Plotly Figure
    """
    # Resample to monthly
    monthly_returns = returns.resample('ME').apply(lambda x: (1 + x).prod() - 1)
    monthly_returns.index = pd.to_datetime(monthly_returns.index)
    
    # Create pivot table
    monthly_returns_df = pd.DataFrame({
        'year': monthly_returns.index.year,
        'month': monthly_returns.index.month,
        'returns': monthly_returns.values * 100  # Convert to percentage
    })
    
    pivot = monthly_returns_df.pivot(index='year', columns='month', values='returns')
    
    # Create heatmap
    fig = go.Figure(data=go.Heatmap(
        z=pivot.values,
        x=['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        y=pivot.index,
        colorscale='RdYlGn',
        zmid=0,
        text=pivot.values,
        texttemplate='%{text:.1f}%',
        textfont={"size": 10},
        hovertemplate='Year: %{y}<br>Month: %{x}<br>Returns: %{z:.2f}%<extra></extra>'
    ))
    
    fig.update_layout(
        title=title,
        xaxis_title="Month",
        yaxis_title="Year",
        template='plotly_white',
        height=400
    )
    
    return fig
