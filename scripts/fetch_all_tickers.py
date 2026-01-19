#!/usr/bin/env python3
"""
Bulk data fetcher script.

Fetches data for all tickers in tickers.json for the last 10 years
and stores them in the PostgreSQL database.
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

from quantlib.data import YahooFinanceFetcher, DataStore
import time


def load_tickers(tickers_file: Path) -> list:
    """
    Load all tickers from tickers.json file.
    
    Args:
        tickers_file: Path to tickers.json
        
    Returns:
        List of all ticker symbols
    """
    with open(tickers_file, 'r') as f:
        data = json.load(f)
    
    # Flatten the dictionary of sectors into a single list
    all_tickers = []
    for sector, tickers in data.items():
        all_tickers.extend(tickers)
    
    # Remove duplicates and sort
    unique_tickers = sorted(list(set(all_tickers)))
    return unique_tickers


def calculate_date_range(years: int = 10) -> tuple:
    """
    Calculate start and end dates for data fetching.
    
    Args:
        years: Number of years of historical data to fetch
        
    Returns:
        Tuple of (start_date, end_date) as strings
    """
    today = datetime.now().date()
    
    # Account for system clock being wrong (e.g., set to future date)
    REASONABLE_MAX_DATE = datetime(2026, 1, 1).date()
    if today > REASONABLE_MAX_DATE:
        today = REASONABLE_MAX_DATE
    
    end_date = today - timedelta(days=1)  # Yesterday to avoid today's data issues
    start_date = end_date - timedelta(days=365 * years)
    
    return start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')


def fetch_and_save_ticker(
    fetcher: YahooFinanceFetcher,
    store: DataStore,
    ticker: str,
    start_date: str,
    end_date: str,
    verbose: bool = False
) -> tuple[bool, str]:
    """
    Fetch and save data for a single ticker.
    
    Args:
        fetcher: YahooFinanceFetcher instance
        store: DataStore instance
        ticker: Stock symbol
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        verbose: Print detailed information
        
    Returns:
        Tuple of (success: bool, message: str)
    """
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
    """Main function to fetch all tickers"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Fetch market data for all tickers in tickers.json"
    )
    parser.add_argument(
        '--tickers-file',
        type=str,
        default='tickers.json',
        help='Path to tickers.json file (default: tickers.json)'
    )
    parser.add_argument(
        '--years',
        type=int,
        default=10,
        help='Number of years of historical data to fetch (default: 10)'
    )
    parser.add_argument(
        '--database-url',
        type=str,
        default=None,
        help='Database connection URL (default: from DATABASE_URL env var or localhost default)'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Print detailed information for each ticker'
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
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Bulk Data Fetcher")
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
    
    # Calculate date range
    print(f"\n2. Calculating date range ({args.years} years)...")
    start_date, end_date = calculate_date_range(years=args.years)
    print(f"   Start: {start_date}")
    print(f"   End: {end_date}")
    
    # Initialize fetcher and store
    print(f"\n3. Initializing data fetcher and database connection...")
    try:
        fetcher = YahooFinanceFetcher()
        store = DataStore(database_url=args.database_url)
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
        print(f"[{i}/{len(all_tickers)}] {ticker}...", end=' ')
        
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
        print(f"\n✅ Successfully fetched {successful} ticker(s)!")
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
