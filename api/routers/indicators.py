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
    stochastic, adx, atr, obv, volume_sma
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
        
        return {'indicators': results}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating indicators: {str(e)}")
