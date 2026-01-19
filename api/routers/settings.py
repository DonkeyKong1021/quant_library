"""
Settings endpoints for API key management
"""

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException
from typing import Dict

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from api.models.schemas import APIKeysRequest, APIKeysResponse
from api.utils.api_key_storage import get_api_key_storage
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/api-keys", response_model=APIKeysResponse)
async def get_api_keys():
    """
    Get all API keys (values are masked for security).
    Only returns whether keys are set, not the actual values.
    """
    try:
        storage = get_api_key_storage()
        keys = storage.get_all_keys()
        
        # Mask keys - only show if they're set (for UI display)
        return APIKeysResponse(
            alpha_vantage_set=bool(keys.get('alpha_vantage', '')),
            polygon_set=bool(keys.get('polygon', '')),
            openai_set=bool(keys.get('openai', '')),
            anthropic_set=bool(keys.get('anthropic', '')),
        )
    except Exception as e:
        logger.error(f"Error retrieving API keys: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve API keys: {str(e)}")


@router.post("/api-keys", response_model=APIKeysResponse)
async def save_api_keys(request: APIKeysRequest):
    """
    Save API keys to secure storage.
    Keys are encrypted before storage.
    """
    try:
        storage = get_api_key_storage()
        
        # Prepare keys dictionary (only include keys that are provided)
        keys_to_save = {}
        if request.alpha_vantage is not None:
            keys_to_save['alpha_vantage'] = request.alpha_vantage
        if request.polygon is not None:
            keys_to_save['polygon'] = request.polygon
        if request.openai is not None:
            keys_to_save['openai'] = request.openai
        if request.anthropic is not None:
            keys_to_save['anthropic'] = request.anthropic
        
        # Get existing keys and merge
        existing_keys = storage.get_all_keys()
        for key_type in ['alpha_vantage', 'polygon', 'openai', 'anthropic']:
            if key_type not in keys_to_save:
                # Keep existing value if not provided
                keys_to_save[key_type] = existing_keys.get(key_type, '')
        
        # Save all keys
        storage.save_keys(keys_to_save)
        
        # Return masked response
        return APIKeysResponse(
            alpha_vantage_set=bool(keys_to_save.get('alpha_vantage', '')),
            polygon_set=bool(keys_to_save.get('polygon', '')),
            openai_set=bool(keys_to_save.get('openai', '')),
            anthropic_set=bool(keys_to_save.get('anthropic', '')),
        )
    except Exception as e:
        logger.error(f"Error saving API keys: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save API keys: {str(e)}")
