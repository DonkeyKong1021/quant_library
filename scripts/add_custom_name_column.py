#!/usr/bin/env python3
"""
Add custom_name column to backtest_results table.
Run this script to add the column to an existing database.
"""

import sys
from pathlib import Path

# Add project root and src directory to path
project_root = Path(__file__).parent.parent
src_dir = project_root / "src"
sys.path.insert(0, str(src_dir))
sys.path.insert(0, str(project_root))

from quantlib.data.database import create_database_engine, get_database_url, verify_connection
from sqlalchemy import text

def main():
    """Add custom_name column to backtest_results table"""
    print("=" * 60)
    print("Adding custom_name column to backtest_results table")
    print("=" * 60)
    
    database_url = get_database_url()
    print(f"\nDatabase URL: {database_url.split('@')[1] if '@' in database_url else 'configured'}")
    
    # Verify connection
    print("\n1. Verifying database connection...")
    try:
        engine = create_database_engine(url=database_url)
        if verify_connection(engine):
            print("   ✅ Database connection successful")
        else:
            print("   ❌ Database connection failed")
            return 1
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
        return 1
    
    # Add column
    print("\n2. Adding custom_name column...")
    try:
        with engine.connect() as conn:
            # Check if column already exists
            check_query = text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'backtest_results' 
                    AND column_name = 'custom_name'
                );
            """)
            result = conn.execute(check_query)
            exists = result.scalar()
            
            if exists:
                print("   ⚠️  Column 'custom_name' already exists")
                return 0
            
            # Add column
            alter_query = text("""
                ALTER TABLE backtest_results 
                ADD COLUMN custom_name TEXT;
            """)
            conn.execute(alter_query)
            conn.commit()
            print("   ✅ Column 'custom_name' added successfully")
        
        print("\n" + "=" * 60)
        print("✅ Database update complete!")
        print("=" * 60)
        return 0
    except Exception as e:
        print(f"\n❌ Error adding column: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
