"""Strategy Metadata - Information about strategies"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class ParameterDefinition:
    """Definition of a strategy parameter"""
    name: str
    type: str  # 'int', 'float', 'str', 'bool'
    default: Any
    description: str = ""
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None
    choices: Optional[List[Any]] = None  # For categorical parameters


@dataclass
class StrategyMetadata:
    """Metadata for a strategy in the library"""
    id: str  # Unique identifier
    name: str  # Display name
    description: str = ""  # Long description
    category: str = "general"  # Category (momentum, mean_reversion, factor, etc.)
    author: str = ""
    version: str = "1.0.0"
    created_date: Optional[datetime] = None
    updated_date: Optional[datetime] = None
    
    # Strategy information
    parameters: List[ParameterDefinition] = field(default_factory=list)
    code_file: Optional[str] = None  # Path to strategy code file
    code: Optional[str] = None  # Strategy code (if embedded)
    
    # Documentation
    documentation: str = ""
    references: List[str] = field(default_factory=list)  # Papers, articles, etc.
    tags: List[str] = field(default_factory=list)  # Searchable tags
    
    # Performance (optional)
    benchmark_sharpe: Optional[float] = None
    benchmark_return: Optional[float] = None
    benchmark_drawdown: Optional[float] = None
    
    # Framework information
    uses_framework: bool = False  # Whether strategy uses AlgorithmFramework
    framework_components: Dict[str, str] = field(default_factory=dict)  # Component types used
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metadata to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'author': self.author,
            'version': self.version,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'updated_date': self.updated_date.isoformat() if self.updated_date else None,
            'parameters': [
                {
                    'name': p.name,
                    'type': p.type,
                    'default': p.default,
                    'description': p.description,
                    'min': p.min,
                    'max': p.max,
                    'step': p.step,
                    'choices': p.choices,
                }
                for p in self.parameters
            ],
            'code_file': self.code_file,
            'code': self.code,
            'documentation': self.documentation,
            'references': self.references,
            'tags': self.tags,
            'benchmark_sharpe': self.benchmark_sharpe,
            'benchmark_return': self.benchmark_return,
            'benchmark_drawdown': self.benchmark_drawdown,
            'uses_framework': self.uses_framework,
            'framework_components': self.framework_components,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'StrategyMetadata':
        """Create metadata from dictionary"""
        params = [
            ParameterDefinition(
                name=p['name'],
                type=p['type'],
                default=p['default'],
                description=p.get('description', ''),
                min=p.get('min'),
                max=p.get('max'),
                step=p.get('step'),
                choices=p.get('choices'),
            )
            for p in data.get('parameters', [])
        ]
        
        created_date = None
        if data.get('created_date'):
            created_date = datetime.fromisoformat(data['created_date'])
        
        updated_date = None
        if data.get('updated_date'):
            updated_date = datetime.fromisoformat(data['updated_date'])
        
        return cls(
            id=data['id'],
            name=data['name'],
            description=data.get('description', ''),
            category=data.get('category', 'general'),
            author=data.get('author', ''),
            version=data.get('version', '1.0.0'),
            created_date=created_date,
            updated_date=updated_date,
            parameters=params,
            code_file=data.get('code_file'),
            code=data.get('code'),
            documentation=data.get('documentation', ''),
            references=data.get('references', []),
            tags=data.get('tags', []),
            benchmark_sharpe=data.get('benchmark_sharpe'),
            benchmark_return=data.get('benchmark_return'),
            benchmark_drawdown=data.get('benchmark_drawdown'),
            uses_framework=data.get('uses_framework', False),
            framework_components=data.get('framework_components', {}),
        )
