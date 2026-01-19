"""
Indicator calculation endpoints
"""

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException
import pandas as pd
import numpy as np
from typing import Dict, Any, List

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from quantlib.indicators import (
    sma, ema, rsi, bollinger_bands, macd,
    stochastic, adx, atr, obv, volume_sma,
    ichimoku, vwap, keltner_channels, donchian_channels,
    williams_r, cci, roc, volume_profile
)

router = APIRouter()


def dict_list_to_dataframe(data: List[Dict[str, Any]]) -> pd.DataFrame:
    """Convert list of dicts to DataFrame"""
    if not data:
        return pd.DataFrame()
    
    df = pd.DataFrame(data)
    if 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'])
        df.set_index('Date', inplace=True)
    return df


def serialize_series(series: pd.Series) -> List[Dict[str, Any]]:
    """Serialize pandas Series to list of dicts"""
    if series.empty:
        return []
    
    result = []
    for idx, val in series.items():
        result.append({
            'timestamp': idx.isoformat() if hasattr(idx, 'isoformat') else str(idx),
            'value': float(val) if pd.notna(val) else None
        })
    return result


@router.post("/calculate")
async def calculate_indicators(request: Dict[str, Any]):
    """Calculate technical indicators for given data"""
    try:
        data = request.get('data', [])
        indicator_configs = request.get('indicators', [])
        
        if not data:
            raise HTTPException(status_code=400, detail="Data is required")
        
        # Convert data to DataFrame
        data_df = dict_list_to_dataframe(data)
        
        if data_df.empty or 'Close' not in data_df.columns:
            raise HTTPException(status_code=400, detail="Data must contain 'Close' column")
        
        close_prices = data_df['Close']
        results = {}
        
        # Calculate each requested indicator
        for indicator_config in indicator_configs:
            indicator_type = indicator_config.get('type')
            params = indicator_config.get('params', {})
            
            if indicator_type == 'sma':
                window = params.get('window', 20)
                values = sma(close_prices, window)
                results['sma'] = {
                    'values': serialize_series(values),
                    'params': {'window': window}
                }
            
            elif indicator_type == 'ema':
                window = params.get('window', 20)
                values = ema(close_prices, window)
                results['ema'] = {
                    'values': serialize_series(values),
                    'params': {'window': window}
                }
            
            elif indicator_type == 'rsi':
                window = params.get('window', 14)
                values = rsi(close_prices, window)
                results['rsi'] = {
                    'values': serialize_series(values),
                    'params': {'window': window}
                }
            
            elif indicator_type == 'bollinger_bands':
                window = params.get('window', 20)
                num_std = params.get('num_std', 2.0)
                bb = bollinger_bands(close_prices, window, num_std)
                results['bollinger_bands'] = {
                    'upper': serialize_series(bb['upper']),
                    'middle': serialize_series(bb['middle']),
                    'lower': serialize_series(bb['lower']),
                    'params': {'window': window, 'num_std': num_std}
                }
            
            elif indicator_type == 'macd':
                fast = params.get('fast', 12)
                slow = params.get('slow', 26)
                signal = params.get('signal', 9)
                macd_result = macd(close_prices, fast, slow, signal)
                results['macd'] = {
                    'macd': serialize_series(macd_result['macd']),
                    'signal': serialize_series(macd_result['signal']),
                    'histogram': serialize_series(macd_result['histogram']) if 'histogram' in macd_result else [],
                    'params': {'fast': fast, 'slow': slow, 'signal': signal}
                }
            
            elif indicator_type == 'stochastic':
                k_window = params.get('k_window', 14)
                d_window = params.get('d_window', 3)
                if 'High' not in data_df.columns or 'Low' not in data_df.columns:
                    raise HTTPException(status_code=400, detail="Stochastic requires High and Low columns")
                stoch_result = stochastic(data_df['High'], data_df['Low'], close_prices, k_window, d_window)
                results['stochastic'] = {
                    'k_percent': serialize_series(stoch_result['k_percent']),
                    'd_percent': serialize_series(stoch_result['d_percent']),
                    'params': {'k_window': k_window, 'd_window': d_window}
                }
            
            elif indicator_type == 'adx':
                window = params.get('window', 14)
                if 'High' not in data_df.columns or 'Low' not in data_df.columns:
                    raise HTTPException(status_code=400, detail="ADX requires High and Low columns")
                adx_values = adx(data_df['High'], data_df['Low'], close_prices, window)
                results['adx'] = {
                    'values': serialize_series(adx_values),
                    'params': {'window': window}
                }
            
            elif indicator_type == 'atr':
                window = params.get('window', 14)
                if 'High' not in data_df.columns or 'Low' not in data_df.columns:
                    raise HTTPException(status_code=400, detail="ATR requires High and Low columns")
                atr_values = atr(data_df['High'], data_df['Low'], close_prices, window)
                results['atr'] = {
                    'values': serialize_series(atr_values),
                    'params': {'window': window}
                }
            
            elif indicator_type == 'obv':
                if 'Volume' not in data_df.columns:
                    raise HTTPException(status_code=400, detail="OBV requires Volume column")
                obv_values = obv(close_prices, data_df['Volume'])
                results['obv'] = {
                    'values': serialize_series(obv_values),
                    'params': {}
                }
            
            elif indicator_type == 'volume_sma':
                window = params.get('window', 20)
                if 'Volume' not in data_df.columns:
                    raise HTTPException(status_code=400, detail="Volume SMA requires Volume column")
                volume_sma_values = volume_sma(data_df['Volume'], window)
                results['volume_sma'] = {
                    'values': serialize_series(volume_sma_values),
                    'params': {'window': window}
                }
            
            elif indicator_type == 'vwap':
                if 'High' not in data_df.columns or 'Low' not in data_df.columns or 'Volume' not in data_df.columns:
                    raise HTTPException(status_code=400, detail="VWAP requires High, Low, and Volume columns")
                vwap_values = vwap(data_df['High'], data_df['Low'], close_prices, data_df['Volume'])
                results['vwap'] = {
                    'values': serialize_series(vwap_values),
                    'params': {}
                }
            
            elif indicator_type == 'ichimoku':
                if 'High' not in data_df.columns or 'Low' not in data_df.columns:
                    raise HTTPException(status_code=400, detail="Ichimoku requires High and Low columns")
                ichimoku_result = ichimoku(data_df['High'], data_df['Low'], close_prices)
                results['ichimoku'] = {
                    'tenkan': serialize_series(ichimoku_result['tenkan']),
                    'kijun': serialize_series(ichimoku_result['kijun']),
                    'senkou_a': serialize_series(ichimoku_result['senkou_a']),
                    'senkou_b': serialize_series(ichimoku_result['senkou_b']),
                    'chikou': serialize_series(ichimoku_result['chikou']),
                    'params': {}
                }
            
            elif indicator_type == 'keltner_channels':
                if 'High' not in data_df.columns or 'Low' not in data_df.columns:
                    raise HTTPException(status_code=400, detail="Keltner Channels requires High and Low columns")
                window = params.get('window', 20)
                atr_mult = params.get('multiplier', 2.0)
                keltner_result = keltner_channels(data_df['High'], data_df['Low'], close_prices, window, atr_mult)
                results['keltner_channels'] = {
                    'upper': serialize_series(keltner_result['upper']),
                    'middle': serialize_series(keltner_result['middle']),
                    'lower': serialize_series(keltner_result['lower']),
                    'params': {'window': window, 'multiplier': atr_mult}
                }
            
            elif indicator_type == 'donchian_channels':
                if 'High' not in data_df.columns or 'Low' not in data_df.columns:
                    raise HTTPException(status_code=400, detail="Donchian Channels requires High and Low columns")
                window = params.get('window', 20)
                donchian_result = donchian_channels(data_df['High'], data_df['Low'], window)
                results['donchian_channels'] = {
                    'upper': serialize_series(donchian_result['upper']),
                    'middle': serialize_series(donchian_result['middle']),
                    'lower': serialize_series(donchian_result['lower']),
                    'params': {'window': window}
                }
            
            elif indicator_type == 'williams_r':
                if 'High' not in data_df.columns or 'Low' not in data_df.columns:
                    raise HTTPException(status_code=400, detail="Williams %R requires High and Low columns")
                window = params.get('window', 14)
                wr_values = williams_r(data_df['High'], data_df['Low'], close_prices, window)
                results['williams_r'] = {
                    'values': serialize_series(wr_values),
                    'params': {'window': window}
                }
            
            elif indicator_type == 'cci':
                if 'High' not in data_df.columns or 'Low' not in data_df.columns:
                    raise HTTPException(status_code=400, detail="CCI requires High and Low columns")
                window = params.get('window', 20)
                cci_values = cci(data_df['High'], data_df['Low'], close_prices, window)
                results['cci'] = {
                    'values': serialize_series(cci_values),
                    'params': {'window': window}
                }
            
            elif indicator_type == 'roc':
                window = params.get('window', 12)
                roc_values = roc(close_prices, window)
                results['roc'] = {
                    'values': serialize_series(roc_values),
                    'params': {'window': window}
                }
            
            elif indicator_type == 'volume_profile':
                if 'Volume' not in data_df.columns:
                    raise HTTPException(status_code=400, detail="Volume Profile requires Volume column")
                bins = params.get('bins', 20)
                vp_result = volume_profile(close_prices, data_df['Volume'], bins)
                # Volume profile returns a DataFrame with price bins and volumes
                results['volume_profile'] = {
                    'price': vp_result['price'].tolist(),
                    'volume': vp_result['volume'].tolist(),
                    'params': {'bins': bins}
                }
        
        return {'indicators': results}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating indicators: {str(e)}")
