"""Results display component with interactive charts"""

import streamlit as st
import pandas as pd
from streamlit_app.utils.plotly_charts import (
    plot_equity_curve_plotly,
    plot_drawdown_plotly,
    plot_returns_distribution_plotly,
    plot_trades_on_chart,
    plot_monthly_returns_plotly
)
from streamlit_app.components.metrics_table import metrics_table_component


def results_display_component(results: dict, data: pd.DataFrame = None):
    """
    Display backtest results with interactive charts and metrics.
    
    Args:
        results: Backtest results dictionary
        data: Original price data (optional, for trade markers)
    """
    if results is None or not results:
        st.warning("No results to display. Run a backtest first.")
        return
    
    # Metrics table at top
    metrics_table_component(results)
    
    st.divider()
    
    # Charts in organized tabs
    chart_tabs = st.tabs([
        "📊 Equity & Drawdown",
        "📉 Returns Analysis",
        "🔄 Monthly Returns",
        "💹 Trade Analysis"
    ])
    
    equity_curve = results.get('equity_curve')
    returns = results.get('returns')
    trades = results.get('trades', pd.DataFrame())
    
    with chart_tabs[0]:
        col1, col2 = st.columns(2, gap="medium")
        
        with col1:
            if equity_curve is not None and len(equity_curve) > 0:
                try:
                    benchmark_equity = results.get('benchmark_equity')
                    fig_equity = plot_equity_curve_plotly(equity_curve, benchmark=benchmark_equity)
                    st.plotly_chart(fig_equity, use_container_width=True)
                except Exception as e:
                    st.error(f"Error rendering equity curve: {str(e)}")
            else:
                st.info("No equity curve data")
        
        with col2:
            if equity_curve is not None and len(equity_curve) > 0:
                try:
                    fig_dd = plot_drawdown_plotly(equity_curve)
                    st.plotly_chart(fig_dd, use_container_width=True)
                except Exception as e:
                    st.error(f"Error rendering drawdown: {str(e)}")
            else:
                st.info("No drawdown data")
    
    with chart_tabs[1]:
        col1, col2 = st.columns(2, gap="medium")
        
        with col1:
            if returns is not None and len(returns) > 0:
                try:
                    fig_dist = plot_returns_distribution_plotly(returns)
                    st.plotly_chart(fig_dist, use_container_width=True)
                except Exception as e:
                    st.error(f"Error rendering distribution: {str(e)}")
            else:
                st.info("No returns data")
        
        with col2:
            if equity_curve is not None and len(equity_curve) > 0:
                try:
                    cumulative_returns = results.get('cumulative_returns', (equity_curve / equity_curve.iloc[0] - 1))
                    if len(cumulative_returns) > 0:
                        fig_cum = plot_equity_curve_plotly(
                            cumulative_returns * 100,
                            title="Cumulative Returns (%)"
                        )
                        st.plotly_chart(fig_cum, use_container_width=True)
                except Exception as e:
                    st.error(f"Error rendering cumulative returns: {str(e)}")
            else:
                st.info("No cumulative returns data")
    
    with chart_tabs[2]:
        if returns is not None and len(returns) > 0:
            try:
                fig_heatmap = plot_monthly_returns_plotly(returns)
                st.plotly_chart(fig_heatmap, use_container_width=True)
            except Exception as e:
                st.error(f"Error rendering heatmap: {str(e)}")
        else:
            st.info("No returns data for heatmap")
    
    with chart_tabs[3]:
        if data is not None and not trades.empty:
            try:
                price_series = data['Close']
                fig_trades = plot_trades_on_chart(price_series, trades)
                st.plotly_chart(fig_trades, use_container_width=True)
            except Exception as e:
                st.error(f"Error rendering trades: {str(e)}")
        else:
            st.info("No trade data available")
