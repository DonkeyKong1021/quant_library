"""
Walk-forward analysis for backtesting

Walk-forward analysis splits data into training and testing periods, optimizes
parameters on training data, then tests on out-of-sample data to detect overfitting.
"""

from typing import Dict, Any, List, Optional, Callable
import pandas as pd
import numpy as np
from datetime import datetime

from quantlib.backtesting import BacktestEngine
from quantlib.strategies import Strategy
from quantlib.risk import RiskCalculator


class WalkForwardAnalyzer:
    """Walk-forward analysis for strategy optimization"""
    
    def __init__(
        self,
        train_size: int,
        test_size: int,
        step_size: Optional[int] = None,
        anchor: bool = False
    ):
        """
        Initialize walk-forward analyzer.
        
        Args:
            train_size: Number of periods for training (e.g., 252 for 1 year of daily data)
            test_size: Number of periods for testing (e.g., 63 for 1 quarter)
            step_size: Number of periods to step forward (default: test_size)
            anchor: If True, training window expands (anchor). If False, rolling window (fixed size)
        """
        self.train_size = train_size
        self.test_size = test_size
        self.step_size = step_size if step_size is not None else test_size
        self.anchor = anchor
    
    def run_analysis(
        self,
        strategy_factory: Callable[[Dict[str, Any]], Strategy],
        data: pd.DataFrame,
        symbol: str,
        parameter_ranges: Dict[str, Dict[str, Any]],
        optimization_objective: str = 'sharpe_ratio',
        initial_capital: float = 100000.0,
        commission: float = 1.0,
        slippage: float = 0.0,
        commission_type: str = 'fixed',
        risk_free_rate: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Run walk-forward analysis.
        
        Args:
            strategy_factory: Function that takes parameters dict and returns Strategy instance
            data: OHLCV DataFrame with datetime index
            symbol: Trading symbol
            parameter_ranges: Parameter ranges for optimization (same format as optimization)
            optimization_objective: Metric to optimize (e.g., 'sharpe_ratio', 'total_return')
            initial_capital: Starting capital
            commission: Commission per trade
            slippage: Slippage as fraction
            commission_type: 'fixed' or 'percentage'
            risk_free_rate: Risk-free rate for metrics
        
        Returns:
            Dictionary with walk-forward results
        """
        if data.empty:
            raise ValueError("Data cannot be empty")
        
        total_periods = len(data)
        if total_periods < self.train_size + self.test_size:
            raise ValueError(
                f"Data length ({total_periods}) must be at least "
                f"train_size ({self.train_size}) + test_size ({self.test_size})"
            )
        
        results = []
        current_start = 0
        
        # Generate walk-forward windows
        windows = []
        while current_start + self.train_size + self.test_size <= total_periods:
            train_end = current_start + self.train_size
            test_end = train_end + self.test_size
            
            windows.append({
                'train_start': current_start,
                'train_end': train_end,
                'test_start': train_end,
                'test_end': test_end,
            })
            
            current_start += self.step_size
        
        if not windows:
            raise ValueError("No valid walk-forward windows could be created")
        
        # Run optimization and testing for each window
        for i, window in enumerate(windows):
            train_data = data.iloc[window['train_start']:window['train_end']]
            test_data = data.iloc[window['test_start']:window['test_end']]
            
            # Optimize parameters on training data
            best_params = self._optimize_parameters(
                strategy_factory=strategy_factory,
                data=train_data,
                symbol=symbol,
                parameter_ranges=parameter_ranges,
                objective=optimization_objective,
                initial_capital=initial_capital,
                commission=commission,
                slippage=slippage,
                commission_type=commission_type,
                risk_free_rate=risk_free_rate,
            )
            
            # Test optimized parameters on test data
            test_result = self._run_backtest(
                strategy_factory=strategy_factory,
                data=test_data,
                symbol=symbol,
                parameters=best_params,
                initial_capital=initial_capital,
                commission=commission,
                slippage=slippage,
                commission_type=commission_type,
                risk_free_rate=risk_free_rate,
            )
            
            # Also run on training data for comparison
            train_result = self._run_backtest(
                strategy_factory=strategy_factory,
                data=train_data,
                symbol=symbol,
                parameters=best_params,
                initial_capital=initial_capital,
                commission=commission,
                slippage=slippage,
                commission_type=commission_type,
                risk_free_rate=risk_free_rate,
            )
            
            results.append({
                'window': i + 1,
                'train_start_date': train_data.index[0],
                'train_end_date': train_data.index[-1],
                'test_start_date': test_data.index[0],
                'test_end_date': test_data.index[-1],
                'optimized_parameters': best_params,
                'train_metrics': train_result['metrics'],
                'test_metrics': test_result['metrics'],
                'test_equity_curve': test_result['equity_curve'],
                'test_returns': test_result['returns'],
            })
        
        # Calculate summary statistics
        summary = self._calculate_summary(results)
        
        return {
            'windows': results,
            'summary': summary,
            'train_size': self.train_size,
            'test_size': self.test_size,
            'step_size': self.step_size,
            'anchor': self.anchor,
            'total_windows': len(results),
        }
    
    def _optimize_parameters(
        self,
        strategy_factory: Callable[[Dict[str, Any]], Strategy],
        data: pd.DataFrame,
        symbol: str,
        parameter_ranges: Dict[str, Dict[str, Any]],
        objective: str,
        initial_capital: float,
        commission: float,
        slippage: float,
        commission_type: str,
        risk_free_rate: float,
    ) -> Dict[str, Any]:
        """Optimize parameters using grid search"""
        from itertools import product
        
        # Generate parameter combinations
        param_names = list(parameter_ranges.keys())
        param_values = {}
        
        for param_name, param_range in parameter_ranges.items():
            min_val = param_range['min']
            max_val = param_range['max']
            step = param_range.get('step', 1.0 if param_range.get('type') == 'int' else 0.1)
            param_type = param_range.get('type', 'float')
            
            if param_type == 'int':
                values = list(range(int(min_val), int(max_val) + 1, int(step)))
            else:
                values = list(np.arange(min_val, max_val + step, step))
            
            param_values[param_name] = values
        
        # Generate all combinations
        combinations = list(product(*[param_values[name] for name in param_names]))
        
        # Limit combinations for performance
        max_combinations = 100
        if len(combinations) > max_combinations:
            # Sample combinations
            indices = np.linspace(0, len(combinations) - 1, max_combinations, dtype=int)
            combinations = [combinations[i] for i in indices]
        
        # Test each combination
        best_params = None
        best_objective = float('-inf')
        
        for combo in combinations:
            params = {param_names[i]: combo[i] for i in range(len(param_names))}
            
            try:
                result = self._run_backtest(
                    strategy_factory=strategy_factory,
                    data=data,
                    symbol=symbol,
                    parameters=params,
                    initial_capital=initial_capital,
                    commission=commission,
                    slippage=slippage,
                    commission_type=commission_type,
                    risk_free_rate=risk_free_rate,
                )
                
                objective_value = result['metrics'].get(objective, float('-inf'))
                if objective_value > best_objective:
                    best_objective = objective_value
                    best_params = params
            except Exception as e:
                print(f"Warning: Error testing parameters {params}: {e}")
                continue
        
        if best_params is None:
            # Fallback to defaults
            best_params = {name: param_ranges[name].get('default', param_ranges[name]['min'])
                          for name, param_ranges in parameter_ranges.items()}
        
        return best_params
    
    def _run_backtest(
        self,
        strategy_factory: Callable[[Dict[str, Any]], Strategy],
        data: pd.DataFrame,
        symbol: str,
        parameters: Dict[str, Any],
        initial_capital: float,
        commission: float,
        slippage: float,
        commission_type: str,
        risk_free_rate: float,
    ) -> Dict[str, Any]:
        """Run a single backtest and return metrics"""
        strategy = strategy_factory(parameters)
        
        engine = BacktestEngine(
            initial_capital=initial_capital,
            commission=commission,
            slippage=slippage,
            commission_type=commission_type
        )
        engine._symbol = symbol
        
        backtest_results = engine.run(strategy, data, symbol=symbol)
        
        # Calculate metrics
        returns = backtest_results.get('returns', pd.Series())
        equity_curve = backtest_results.get('equity_curve', pd.Series())
        
        metrics = {}
        if len(returns) > 0:
            try:
                calculator = RiskCalculator(
                    returns=returns,
                    equity_curve=equity_curve if len(equity_curve) > 0 else None,
                    risk_free_rate=risk_free_rate,
                    periods=252,  # Daily data
                )
                metrics = calculator.get_flat_metrics()
            except Exception as e:
                print(f"Warning: Error calculating metrics: {e}")
        
        return {
            'metrics': metrics,
            'equity_curve': equity_curve,
            'returns': returns,
        }
    
    def _calculate_summary(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate summary statistics across all windows"""
        if not results:
            return {}
        
        # Extract metrics
        train_metrics_list = [r['train_metrics'] for r in results]
        test_metrics_list = [r['test_metrics'] for r in results]
        
        # Calculate averages
        summary = {}
        metric_names = set()
        for metrics in train_metrics_list + test_metrics_list:
            metric_names.update(metrics.keys())
        
        for metric_name in metric_names:
            train_values = [m.get(metric_name, 0) for m in train_metrics_list if metric_name in m]
            test_values = [m.get(metric_name, 0) for m in test_metrics_list if metric_name in m]
            
            if train_values:
                summary[f'train_avg_{metric_name}'] = np.mean(train_values)
                summary[f'train_std_{metric_name}'] = np.std(train_values)
            
            if test_values:
                summary[f'test_avg_{metric_name}'] = np.mean(test_values)
                summary[f'test_std_{metric_name}'] = np.std(test_values)
            
            # Calculate degradation (difference between train and test)
            if train_values and test_values:
                summary[f'degradation_{metric_name}'] = np.mean(train_values) - np.mean(test_values)
        
        return summary
