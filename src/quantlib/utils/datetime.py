"""Date and time handling utilities"""

from datetime import datetime
from typing import Union
import pandas as pd


def to_datetime(date: Union[str, datetime, pd.Timestamp]) -> pd.Timestamp:
    """
    Convert various date formats to pandas Timestamp.
    
    Args:
        date: Date in string, datetime, or Timestamp format
        
    Returns:
        pandas Timestamp object
    """
    return pd.Timestamp(date)


def normalize_date_range(
    start: Union[str, datetime, pd.Timestamp],
    end: Union[str, datetime, pd.Timestamp]
) -> tuple[pd.Timestamp, pd.Timestamp]:
    """
    Normalize start and end dates to Timestamps.
    
    Args:
        start: Start date
        end: End date
        
    Returns:
        Tuple of (start_timestamp, end_timestamp)
    """
    start_ts = to_datetime(start)
    end_ts = to_datetime(end)
    
    if start_ts > end_ts:
        raise ValueError(f"Start date {start_ts} must be before end date {end_ts}")
    
    return start_ts, end_ts
