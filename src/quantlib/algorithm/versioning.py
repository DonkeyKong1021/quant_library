"""Algorithm versioning system"""

from typing import Dict, List, Optional
from datetime import datetime
from dataclasses import dataclass, field
import uuid


@dataclass
class AlgorithmVersion:
    """Represents a version of an algorithm"""
    version_id: str
    algorithm_id: str
    version_number: str  # e.g., "1.0.0", "1.1.0"
    code: str
    description: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    created_by: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)
    is_active: bool = False
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'version_id': self.version_id,
            'algorithm_id': self.algorithm_id,
            'version_number': self.version_number,
            'code': self.code,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'created_by': self.created_by,
            'tags': self.tags,
            'metadata': self.metadata,
            'is_active': self.is_active,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'AlgorithmVersion':
        """Create from dictionary"""
        return cls(
            version_id=data['version_id'],
            algorithm_id=data['algorithm_id'],
            version_number=data['version_number'],
            code=data['code'],
            description=data.get('description'),
            created_at=datetime.fromisoformat(data['created_at']),
            created_by=data.get('created_by'),
            tags=data.get('tags', []),
            metadata=data.get('metadata', {}),
            is_active=data.get('is_active', False)
        )


class AlgorithmVersionManager:
    """Manages algorithm versions"""
    
    def __init__(self, storage_backend=None):
        """
        Initialize version manager.
        
        Args:
            storage_backend: Storage backend (database, file system, etc.)
        """
        self.storage = storage_backend
        self.versions: Dict[str, List[AlgorithmVersion]] = {}  # algorithm_id -> versions
    
    def create_version(
        self,
        algorithm_id: str,
        code: str,
        version_number: Optional[str] = None,
        description: Optional[str] = None,
        created_by: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> AlgorithmVersion:
        """
        Create a new version of an algorithm.
        
        Args:
            algorithm_id: Algorithm ID
            code: Algorithm code
            version_number: Version number (auto-incremented if None)
            description: Version description
            created_by: Creator identifier
            tags: Version tags
            
        Returns:
            AlgorithmVersion object
        """
        # Auto-generate version number if not provided
        if version_number is None:
            existing_versions = self.get_versions(algorithm_id)
            if existing_versions:
                # Parse last version and increment
                last_version = existing_versions[-1].version_number
                parts = last_version.split('.')
                if len(parts) == 3:
                    major, minor, patch = map(int, parts)
                    patch += 1
                    version_number = f"{major}.{minor}.{patch}"
                else:
                    version_number = "1.0.0"
            else:
                version_number = "1.0.0"
        
        version = AlgorithmVersion(
            version_id=str(uuid.uuid4()),
            algorithm_id=algorithm_id,
            version_number=version_number,
            code=code,
            description=description,
            created_by=created_by,
            tags=tags or []
        )
        
        # Store version
        if algorithm_id not in self.versions:
            self.versions[algorithm_id] = []
        self.versions[algorithm_id].append(version)
        
        # Sort by version number
        self.versions[algorithm_id].sort(key=lambda v: v.version_number)
        
        return version
    
    def get_versions(self, algorithm_id: str) -> List[AlgorithmVersion]:
        """Get all versions for an algorithm"""
        return self.versions.get(algorithm_id, [])
    
    def get_version(self, algorithm_id: str, version_number: str) -> Optional[AlgorithmVersion]:
        """Get specific version"""
        versions = self.get_versions(algorithm_id)
        for version in versions:
            if version.version_number == version_number:
                return version
        return None
    
    def get_latest_version(self, algorithm_id: str) -> Optional[AlgorithmVersion]:
        """Get latest version"""
        versions = self.get_versions(algorithm_id)
        return versions[-1] if versions else None
    
    def set_active_version(self, algorithm_id: str, version_number: str) -> bool:
        """Set active version for an algorithm"""
        version = self.get_version(algorithm_id, version_number)
        if version:
            # Deactivate all other versions
            for v in self.get_versions(algorithm_id):
                v.is_active = False
            version.is_active = True
            return True
        return False
    
    def compare_versions(
        self,
        algorithm_id: str,
        version1: str,
        version2: str
    ) -> Dict:
        """Compare two versions (returns diff information)"""
        v1 = self.get_version(algorithm_id, version1)
        v2 = self.get_version(algorithm_id, version2)
        
        if not v1 or not v2:
            return {'error': 'Version not found'}
        
        return {
            'version1': v1.version_number,
            'version2': v2.version_number,
            'code_diff': self._diff_code(v1.code, v2.code),
            'metadata_diff': self._diff_dict(v1.metadata, v2.metadata),
        }
    
    def _diff_code(self, code1: str, code2: str) -> Dict:
        """Simple code diff (in practice, use a proper diff library)"""
        lines1 = code1.split('\n')
        lines2 = code2.split('\n')
        return {
            'lines_added': len(lines2) - len(lines1),
            'similarity': len(set(lines1) & set(lines2)) / max(len(set(lines1)), len(set(lines2)), 1)
        }
    
    def _diff_dict(self, dict1: Dict, dict2: Dict) -> Dict:
        """Compare two dictionaries"""
        all_keys = set(dict1.keys()) | set(dict2.keys())
        diff = {}
        for key in all_keys:
            if key not in dict1:
                diff[key] = {'added': dict2[key]}
            elif key not in dict2:
                diff[key] = {'removed': dict1[key]}
            elif dict1[key] != dict2[key]:
                diff[key] = {'changed': (dict1[key], dict2[key])}
        return diff
