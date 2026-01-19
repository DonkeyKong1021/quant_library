"""
QuantLib Dashboard - Main Streamlit Application

Interactive web dashboard for quantitative trading backtesting.
"""

import sys
from pathlib import Path

# Add parent directory to path so we can import streamlit_app modules
parent_dir = Path(__file__).parent.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

import streamlit as st
import pandas as pd
from streamlit_app.utils.streamlit_helpers import (
    init_session_state, 
    check_database_connection, 
    get_database_symbols,
    get_symbol_metadata,
    get_database_statistics,
    get_database_size
)

# Page configuration
st.set_page_config(
    page_title="QuantLib Dashboard",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
init_session_state()

# Sidebar
with st.sidebar:
    st.markdown("### 🧭 Navigation")
    
    page = st.radio(
        "Select Page",
        ["🏠 Dashboard", "📊 Backtest", "🔧 Strategy Builder", "📈 Data Explorer"],
        label_visibility="collapsed"
    )
    
    st.divider()
    
    # Database status with refresh button
    col_status, col_refresh = st.columns([4, 1])
    
    with col_status:
        db_connected, db_status = check_database_connection()
        if db_connected:
            try:
                db_symbols = get_database_symbols()
                symbol_count = len(db_symbols) if db_symbols else 0
                st.success(f"🗄️ {db_status} • {symbol_count} symbols")
            except Exception:
                st.success(f"🗄️ {db_status}")
        else:
            st.error(f"🗄️ {db_status}")
            st.caption("Some features may be limited")
    
    with col_refresh:
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("🔄", help="Refresh database connection and clear cache", key="refresh_db", use_container_width=True):
            get_database_symbols.clear()
            get_symbol_metadata.clear()
            get_database_statistics.clear()
            get_database_size.clear()
            st.rerun()
    
    st.divider()
    st.markdown("### 📖 About")
    st.caption(
        "QuantLib Dashboard provides:\n"
        "• Market data fetching\n"
        "• Strategy configuration\n"
        "• Backtesting engine\n"
        "• Performance analysis\n"
        "• Data visualization"
    )

# Main title
st.title("📈 QuantLib Trading Dashboard")

# Main content area
if page == "🏠 Dashboard":
    # Welcome section
    col1, col2 = st.columns([1, 1], gap="large")
    
    with col1:
        st.markdown("### 🚀 Quick Start")
        st.markdown("""
        1. Navigate to **Backtest** page
        2. **Fetch Data** - Browse database or enter symbol
        3. **Select Strategy** - Choose built-in or create custom
        4. **Configure Backtest** - Set capital, commission, slippage
        5. **Run Backtest** - Execute and view results
        """)
    
    with col2:
        st.markdown("### 📚 Features")
        st.markdown("""
        • **Data Management** - Yahoo Finance & PostgreSQL
        • **Strategy Library** - Built-in + custom strategies
        • **Interactive Charts** - Plotly visualizations
        • **Performance Metrics** - Comprehensive analytics
        • **Trade Analysis** - Detailed trade history
        """)
    
    st.divider()
    
    # Database Statistics Section
    db_connected, db_status = check_database_connection()
    if db_connected:
        st.markdown("### 🗄️ Database Statistics")
        
        try:
            db_stats = get_database_statistics()
            db_size = get_database_size()
            
            # Main statistics in metrics
            stat_cols = st.columns(6, gap="medium")
            
            with stat_cols[0]:
                st.metric("Total Symbols", f"{db_stats.get('total_symbols', 0):,}")
            
            with stat_cols[1]:
                total_rows = db_stats.get('total_rows', 0)
                if total_rows > 0:
                    st.metric("Total Rows", f"{total_rows:,}")
                else:
                    st.metric("Total Rows", "—")
            
            with stat_cols[2]:
                avg_rows = db_stats.get('avg_rows_per_symbol', 0)
                if avg_rows > 0:
                    st.metric("Avg Rows/Symbol", f"{avg_rows:,.0f}")
                else:
                    st.metric("Avg Rows/Symbol", "—")
            
            with stat_cols[3]:
                earliest = db_stats.get('earliest_date')
                latest = db_stats.get('latest_date')
                if earliest and latest:
                    date_span = (latest - earliest).days
                    st.metric("Date Span", f"{date_span:,} days")
                else:
                    st.metric("Date Span", "—")
            
            with stat_cols[4]:
                last_update = db_stats.get('last_update')
                if last_update:
                    if hasattr(last_update, 'strftime'):
                        time_ago = (pd.Timestamp.now() - last_update).total_seconds()
                        if time_ago < 3600:
                            st.metric("Last Update", f"{int(time_ago/60)} min ago")
                        elif time_ago < 86400:
                            st.metric("Last Update", f"{int(time_ago/3600)} hrs ago")
                        else:
                            st.metric("Last Update", f"{int(time_ago/86400)} days ago")
                    else:
                        st.metric("Last Update", str(last_update)[:10])
                else:
                    st.metric("Last Update", "—")
            
            with stat_cols[5]:
                total_size_gb = db_size.get('total_size_gb', 0)
                if total_size_gb > 0:
                    if total_size_gb < 1:
                        st.metric("Database Size", f"{total_size_gb * 1024:.2f} MB")
                    else:
                        st.metric("Database Size", f"{total_size_gb:.2f} GB")
                else:
                    st.metric("Database Size", "—")
            
            # Additional details in expander
            with st.expander("📊 Detailed Database Information"):
                detail_cols = st.columns(2, gap="large")
                
                with detail_cols[0]:
                    st.markdown("**Date Range**")
                    earliest = db_stats.get('earliest_date')
                    latest = db_stats.get('latest_date')
                    if earliest:
                        if hasattr(earliest, 'strftime'):
                            st.write(f"Earliest: {earliest.strftime('%Y-%m-%d')}")
                        else:
                            st.write(f"Earliest: {str(earliest)[:10]}")
                    else:
                        st.write("Earliest: N/A")
                    if latest:
                        if hasattr(latest, 'strftime'):
                            st.write(f"Latest: {latest.strftime('%Y-%m-%d')}")
                        else:
                            st.write(f"Latest: {str(latest)[:10]}")
                    else:
                        st.write("Latest: N/A")
                    
                    st.markdown("**Last Update**")
                    last_update = db_stats.get('last_update')
                    if last_update:
                        if hasattr(last_update, 'strftime'):
                            st.write(f"Most Recent: {last_update.strftime('%Y-%m-%d %H:%M:%S')}")
                        else:
                            st.write(f"Most Recent: {str(last_update)}")
                    else:
                        st.write("Last Update: N/A")
                
                with detail_cols[1]:
                    st.markdown("**Storage Statistics**")
                    total_symbols = db_stats.get('total_symbols', 0)
                    total_rows = db_stats.get('total_rows', 0)
                    st.write(f"Total Symbols: {total_symbols:,}")
                    st.write(f"Total Rows: {total_rows:,}")
                    st.write(f"Average Rows per Symbol: {db_stats.get('avg_rows_per_symbol', 0):,.0f}")
                    
                    st.markdown("**Database Size**")
                    total_size_gb = db_size.get('total_size_gb', 0)
                    ohlcv_size_gb = db_size.get('ohlcv_table_size_gb', 0)
                    metadata_size_gb = db_size.get('metadata_table_size_gb', 0)
                    
                    if total_size_gb > 0:
                        st.write(f"Total Database: {total_size_gb:.2f} GB")
                        if ohlcv_size_gb > 0:
                            st.write(f"OHLCV Data: {ohlcv_size_gb:.2f} GB ({ohlcv_size_gb/total_size_gb*100:.1f}%)")
                        if metadata_size_gb > 0:
                            st.write(f"Metadata: {metadata_size_gb:.2f} GB ({metadata_size_gb/total_size_gb*100:.1f}%)")
                    else:
                        st.write("Size: Calculating...")
                    
                    # Format breakdown
                    symbols_by_format = db_stats.get('symbols_by_format', {})
                    if symbols_by_format:
                        st.markdown("**Storage Format**")
                        for fmt, count in symbols_by_format.items():
                            st.write(f"{fmt}: {count} symbols")
                    
                    # Show sample symbols
                    if total_symbols > 0:
                        db_symbols = get_database_symbols()
                        if db_symbols and len(db_symbols) > 0:
                            st.markdown("**Sample Symbols**")
                            sample_size = min(10, len(db_symbols))
                            sample_symbols = ", ".join(db_symbols[:sample_size])
                            st.write(sample_symbols)
                            if len(db_symbols) > sample_size:
                                st.caption(f"... and {len(db_symbols) - sample_size} more")
        except Exception as e:
            st.warning(f"Could not load database statistics: {str(e)}")
        
        st.divider()
    
    # Session Status
    st.markdown("### 📊 Current Session")
    
    # Session metrics in cards
    metric_cols = st.columns(4, gap="medium")
    
    with metric_cols[0]:
        with st.container():
            if st.session_state.data is not None:
                st.metric("📊 Symbol", st.session_state.selected_symbol or "N/A")
                st.caption("Data loaded")
            else:
                st.metric("📊 Symbol", "—")
                st.caption("No data")
    
    with metric_cols[1]:
        with st.container():
            if st.session_state.data is not None:
                st.metric("📈 Rows", f"{len(st.session_state.data):,}")
                if len(st.session_state.data) > 0:
                    date_range = f"{st.session_state.data.index[0].strftime('%Y-%m-%d')} to {st.session_state.data.index[-1].strftime('%Y-%m-%d')}"
                    st.caption(date_range)
            else:
                st.metric("📈 Rows", "—")
                st.caption("Fetch data to begin")
    
    with metric_cols[2]:
        with st.container():
            if st.session_state.results is not None:
                total_return = st.session_state.results.get('total_return', 0) * 100
                st.metric("💰 Return", f"{total_return:.2f}%")
                st.caption("Backtest complete")
            else:
                st.metric("💰 Return", "—")
                st.caption("No backtest")
    
    with metric_cols[3]:
        with st.container():
            strategy_name = st.session_state.strategy_type.replace('_', ' ').title() if st.session_state.strategy_type else "None"
            st.metric("⚙️ Strategy", strategy_name)
            if st.session_state.results is None:
                st.caption("Configure & run")

elif page == "📊 Backtest":
    from streamlit_app.pages import backtest

elif page == "🔧 Strategy Builder":
    from streamlit_app.pages import strategy_builder

elif page == "📈 Data Explorer":
    from streamlit_app.pages import data_explorer
