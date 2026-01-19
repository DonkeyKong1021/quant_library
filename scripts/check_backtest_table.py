#!/usr/bin/env python3
"""
Check if backtest_results table exists in the database
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
    """Check if backtest_results table exists"""
    print("=" * 60)
    print("Checking for backtest_results table")
    print("=" * 60)
    
    try:
        engine = create_database_engine()
        
        if not verify_connection(engine):
            print("\n❌ Cannot connect to database")
            print("\nPlease ensure:")
            print("   - PostgreSQL is running")
            print("   - DATABASE_URL is set correctly")
            return 1
        
        print("\n✅ Database connection successful")
        
        with engine.connect() as conn:
            # Check if table exists
            check_query = text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'backtest_results'
                );
            """)
            result = conn.execute(check_query)
            exists = result.scalar()
            
            if exists:
                print("\n✅ backtest_results table EXISTS\n")
                
                # Get row count
                count_query = text('SELECT COUNT(*) FROM backtest_results')
                count_result = conn.execute(count_query)
                count = count_result.scalar()
                print(f"   Records in table: {count}")
                
                # Show table structure
                desc_query = text("""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'backtest_results'
                    ORDER BY ordinal_position
                """)
                desc_result = conn.execute(desc_query)
                print("\n   Table structure:")
                for row in desc_result:
                    print(f"     - {row[0]}: {row[1]}")
                
                # Show indexes
                index_query = text("""
                    SELECT indexname 
                    FROM pg_indexes 
                    WHERE tablename = 'backtest_results'
                """)
                index_result = conn.execute(index_query)
                indexes = [row[0] for row in index_result]
                if indexes:
                    print("\n   Indexes:")
                    for idx in indexes:
                        print(f"     - {idx}")
                
                print("\n" + "=" * 60)
                print("✅ Table verification complete!")
                print("=" * 60)
                return 0
            else:
                print("\n❌ backtest_results table DOES NOT EXIST\n")
                print("To create the table, run one of:")
                print("   python scripts/init_database.py")
                print("   python scripts/add_backtest_table.py")
                print("\n" + "=" * 60)
                return 1
                
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
