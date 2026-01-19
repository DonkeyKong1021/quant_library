"""
Helper functions for getting AI clients with API keys from storage.
"""

import os
from typing import Optional, Tuple


def get_ai_api_keys() -> Tuple[Optional[str], Optional[str]]:
    """
    Get OpenAI and Anthropic API keys from database storage first, then environment variables.
    
    Returns:
        Tuple of (openai_key, anthropic_key)
    """
    try:
        from api.utils.api_key_storage import get_api_key_storage
        storage = get_api_key_storage()
        openai_key = storage.get_key('openai')
        anthropic_key = storage.get_key('anthropic')
        
        # Use stored keys if available, otherwise fall back to env vars
        if not openai_key:
            openai_key = os.getenv("OPENAI_API_KEY")
        if not anthropic_key:
            anthropic_key = os.getenv("ANTHROPIC_API_KEY")
            
        return openai_key, anthropic_key
    except Exception:
        # If storage fails, fall back to environment variables
        return os.getenv("OPENAI_API_KEY"), os.getenv("ANTHROPIC_API_KEY")


def get_ai_client() -> Tuple[Optional[any], Optional[str]]:
    """
    Get an AI client based on available API keys (from storage or env vars).
    
    Returns:
        Tuple of (client, provider_name) or (None, None) if no API key found
    """
    openai_key, anthropic_key = get_ai_api_keys()
    
    if openai_key:
        try:
            from openai import OpenAI
            return OpenAI(api_key=openai_key), "openai"
        except ImportError:
            pass
    
    if anthropic_key:
        try:
            import anthropic
            return anthropic.Anthropic(api_key=anthropic_key), "anthropic"
        except ImportError:
            pass
    
    return None, None
