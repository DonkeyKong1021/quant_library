"""
Data Explorer Page

Comprehensive data exploration and analysis page with technical indicators, 
statistical analysis, and visualization tools.
"""

import sys
from pathlib import Path

# Add parent directory to path so we can import streamlit_app modules
_parent_dir = Path(__file__).parent.parent.parent
if str(_parent_dir) not in sys.path:
    sys.path.insert(0, str(_parent_dir))

import streamlit as st
import pandas as pd
import numpy as np
from streamlit_app.utils.streamlit_helpers import init_session_state
from streamlit_app.components.data_fetcher import data_fetcher_component
from quantlib.indicators import sma, ema, rsi, bollinger_bands, macd
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# Initialize session state
init_session_state()

# Header with modal symbol selector
st.title("📈 Data Explorer")
st.caption("Comprehensive market data analysis with technical indicators, statistics, and visualizations")

# Modal-style symbol selector
data = data_fetcher_component(embed_in_layout=True, modal=True)

if data is None:
    st.info("👆 Please fetch data above to continue")
    st.stop()

st.divider()

# Validate data
if data is None or data.empty:
    st.error("No data available")
    st.stop()

if 'Close' not in data.columns:
    st.error("Data missing 'Close' column")
    st.stop()

close_prices = data['Close']

# Quick Overview Section
st.markdown("### 📊 Quick Overview")

overview_cols = st.columns(5, gap="medium")

with overview_cols[0]:
    st.metric("Current Price", f"${close_prices.iloc[-1]:.2f}")
    price_change = close_prices.iloc[-1] - close_prices.iloc[0]
    price_change_pct = (price_change / close_prices.iloc[0]) * 100
    delta_color = "normal" if price_change >= 0 else "inverse"
    st.metric("Total Change", f"${price_change:.2f}", f"{price_change_pct:.2f}%", delta_color=delta_color)

with overview_cols[1]:
    st.metric("52W High", f"${close_prices.max():.2f}")
    st.metric("52W Low", f"${close_prices.min():.2f}")

with overview_cols[2]:
    returns = close_prices.pct_change().dropna()
    if len(returns) > 0:
        volatility = returns.std() * np.sqrt(252) * 100  # Annualized
        st.metric("Volatility (Annual)", f"{volatility:.2f}%")
        annual_return = returns.mean() * 252 * 100
        st.metric("Annual Return", f"{annual_return:.2f}%")

with overview_cols[3]:
    st.metric("Data Points", f"{len(data):,}")
    date_range = (data.index[-1] - data.index[0]).days
    st.metric("Time Span", f"{date_range} days")

with overview_cols[4]:
    if len(returns) > 0:
        sharpe = (returns.mean() / returns.std()) * np.sqrt(252) if returns.std() > 0 else 0
        st.metric("Sharpe Ratio", f"{sharpe:.2f}")
    max_dd = ((close_prices / close_prices.expanding().max()) - 1).min() * 100
    st.metric("Max Drawdown", f"{max_dd:.2f}%")

st.divider()

# Main Content Tabs
main_tabs = st.tabs([
    "📈 Charts & Indicators",
    "📊 Statistics",
    "📉 Returns Analysis",
    "💹 Volume Analysis",
    "💾 Export"
])

# Tab 1: Charts & Indicators
with main_tabs[0]:
    col_config, col_chart = st.columns([1, 1.5], gap="large")
    
    with col_config:
        st.markdown("### ⚙️ Chart Configuration")
        
        chart_type = st.selectbox(
            "Chart Type",
            ["Line Chart", "Candlestick Chart"],
            help="Chart visualization type"
        )
        
        show_volume = st.checkbox(
            "Show Volume",
            value=True,
            help="Display volume subplot"
        )
        
        st.divider()
        
        # Indicators in expander
        with st.expander("📈 Technical Indicators", expanded=False):
            col1, col2 = st.columns(2)
            
            with col1:
                show_sma = st.checkbox("SMA", key="show_sma")
                if show_sma:
                    sma_window = st.number_input("SMA Window", min_value=5, max_value=200, value=20, key="sma_window")
                
                show_ema = st.checkbox("EMA", key="show_ema")
                if show_ema:
                    ema_window = st.number_input("EMA Window", min_value=5, max_value=200, value=20, key="ema_window")
                
                show_rsi = st.checkbox("RSI", key="show_rsi")
                if show_rsi:
                    rsi_window = st.number_input("RSI Window", min_value=5, max_value=50, value=14, key="rsi_window")
            
            with col2:
                show_bb = st.checkbox("Bollinger Bands", key="show_bb")
                if show_bb:
                    bb_window = st.number_input("BB Window", min_value=5, max_value=200, value=20, key="bb_window")
                
                show_macd = st.checkbox("MACD", key="show_macd")
                if show_macd:
                    col_macd = st.columns(2)
                    with col_macd[0]:
                        macd_fast = st.number_input("Fast", min_value=5, max_value=50, value=12, key="macd_fast")
                    with col_macd[1]:
                        macd_slow = st.number_input("Slow", min_value=10, max_value=100, value=26, key="macd_slow")
    
    with col_chart:
        st.markdown("### 📉 Price Chart")
        
        # Determine subplot configuration
        subplot_count = 1
        if show_rsi:
            subplot_count += 1
        if show_volume:
            subplot_count += 1
        
        # Create subplots
        if subplot_count > 1:
            fig = make_subplots(
                rows=subplot_count,
                cols=1,
                shared_xaxes=True,
                vertical_spacing=0.05,
                subplot_titles=['Price'] + (['RSI'] if show_rsi else []) + (['Volume'] if show_volume else [])
            )
            price_row = 1
            rsi_row = 2 if show_rsi else None
            volume_row = subplot_count if show_volume else None
        else:
            fig = go.Figure()
            price_row = None
        
        # Price chart
        if chart_type == "Line Chart":
            trace = go.Scatter(
                x=data.index,
                y=close_prices.values,
                mode='lines',
                name='Close',
                line=dict(width=2, color='black')
            )
        else:  # Candlestick
            trace = go.Candlestick(
                x=data.index,
                open=data['Open'],
                high=data['High'],
                low=data['Low'],
                close=data['Close'],
                name='Price'
            )
        
        if price_row:
            fig.add_trace(trace, row=price_row, col=1)
        else:
            fig.add_trace(trace)
        
        # Add indicators
        if show_sma:
            sma_values = sma(close_prices, sma_window)
            sma_trace = go.Scatter(
                x=data.index,
                y=sma_values.values,
                mode='lines',
                name=f'SMA({sma_window})',
                line=dict(width=1.5, color='blue')
            )
            if price_row:
                fig.add_trace(sma_trace, row=price_row, col=1)
            else:
                fig.add_trace(sma_trace)
        
        if show_ema:
            ema_values = ema(close_prices, ema_window)
            ema_trace = go.Scatter(
                x=data.index,
                y=ema_values.values,
                mode='lines',
                name=f'EMA({ema_window})',
                line=dict(width=1.5, color='orange')
            )
            if price_row:
                fig.add_trace(ema_trace, row=price_row, col=1)
            else:
                fig.add_trace(ema_trace)
        
        if show_bb:
            bb = bollinger_bands(close_prices, bb_window)
            if price_row:
                fig.add_trace(go.Scatter(
                    x=data.index,
                    y=bb['upper'].values,
                    mode='lines',
                    name='BB Upper',
                    line=dict(width=1, color='gray', dash='dash'),
                    showlegend=False
                ), row=price_row, col=1)
                fig.add_trace(go.Scatter(
                    x=data.index,
                    y=bb['middle'].values,
                    mode='lines',
                    name='BB Middle',
                    line=dict(width=1, color='gray', dash='dot')
                ), row=price_row, col=1)
                fig.add_trace(go.Scatter(
                    x=data.index,
                    y=bb['lower'].values,
                    mode='lines',
                    name='BB Lower',
                    line=dict(width=1, color='gray', dash='dash'),
                    showlegend=False,
                    fill='tonexty',
                    fillcolor='rgba(128,128,128,0.1)'
                ), row=price_row, col=1)
            else:
                fig.add_trace(go.Scatter(
                    x=data.index,
                    y=bb['upper'].values,
                    mode='lines',
                    name='BB Upper',
                    line=dict(width=1, color='gray', dash='dash'),
                    showlegend=False
                ))
                fig.add_trace(go.Scatter(
                    x=data.index,
                    y=bb['middle'].values,
                    mode='lines',
                    name='BB Middle',
                    line=dict(width=1, color='gray', dash='dot')
                ))
                fig.add_trace(go.Scatter(
                    x=data.index,
                    y=bb['lower'].values,
                    mode='lines',
                    name='BB Lower',
                    line=dict(width=1, color='gray', dash='dash'),
                    showlegend=False,
                    fill='tonexty',
                    fillcolor='rgba(128,128,128,0.1)'
                ))
        
        if show_macd:
            macd_result = macd(close_prices, macd_fast, macd_slow, 9)
            if price_row:
                fig.add_trace(go.Scatter(
                    x=data.index,
                    y=macd_result['macd'].values,
                    mode='lines',
                    name='MACD',
                    line=dict(width=1.5, color='blue')
                ), row=price_row, col=1)
                fig.add_trace(go.Scatter(
                    x=data.index,
                    y=macd_result['signal'].values,
                    mode='lines',
                    name='Signal',
                    line=dict(width=1.5, color='red')
                ), row=price_row, col=1)
            else:
                fig.add_trace(go.Scatter(
                    x=data.index,
                    y=macd_result['macd'].values,
                    mode='lines',
                    name='MACD',
                    line=dict(width=1.5, color='blue')
                ))
                fig.add_trace(go.Scatter(
                    x=data.index,
                    y=macd_result['signal'].values,
                    mode='lines',
                    name='Signal',
                    line=dict(width=1.5, color='red')
                ))
        
        # RSI subplot
        if show_rsi:
            rsi_values = rsi(close_prices, rsi_window)
            rsi_trace = go.Scatter(
                x=data.index,
                y=rsi_values.values,
                mode='lines',
                name=f'RSI({rsi_window})',
                line=dict(width=2, color='purple')
            )
            fig.add_trace(rsi_trace, row=rsi_row, col=1)
            fig.add_hline(y=70, line_dash="dash", line_color="red", opacity=0.5, row=rsi_row, col=1)
            fig.add_hline(y=30, line_dash="dash", line_color="green", opacity=0.5, row=rsi_row, col=1)
        
        # Volume subplot
        if show_volume:
            volume_trace = go.Bar(
                x=data.index,
                y=data['Volume'].values,
                name='Volume',
                marker_color='lightblue'
            )
            fig.add_trace(volume_trace, row=volume_row, col=1)
        
        # Update layout
        symbol_name = st.session_state.selected_symbol or 'Price'
        fig.update_layout(
            title=f"{symbol_name} Price Chart with Indicators",
            height=600,
            hovermode='x unified',
            template='plotly_white',
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )
        
        if price_row:
            fig.update_yaxes(title_text="Price ($)", row=price_row, col=1)
        if rsi_row:
            fig.update_yaxes(title_text="RSI", range=[0, 100], row=rsi_row, col=1)
        if volume_row:
            fig.update_yaxes(title_text="Volume", row=volume_row, col=1)
        
        st.plotly_chart(fig, use_container_width=True)

# Tab 2: Statistics
with main_tabs[1]:
    st.markdown("### 📊 Comprehensive Statistics")
    
    stat_cols = st.columns(3, gap="large")
    
    with stat_cols[0]:
        st.markdown("**Price Statistics**")
        price_stats = data[['Open', 'High', 'Low', 'Close']].describe()
        st.dataframe(price_stats, use_container_width=True)
        
        # Additional price metrics
        st.markdown("**Additional Metrics**")
        st.write(f"Current Price: ${close_prices.iloc[-1]:.2f}")
        st.write(f"Price Range: ${close_prices.min():.2f} - ${close_prices.max():.2f}")
        st.write(f"Average Price: ${close_prices.mean():.2f}")
        st.write(f"Median Price: ${close_prices.median():.2f}")
    
    with stat_cols[1]:
        st.markdown("**Volume Statistics**")
        if 'Volume' in data.columns:
            vol_stats = data[['Volume']].describe()
            st.dataframe(vol_stats, use_container_width=True)
            
            st.markdown("**Volume Metrics**")
            st.write(f"Average Volume: {data['Volume'].mean():,.0f}")
            st.write(f"Max Volume: {data['Volume'].max():,.0f}")
            st.write(f"Min Volume: {data['Volume'].min():,.0f}")
            st.write(f"Total Volume: {data['Volume'].sum():,.0f}")
        else:
            st.info("No volume data available")
    
    with stat_cols[2]:
        st.markdown("**Returns Statistics**")
        returns = data['Close'].pct_change().dropna()
        if len(returns) > 0:
            returns_df = pd.DataFrame({
                'Statistic': ['Mean', 'Std Dev', 'Min', 'Max', 'Skewness', 'Kurtosis', 'Count'],
                'Value': [
                    f"{returns.mean()*100:.4f}%",
                    f"{returns.std()*100:.4f}%",
                    f"{returns.min()*100:.2f}%",
                    f"{returns.max()*100:.2f}%",
                    f"{returns.skew():.4f}",
                    f"{returns.kurtosis():.4f}",
                    f"{len(returns):,}"
                ]
            })
            st.dataframe(returns_df, use_container_width=True, hide_index=True)
            
            st.markdown("**Performance Metrics**")
            annual_return = returns.mean() * 252 * 100
            volatility = returns.std() * np.sqrt(252) * 100
            sharpe = (returns.mean() / returns.std()) * np.sqrt(252) if returns.std() > 0 else 0
            st.write(f"Annual Return: {annual_return:.2f}%")
            st.write(f"Annual Volatility: {volatility:.2f}%")
            st.write(f"Sharpe Ratio: {sharpe:.2f}")
        else:
            st.info("Insufficient data for returns")
    
    # Data preview
    st.divider()
    st.markdown("### 📋 Data Preview")
    st.dataframe(data.head(20), use_container_width=True, height=400)

# Tab 3: Returns Analysis
with main_tabs[2]:
    st.markdown("### 📈 Returns Analysis")
    
    returns = data['Close'].pct_change().dropna()
    
    if len(returns) > 0:
        # Metrics row
        metric_cols = st.columns(5, gap="medium")
        with metric_cols[0]:
            st.metric("Avg Daily Return", f"{returns.mean()*100:.4f}%")
        with metric_cols[1]:
            annual_return = returns.mean() * 252 * 100
            st.metric("Annual Return", f"{annual_return:.2f}%")
        with metric_cols[2]:
            volatility = returns.std() * np.sqrt(252) * 100
            st.metric("Volatility", f"{volatility:.2f}%")
        with metric_cols[3]:
            sharpe = (returns.mean() / returns.std()) * np.sqrt(252) if returns.std() > 0 else 0
            st.metric("Sharpe Ratio", f"{sharpe:.2f}")
        with metric_cols[4]:
            negative_returns = returns[returns < 0]
            if len(negative_returns) > 0 and negative_returns.std() > 0:
                sortino = (returns.mean() / negative_returns.std()) * np.sqrt(252)
            else:
                sortino = 0
            st.metric("Sortino Ratio", f"{sortino:.2f}")
        
        st.divider()
        
        # Charts
        chart_cols = st.columns(2, gap="medium")
        
        with chart_cols[0]:
            # Returns distribution
            fig_dist = go.Figure()
            fig_dist.add_trace(go.Histogram(
                x=returns.values * 100,
                nbinsx=50,
                name='Daily Returns',
                marker_color='blue',
                opacity=0.7
            ))
            # Add mean line
            mean_return = returns.mean() * 100
            fig_dist.add_vline(
                x=mean_return,
                line_dash="dash",
                line_color="red",
                annotation_text=f"Mean: {mean_return:.2f}%"
            )
            fig_dist.update_layout(
                title="Returns Distribution (%)",
                xaxis_title="Daily Return (%)",
                yaxis_title="Frequency",
                template='plotly_white',
                height=400
            )
            st.plotly_chart(fig_dist, use_container_width=True)
        
        with chart_cols[1]:
            # Cumulative returns
            cumulative_returns = (1 + returns).cumprod() - 1
            fig_cum = go.Figure()
            fig_cum.add_trace(go.Scatter(
                x=cumulative_returns.index,
                y=cumulative_returns.values * 100,
                mode='lines',
                name='Cumulative Returns',
                line=dict(width=2, color='green'),
                fill='tozeroy',
                fillcolor='rgba(0,255,0,0.1)'
            ))
            fig_cum.update_layout(
                title="Cumulative Returns (%)",
                xaxis_title="Date",
                yaxis_title="Cumulative Return (%)",
                template='plotly_white',
                height=400
            )
            st.plotly_chart(fig_cum, use_container_width=True)
        
        # Additional analysis
        st.divider()
        st.markdown("### 📊 Return Periods Analysis")
        
        period_cols = st.columns(3, gap="medium")
        
        with period_cols[0]:
            st.markdown("**Best/Worst Days**")
            best_day = returns.idxmax()
            worst_day = returns.idxmin()
            st.write(f"Best: {returns.max()*100:.2f}% on {best_day.strftime('%Y-%m-%d')}")
            st.write(f"Worst: {returns.min()*100:.2f}% on {worst_day.strftime('%Y-%m-%d')}")
            st.write(f"Positive Days: {len(returns[returns > 0])} ({len(returns[returns > 0])/len(returns)*100:.1f}%)")
            st.write(f"Negative Days: {len(returns[returns < 0])} ({len(returns[returns < 0])/len(returns)*100:.1f}%)")
        
        with period_cols[1]:
            st.markdown("**Return Ranges**")
            st.write(f"Mean: {returns.mean()*100:.4f}%")
            st.write(f"Median: {returns.median()*100:.4f}%")
            st.write(f"Std Dev: {returns.std()*100:.4f}%")
            st.write(f"Skewness: {returns.skew():.4f}")
            st.write(f"Kurtosis: {returns.kurtosis():.4f}")
        
        with period_cols[2]:
            st.markdown("**Risk Metrics**")
            max_dd = ((close_prices / close_prices.expanding().max()) - 1).min() * 100
            st.write(f"Max Drawdown: {max_dd:.2f}%")
            var_95 = returns.quantile(0.05) * 100
            st.write(f"VaR (95%): {var_95:.2f}%")
            cvar_95 = returns[returns <= returns.quantile(0.05)].mean() * 100
            st.write(f"CVaR (95%): {cvar_95:.2f}%")
    else:
        st.info("Insufficient data for returns analysis")

# Tab 4: Volume Analysis
with main_tabs[3]:
    st.markdown("### 📉 Volume Analysis")
    
    if 'Volume' in data.columns:
        # Metrics
        vol_metric_cols = st.columns(4, gap="medium")
        with vol_metric_cols[0]:
            st.metric("Average Volume", f"{data['Volume'].mean():,.0f}")
        with vol_metric_cols[1]:
            st.metric("Max Volume", f"{data['Volume'].max():,.0f}")
        with vol_metric_cols[2]:
            st.metric("Min Volume", f"{data['Volume'].min():,.0f}")
        with vol_metric_cols[3]:
            st.metric("Total Volume", f"{data['Volume'].sum():,.0f}")
        
        st.divider()
        
        # Charts
        vol_chart_cols = st.columns(2, gap="medium")
        
        with vol_chart_cols[0]:
            # Volume over time
            fig_vol = go.Figure()
            fig_vol.add_trace(go.Scatter(
                x=data.index,
                y=data['Volume'].values,
                mode='lines',
                name='Volume',
                line=dict(width=1, color='lightblue'),
                fill='tozeroy',
                fillcolor='rgba(173,216,230,0.3)'
            ))
            # Add average line
            avg_vol = data['Volume'].mean()
            fig_vol.add_hline(
                y=avg_vol,
                line_dash="dash",
                line_color="red",
                annotation_text=f"Avg: {avg_vol:,.0f}"
            )
            fig_vol.update_layout(
                title="Volume Over Time",
                xaxis_title="Date",
                yaxis_title="Volume",
                template='plotly_white',
                height=400
            )
            st.plotly_chart(fig_vol, use_container_width=True)
        
        with vol_chart_cols[1]:
            # Volume vs Price scatter
            fig_vol_price = go.Figure()
            fig_vol_price.add_trace(go.Scatter(
                x=data['Close'].values,
                y=data['Volume'].values,
                mode='markers',
                name='Volume vs Price',
                marker=dict(size=4, color='blue', opacity=0.5)
            ))
            fig_vol_price.update_layout(
                title="Volume vs Price",
                xaxis_title="Price ($)",
                yaxis_title="Volume",
                template='plotly_white',
                height=400
            )
            st.plotly_chart(fig_vol_price, use_container_width=True)
        
        # Volume statistics
        st.divider()
        st.markdown("### 📊 Volume Statistics")
        vol_stats_cols = st.columns(2, gap="large")
        
        with vol_stats_cols[0]:
            st.dataframe(data[['Volume']].describe(), use_container_width=True)
        
        with vol_stats_cols[1]:
            st.markdown("**Volume Analysis**")
            vol_change = data['Volume'].pct_change().dropna()
            if len(vol_change) > 0:
                st.write(f"Avg Daily Change: {vol_change.mean()*100:.2f}%")
                st.write(f"Volatility: {vol_change.std()*100:.2f}%")
            high_vol_days = len(data[data['Volume'] > data['Volume'].quantile(0.9)])
            st.write(f"High Volume Days (>90th percentile): {high_vol_days}")
            low_vol_days = len(data[data['Volume'] < data['Volume'].quantile(0.1)])
            st.write(f"Low Volume Days (<10th percentile): {low_vol_days}")
    else:
        st.info("No volume data available")

# Tab 5: Export
with main_tabs[4]:
    st.markdown("### 💾 Data Export")
    
    export_cols = st.columns(2, gap="large")
    
    with export_cols[0]:
        st.markdown("**Export Options**")
        export_format = st.selectbox(
            "Format",
            ["CSV", "Excel", "JSON"],
            help="Select export format"
        )
        
        st.markdown("**Data Information**")
        st.write(f"Symbol: {st.session_state.selected_symbol or 'N/A'}")
        st.write(f"Rows: {len(data):,}")
        st.write(f"Date Range: {data.index[0].strftime('%Y-%m-%d')} to {data.index[-1].strftime('%Y-%m-%d')}")
        st.write(f"Columns: {', '.join(data.columns.tolist())}")
        
        symbol = st.session_state.selected_symbol or 'data'
        start_date = data.index[0].strftime('%Y%m%d')
        end_date = data.index[-1].strftime('%Y%m%d')
        filename = f"{symbol}_{start_date}_to_{end_date}"
        
        if export_format == "CSV":
            csv = data.to_csv()
            st.download_button(
                label="📥 Download CSV",
                data=csv,
                file_name=f"{filename}.csv",
                mime="text/csv",
                use_container_width=True,
                key="download_csv"
            )
        elif export_format == "Excel":
            try:
                import io
                output = io.BytesIO()
                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                    data.to_excel(writer, sheet_name='OHLCV Data')
                st.download_button(
                    label="📥 Download Excel",
                    data=output.getvalue(),
                    file_name=f"{filename}.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    use_container_width=True,
                    key="download_excel"
                )
            except ImportError:
                st.warning("Excel export requires 'openpyxl' package. Install with: pip install openpyxl")
        elif export_format == "JSON":
            json_str = data.to_json(orient='index', date_format='iso')
            st.download_button(
                label="📥 Download JSON",
                data=json_str,
                file_name=f"{filename}.json",
                mime="application/json",
                use_container_width=True,
                key="download_json"
            )
    
    with export_cols[1]:
        st.markdown("**Data Preview**")
        preview_rows = st.slider("Preview Rows", 5, 50, 10, key="preview_rows")
        st.dataframe(data.head(preview_rows), use_container_width=True, height=400)
        
        st.markdown("**Quick Statistics**")
        with st.expander("View Statistics"):
            st.dataframe(data.describe(), use_container_width=True)
