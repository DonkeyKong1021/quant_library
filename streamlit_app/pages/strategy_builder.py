"""
Strategy Builder Page

Page for creating and testing custom strategies with code editor.
"""

import sys
from pathlib import Path

# Add parent directory to path so we can import streamlit_app modules
_parent_dir = Path(__file__).parent.parent.parent
if str(_parent_dir) not in sys.path:
    sys.path.insert(0, str(_parent_dir))

import streamlit as st
from streamlit_app.utils.streamlit_helpers import init_session_state

# Initialize session state
init_session_state()

st.title("🔧 Strategy Builder")

st.markdown("""
Build and test custom trading strategies using the QuantLib framework.
""")

# Strategy templates
st.header("📝 Strategy Templates")

template_type = st.selectbox(
    "Select Template",
    ["Moving Average Crossover", "RSI Momentum", "Mean Reversion", "Blank Template"],
    help="Choose a strategy template to start with"
)

templates = {
    "Moving Average Crossover": """from quantlib.strategies import Strategy
from quantlib.indicators import sma
import pandas as pd

class MyStrategy(Strategy):
    def initialize(self, context):
        context.short_window = 20
        context.long_window = 50
        context.position = 0
        context.prices = []
    
    def on_data(self, context, data):
        close_price = data.get('Close', 0)
        if close_price:
            context.prices.append(close_price)
            if len(context.prices) >= context.long_window:
                prices_series = pd.Series(context.prices)
                short_ma = sma(prices_series, context.short_window)
                long_ma = sma(prices_series, context.long_window)
                if len(short_ma.dropna()) > 0 and len(long_ma.dropna()) > 0:
                    if short_ma.dropna().iloc[-1] > long_ma.dropna().iloc[-1] and context.position <= 0:
                        context.place_order('SYMBOL', 100, 'BUY')
                        context.position = 100
                    elif short_ma.dropna().iloc[-1] < long_ma.dropna().iloc[-1] and context.position > 0:
                        context.place_order('SYMBOL', 100, 'SELL')
                        context.position = 0""",
    
    "RSI Momentum": """from quantlib.strategies import Strategy
from quantlib.indicators import rsi
import pandas as pd

class MyStrategy(Strategy):
    def initialize(self, context):
        context.rsi_window = 14
        context.rsi_oversold = 30
        context.rsi_overbought = 70
        context.position = 0
        context.prices = []
    
    def on_data(self, context, data):
        close_price = data.get('Close', 0)
        if close_price:
            context.prices.append(close_price)
            if len(context.prices) >= context.rsi_window + 1:
                prices_series = pd.Series(context.prices)
                rsi_val = rsi(prices_series, context.rsi_window)
                if len(rsi_val.dropna()) > 0:
                    current_rsi = rsi_val.dropna().iloc[-1]
                    if current_rsi < context.rsi_oversold and context.position <= 0:
                        context.place_order('SYMBOL', 100, 'BUY')
                        context.position = 100
                    elif current_rsi > context.rsi_overbought and context.position > 0:
                        context.place_order('SYMBOL', 100, 'SELL')
                        context.position = 0""",
    
    "Mean Reversion": """from quantlib.strategies import Strategy
from quantlib.indicators import bollinger_bands
import pandas as pd

class MyStrategy(Strategy):
    def initialize(self, context):
        context.bb_window = 20
        context.bb_std = 2.0
        context.position = 0
        context.prices = []
    
    def on_data(self, context, data):
        close_price = data.get('Close', 0)
        if close_price:
            context.prices.append(close_price)
            if len(context.prices) >= context.bb_window:
                prices_series = pd.Series(context.prices)
                bb = bollinger_bands(prices_series, context.bb_window, context.bb_std)
                if len(bb.dropna()) > 0:
                    current_price = close_price
                    lower_band = bb['lower'].dropna().iloc[-1]
                    upper_band = bb['upper'].dropna().iloc[-1]
                    if current_price <= lower_band and context.position <= 0:
                        context.place_order('SYMBOL', 100, 'BUY')
                        context.position = 100
                    elif current_price >= upper_band and context.position > 0:
                        context.place_order('SYMBOL', 100, 'SELL')
                        context.position = 0""",
    
    "Blank Template": """from quantlib.strategies import Strategy
import pandas as pd

class MyStrategy(Strategy):
    def initialize(self, context):
        # Initialize your strategy parameters here
        context.my_param = 20
        context.position = 0
        context.prices = []
    
    def on_data(self, context, data):
        # Your strategy logic here
        close_price = data.get('Close', 0)
        if close_price:
            context.prices.append(close_price)
            # Add your trading logic
            # Example:
            # if some_condition:
            #     context.place_order('SYMBOL', 100, 'BUY')
        pass"""
}

# Code editor
st.header("✍️ Write Your Strategy")

code = st.text_area(
    "Strategy Code",
    value=templates.get(template_type, templates["Blank Template"]),
    height=500,
    help="Write your custom strategy code following the Strategy interface"
)

col1, col2 = st.columns([1, 4])
with col1:
    save_code = st.button("💾 Save Code")
with col2:
    if save_code:
        st.session_state.custom_strategy_code = code
        st.success("✅ Strategy code saved to session state")

# Documentation
with st.expander("📚 Strategy Interface Documentation"):
    st.markdown("""
    ### Strategy Base Class
    
    Your strategy must inherit from `Strategy` and implement:
    
    ```python
    from quantlib.strategies import Strategy
    
    class MyStrategy(Strategy):
        def initialize(self, context):
            # Called once at the start
            # Set up parameters, initialize state
            pass
        
        def on_data(self, context, data):
            # Called for each bar/data point
            # data is a dict with: Open, High, Low, Close, Volume
            # Use context.place_order(symbol, quantity, direction) to trade
            pass
    ```
    
    ### Available Indicators
    
    - `sma(series, window)` - Simple Moving Average
    - `ema(series, window)` - Exponential Moving Average
    - `rsi(series, window)` - Relative Strength Index
    - `bollinger_bands(series, window, num_std)` - Bollinger Bands
    - `macd(series, fast, slow, signal)` - MACD
    - And many more in `quantlib.indicators`
    
    ### Context Methods
    
    - `context.place_order(symbol, quantity, direction)` - Place a trade
      - direction: 'BUY' or 'SELL'
    - `context.portfolio` - Access portfolio state
    - `context.current_time` - Current timestamp
    
    ### Example Usage
    
    ```python
    # Calculate indicator
    prices_series = pd.Series(context.prices)
    ma = sma(prices_series, 20)
    
    # Make trading decision
    if ma.iloc[-1] > current_price:
        context.place_order('AAPL', 100, 'BUY')
    ```
    """)

st.warning("⚠️ **Security Note**: For security reasons, custom code execution in the web UI is disabled. "
           "To use custom strategies, add them to the library code or use the built-in strategies. "
           "This page is for reference and code development.")

st.info("💡 **Tip**: Copy your strategy code and add it to the library, then use it in the Backtest page.")
