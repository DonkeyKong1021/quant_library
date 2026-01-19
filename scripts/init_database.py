#!/usr/bin/env python3
"""
Database initialization script.

Creates database schema (tables and indexes) for storing market data.
"""

import sys
from pathlib import Path

# Add project root and src directory to path
project_root = Path(__file__).parent.parent
src_dir = project_root / "src"
sys.path.insert(0, str(src_dir))
sys.path.insert(0, str(project_root))

from quantlib.data.database import (
    create_database_engine,
    init_database,
    verify_connection,
    get_database_url,
    get_database_url_for_source,
)
import argparse


def main():
    """Main function to initialize database"""
    parser = argparse.ArgumentParser(
        description="Initialize PostgreSQL database schema for quant_library"
    )
    parser.add_argument(
        '--database-url',
        type=str,
        default=None,
        help='Database connection URL (default: from DATABASE_URL env var or localhost default)'
    )
    parser.add_argument(
        '--source',
        type=str,
        default=None,
        choices=['yahoo', 'alpha_vantage', 'polygon'],
        help='Data source to initialize (yahoo, alpha_vantage, polygon). Initializes source-specific database.'
    )
    parser.add_argument(
        '--all-sources',
        action='store_true',
        help='Initialize all source databases (yahoo, alpha_vantage, polygon)'
    )
    parser.add_argument(
        '--drop-existing',
        action='store_true',
        help='Drop existing tables before creating (WARNING: destroys all data)'
    )
    
    args = parser.parse_args()
    
    # Handle --all-sources flag
    if args.all_sources:
        print("=" * 60)
        print("Database Initialization Script - All Sources")
        print("=" * 60)
        
        sources = ['yahoo', 'alpha_vantage', 'polygon']
        success_count = 0
        
        for source in sources:
            print(f"\n{'=' * 60}")
            print(f"Initializing {source.upper()} database...")
            print("=" * 60)
            
            try:
                database_url = get_database_url_for_source(source)
                print(f"\nDatabase URL: {database_url.split('@')[1] if '@' in database_url else 'configured'}")
                
                # Verify connection
                print("\n1. Verifying database connection...")
                engine = create_database_engine(url=database_url)
                if verify_connection(engine):
                    print("   ✅ Database connection successful")
                else:
                    print("   ❌ Database connection failed")
                    print(f"   Please create the database: createdb {database_url.split('/')[-1]}")
                    continue
                
                # Initialize database
                print("\n2. Initializing database schema...")
                init_database(engine=engine, drop_existing=args.drop_existing)
                print(f"   ✅ {source.upper()} database initialized successfully")
                success_count += 1
                
            except Exception as e:
                print(f"   ❌ Error initializing {source} database: {e}")
                print(f"   Please create the database: createdb quant_library_{source}")
                continue
        
        print("\n" + "=" * 60)
        print(f"✅ Complete! Successfully initialized {success_count}/{len(sources)} databases")
        print("=" * 60)
        return 0 if success_count == len(sources) else 1
    
    # Handle single database initialization
    print("=" * 60)
    print("Database Initialization Script")
    print("=" * 60)
    
    # Get database URL
    if args.database_url:
        database_url = args.database_url
    elif args.source:
        database_url = get_database_url_for_source(args.source)
        print(f"Initializing {args.source.upper()} database...")
    else:
        database_url = get_database_url()
    
    print(f"\nDatabase URL: {database_url.split('@')[1] if '@' in database_url else 'configured'}")
    
    # Verify connection first
    print("\n1. Verifying database connection...")
    try:
        engine = create_database_engine(url=database_url)
        if verify_connection(engine):
            print("   ✅ Database connection successful")
        else:
            print("   ❌ Database connection failed")
            print("\nPlease ensure:")
            print("   - PostgreSQL is installed and running")
            print("   - Database exists (you may need to create it manually)")
            print("   - Connection credentials are correct")
            print(f"   - DATABASE_URL is set correctly (or use --database-url)")
            return 1
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
        print("\nPlease ensure:")
        print("   - PostgreSQL is installed and running")
        print("   - Database exists (you may need to create it manually)")
        print("   - Connection credentials are correct")
        return 1
    
    # Initialize database
    print("\n2. Initializing database schema...")
    try:
        init_database(engine=engine, drop_existing=args.drop_existing)
        print("\n" + "=" * 60)
        print("✅ Database initialization complete!")
        print("=" * 60)
        return 0
    except Exception as e:
        print(f"\n❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
