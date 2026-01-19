"""
Backtest results storage utilities
"""

import sys
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
import json

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from quantlib.data.database import create_database_engine, get_database_url
from sqlalchemy import text, select
from sqlalchemy.dialects.postgresql import JSONB


class BacktestStorage:
    """Storage for backtest results"""
    
    def __init__(self, database_url: Optional[str] = None):
        self.engine = create_database_engine(url=database_url or get_database_url())
    
    def save_result(
        self,
        result_id: str,
        symbol: str,
        strategy_name: Optional[str],
        results: Dict[str, Any],
        metrics: Dict[str, Any],
        equity_curve: List[Dict[str, Any]],
        trades: List[Dict[str, Any]],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Save backtest result to database
        
        Args:
            result_id: Unique identifier for the result
            symbol: Stock symbol
            strategy_name: Name of the strategy
            results: Backtest results dictionary
            metrics: Performance metrics dictionary
            equity_curve: Equity curve data
            trades: Trade history
            metadata: Optional metadata (start_date, end_date, initial_capital, commission, slippage)
        """
        # Store metadata in metrics if provided
        if metadata:
            metrics = {**metrics, **metadata}
        
        with self.engine.connect() as conn:
            insert_query = text("""
                INSERT INTO backtest_results 
                (result_id, symbol, strategy_name, results, metrics, equity_curve, trades)
                VALUES (:result_id, :symbol, :strategy_name, :results, :metrics, :equity_curve, :trades)
                ON CONFLICT (result_id) DO UPDATE SET
                    symbol = EXCLUDED.symbol,
                    strategy_name = EXCLUDED.strategy_name,
                    results = EXCLUDED.results,
                    metrics = EXCLUDED.metrics,
                    equity_curve = EXCLUDED.equity_curve,
                    trades = EXCLUDED.trades
            """)
            conn.execute(insert_query, {
                'result_id': result_id,
                'symbol': symbol,
                'strategy_name': strategy_name,
                'results': json.dumps(results),
                'metrics': json.dumps(metrics),
                'equity_curve': json.dumps(equity_curve),
                'trades': json.dumps(trades),
            })
            conn.commit()
    
    def get_result(self, result_id: str) -> Optional[Dict[str, Any]]:
        """Get backtest result by ID"""
        with self.engine.connect() as conn:
            query = text("""
                SELECT result_id, symbol, strategy_name, created_at, results, metrics, equity_curve, trades
                FROM backtest_results
                WHERE result_id = :result_id
            """)
            result = conn.execute(query, {'result_id': result_id})
            row = result.fetchone()
            
            if row:
                return {
                    'result_id': row[0],
                    'symbol': row[1],
                    'strategy_name': row[2],
                    'created_at': row[3].isoformat() if row[3] else None,
                    'results': json.loads(row[4]) if row[4] else {},
                    'metrics': json.loads(row[5]) if row[5] else {},
                    'equity_curve': json.loads(row[6]) if row[6] else [],
                    'trades': json.loads(row[7]) if row[7] else [],
                }
            return None
    
    def list_results(
        self,
        limit: int = 100,
        offset: int = 0,
        symbol: Optional[str] = None,
        strategy_name: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        sort_by: str = 'created_at',
        sort_order: str = 'DESC'
    ) -> List[Dict[str, Any]]:
        """List backtest results with filtering and sorting
        
        Args:
            limit: Maximum number of results to return
            offset: Number of results to skip
            symbol: Filter by symbol (case-insensitive partial match)
            strategy_name: Filter by strategy name (case-insensitive partial match)
            start_date: Filter by start_date in metrics (YYYY-MM-DD format)
            end_date: Filter by end_date in metrics (YYYY-MM-DD format)
            sort_by: Field to sort by (created_at, symbol, strategy_name, or metric key)
            sort_order: Sort order (ASC or DESC)
        """
        with self.engine.connect() as conn:
            # Build WHERE clause
            where_conditions = []
            params = {'limit': limit, 'offset': offset}
            
            if symbol:
                where_conditions.append("LOWER(symbol) LIKE LOWER(:symbol)")
                params['symbol'] = f'%{symbol}%'
            
            if strategy_name:
                where_conditions.append("LOWER(strategy_name) LIKE LOWER(:strategy_name)")
                params['strategy_name'] = f'%{strategy_name}%'
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            # Validate sort_by and sort_order
            valid_sort_fields = ['created_at', 'symbol', 'strategy_name']
            if sort_by not in valid_sort_fields:
                sort_by = 'created_at'
            
            if sort_order.upper() not in ['ASC', 'DESC']:
                sort_order = 'DESC'
            else:
                sort_order = sort_order.upper()
            
            # Build query
            query = text(f"""
                SELECT result_id, symbol, strategy_name, created_at, metrics
                FROM backtest_results
                WHERE {where_clause}
                ORDER BY {sort_by} {sort_order}
                LIMIT :limit OFFSET :offset
            """)
            
            result = conn.execute(query, params)
            rows = result.fetchall()
            
            results = []
            for row in rows:
                metrics_data = json.loads(row[4]) if row[4] else {}
                
                # Apply date filtering on metrics if specified
                if start_date and metrics_data.get('start_date'):
                    if metrics_data['start_date'] < start_date:
                        continue
                if end_date and metrics_data.get('end_date'):
                    if metrics_data['end_date'] > end_date:
                        continue
                
                results.append({
                    'result_id': row[0],
                    'symbol': row[1],
                    'strategy_name': row[2],
                    'created_at': row[3].isoformat() if row[3] else None,
                    'metrics': metrics_data,
                })
            
            return results
    
    def delete_result(self, result_id: str) -> bool:
        """Delete backtest result"""
        with self.engine.connect() as conn:
            query = text("DELETE FROM backtest_results WHERE result_id = :result_id")
            result = conn.execute(query, {'result_id': result_id})
            conn.commit()
            return result.rowcount > 0
    
    def count_results(
        self,
        symbol: Optional[str] = None,
        strategy_name: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> int:
        """Count backtest results with filtering"""
        with self.engine.connect() as conn:
            where_conditions = []
            params = {}
            
            if symbol:
                where_conditions.append("LOWER(symbol) LIKE LOWER(:symbol)")
                params['symbol'] = f'%{symbol}%'
            
            if strategy_name:
                where_conditions.append("LOWER(strategy_name) LIKE LOWER(:strategy_name)")
                params['strategy_name'] = f'%{strategy_name}%'
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            query = text(f"""
                SELECT COUNT(*) FROM backtest_results
                WHERE {where_clause}
            """)
            
            result = conn.execute(query, params)
            return result.scalar() or 0
