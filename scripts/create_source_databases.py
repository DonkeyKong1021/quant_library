#!/usr/bin/env python3
"""
Create and initialize all source-specific databases.

This script creates the three source databases:
- quant_library_yahoo
- quant_library_alphavantage
- quant_library_polygon

And initializes the schema for each.
"""

import sys
import subprocess
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from quantlib.data.database import (
    get_database_url_for_source,
    create_database_engine,
    verify_connection,
    init_database,
)
import argparse


def create_database(db_name: str, base_url: str) -> bool:
    """
    Create a PostgreSQL database if it doesn't exist.
    
    Args:
        db_name: Database name
        base_url: Base connection URL (without database name)
        
    Returns:
        True if database was created or already exists, False on error
    """
    try:
        # Extract connection info from base URL
        # Format: postgresql://user:pass@host:port/database
        if '@' in base_url:
            # Parse the base URL to get connection info
            parts = base_url.split('@')
            if len(parts) == 2:
                conn_info = parts[1].split('/')[0]  # host:port
                user_pass = parts[0].replace('postgresql://', '')
                if ':' in user_pass:
                    user = user_pass.split(':')[0]
                else:
                    user = user_pass
                
                # Use psql to create database
                # Connect to postgres database to create the target database
                postgres_url = base_url.rsplit('/', 1)[0] + '/postgres'
                
                # Extract just the connection parts
                # For simplicity, try using createdb command
                try:
                    result = subprocess.run(
                        ['createdb', db_name],
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    if result.returncode == 0:
                        print(f"   ✅ Created database: {db_name}")
                        return True
                    elif 'already exists' in result.stderr.lower():
                        print(f"   ℹ️  Database already exists: {db_name}")
                        return True
                    else:
                        print(f"   ⚠️  Could not create database (may need manual creation): {result.stderr.strip()}")
                        return False
                except FileNotFoundError:
                    # createdb command not found, provide instructions
                    print(f"   ⚠️  Please create database manually: createdb {db_name}")
                    return False
        return False
    except Exception as e:
        print(f"   ⚠️  Error creating database: {e}")
        return False


def main():
    """Create and initialize all source databases."""
    parser = argparse.ArgumentParser(
        description="Create and initialize source-specific databases for QuantLib"
    )
    parser.add_argument(
        '--skip-create',
        action='store_true',
        help='Skip database creation (assume databases already exist)'
    )
    parser.add_argument(
        '--drop-existing',
        action='store_true',
        help='Drop existing tables before creating (WARNING: destroys all data)'
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Create Source Databases")
    print("=" * 60)
    print("\nThis script will create and initialize:")
    print("  - quant_library_yahoo (Yahoo Finance data)")
    print("  - quant_library_alphavantage (Alpha Vantage data)")
    print("  - quant_library_polygon (Polygon.io data)")
    print("\n" + "=" * 60)
    
    sources = ['yahoo', 'alpha_vantage', 'polygon']
    success_count = 0
    
    for source in sources:
        print(f"\n{'=' * 60}")
        print(f"Processing {source.upper()} database...")
        print("=" * 60)
        
        try:
            # Get database URL for this source
            database_url = get_database_url_for_source(source)
            db_name = database_url.split('/')[-1]
            
            print(f"\nDatabase URL: {database_url.split('@')[1] if '@' in database_url else 'configured'}")
            print(f"Database name: {db_name}")
            
            # Create database if not skipping
            if not args.skip_create:
                print("\n1. Creating database (if needed)...")
                create_database(db_name, database_url)
            
            # Verify connection
            print("\n2. Verifying database connection...")
            try:
                engine = create_database_engine(url=database_url)
                if verify_connection(engine):
                    print("   ✅ Database connection successful")
                else:
                    print("   ❌ Database connection failed")
                    print(f"   Please ensure database exists: createdb {db_name}")
                    continue
            except Exception as e:
                print(f"   ❌ Connection error: {e}")
                print(f"   Please create the database: createdb {db_name}")
                continue
            
            # Initialize database schema
            print("\n3. Initializing database schema...")
            try:
                init_database(engine=engine, drop_existing=args.drop_existing)
                print(f"   ✅ {source.upper()} database initialized successfully")
                success_count += 1
            except Exception as e:
                print(f"   ❌ Error initializing schema: {e}")
                continue
                
        except Exception as e:
            print(f"\n❌ Error processing {source} database: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    print("\n" + "=" * 60)
    if success_count == len(sources):
        print("✅ Success! All source databases created and initialized")
    else:
        print(f"⚠️  Partial success: {success_count}/{len(sources)} databases initialized")
        print("\nFor databases that failed, you may need to:")
        print("  1. Create the database manually: createdb <database_name>")
        print("  2. Check PostgreSQL is running")
        print("  3. Verify connection credentials")
    print("=" * 60)
    
    return 0 if success_count == len(sources) else 1


if __name__ == "__main__":
    sys.exit(main())
