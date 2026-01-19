"""Strategy Registry - Discovery and management of strategy library"""

import os
import json
from typing import Dict, List, Optional, Set
from pathlib import Path
import importlib.util
import sys

from quantlib.strategy_library.metadata import StrategyMetadata, ParameterDefinition

# Try to import yaml (optional)
try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False


class StrategyRegistry:
    """Registry for managing strategy library"""
    
    def __init__(self, library_path: Optional[str] = None):
        """
        Initialize strategy registry.
        
        Args:
            library_path: Path to strategy library directory (default: auto-detect)
        """
        if library_path is None:
            # Auto-detect: look for strategy_library/strategies directory
            current_file = Path(__file__).parent
            library_path = current_file / 'strategies'
            if not library_path.exists():
                library_path = current_file.parent.parent / 'strategy_library' / 'strategies'
        
        self.library_path = Path(library_path)
        self._strategies: Dict[str, StrategyMetadata] = {}
        self._loaded = False
        
        # Ensure library path exists
        self.library_path.mkdir(parents=True, exist_ok=True)
    
    def discover_strategies(self) -> List[StrategyMetadata]:
        """
        Discover all strategies in the library.
        
        Returns:
            List of StrategyMetadata objects
        """
        if self._loaded:
            return list(self._strategies.values())
        
        strategies = []
        
        if not self.library_path.exists():
            return strategies
        
        # Look for metadata files (YAML or JSON)
        if YAML_AVAILABLE:
            for metadata_file in self.library_path.rglob('*.yaml'):
                try:
                    metadata = self._load_metadata_file(metadata_file)
                    if metadata:
                        strategies.append(metadata)
                        self._strategies[metadata.id] = metadata
                except Exception as e:
                    print(f"Warning: Failed to load metadata from {metadata_file}: {e}")
                    continue
            
            for metadata_file in self.library_path.rglob('*.yml'):
                try:
                    metadata = self._load_metadata_file(metadata_file)
                    if metadata:
                        strategies.append(metadata)
                        self._strategies[metadata.id] = metadata
                except Exception as e:
                    print(f"Warning: Failed to load metadata from {metadata_file}: {e}")
                    continue
        
        for metadata_file in self.library_path.rglob('*.json'):
            try:
                metadata = self._load_metadata_file(metadata_file)
                if metadata:
                    strategies.append(metadata)
                    self._strategies[metadata.id] = metadata
            except Exception as e:
                print(f"Warning: Failed to load metadata from {metadata_file}: {e}")
                continue
        
        self._loaded = True
        return strategies
    
    def _load_metadata_file(self, metadata_file: Path) -> Optional[StrategyMetadata]:
        """Load metadata from a file"""
        with open(metadata_file, 'r') as f:
            if metadata_file.suffix in ['.yaml', '.yml']:
                if YAML_AVAILABLE:
                    data = yaml.safe_load(f)
                else:
                    raise ImportError("YAML not available. Install PyYAML to use .yaml files.")
            else:
                data = json.load(f)
        
        metadata = StrategyMetadata.from_dict(data)
        
        # Load code if code_file is specified
        if metadata.code_file and not metadata.code:
            code_path = metadata_file.parent / metadata.code_file
            if code_path.exists():
                with open(code_path, 'r') as code_f:
                    metadata.code = code_f.read()
        
        return metadata
    
    def get_strategy(self, strategy_id: str) -> Optional[StrategyMetadata]:
        """
        Get strategy metadata by ID.
        
        Args:
            strategy_id: Strategy identifier
            
        Returns:
            StrategyMetadata or None if not found
        """
        if not self._loaded:
            self.discover_strategies()
        
        return self._strategies.get(strategy_id)
    
    def list_strategies(
        self,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        search: Optional[str] = None
    ) -> List[StrategyMetadata]:
        """
        List strategies with optional filtering.
        
        Args:
            category: Filter by category
            tags: Filter by tags (strategies must have all tags)
            search: Search in name, description, tags
            
        Returns:
            List of StrategyMetadata objects
        """
        if not self._loaded:
            self.discover_strategies()
        
        strategies = list(self._strategies.values())
        
        # Filter by category
        if category:
            strategies = [s for s in strategies if s.category == category]
        
        # Filter by tags
        if tags:
            strategies = [
                s for s in strategies
                if all(tag in s.tags for tag in tags)
            ]
        
        # Search
        if search:
            search_lower = search.lower()
            strategies = [
                s for s in strategies
                if (search_lower in s.name.lower() or
                    search_lower in s.description.lower() or
                    any(search_lower in tag.lower() for tag in s.tags))
            ]
        
        return strategies
    
    def get_categories(self) -> Set[str]:
        """
        Get all strategy categories.
        
        Returns:
            Set of category names
        """
        if not self._loaded:
            self.discover_strategies()
        
        return set(s.category for s in self._strategies.values())
    
    def get_all_tags(self) -> Set[str]:
        """
        Get all tags used across strategies.
        
        Returns:
            Set of tag names
        """
        if not self._loaded:
            self.discover_strategies()
        
        tags = set()
        for strategy in self._strategies.values():
            tags.update(strategy.tags)
        return tags


# Global registry instance
_registry: Optional[StrategyRegistry] = None


def get_registry() -> StrategyRegistry:
    """Get global strategy registry instance"""
    global _registry
    if _registry is None:
        _registry = StrategyRegistry()
    return _registry
