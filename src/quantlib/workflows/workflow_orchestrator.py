"""
Workflow orchestrator for coordinating optimization agent and parallel executor
"""

import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging
import uuid
import threading
import pandas as pd

# Add project root to path
project_root = Path(__file__).parent.parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from quantlib.workflows.optimization_agent import OptimizationAgent
from quantlib.workflows.parallel_executor import ParallelExecutor

logger = logging.getLogger(__name__)


class WorkflowOrchestrator:
    """Orchestrates optimization workflow with parallel execution"""
    
    def __init__(
        self,
        strategy_config: Dict[str, Any],
        data_df: pd.DataFrame,
        symbol: str,
        parameter_ranges: Dict[str, Dict[str, Any]],
        config: Dict[str, Any],
        objective: str = 'sharpe_ratio',
        max_iterations: int = 100,
        n_workers: Optional[int] = None
    ):
        """
        Initialize workflow orchestrator.
        
        Args:
            strategy_config: Base strategy configuration (type and base params)
            data_df: DataFrame with OHLCV data
            symbol: Trading symbol
            parameter_ranges: Parameter ranges for optimization
            config: Backtest configuration
            objective: Objective metric to optimize
            max_iterations: Maximum optimization iterations
            n_workers: Number of parallel workers
        """
        self.workflow_id = str(uuid.uuid4())
        self.strategy_config = strategy_config
        self.data_df = data_df.copy()
        self.symbol = symbol
        self.parameter_ranges = parameter_ranges
        self.config = config
        self.objective = objective
        self.max_iterations = max_iterations
        self.n_workers = n_workers
        
        self.status = 'pending'
        self.progress = 0
        self.results = []
        self.best_result = None
        self.start_time = None
        self.end_time = None
        self.error = None
        
        # Thread safety
        self._lock = threading.Lock()
        self._stop_requested = False
    
    def _create_objective_function(self):
        """Create objective function for optimization agent"""
        # Import here to avoid circular dependencies
        from api.routers.backtest import run_single_backtest
        
        def objective(params: Dict[str, Any]) -> float:
            """Objective function: run backtest and return metric value"""
            try:
                # Create strategy config with test parameters
                test_strategy_config = self.strategy_config.copy()
                base_params = test_strategy_config.get('params', {}).copy()
                base_params.update(params)
                test_strategy_config['params'] = base_params
                
                # Run backtest
                result = run_single_backtest(
                    data_df=self.data_df,
                    strategy_config=test_strategy_config,
                    config=self.config,
                    symbol=self.symbol
                )
                
                # Get objective value
                metrics = result.get('metrics', {})
                objective_value = metrics.get(self.objective)
                
                if objective_value is None:
                    logger.warning(f"Objective '{self.objective}' not found in metrics")
                    return float('-inf')
                
                return float(objective_value) if objective_value is not None else float('-inf')
            
            except Exception as e:
                logger.error(f"Error in objective function: {e}")
                return float('-inf')
        
        return objective
    
    def _run_backtest_task(self, task_params: Dict[str, Any]) -> Dict[str, Any]:
        """Run a single backtest task (used by parallel executor)"""
        from api.routers.backtest import run_single_backtest
        
        try:
            params = task_params.get('parameters', {})
            
            # Create strategy config with test parameters
            test_strategy_config = self.strategy_config.copy()
            base_params = test_strategy_config.get('params', {}).copy()
            base_params.update(params)
            test_strategy_config['params'] = base_params
            
            # Run backtest
            result = run_single_backtest(
                data_df=self.data_df,
                strategy_config=test_strategy_config,
                config=self.config,
                symbol=self.symbol
            )
            
            # Get objective value
            metrics = result.get('metrics', {})
            objective_value = metrics.get(self.objective, float('-inf'))
            
            return {
                'parameters': params,
                'metrics': metrics,
                'objective_value': float(objective_value) if objective_value is not None else float('-inf'),
                'result_id': str(uuid.uuid4()),
                'result': result
            }
        
        except Exception as e:
            logger.error(f"Error running backtest task: {e}")
            return {
                'parameters': task_params.get('parameters', {}),
                'error': str(e),
                'objective_value': float('-inf')
            }
    
    def run(self, async_execution: bool = False) -> Dict[str, Any]:
        """
        Run the optimization workflow.
        
        Args:
            async_execution: If True, run in background thread and return immediately
        
        Returns:
            Dictionary with workflow results (or workflow_id if async)
        """
        if async_execution:
            # Run in background thread
            thread = threading.Thread(target=self._run_sync)
            thread.daemon = True
            thread.start()
            return {
                'workflow_id': self.workflow_id,
                'status': 'running',
                'progress': 0
            }
        else:
            return self._run_sync()
    
    def _run_sync(self) -> Dict[str, Any]:
        """Run workflow synchronously"""
        with self._lock:
            self.status = 'running'
            self.start_time = datetime.now()
        
        try:
            # Create optimization agent
            objective_function = self._create_objective_function()
            agent = OptimizationAgent(
                parameter_ranges=self.parameter_ranges,
                objective_function=objective_function,
                max_iterations=self.max_iterations
            )
            
            # Create parallel executor
            executor = ParallelExecutor(n_workers=self.n_workers)
            
            # Run Bayesian optimization
            # For now, run full optimization (scikit-optimize handles internal parallelism)
            # In the future, we could implement batch-based optimization for better parallelization
            opt_result = agent.optimize(n_calls=self.max_iterations)
            
            # Extract results from optimization history
            with self._lock:
                self.results = [
                    {
                        'parameters': entry['parameters'],
                        'objective_value': entry['objective_value'],
                        'metrics': {}  # Will be populated if we store full results
                    }
                    for entry in agent.optimization_history
                ]
                
                # Find best result
                if self.results:
                    self.best_result = max(self.results, key=lambda x: x['objective_value'])
                    self.progress = 100
                    self.status = 'completed'
                else:
                    self.status = 'failed'
                    self.error = "No results generated"
            
            self.end_time = datetime.now()
            
            return self.get_status()
        
        except Exception as e:
            logger.error(f"Error in workflow execution: {e}")
            with self._lock:
                self.status = 'failed'
                self.error = str(e)
                self.end_time = datetime.now()
            return self.get_status()
    
    def stop(self):
        """Request workflow to stop"""
        with self._lock:
            self._stop_requested = True
            if self.status == 'running':
                self.status = 'stopped'
                self.end_time = datetime.now()
    
    def get_status(self) -> Dict[str, Any]:
        """Get current workflow status"""
        with self._lock:
            elapsed = None
            if self.start_time:
                end = self.end_time or datetime.now()
                elapsed = (end - self.start_time).total_seconds()
            
            return {
                'workflow_id': self.workflow_id,
                'status': self.status,
                'progress': self.progress,
                'best_result': self.best_result,
                'top_results': sorted(self.results, key=lambda x: x['objective_value'], reverse=True)[:10],
                'total_backtests': len(self.results),
                'elapsed_seconds': elapsed,
                'error': self.error
            }
