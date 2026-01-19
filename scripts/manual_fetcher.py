#!/usr/bin/env python3
"""
Manual data fetcher script for testing/debugging.

Fetches data for a symbol and saves it to the data folder.
"""

import sys
from pathlib import Path

# Add project root and src directory to path
project_root = Path(__file__).parent.parent
src_dir = project_root / "src"
sys.path.insert(0, str(src_dir))
sys.path.insert(0, str(project_root))

from quantlib.data import YahooFinanceFetcher, DataStore
from datetime import datetime, timedelta

def main():
    """Main function to fetch and save data"""
    symbol = "AAPL"
    
    # Same date range calculation as in Streamlit app
    today = datetime.now().date()
    
    # Account for system clock being wrong (e.g., set to future date)
    # Use a reasonable maximum date (e.g., end of 2024) if system date is in the future
    REASONABLE_MAX_DATE = datetime(2026, 1, 1).date()
    if today > REASONABLE_MAX_DATE:
        today = REASONABLE_MAX_DATE
    
    end_date = today - timedelta(days=1)  # Yesterday to avoid today's data issues
    start_date = end_date - timedelta(days=365*10)  # 10 years before yesterday
    
    print("=" * 60)
    print("Manual Data Fetcher Test")
    print("=" * 60)
    print(f"Symbol: {symbol}")
    print(f"Start Date: {start_date}")
    print(f"End Date: {end_date}")
    print(f"Date Range: {(end_date - start_date).days} days")
    print("=" * 60)
    
    # Create fetcher and store
    fetcher = YahooFinanceFetcher()
    store = DataStore()
    
    # Try fetching data
    print(f"\n1. Attempting to fetch data for {symbol}...")
    try:
        data = fetcher.fetch_ohlcv(
            symbol=symbol,
            start=str(start_date),
            end=str(end_date)
        )
        print(f"   ✅ Success! Fetched {len(data)} rows")
        print(f"   Date range: {data.index[0].date()} to {data.index[-1].date()}")
        print(f"   Columns: {list(data.columns)}")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        
        # Try with a shorter date range
        print(f"\n2. Trying with shorter date range (1 year)...")
        try:
            short_end = today - timedelta(days=1)
            short_start = short_end - timedelta(days=365)
            data = fetcher.fetch_ohlcv(
                symbol=symbol,
                start=str(short_start),
                end=str(short_end)
            )
            print(f"   ✅ Success with 1-year range! Fetched {len(data)} rows")
        except Exception as e2:
            print(f"   ❌ Still failed: {e2}")
            return
        
        # Try with even shorter range
        print(f"\n3. Trying with 30-day range...")
        try:
            short_end = today - timedelta(days=1)
            short_start = short_end - timedelta(days=30)
            data = fetcher.fetch_ohlcv(
                symbol=symbol,
                start=str(short_start),
                end=str(short_end)
            )
            print(f"   ✅ Success with 30-day range! Fetched {len(data)} rows")
        except Exception as e3:
            print(f"   ❌ Still failed: {e3}")
            return
        
        return
    
    # Save to data folder
    print(f"\n4. Saving data to data folder...")
    try:
        store.save(symbol, data)
        print(f"   ✅ Data saved successfully!")
        
        # Verify it was saved
        if store.exists(symbol):
            print(f"   ✅ Verified: Data exists in cache")
            metadata = store.get_metadata(symbol)
            print(f"   Metadata: {metadata}")
        else:
            print(f"   ⚠️  Warning: Data may not have been saved correctly")
            
    except Exception as e:
        print(f"   ❌ Error saving data: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
