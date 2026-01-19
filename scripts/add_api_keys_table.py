#!/usr/bin/env python3
"""
Add api_keys table to existing database.
This script adds the api_keys table without dropping existing tables.
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from quantlib.data.database import create_database_engine, get_database_url, verify_connection
from sqlalchemy import text


def main():
    """Add api_keys table to database."""
    print("=" * 60)
    print("Add API Keys Table")
    print("=" * 60)
    
    database_url = get_database_url()
    print(f"\nDatabase URL: {database_url.split('@')[1] if '@' in database_url else 'configured'}")
    
    # Verify connection
    print("\n1. Verifying database connection...")
    try:
        engine = create_database_engine(url=database_url)
        if not verify_connection(engine):
            print("   ❌ Database connection failed")
            return 1
        print("   ✅ Database connection successful")
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
        return 1
    
    # Create api_keys table
    print("\n2. Creating api_keys table...")
    try:
        with engine.connect() as conn:
            # Check if table already exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'api_keys'
                )
            """))
            table_exists = result.scalar()
            
            if table_exists:
                print("   ℹ️  api_keys table already exists")
            else:
                conn.execute(text("""
                    CREATE TABLE api_keys (
                        id TEXT PRIMARY KEY DEFAULT 'default',
                        alpha_vantage_key TEXT,
                        polygon_key TEXT,
                        openai_key TEXT,
                        anthropic_key TEXT,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                conn.commit()
                print("   ✅ api_keys table created successfully")
        
        print("\n" + "=" * 60)
        print("✅ Complete!")
        print("=" * 60)
        return 0
    except Exception as e:
        print(f"\n❌ Error creating table: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
