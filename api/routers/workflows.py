"""
Agent workflow endpoints for intelligent backtest optimization
"""

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
import pandas as pd
import threading

# Set up logger
logger = logging.getLogger(__name__)

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from api.models.schemas import (
    WorkflowRequest,
    WorkflowResponse,
    WorkflowStatusResponse,
    WorkflowStatus,
    WorkflowResultSummary,
)
from api.routers.backtest import dict_list_to_dataframe
from quantlib.workflows.workflow_orchestrator import WorkflowOrchestrator

router = APIRouter()

# In-memory storage for workflows (can be extended to database)
workflows: Dict[str, WorkflowOrchestrator] = {}
workflows_lock = threading.Lock()


def _get_strategy_name(strategy_config: Dict[str, Any]) -> str:
    """Extract strategy name from config"""
    strategy_type = strategy_config.get('type', 'unknown')
    if strategy_type == 'custom':
        return 'Custom Strategy'
    
    try:
        from api.routers.strategies import STRATEGIES
        if strategy_type in STRATEGIES:
            return STRATEGIES[strategy_type]['name']
    except:
        pass
    
    return strategy_type


@router.post("/create", response_model=WorkflowResponse)
async def create_workflow(
    request: WorkflowRequest,
    background_tasks: BackgroundTasks
):
    """Create and start a new optimization workflow"""
    try:
        # Convert data from list of dicts to DataFrame
        data_df = dict_list_to_dataframe(request.data)
        
        if data_df.empty:
            raise HTTPException(status_code=400, detail="Data is empty")
        
        # Convert parameter ranges format
        param_ranges = {}
        for param_name, param_range in request.parameter_ranges.items():
            param_ranges[param_name] = {
                'min': param_range.min,
                'max': param_range.max,
                'type': param_range.type,
            }
        
        # Create orchestrator
        orchestrator = WorkflowOrchestrator(
            strategy_config=request.strategy,
            data_df=data_df,
            symbol=request.symbol,
            parameter_ranges=param_ranges,
            config=request.config,
            objective=request.objective,
            max_iterations=request.max_iterations,
            n_workers=request.n_workers
        )
        
        # Store orchestrator
        with workflows_lock:
            workflows[orchestrator.workflow_id] = orchestrator
        
        # Start workflow in background
        def run_workflow():
            try:
                orchestrator.run(async_execution=False)
            except Exception as e:
                logger.error(f"Error in workflow {orchestrator.workflow_id}: {e}")
                with workflows_lock:
                    if orchestrator.workflow_id in workflows:
                        workflows[orchestrator.workflow_id].status = 'failed'
                        workflows[orchestrator.workflow_id].error = str(e)
        
        background_tasks.add_task(run_workflow)
        
        return WorkflowResponse(
            workflow_id=orchestrator.workflow_id,
            status=WorkflowStatus.running,
            progress=0,
            message="Workflow started"
        )
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid request: {str(e)}")
    except Exception as e:
        logger.error(f"Error creating workflow: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating workflow: {str(e)}")


@router.get("/{workflow_id}", response_model=WorkflowStatusResponse)
async def get_workflow_status(workflow_id: str):
    """Get workflow status and results"""
    with workflows_lock:
        if workflow_id not in workflows:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        orchestrator = workflows[workflow_id]
        status_dict = orchestrator.get_status()
    
    # Convert to response model
    best_result = None
    if status_dict.get('best_result'):
        best_result = WorkflowResultSummary(
            parameters=status_dict['best_result'].get('parameters', {}),
            objective_value=status_dict['best_result'].get('objective_value', 0),
            metrics=status_dict['best_result'].get('metrics')
        )
    
    top_results = [
        WorkflowResultSummary(
            parameters=r.get('parameters', {}),
            objective_value=r.get('objective_value', 0),
            metrics=r.get('metrics')
        )
        for r in status_dict.get('top_results', [])
    ]
    
    return WorkflowStatusResponse(
        workflow_id=status_dict['workflow_id'],
        status=WorkflowStatus(status_dict['status']),
        progress=status_dict.get('progress', 0),
        best_result=best_result,
        top_results=top_results,
        total_backtests=status_dict.get('total_backtests', 0),
        elapsed_seconds=status_dict.get('elapsed_seconds'),
        error=status_dict.get('error')
    )


@router.post("/{workflow_id}/stop")
async def stop_workflow(workflow_id: str):
    """Stop a running workflow"""
    with workflows_lock:
        if workflow_id not in workflows:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        orchestrator = workflows[workflow_id]
        orchestrator.stop()
    
    return {"message": "Workflow stop requested", "workflow_id": workflow_id}


@router.get("/", response_model=List[WorkflowStatusResponse])
async def list_workflows(
    limit: int = 100,
    offset: int = 0,
    status: Optional[str] = None
):
    """List workflows with optional filtering"""
    with workflows_lock:
        workflow_list = list(workflows.values())
    
    # Filter by status if provided
    if status:
        workflow_list = [w for w in workflow_list if w.status == status]
    
    # Sort by start time (most recent first)
    workflow_list.sort(key=lambda w: w.start_time or datetime.min, reverse=True)
    
    # Paginate
    workflow_list = workflow_list[offset:offset + limit]
    
    # Convert to response models
    results = []
    for orchestrator in workflow_list:
        status_dict = orchestrator.get_status()
        
        best_result = None
        if status_dict.get('best_result'):
            best_result = WorkflowResultSummary(
                parameters=status_dict['best_result'].get('parameters', {}),
                objective_value=status_dict['best_result'].get('objective_value', 0),
                metrics=status_dict['best_result'].get('metrics')
            )
        
        top_results = [
            WorkflowResultSummary(
                parameters=r.get('parameters', {}),
                objective_value=r.get('objective_value', 0),
                metrics=r.get('metrics')
            )
            for r in status_dict.get('top_results', [])
        ]
        
        results.append(WorkflowStatusResponse(
            workflow_id=status_dict['workflow_id'],
            status=WorkflowStatus(status_dict['status']),
            progress=status_dict.get('progress', 0),
            best_result=best_result,
            top_results=top_results,
            total_backtests=status_dict.get('total_backtests', 0),
            elapsed_seconds=status_dict.get('elapsed_seconds'),
            error=status_dict.get('error')
        ))
    
    return results
