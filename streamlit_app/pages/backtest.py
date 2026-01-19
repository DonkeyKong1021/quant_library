"""
Backtesting Page

Main page for running backtests with data fetching, strategy configuration,
and results visualization.
"""

import sys
from pathlib import Path

# Add parent directory to path so we can import streamlit_app modules
_parent_dir = Path(__file__).parent.parent.parent
if str(_parent_dir) not in sys.path:
    sys.path.insert(0, str(_parent_dir))

import streamlit as st
import pandas as pd
from streamlit_app.utils.streamlit_helpers import init_session_state
from streamlit_app.components.data_fetcher import data_fetcher_component
from streamlit_app.components.strategy_selector import strategy_selector_component
from streamlit_app.components.backtest_config import backtest_config_component
from streamlit_app.components.results_display import results_display_component
from streamlit_app.components.trade_history import trade_history_component
from quantlib.backtesting import BacktestEngine
from quantlib.data import YahooFinanceFetcher

# Initialize session state
init_session_state()

st.title("📊 Backtesting")

# Workflow progress indicator
def show_progress_indicator():
    """Show visual progress indicator for backtest workflow"""
    steps = [
        ("📥 Data", st.session_state.data is not None),
        ("🎯 Strategy", st.session_state.strategy_type is not None),
        ("⚙️ Config", st.session_state.backtest_config.get('initial_capital', 0) > 0),
        ("🚀 Run", st.session_state.results is not None)
    ]
    
    cols = st.columns(4, gap="small")
    for idx, (label, completed) in enumerate(steps):
        with cols[idx]:
            if completed:
                st.success(f"✓ {label}")
            else:
                st.caption(f"○ {label}")

show_progress_indicator()
st.divider()

# Two-column layout: Configuration left, Preview/Results right
col_left, col_right = st.columns([1.2, 1], gap="large")

with col_left:
    # Data fetching section
    with st.container():
        st.markdown("### 📥 Data")
        data = data_fetcher_component(embed_in_layout=True)
    
    # Only show data metrics if data is available
    data = st.session_state.data if st.session_state.data is not None else None
    
    if data is not None:
        # Quick data info in compact format
        col_info = st.columns(3, gap="small")
        with col_info[0]:
            st.metric("Symbol", st.session_state.selected_symbol or "—")
        with col_info[1]:
            st.metric("Rows", f"{len(data):,}")
        with col_info[2]:
            if len(data) > 0:
                date_span = (data.index[-1] - data.index[0]).days
                st.metric("Days", f"{date_span}")
    
    if data is None:
        st.info("👆 Fetch data above to continue")
    else:
        st.divider()
        
        # Strategy configuration section
        with st.container():
            st.markdown("### 🎯 Strategy")
            strategy = strategy_selector_component()
            
            if strategy is None:
                st.info("👆 Configure strategy to continue")
            else:
                st.divider()
                
                # Backtest configuration section
                with st.container():
                    st.markdown("### ⚙️ Configuration")
                    config = backtest_config_component()
                
                st.divider()
                
                # Run backtest button
                if st.button("🚀 Run Backtest", type="primary", use_container_width=True):
                    if data is None or data.empty:
                        st.error("❌ No data available. Please fetch data first.")
                    elif strategy is None:
                        st.error("❌ No strategy configured. Please configure a strategy first.")
                    else:
                        with st.spinner("⏳ Running backtest... This may take a moment."):
                            try:
                                # Create backtest engine
                                engine = BacktestEngine(
                                    initial_capital=config['initial_capital'],
                                    commission=config['commission'],
                                    slippage=config['slippage'],
                                    commission_type=config.get('commission_type', 'fixed')
                                )
                                
                                # Run backtest with symbol from session state
                                symbol = st.session_state.selected_symbol
                                results = engine.run(strategy, data, symbol=symbol)
                                
                                # Store results in session state
                                st.session_state.results = results
                                
                                st.success("✅ Backtest completed successfully!")
                                st.rerun()
                                
                            except Exception as e:
                                st.error(f"❌ Error running backtest: {str(e)}")
                                with st.expander("🔍 Technical Details"):
                                    st.exception(e)

with col_right:
    st.markdown("### 📊 Preview & Results")
    
    # Show data preview if available
    data = st.session_state.data if st.session_state.data is not None else None
    if data is not None:
        with st.container():
            st.markdown("**📈 Data Summary**")
            summary_cols = st.columns(3, gap="small")
            with summary_cols[0]:
                st.metric("Rows", len(data))
            with summary_cols[1]:
                st.caption(f"Start: {data.index[0].strftime('%Y-%m-%d')}")
            with summary_cols[2]:
                st.caption(f"End: {data.index[-1].strftime('%Y-%m-%d')}")
            
            # Compact data preview table
            with st.expander("📋 View Data Preview", expanded=False):
                st.dataframe(
                    data.head(10),
                    use_container_width=True,
                    height=300
                )
    
    # Show results if available
    if st.session_state.results is not None:
        st.divider()
        results = st.session_state.results
        
        # Quick metrics summary
        with st.container():
            st.markdown("**⚡ Quick Stats**")
            quick_cols = st.columns(2, gap="small")
            with quick_cols[0]:
                total_return = results.get('total_return', 0) * 100
                st.metric("Return", f"{total_return:.2f}%")
            with quick_cols[1]:
                sharpe = results.get('sharpe_ratio', 0)
                st.metric("Sharpe", f"{sharpe:.2f}")
            
            # Show full results (scrollable)
            st.divider()
            strategy_name = st.session_state.strategy_type.replace('_', ' ').title() if st.session_state.strategy_type else "Unknown Strategy"
            symbol = st.session_state.selected_symbol or "Unknown"
            results_display_component(results, data, strategy_name=strategy_name, symbol=symbol)
            
            st.divider()
            trade_history_component(results)
    else:
        # Improved empty state
        if data is None:
            st.info("👆 Fetch data to see preview here")
        else:
            st.info("👆 Configure and run backtest to see results here")
            with st.expander("ℹ️ How to run a backtest"):
                st.markdown("""
                1. **Fetch Data** - Select a symbol and date range in the left column
                2. **Choose Strategy** - Select a built-in strategy and configure parameters
                3. **Set Configuration** - Adjust capital, commission, and slippage settings
                4. **Run Backtest** - Click the "Run Backtest" button to execute
                5. **View Results** - Results will appear here automatically
                """)
