"""Trade history table component"""

import streamlit as st
import pandas as pd
from datetime import datetime


def trade_history_component(results: dict):
    """
    Display trade history table with filtering and export options.
    
    Args:
        results: Backtest results dictionary
    """
    if results is None:
        st.warning("No results available")
        return
    
    trades = results.get('trades', pd.DataFrame())
    
    if trades is None:
        st.warning("Trade data is None. Strategy may not have executed any trades.")
        return
    
    if trades.empty:
        st.info("No trades to display. The strategy did not generate any trades during the backtest period.")
        return
    
    # Validate trades DataFrame structure
    required_columns = ['timestamp', 'symbol', 'quantity', 'direction', 'price']
    missing_columns = [col for col in required_columns if col not in trades.columns]
    if missing_columns:
        st.error(f"Trade data is missing required columns: {', '.join(missing_columns)}")
        st.dataframe(trades.head(), use_container_width=True)
        return
    
    st.markdown("### 📋 Trade History")
    
    # Convert timestamp to datetime if needed
    if 'timestamp' in trades.columns:
        trades['timestamp'] = pd.to_datetime(trades['timestamp'])
    
    # Filters in compact layout
    filter_cols = st.columns(4, gap="small")
    
    with filter_cols[0]:
        filter_direction = st.selectbox(
            "Direction",
            ["All", "BUY", "SELL"],
            help="Filter by direction"
        )
    
    with filter_cols[1]:
        if 'timestamp' in trades.columns:
            date_range = st.date_input(
                "Date Range",
                value=(trades['timestamp'].min().date(), trades['timestamp'].max().date()),
                help="Filter by date"
            )
        else:
            date_range = None
    
    with filter_cols[2]:
        st.write("")  # Spacing
        export_csv = st.button("📥 Export CSV", use_container_width=True)
    
    with filter_cols[3]:
        st.write("")  # Spacing
    
    # Apply filters
    filtered_trades = trades.copy()
    
    if filter_direction != "All":
        filtered_trades = filtered_trades[filtered_trades['direction'] == filter_direction]
    
    if date_range and isinstance(date_range, tuple) and len(date_range) == 2:
        if date_range[0] and date_range[1]:
            filtered_trades = filtered_trades[
                (filtered_trades['timestamp'].dt.date >= date_range[0]) &
                (filtered_trades['timestamp'].dt.date <= date_range[1])
            ]
    
    # Display filtered trades
    st.dataframe(
        filtered_trades,
        use_container_width=True,
        height=400
    )
    
    # Trade statistics
    if not filtered_trades.empty:
        st.markdown("**📊 Trade Statistics**")
        stat_cols = st.columns(4, gap="small")
        
        with stat_cols[0]:
            st.metric("Total Trades", len(filtered_trades))
        with stat_cols[1]:
            buy_count = len(filtered_trades[filtered_trades['direction'] == 'BUY'])
            st.metric("Buy Orders", buy_count)
        with stat_cols[2]:
            sell_count = len(filtered_trades[filtered_trades['direction'] == 'SELL'])
            st.metric("Sell Orders", sell_count)
        with stat_cols[3]:
            if 'price' in filtered_trades.columns:
                avg_price = filtered_trades['price'].mean()
                st.metric("Avg Price", f"${avg_price:.2f}")
    
    # Export functionality
    if export_csv:
        csv = filtered_trades.to_csv(index=False)
        st.download_button(
            label="📥 Download Filtered Trades",
            data=csv,
            file_name=f"trades_{st.session_state.selected_symbol or 'data'}.csv",
            mime="text/csv",
            key="download_trades_csv"
        )
