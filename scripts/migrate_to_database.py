#!/usr/bin/env python3
"""
Migration script to move existing parquet/pickle files to PostgreSQL database.

Scans the data directory for existing parquet and pickle files, loads them,
and inserts the data into the database.
"""

import sys
from pathlib import Path
from datetime import datetime
import traceback

# Add project root and src directory to path
project_root = Path(__file__).parent.parent
src_dir = project_root / "src"
sys.path.insert(0, str(src_dir))
sys.path.insert(0, str(project_root))

import pandas as pd
from quantlib.data.storage import DataStore
import argparse


def find_data_files(data_dir: Path):
    """
    Find all parquet and pickle files in the data directory.
    
    Args:
        data_dir: Path to data directory
        
    Returns:
        List of tuples (file_path, symbol, format)
    """
    files = []
    
    # Find parquet files
    for parquet_file in data_dir.glob("*.parquet"):
        symbol = parquet_file.stem.upper()
        files.append((parquet_file, symbol, 'parquet'))
    
    # Find pickle files
    for pickle_file in data_dir.glob("*.pickle"):
        symbol = pickle_file.stem.upper()
        files.append((pickle_file, symbol, 'pickle'))
    
    return files


def migrate_file(file_path: Path, symbol: str, format: str, store: DataStore, verbose: bool = False) -> bool:
    """
    Migrate a single file to the database.
    
    Args:
        file_path: Path to the file
        symbol: Stock symbol
        format: File format ('parquet' or 'pickle')
        store: DataStore instance
        verbose: Print detailed information
        
    Returns:
        True if successful, False otherwise
    """
    try:
        if verbose:
            print(f"  Loading {file_path.name}...")
        
        # Load the file
        if format == 'parquet':
            data = pd.read_parquet(file_path)
        elif format == 'pickle':
            data = pd.read_pickle(file_path)
        else:
            print(f"    ❌ Unknown format: {format}")
            return False
        
        if data.empty:
            if verbose:
                print(f"    ⚠️  File is empty, skipping")
            return True  # Not an error, just skip
        
        # Ensure index is datetime
        if not isinstance(data.index, pd.DatetimeIndex):
            print(f"    ❌ Data index is not datetime, skipping")
            return False
        
        if verbose:
            print(f"    Loaded {len(data)} rows from {data.index.min()} to {data.index.max()}")
        
        # Save to database
        store.save(symbol, data, format=format)
        
        if verbose:
            print(f"    ✅ Migrated successfully")
        
        return True
        
    except Exception as e:
        print(f"    ❌ Error migrating {file_path.name}: {e}")
        if verbose:
            traceback.print_exc()
        return False


def main():
    """Main migration function"""
    parser = argparse.ArgumentParser(
        description="Migrate existing parquet/pickle files to PostgreSQL database"
    )
    parser.add_argument(
        '--data-dir',
        type=str,
        default='data',
        help='Directory containing parquet/pickle files (default: data)'
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
        help='Print detailed information for each file'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Scan files but do not migrate (useful for preview)'
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Database Migration Script")
    print("=" * 60)
    
    data_dir = Path(args.data_dir)
    
    if not data_dir.exists():
        print(f"\n❌ Data directory does not exist: {data_dir}")
        print("Please specify a valid data directory with --data-dir")
        return 1
    
    # Find all data files
    print(f"\n1. Scanning data directory: {data_dir}")
    files = find_data_files(data_dir)
    
    if not files:
        print("   ⚠️  No parquet or pickle files found")
        return 0
    
    print(f"   Found {len(files)} file(s) to migrate")
    
    if args.verbose:
        print("\n   Files to migrate:")
        for file_path, symbol, format in files:
            print(f"     - {file_path.name} ({symbol}, {format})")
    
    if args.dry_run:
        print("\n✅ Dry run complete (no data was migrated)")
        return 0
    
    # Initialize database store
    print("\n2. Connecting to database...")
    try:
        store = DataStore(database_url=args.database_url)
        print("   ✅ Database connection successful")
    except Exception as e:
        print(f"   ❌ Failed to connect to database: {e}")
        print("\nPlease ensure:")
        print("   - Database is initialized (run scripts/init_database.py)")
        print("   - Database is running and accessible")
        print("   - Connection credentials are correct")
        return 1
    
    # Migrate files
    print(f"\n3. Migrating {len(files)} file(s)...")
    print("-" * 60)
    
    successful = 0
    failed = 0
    
    for i, (file_path, symbol, format) in enumerate(files, 1):
        print(f"[{i}/{len(files)}] Migrating {symbol} ({format})...")
        
        if migrate_file(file_path, symbol, format, store, verbose=args.verbose):
            successful += 1
        else:
            failed += 1
        
        print()  # Blank line between files
    
    # Summary
    print("=" * 60)
    print("Migration Summary")
    print("=" * 60)
    print(f"Total files: {len(files)}")
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    print("=" * 60)
    
    if failed > 0:
        print("\n⚠️  Some files failed to migrate. Check the errors above.")
        return 1
    else:
        print("\n✅ Migration complete!")
        return 0


if __name__ == "__main__":
    sys.exit(main())
