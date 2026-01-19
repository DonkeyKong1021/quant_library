"""Strategy selector and configuration component"""

import streamlit as st
from quantlib.strategies import Strategy
from quantlib.indicators import sma, rsi, bollinger_bands, macd
import pandas as pd


class MovingAverageStrategy(Strategy):
    """Moving Average Crossover Strategy"""
    def initialize(self, context):
        self.short_window = st.session_state.strategy_params.get('short_window', 20)
        self.long_window = st.session_state.strategy_params.get('long_window', 50)
        self.position = 0
        self.prices = []
    
    def on_data(self, context, data):
        close_price = data.get('Close', 0)
        if close_price:
            self.prices.append(close_price)
            if len(self.prices) >= self.long_window:
                prices_series = pd.Series(self.prices)
                short_ma = sma(prices_series, self.short_window)
                long_ma = sma(prices_series, self.long_window)
                if len(short_ma.dropna()) > 0 and len(long_ma.dropna()) > 0:
                    if short_ma.dropna().iloc[-1] > long_ma.dropna().iloc[-1] and self.position <= 0:
                        symbol = st.session_state.selected_symbol or 'SYMBOL'
                        context.place_order(symbol, 100, 'BUY')
                        self.position = 100
                    elif short_ma.dropna().iloc[-1] < long_ma.dropna().iloc[-1] and self.position > 0:
                        symbol = st.session_state.selected_symbol or 'SYMBOL'
                        context.place_order(symbol, 100, 'SELL')
                        self.position = 0


class RSIStrategy(Strategy):
    """RSI Momentum Strategy"""
    def initialize(self, context):
        self.rsi_window = st.session_state.strategy_params.get('rsi_window', 14)
        self.rsi_oversold = st.session_state.strategy_params.get('rsi_oversold', 30)
        self.rsi_overbought = st.session_state.strategy_params.get('rsi_overbought', 70)
        self.position = 0
        self.prices = []
    
    def on_data(self, context, data):
        close_price = data.get('Close', 0)
        if close_price:
            self.prices.append(close_price)
            if len(self.prices) >= self.rsi_window + 1:
                prices_series = pd.Series(self.prices)
                rsi_val = rsi(prices_series, self.rsi_window)
                if len(rsi_val.dropna()) > 0:
                    current_rsi = rsi_val.dropna().iloc[-1]
                    if current_rsi < self.rsi_oversold and self.position <= 0:
                        symbol = st.session_state.selected_symbol or 'SYMBOL'
                        context.place_order(symbol, 100, 'BUY')
                        self.position = 100
                    elif current_rsi > self.rsi_overbought and self.position > 0:
                        symbol = st.session_state.selected_symbol or 'SYMBOL'
                        context.place_order(symbol, 100, 'SELL')
                        self.position = 0


class BollingerBandsStrategy(Strategy):
    """Bollinger Bands Mean Reversion Strategy"""
    def initialize(self, context):
        self.bb_window = st.session_state.strategy_params.get('bb_window', 20)
        self.bb_std = st.session_state.strategy_params.get('bb_std', 2.0)
        self.position = 0
        self.prices = []
    
    def on_data(self, context, data):
        close_price = data.get('Close', 0)
        if close_price:
            self.prices.append(close_price)
            if len(self.prices) >= self.bb_window:
                prices_series = pd.Series(self.prices)
                bb = bollinger_bands(prices_series, self.bb_window, self.bb_std)
                if len(bb.dropna()) > 0:
                    current_price = close_price
                    bb_data = bb.dropna()
                    upper = bb_data['upper'].iloc[-1]
                    lower = bb_data['lower'].iloc[-1]
                    if current_price <= lower and self.position <= 0:
                        symbol = st.session_state.selected_symbol or 'SYMBOL'
                        context.place_order(symbol, 100, 'BUY')
                        self.position = 100
                    elif current_price >= upper and self.position > 0:
                        symbol = st.session_state.selected_symbol or 'SYMBOL'
                        context.place_order(symbol, 100, 'SELL')
                        self.position = 0


class MACDStrategy(Strategy):
    """MACD Crossover Strategy"""
    def initialize(self, context):
        self.macd_fast = st.session_state.strategy_params.get('macd_fast', 12)
        self.macd_slow = st.session_state.strategy_params.get('macd_slow', 26)
        self.macd_signal = st.session_state.strategy_params.get('macd_signal', 9)
        self.position = 0
        self.prices = []
        self.last_macd_signal = None
    
    def on_data(self, context, data):
        close_price = data.get('Close', 0)
        if close_price:
            self.prices.append(close_price)
            if len(self.prices) >= self.macd_slow + self.macd_signal:
                prices_series = pd.Series(self.prices)
                macd_result = macd(prices_series, self.macd_fast, self.macd_slow, self.macd_signal)
                if len(macd_result.dropna()) > 0:
                    macd_data = macd_result.dropna()
                    current_macd = macd_data['macd'].iloc[-1]
                    current_signal = macd_data['signal'].iloc[-1]
                    
                    # Buy when MACD crosses above signal
                    if current_macd > current_signal and self.last_macd_signal is not None and self.last_macd_signal <= self.last_macd_signal and self.position <= 0:
                        symbol = st.session_state.selected_symbol or 'SYMBOL'
                        context.place_order(symbol, 100, 'BUY')
                        self.position = 100
                    # Sell when MACD crosses below signal
                    elif current_macd < current_signal and self.last_macd_signal is not None and self.last_macd_signal >= self.last_macd_signal and self.position > 0:
                        symbol = st.session_state.selected_symbol or 'SYMBOL'
                        context.place_order(symbol, 100, 'SELL')
                        self.position = 0
                    
                    self.last_macd_signal = current_macd - current_signal


def strategy_selector_component():
    """
    Strategy selector component with built-in strategies and custom code option.
    
    Returns:
        Strategy instance or None
    """
    strategy_type = st.radio(
        "Strategy Type",
        ["Built-in Strategy", "Custom Code"],
        horizontal=True
    )
    
    if strategy_type == "Built-in Strategy":
        strategy_name = st.selectbox(
            "Select Strategy",
            ["Moving Average Crossover", "RSI Momentum", "Bollinger Bands Mean Reversion", "MACD Crossover"],
            help="Choose a built-in strategy"
        )
        
        # Parameters in expander for compact layout
        with st.expander("⚙️ Parameters", expanded=True):
            if strategy_name == "Moving Average Crossover":
                col1, col2 = st.columns(2)
                with col1:
                    short_window = st.number_input(
                        "Short Window",
                        min_value=5,
                        max_value=200,
                        value=st.session_state.strategy_params.get('short_window', 20),
                        step=1,
                        help="Short moving average period"
                    )
                with col2:
                    long_window = st.number_input(
                        "Long Window",
                        min_value=10,
                        max_value=200,
                        value=st.session_state.strategy_params.get('long_window', 50),
                        step=1,
                        help="Long moving average period"
                    )
                
                if short_window >= long_window:
                    st.warning("Short window should be less than long window")
                    return None
                
                st.session_state.strategy_params = {
                    'short_window': short_window,
                    'long_window': long_window
                }
                st.session_state.strategy_type = 'moving_average'
                return MovingAverageStrategy()
            
            elif strategy_name == "RSI Momentum":
                col1, col2, col3 = st.columns(3)
                with col1:
                    rsi_window = st.number_input(
                        "RSI Window",
                        min_value=5,
                        max_value=50,
                        value=st.session_state.strategy_params.get('rsi_window', 14),
                        step=1,
                        help="RSI calculation period"
                    )
                with col2:
                    rsi_oversold = st.number_input(
                        "Oversold",
                        min_value=0,
                        max_value=50,
                        value=st.session_state.strategy_params.get('rsi_oversold', 30),
                        step=1,
                        help="Oversold threshold"
                    )
                with col3:
                    rsi_overbought = st.number_input(
                        "Overbought",
                        min_value=50,
                        max_value=100,
                        value=st.session_state.strategy_params.get('rsi_overbought', 70),
                        step=1,
                        help="Overbought threshold"
                    )
                
                st.session_state.strategy_params = {
                    'rsi_window': rsi_window,
                    'rsi_oversold': rsi_oversold,
                    'rsi_overbought': rsi_overbought
                }
                st.session_state.strategy_type = 'rsi'
                return RSIStrategy()
            
            elif strategy_name == "Bollinger Bands Mean Reversion":
                col1, col2 = st.columns(2)
                with col1:
                    bb_window = st.number_input(
                        "BB Window",
                        min_value=5,
                        max_value=200,
                        value=st.session_state.strategy_params.get('bb_window', 20),
                        step=1,
                        help="Bollinger Bands period"
                    )
                with col2:
                    bb_std = st.number_input(
                        "Standard Deviations",
                        min_value=1.0,
                        max_value=5.0,
                        value=st.session_state.strategy_params.get('bb_std', 2.0),
                        step=0.1,
                        help="Number of standard deviations"
                    )
                
                st.session_state.strategy_params = {
                    'bb_window': bb_window,
                    'bb_std': bb_std
                }
                st.session_state.strategy_type = 'bollinger_bands'
                return BollingerBandsStrategy()
            
            elif strategy_name == "MACD Crossover":
                col1, col2, col3 = st.columns(3)
                with col1:
                    macd_fast = st.number_input(
                        "Fast",
                        min_value=5,
                        max_value=50,
                        value=st.session_state.strategy_params.get('macd_fast', 12),
                        step=1,
                        help="Fast EMA period"
                    )
                with col2:
                    macd_slow = st.number_input(
                        "Slow",
                        min_value=10,
                        max_value=100,
                        value=st.session_state.strategy_params.get('macd_slow', 26),
                        step=1,
                        help="Slow EMA period"
                    )
                with col3:
                    macd_signal = st.number_input(
                        "Signal",
                        min_value=5,
                        max_value=50,
                        value=st.session_state.strategy_params.get('macd_signal', 9),
                        step=1,
                        help="Signal line period"
                    )
                
                if macd_fast >= macd_slow:
                    st.warning("Fast period should be less than slow period")
                    return None
                
                st.session_state.strategy_params = {
                    'macd_fast': macd_fast,
                    'macd_slow': macd_slow,
                    'macd_signal': macd_signal
                }
                st.session_state.strategy_type = 'macd'
                return MACDStrategy()
    
    else:  # Custom Code
        st.info("💡 Custom code strategy creation is available in the Strategy Builder page")
        st.caption("Use the Strategy Builder page to create and test custom strategies")
        return None
