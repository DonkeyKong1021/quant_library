#!/usr/bin/env python3
"""
Add backtest_results table to database schema.
Run this script to add the table to an existing database.
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
    """Add backtest_results table to database"""
    print("=" * 60)
    print("Adding backtest_results table to database")
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
    
    # Create table
    print("\n2. Creating backtest_results table...")
    try:
        with engine.connect() as conn:
            # Check if table already exists
            check_query = text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'backtest_results'
                );
            """)
            result = conn.execute(check_query)
            exists = result.scalar()
            
            if exists:
                print("   ⚠️  Table 'backtest_results' already exists")
                response = input("   Do you want to drop and recreate it? (y/N): ")
                if response.lower() == 'y':
                    conn.execute(text("DROP TABLE IF EXISTS backtest_results CASCADE"))
                    conn.commit()
                    print("   ✅ Dropped existing table")
                else:
                    print("   Skipping table creation")
                    return 0
            
            # Create table
            create_query = text("""
                CREATE TABLE backtest_results (
                    result_id TEXT PRIMARY KEY,
                    symbol TEXT NOT NULL,
                    strategy_name TEXT,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    results JSONB,
                    metrics JSONB,
                    equity_curve JSONB,
                    trades JSONB
                );
            """)
            conn.execute(create_query)
            
            # Create indexes
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_backtest_symbol ON backtest_results(symbol)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_backtest_created ON backtest_results(created_at)"))
            
            conn.commit()
            print("   ✅ Table 'backtest_results' created successfully")
            print("   ✅ Indexes created")
        
        print("\n" + "=" * 60)
        print("✅ Database update complete!")
        print("=" * 60)
        return 0
    except Exception as e:
        print(f"\n❌ Error creating table: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
