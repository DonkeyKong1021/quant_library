"""
Bayesian optimization agent for parameter exploration
"""

import sys
from pathlib import Path
from typing import Dict, Any, List, Callable, Optional
import logging
import numpy as np

# Add project root to path
project_root = Path(__file__).parent.parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

logger = logging.getLogger(__name__)

try:
    from skopt import gp_minimize
    from skopt.space import Real, Integer, Categorical
    from skopt.utils import use_named_args
    SKOPT_AVAILABLE = True
except ImportError:
    SKOPT_AVAILABLE = False
    logger.warning("scikit-optimize not available. Install with: pip install scikit-optimize")


class OptimizationAgent:
    """Bayesian optimization agent using Gaussian Process optimization"""
    
    def __init__(
        self,
        parameter_ranges: Dict[str, Dict[str, Any]],
        objective_function: Callable[[Dict[str, Any]], float],
        max_iterations: int = 100
    ):
        """
        Initialize optimization agent.
        
        Args:
            parameter_ranges: Dictionary mapping parameter names to ranges
                Format: {"param_name": {"min": float, "max": float, "type": "int"|"float"}}
            objective_function: Function that takes parameters dict and returns objective value (to maximize)
            max_iterations: Maximum number of optimization iterations
        """
        if not SKOPT_AVAILABLE:
            raise ImportError(
                "scikit-optimize is required for Bayesian optimization. "
                "Install with: pip install scikit-optimize"
            )
        
        self.parameter_ranges = parameter_ranges
        self.objective_function = objective_function
        self.max_iterations = max_iterations
        
        # Convert parameter ranges to skopt Space
        self.space = self._create_space()
        self.parameter_names = list(parameter_ranges.keys())
        
        # Store optimization history
        self.optimization_history = []
    
    def _create_space(self):
        """Convert parameter ranges to scikit-optimize Space"""
        dimensions = []
        for param_name, param_range in self.parameter_ranges.items():
            min_val = param_range['min']
            max_val = param_range['max']
            param_type = param_range.get('type', 'float')
            
            if param_type == 'int':
                dimensions.append(Integer(min_val, max_val, name=param_name))
            else:
                dimensions.append(Real(min_val, max_val, name=param_name))
        
        return dimensions
    
    def optimize(self, n_calls: Optional[int] = None) -> Dict[str, Any]:
        """
        Run Bayesian optimization.
        
        Args:
            n_calls: Number of optimization calls (default: max_iterations)
        
        Returns:
            Dictionary with best parameters and optimization results
        """
        if n_calls is None:
            n_calls = self.max_iterations
        
        # Create objective wrapper (negate since gp_minimize minimizes)
        @use_named_args(dimensions=self.space)
        def objective_wrapper(**params):
            # Convert to dict format expected by objective_function
            params_dict = {name: params[name] for name in self.parameter_names}
            
            try:
                objective_value = self.objective_function(params_dict)
                # Negate because gp_minimize minimizes, but we want to maximize
                return -float(objective_value) if objective_value is not None else float('inf')
            except Exception as e:
                logger.error(f"Error in objective function: {e}")
                return float('inf')
        
        # Run optimization
        logger.info(f"Starting Bayesian optimization with {n_calls} iterations")
        result = gp_minimize(
            func=objective_wrapper,
            dimensions=self.space,
            n_calls=n_calls,
            n_initial_points=min(10, n_calls // 4),  # 25% for initial exploration
            random_state=42,
            verbose=False
        )
        
        # Extract best parameters
        best_params = {}
        for i, param_name in enumerate(self.parameter_names):
            value = result.x[i]
            param_type = self.parameter_ranges[param_name].get('type', 'float')
            if param_type == 'int':
                best_params[param_name] = int(round(value))
            else:
                best_params[param_name] = float(value)
        
        # Store optimization history
        self.optimization_history = []
        if hasattr(result, 'x_iters') and hasattr(result, 'func_vals'):
            for i, func_val in enumerate(result.func_vals):
                params = {}
                if i < len(result.x_iters):
                    param_values = result.x_iters[i]
                    for j, param_name in enumerate(self.parameter_names):
                        if j < len(param_values):
                            value = param_values[j]
                            param_type = self.parameter_ranges[param_name].get('type', 'float')
                            if param_type == 'int':
                                params[param_name] = int(round(value))
                            else:
                                params[param_name] = float(value)
                    
                    self.optimization_history.append({
                        'parameters': params,
                        'objective_value': -func_val  # Negate back to original scale
                    })
        
        logger.info(f"Optimization complete. Best objective: {-result.fun:.4f}")
        
        return {
            'best_parameters': best_params,
            'best_objective_value': -result.fun,  # Negate back
            'optimization_result': result,
            'history': self.optimization_history
        }
    
    def suggest_next_batch(
        self,
        n_suggestions: int = 10,
        previous_results: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Suggest next batch of parameter combinations to test.
        
        This is useful for iterative optimization where batches are evaluated in parallel.
        
        Args:
            n_suggestions: Number of suggestions to generate
            previous_results: Previous evaluation results (for informed suggestions)
        
        Returns:
            List of parameter dictionaries to test
        """
        # For now, run a quick optimization to get suggestions
        # In a more sophisticated implementation, we could use the acquisition function directly
        temp_result = self.optimize(n_calls=n_suggestions)
        
        # Extract suggestions from history (last n_suggestions)
        suggestions = [
            {'parameters': entry['parameters']}
            for entry in self.optimization_history[-n_suggestions:]
        ]
        
        return suggestions
