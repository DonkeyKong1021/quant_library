"""
Secure storage for API keys in the database.
"""

import sys
from pathlib import Path
from typing import Optional, Dict
from sqlalchemy import text, select
import logging

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from quantlib.data.database import create_database_engine, get_database_url
from api.utils.encryption import encrypt_api_key, decrypt_api_key

logger = logging.getLogger(__name__)


class APIKeyStorage:
    """Secure storage for API keys in database"""
    
    def __init__(self, database_url: Optional[str] = None):
        """Initialize API key storage."""
        self.engine = create_database_engine(url=database_url or get_database_url())
        self._ensure_table_exists()
    
    def _ensure_table_exists(self):
        """Ensure api_keys table exists."""
        try:
            with self.engine.connect() as conn:
                # Check if table exists by trying to query it
                conn.execute(text("SELECT 1 FROM api_keys LIMIT 1"))
        except Exception:
            # Table doesn't exist, create it
            try:
                with self.engine.connect() as conn:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS api_keys (
                            id TEXT PRIMARY KEY DEFAULT 'default',
                            alpha_vantage_key TEXT,
                            polygon_key TEXT,
                            openai_key TEXT,
                            anthropic_key TEXT,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """))
                    conn.commit()
                    logger.info("Created api_keys table")
            except Exception as e:
                logger.warning(f"Could not create api_keys table: {e}")
    
    def get_all_keys(self) -> Dict[str, str]:
        """
        Get all API keys (decrypted).
        
        Returns:
            Dictionary with keys: alpha_vantage, polygon, openai, anthropic
        """
        try:
            with self.engine.connect() as conn:
                result = conn.execute(
                    text("SELECT alpha_vantage_key, polygon_key, openai_key, anthropic_key FROM api_keys WHERE id = 'default'")
                ).fetchone()
                
                if result:
                    return {
                        'alpha_vantage': decrypt_api_key(result[0] or ''),
                        'polygon': decrypt_api_key(result[1] or ''),
                        'openai': decrypt_api_key(result[2] or ''),
                        'anthropic': decrypt_api_key(result[3] or ''),
                    }
        except Exception as e:
            logger.warning(f"Error reading API keys from database: {e}")
        
        return {
            'alpha_vantage': '',
            'polygon': '',
            'openai': '',
            'anthropic': '',
        }
    
    def get_key(self, key_type: str) -> str:
        """
        Get a specific API key (decrypted).
        
        Args:
            key_type: One of 'alpha_vantage', 'polygon', 'openai', 'anthropic'
            
        Returns:
            Decrypted API key or empty string
        """
        keys = self.get_all_keys()
        return keys.get(key_type, '')
    
    def save_keys(self, keys: Dict[str, str]) -> None:
        """
        Save API keys (encrypted) to database.
        
        Args:
            keys: Dictionary with keys: alpha_vantage, polygon, openai, anthropic
        """
        try:
            # Encrypt keys
            encrypted = {
                'alpha_vantage_key': encrypt_api_key(keys.get('alpha_vantage', '')),
                'polygon_key': encrypt_api_key(keys.get('polygon', '')),
                'openai_key': encrypt_api_key(keys.get('openai', '')),
                'anthropic_key': encrypt_api_key(keys.get('anthropic', '')),
            }
            
            with self.engine.connect() as conn:
                # Use INSERT ... ON CONFLICT UPDATE (UPSERT)
                conn.execute(text("""
                    INSERT INTO api_keys (id, alpha_vantage_key, polygon_key, openai_key, anthropic_key, updated_at)
                    VALUES ('default', :alpha_vantage_key, :polygon_key, :openai_key, :anthropic_key, CURRENT_TIMESTAMP)
                    ON CONFLICT (id) DO UPDATE SET
                        alpha_vantage_key = EXCLUDED.alpha_vantage_key,
                        polygon_key = EXCLUDED.polygon_key,
                        openai_key = EXCLUDED.openai_key,
                        anthropic_key = EXCLUDED.anthropic_key,
                        updated_at = CURRENT_TIMESTAMP
                """), encrypted)
                conn.commit()
                logger.info("Saved API keys to database")
        except Exception as e:
            logger.error(f"Error saving API keys to database: {e}")
            raise


# Global instance
_storage: Optional[APIKeyStorage] = None


def get_api_key_storage() -> APIKeyStorage:
    """Get global API key storage instance."""
    global _storage
    if _storage is None:
        _storage = APIKeyStorage()
    return _storage
