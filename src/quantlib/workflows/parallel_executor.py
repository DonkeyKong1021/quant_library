"""
Parallel execution framework for backtests
"""

import multiprocessing
from typing import List, Dict, Any, Callable, Optional
from concurrent.futures import ProcessPoolExecutor, as_completed
import logging

logger = logging.getLogger(__name__)


class ParallelExecutor:
    """Execute backtests in parallel using multiprocessing"""
    
    def __init__(self, n_workers: Optional[int] = None):
        """
        Initialize parallel executor.
        
        Args:
            n_workers: Number of worker processes (default: CPU count)
        """
        if n_workers is None:
            n_workers = multiprocessing.cpu_count()
        self.n_workers = min(n_workers, multiprocessing.cpu_count())
        logger.info(f"Initialized ParallelExecutor with {self.n_workers} workers")
    
    def execute_batch(
        self,
        tasks: List[Dict[str, Any]],
        task_function: Callable[[Dict[str, Any]], Dict[str, Any]],
        progress_callback: Optional[Callable[[int, int], None]] = None
    ) -> List[Dict[str, Any]]:
        """
        Execute a batch of tasks in parallel.
        
        Args:
            tasks: List of task dictionaries (each contains parameters for a backtest)
            task_function: Function that executes a single task and returns result
            progress_callback: Optional callback function(completed, total) for progress updates
        
        Returns:
            List of results corresponding to tasks (in same order)
        """
        if not tasks:
            return []
        
        results = [None] * len(tasks)
        completed_count = 0
        
        with ProcessPoolExecutor(max_workers=self.n_workers) as executor:
            # Submit all tasks
            future_to_index = {
                executor.submit(task_function, task): i
                for i, task in enumerate(tasks)
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_index):
                index = future_to_index[future]
                try:
                    result = future.result()
                    results[index] = result
                    completed_count += 1
                    
                    if progress_callback:
                        progress_callback(completed_count, len(tasks))
                        
                except Exception as e:
                    logger.error(f"Error executing task {index}: {e}")
                    results[index] = {
                        'error': str(e),
                        'parameters': tasks[index].get('parameters', {})
                    }
        
        return results
