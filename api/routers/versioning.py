"""Algorithm versioning endpoints"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional, List
import logging
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory storage for algorithm versions (would use database in production)
algorithm_versions: Dict[str, List[Dict[str, Any]]] = {}


@router.post("/algorithms/{algorithm_id}/versions")
async def create_version(algorithm_id: str, request: Dict[str, Any]):
    """
    Create a new version of an algorithm.
    
    Request body:
    - code: Algorithm code
    - version_number: Optional version number (auto-incremented if not provided)
    - description: Version description
    - tags: List of tags
    """
    try:
        if algorithm_id not in algorithm_versions:
            algorithm_versions[algorithm_id] = []
        
        existing_versions = algorithm_versions[algorithm_id]
        
        # Auto-generate version number if not provided
        version_number = request.get('version_number')
        if not version_number:
            if existing_versions:
                last_version = existing_versions[-1].get('version_number', '0.0.0')
                parts = last_version.split('.')
                if len(parts) == 3:
                    major, minor, patch = map(int, parts)
                    patch += 1
                    version_number = f"{major}.{minor}.{patch}"
                else:
                    version_number = "1.0.0"
            else:
                version_number = "1.0.0"
        
        version = {
            'version_id': str(uuid.uuid4()),
            'algorithm_id': algorithm_id,
            'version_number': version_number,
            'code': request.get('code', ''),
            'description': request.get('description'),
            'tags': request.get('tags', []),
            'created_at': None,  # Would use actual timestamp
            'is_active': False,
        }
        
        algorithm_versions[algorithm_id].append(version)
        
        return version
    except Exception as e:
        logger.error(f"Error creating version: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/algorithms/{algorithm_id}/versions")
async def list_versions(algorithm_id: str):
    """List all versions for an algorithm"""
    versions = algorithm_versions.get(algorithm_id, [])
    return {
        'algorithm_id': algorithm_id,
        'versions': versions,
        'total': len(versions)
    }


@router.get("/algorithms/{algorithm_id}/versions/{version_number}")
async def get_version(algorithm_id: str, version_number: str):
    """Get a specific version"""
    versions = algorithm_versions.get(algorithm_id, [])
    for version in versions:
        if version.get('version_number') == version_number:
            return version
    
    raise HTTPException(status_code=404, detail="Version not found")


@router.post("/algorithms/{algorithm_id}/versions/{version_number}/activate")
async def activate_version(algorithm_id: str, version_number: str):
    """Set a version as active"""
    versions = algorithm_versions.get(algorithm_id, [])
    
    for version in versions:
        if version.get('version_number') == version_number:
            # Deactivate all other versions
            for v in versions:
                v['is_active'] = False
            version['is_active'] = True
            return version
    
    raise HTTPException(status_code=404, detail="Version not found")


@router.get("/algorithms/{algorithm_id}/versions/compare")
async def compare_versions(
    algorithm_id: str,
    version1: str,
    version2: str
):
    """Compare two versions"""
    v1 = None
    v2 = None
    
    versions = algorithm_versions.get(algorithm_id, [])
    for version in versions:
        if version.get('version_number') == version1:
            v1 = version
        if version.get('version_number') == version2:
            v2 = version
    
    if not v1 or not v2:
        raise HTTPException(status_code=404, detail="One or both versions not found")
    
    return {
        'version1': v1,
        'version2': v2,
        'differences': {
            'code_diff': 'Stub - would show actual diff',
            'description_diff': v1.get('description') != v2.get('description'),
        }
    }
