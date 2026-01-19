"""
Encryption utility for API keys storage.
Uses Fernet symmetric encryption (AES 128 in CBC mode with SHA256 HMAC).
"""

import os
import base64
from typing import Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def _get_encryption_key() -> bytes:
    """
    Get or generate encryption key from environment variable or generate a new one.
    
    In production, set QUANTLIB_ENCRYPTION_KEY environment variable.
    If not set, generates a key (less secure but works for development).
    """
    key_env = os.getenv('QUANTLIB_ENCRYPTION_KEY')
    
    if key_env:
        # Use provided key (base64 encoded)
        try:
            return base64.urlsafe_b64decode(key_env.encode())
        except Exception:
            # If invalid, generate from it using PBKDF2
            pass
    
    # Generate key from DATABASE_URL (deterministic but not secure)
    # This is a fallback - in production, always set QUANTLIB_ENCRYPTION_KEY
    fallback_secret = os.getenv('DATABASE_URL', 'default_secret_key_for_development')
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b'quantlib_salt',  # Fixed salt (not ideal but works for single-instance)
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(fallback_secret.encode()))
    return key


def encrypt_api_key(api_key: str) -> str:
    """
    Encrypt an API key for storage.
    
    Args:
        api_key: Plain text API key
        
    Returns:
        Encrypted API key (base64 encoded)
    """
    if not api_key:
        return ""
    
    key = _get_encryption_key()
    fernet = Fernet(key)
    encrypted = fernet.encrypt(api_key.encode())
    return base64.urlsafe_b64encode(encrypted).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """
    Decrypt an API key from storage.
    
    Args:
        encrypted_key: Encrypted API key (base64 encoded)
        
    Returns:
        Decrypted API key (plain text)
    """
    if not encrypted_key:
        return ""
    
    try:
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_key.encode())
        key = _get_encryption_key()
        fernet = Fernet(key)
        decrypted = fernet.decrypt(encrypted_bytes)
        return decrypted.decode()
    except Exception as e:
        # If decryption fails, return empty string
        # This can happen if encryption key changed
        return ""
