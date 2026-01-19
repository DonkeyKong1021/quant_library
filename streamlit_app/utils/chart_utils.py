"""Chart performance utilities for Streamlit"""

import pandas as pd
import numpy as np
from typing import Optional


def lttb_downsample(data: pd.Series, threshold: int) -> pd.Series:
    """
    Largest-Triangle-Three-Buckets (LTTB) downsampling algorithm
    Preserves visual accuracy while reducing data points
    
    Args:
        data: pandas Series with datetime index
        threshold: Target number of data points
        
    Returns:
        Downsampled Series
    """
    if len(data) <= threshold or threshold < 3:
        return data
    
    data_length = len(data)
    if data_length <= 2:
        return data
    
    # Convert to numpy for faster computation
    indices = data.index.values
    values = data.values
    
    # Bucket size. Leave room for start and end data points
    every = (data_length - 2) / (threshold - 2)
    
    # Always add the first point
    sampled_indices = [0]
    sampled_values = [values[0]]
    a = 0
    
    for i in range(threshold - 2):
        # Calculate point range for current bucket
        range_start = int((i + 0) * every) + 1
        range_end = int((i + 1) * every) + 1
        range_end_next = int((i + 2) * every) + 1
        
        # Calculate point average for next bucket (for visualization)
        avg_range_start = range_end
        avg_range_end = min(range_end_next, data_length)
        
        if avg_range_start < avg_range_end:
            avg_x = np.mean(indices[avg_range_start:avg_range_end])
            avg_y = np.mean(values[avg_range_start:avg_range_end])
        else:
            avg_x = indices[range_end] if range_end < data_length else indices[-1]
            avg_y = values[range_end] if range_end < data_length else values[-1]
        
        # Get the range for current bucket
        range_length = range_end - range_start
        
        # Calculate point for this bucket
        max_area = -1
        max_area_point = range_start
        
        for j in range(range_start, range_end):
            # Calculate triangle area over three buckets
            area = abs(
                (indices[a] - avg_x) * (values[j] - values[a]) -
                (indices[a] - indices[j]) * (avg_y - values[a])
            ) * 0.5
            
            if area > max_area:
                max_area = area
                max_area_point = j
        
        sampled_indices.append(max_area_point)
        sampled_values.append(values[max_area_point])
        a = max_area_point
    
    # Always add the last point
    sampled_indices.append(data_length - 1)
    sampled_values.append(values[-1])
    
    # Create new Series with sampled data
    sampled_index = indices[sampled_indices]
    sampled_series = pd.Series(sampled_values, index=sampled_index, name=data.name)
    
    return sampled_series


def adaptive_sample(data: pd.Series, max_points: int = 2000) -> pd.Series:
    """
    Adaptive sampling based on data size
    Uses LTTB for time series
    
    Args:
        data: pandas Series
        max_points: Maximum number of points (default: 2000)
        
    Returns:
        Sampled Series
    """
    if len(data) <= max_points:
        return data
    
    return lttb_downsample(data, max_points)
