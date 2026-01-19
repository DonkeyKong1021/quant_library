"""Performance metrics display component"""

import streamlit as st
import pandas as pd
from quantlib.risk import (
    sharpe_ratio, sortino_ratio, calmar_ratio,
    max_drawdown, max_drawdown_pct,
    alpha, beta, information_ratio
)


def metrics_table_component(results: dict):
    """
    Display performance metrics in a formatted table.
    
    Args:
        results: Backtest results dictionary
    """
    if results is None or not results:
        st.warning("No results to display")
        return
    
    st.markdown("### 📊 Performance Metrics")
    
    returns = results.get('returns')
    equity_curve = results.get('equity_curve')
    
    if returns is None or equity_curve is None:
        st.error("Insufficient data for metrics calculation: Missing returns or equity curve data")
        return
    
    if len(returns) == 0:
        st.warning("No returns data available. Strategy may not have generated any trades.")
        return
    
    if len(equity_curve) == 0:
        st.warning("No equity curve data available.")
        return
    
    # Calculate metrics
    sharpe = sharpe_ratio(returns)
    sortino = sortino_ratio(returns)
    max_dd = max_drawdown(equity_curve)
    max_dd_pct = max_drawdown_pct(equity_curve)
    total_return = results.get('total_return', 0) * 100
    
    # Calculate Calmar ratio
    calmar = calmar_ratio(returns, abs(max_dd_pct / 100)) if max_dd_pct != 0 else 0
    
    # Benchmark metrics (if available)
    benchmark_returns = results.get('benchmark_returns')
    benchmark_symbol = results.get('benchmark_symbol', 'Benchmark')
    alpha_val = None
    beta_val = None
    info_ratio = None
    benchmark_return = None
    
    if benchmark_returns is not None and len(benchmark_returns) > 0:
        try:
            # Align returns for comparison
            common_index = returns.index.intersection(benchmark_returns.index)
            if len(common_index) > 0:
                strategy_ret_aligned = returns.loc[common_index]
                bench_ret_aligned = benchmark_returns.loc[common_index]
                
                alpha_val = alpha(strategy_ret_aligned, bench_ret_aligned)
                beta_val = beta(strategy_ret_aligned, bench_ret_aligned)
                info_ratio = information_ratio(strategy_ret_aligned, bench_ret_aligned)
                benchmark_return = (bench_ret_aligned.mean() * 252) * 100  # Annualized
        except Exception:
            pass  # Skip benchmark metrics if calculation fails
    
    # Trade statistics
    trades_df = results.get('trades', pd.DataFrame())
    num_trades = results.get('num_trades', 0)
    total_commission = results.get('total_commission', 0)
    
    # Display metrics in columns
    if alpha_val is not None:
        # Show benchmark comparison metrics
        st.info(f"📊 Benchmark: {benchmark_symbol}")
        col1, col2, col3, col4, col5 = st.columns(5)
    else:
        col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            "Total Return",
            f"{total_return:.2f}%",
            delta=f"{total_return - benchmark_return:.2f}%" if benchmark_return is not None else None
        )
        st.metric(
            "Sharpe Ratio",
            f"{sharpe:.2f}"
        )
    
    with col2:
        st.metric(
            "Sortino Ratio",
            f"{sortino:.2f}"
        )
        st.metric(
            "Calmar Ratio",
            f"{calmar:.2f}"
        )
    
    with col3:
        st.metric(
            "Max Drawdown",
            f"{max_dd_pct:.2f}%"
        )
        st.metric(
            "Total Trades",
            f"{num_trades}"
        )
    
    with col4:
        st.metric(
            "Initial Capital",
            f"${results.get('initial_capital', 0):,.2f}"
        )
        st.metric(
            "Final Equity",
            f"${results.get('final_equity', 0):,.2f}"
        )
    
    if alpha_val is not None:
        with col5:
            st.metric(
                "Alpha",
                f"{alpha_val:.2f}%"
            )
            st.metric(
                "Beta",
                f"{beta_val:.2f}"
            )
            if benchmark_return is not None:
                st.metric(
                    f"{benchmark_symbol} Return",
                    f"{benchmark_return:.2f}%"
                )
    
    # Benchmark comparison section
    if alpha_val is not None:
        with st.expander("📈 Benchmark Comparison Metrics"):
            col1, col2 = st.columns(2)
            with col1:
                st.write("**Strategy vs Benchmark**")
                st.write(f"- Alpha: {alpha_val:.4f}% (annualized)")
                st.write(f"- Beta: {beta_val:.4f}")
                st.write(f"- Information Ratio: {info_ratio:.4f}")
                if benchmark_return is not None:
                    st.write(f"- Benchmark Return: {benchmark_return:.2f}% (annualized)")
                    st.write(f"- Strategy Return: {total_return:.2f}% (annualized)")
                    st.write(f"- Excess Return: {total_return - benchmark_return:.2f}%")
    
    # Additional metrics
    with st.expander("📈 Detailed Metrics"):
        col1, col2 = st.columns(2)
        
        with col1:
            st.write("**Returns Statistics**")
            st.write(f"- Average Daily Return: {returns.mean()*100:.4f}%")
            st.write(f"- Volatility (Std Dev): {returns.std()*100:.4f}%")
            st.write(f"- Best Day: {returns.max()*100:.2f}%")
            st.write(f"- Worst Day: {returns.min()*100:.2f}%")
        
        with col2:
            st.write("**Trade Statistics**")
            st.write(f"- Total Commission: ${total_commission:,.2f}")
            if not trades_df.empty and 'direction' in trades_df.columns:
                buy_trades = len(trades_df[trades_df['direction'] == 'BUY'])
                sell_trades = len(trades_df[trades_df['direction'] == 'SELL'])
                st.write(f"- Buy Trades: {buy_trades}")
                st.write(f"- Sell Trades: {sell_trades}")
            st.write(f"- Commission per Trade: ${total_commission/num_trades:,.2f}" if num_trades > 0 else "- Commission per Trade: N/A")
