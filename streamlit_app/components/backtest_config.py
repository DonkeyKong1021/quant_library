"""Backtest configuration UI component"""

import streamlit as st


def backtest_config_component():
    """
    Backtest configuration component with parameters input.
    
    Returns:
        Dictionary with backtest configuration
    """
    # Main parameters in compact layout
    col1, col2, col3 = st.columns(3, gap="small")
    
    with col1:
        initial_capital = st.number_input(
            "Initial Capital ($)",
            min_value=1000.0,
            max_value=10000000.0,
            value=float(st.session_state.backtest_config.get('initial_capital', 100000)),
            step=10000.0,
            help="Starting capital"
        )
    
    with col2:
        commission = st.number_input(
            "Commission ($)",
            min_value=0.0,
            max_value=100.0,
            value=float(st.session_state.backtest_config.get('commission', 1.0)),
            step=0.1,
            help="Commission per trade"
        )
    
    with col3:
        slippage = st.number_input(
            "Slippage (%)",
            min_value=0.0,
            max_value=5.0,
            value=float(st.session_state.backtest_config.get('slippage', 0.0)) * 100,
            step=0.1,
            format="%.2f",
            help="Slippage percentage"
        ) / 100.0
    
    # Advanced settings in expander
    with st.expander("🔧 Advanced Settings"):
        col1, col2 = st.columns(2)
        with col1:
            commission_type = st.selectbox(
                "Commission Type",
                ["Fixed ($ per trade)", "Percentage (% of value)"],
                help="Commission calculation method"
            )
        with col2:
            benchmark_symbol = st.text_input(
                "Benchmark Symbol",
                value=st.session_state.backtest_config.get('benchmark_symbol', 'SPY'),
                placeholder="SPY",
                help="Benchmark for comparison"
            )
    
    # Benchmark comparison
    use_benchmark = st.checkbox(
        "Enable Benchmark Comparison",
        value=st.session_state.backtest_config.get('use_benchmark', True),
        help="Compare against benchmark"
    )
    
    # Store configuration
    config = {
        'initial_capital': initial_capital,
        'commission': commission,
        'slippage': slippage,
        'commission_type': 'fixed' if commission_type == "Fixed ($ per trade)" else 'percentage',
        'use_benchmark': use_benchmark,
        'benchmark_symbol': benchmark_symbol.upper() if benchmark_symbol else 'SPY'
    }
    
    st.session_state.backtest_config = config
    
    return config
