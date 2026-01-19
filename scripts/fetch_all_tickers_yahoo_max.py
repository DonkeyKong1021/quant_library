#!/usr/bin/env python3
"""
Fetch all tickers from tickers.json with maximum date range from Yahoo Finance.

This script fetches data for all tickers using Yahoo Finance with the maximum
available historical date range (typically back to 1970 or IPO date).
"""

import sys
import json
from pathlib import Path
from datetime import datetime, timedelta

# Add project root and src directory to path
project_root = Path(__file__).parent.parent
src_dir = project_root / "src"
sys.path.insert(0, str(src_dir))
sys.path.insert(0, str(project_root))

from quantlib.data import DataStore
from quantlib.data.fetcher_registry import get_registry
import time


def load_tickers(tickers_file: Path) -> list:
    """Load all tickers from tickers.json file."""
    with open(tickers_file, 'r') as f:
        data = json.load(f)
    
    # Flatten the dictionary of sectors into a single list
    all_tickers = []
    for sector, tickers in data.items():
        all_tickers.extend(tickers)
    
    # Remove duplicates and sort
    unique_tickers = sorted(list(set(all_tickers)))
    return unique_tickers


def fetch_and_save_ticker(fetcher, store: DataStore, ticker: str, start_date: str, end_date: str, verbose: bool = False) -> tuple[bool, str]:
    """Fetch and save data for a single ticker."""
    ticker = ticker.upper()
    
    try:
        # Check if data already exists
        if store.exists(ticker):
            if verbose:
                print(f"    ⏭️  {ticker} already exists in database, skipping...")
            return True, "already_exists"
        
        # Fetch data
        if verbose:
            print(f"    📥 Fetching {ticker}...")
        
        data = fetcher.fetch_ohlcv(
            symbol=ticker,
            start=start_date,
            end=end_date
        )
        
        if data.empty:
            return False, "no_data_returned"
        
        # Save to database
        if verbose:
            print(f"    💾 Saving {ticker} ({len(data)} rows)...")
        
        store.save(ticker, data)
        
        # Verify it was saved
        if store.exists(ticker):
            metadata = store.get_metadata(ticker)
            return True, f"success ({len(data)} rows, {metadata.get('start_date', 'N/A')} to {metadata.get('end_date', 'N/A')})"
        else:
            return False, "save_verification_failed"
            
    except Exception as e:
        error_msg = str(e)
        # Check for common error types
        if "No data found" in error_msg or "delisted" in error_msg.lower():
            return False, "no_data_available"
        elif "timeout" in error_msg.lower() or "connection" in error_msg.lower():
            return False, "network_error"
        else:
            return False, f"error: {error_msg[:50]}"


def main():
    """Main function to fetch all tickers with maximum date range."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Fetch market data for all tickers in tickers.json from Yahoo Finance with maximum date range"
    )
    parser.add_argument(
        '--tickers-file',
        type=str,
        default='tickers.json',
        help='Path to tickers.json file (default: tickers.json)'
    )
    parser.add_argument(
        '--delay',
        type=float,
        default=0.5,
        help='Delay between requests in seconds (default: 0.5)'
    )
    parser.add_argument(
        '--skip-existing',
        action='store_true',
        help='Skip tickers that already exist in the database'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Print detailed information for each ticker'
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Yahoo Finance Bulk Data Fetcher (Maximum Date Range)")
    print("=" * 60)
    
    # Load tickers
    tickers_file = project_root / args.tickers_file
    if not tickers_file.exists():
        print(f"\n❌ Tickers file not found: {tickers_file}")
        return 1
    
    print(f"\n1. Loading tickers from {args.tickers_file}...")
    try:
        all_tickers = load_tickers(tickers_file)
        print(f"   ✅ Loaded {len(all_tickers)} unique tickers")
    except Exception as e:
        print(f"   ❌ Error loading tickers: {e}")
        return 1
    
    # Calculate maximum date range (Yahoo Finance can go back to 1970 or IPO date)
    # Use a very early start date - Yahoo Finance will return data from the earliest available date
    print(f"\n2. Setting date range (maximum available from Yahoo Finance)...")
    today = datetime.now().date()
    REASONABLE_MAX_DATE = datetime(2026, 1, 1).date()
    if today > REASONABLE_MAX_DATE:
        today = REASONABLE_MAX_DATE
    
    end_date = (today - timedelta(days=1)).strftime('%Y-%m-%d')
    start_date = "1970-01-01"  # Very early date - Yahoo Finance will return from IPO/earliest available
    
    print(f"   Start: {start_date} (Yahoo Finance will return from earliest available)")
    print(f"   End: {end_date}")
    
    # Initialize fetcher and store (Yahoo Finance database)
    print(f"\n3. Initializing Yahoo Finance fetcher and database connection...")
    try:
        registry = get_registry()
        fetcher = registry.create(source='yahoo')
        print(f"   Using data source: yahoo")
        store = DataStore(data_source='yahoo')  # Use Yahoo Finance database
        print("   ✅ Initialized successfully")
    except Exception as e:
        print(f"   ❌ Error initializing: {e}")
        return 1
    
    # Filter existing tickers if requested
    if args.skip_existing:
        print(f"\n4. Checking existing tickers in database...")
        existing_count = 0
        tickers_to_fetch = []
        for ticker in all_tickers:
            if store.exists(ticker):
                existing_count += 1
            else:
                tickers_to_fetch.append(ticker)
        print(f"   Found {existing_count} existing tickers, {len(tickers_to_fetch)} to fetch")
        all_tickers = tickers_to_fetch
    
    if not all_tickers:
        print("\n✅ All tickers already exist in database!")
        return 0
    
    # Fetch data for each ticker
    print(f"\n5. Fetching data for {len(all_tickers)} ticker(s)...")
    print("   (This may take a while - Yahoo Finance will return maximum available history)")
    print("-" * 60)
    
    successful = 0
    failed = 0
    skipped = 0
    results = {
        'success': [],
        'failed': [],
        'skipped': []
    }
    
    for i, ticker in enumerate(all_tickers, 1):
        print(f"[{i}/{len(all_tickers)}] {ticker}...", end=' ', flush=True)
        
        success, message = fetch_and_save_ticker(
            fetcher,
            store,
            ticker,
            start_date,
            end_date,
            verbose=args.verbose
        )
        
        if success:
            if message == "already_exists":
                skipped += 1
                results['skipped'].append(ticker)
                print(f"⏭️  Skipped (already exists)")
            else:
                successful += 1
                results['success'].append(ticker)
                print(f"✅ {message}")
        else:
            failed += 1
            results['failed'].append((ticker, message))
            print(f"❌ {message}")
        
        # Delay between requests to avoid rate limiting
        if i < len(all_tickers) and args.delay > 0:
            time.sleep(args.delay)
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"Total tickers: {len(all_tickers)}")
    print(f"✅ Successful: {successful}")
    print(f"⏭️  Skipped: {skipped}")
    print(f"❌ Failed: {failed}")
    print("=" * 60)
    
    if failed > 0:
        print(f"\nFailed tickers ({failed}):")
        for ticker, reason in results['failed'][:20]:  # Show first 20
            print(f"  - {ticker}: {reason}")
        if len(results['failed']) > 20:
            print(f"  ... and {len(results['failed']) - 20} more")
    
    if successful > 0:
        print(f"\n✅ Successfully fetched {successful} ticker(s) to Yahoo Finance database!")
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
