"""
Issue logging endpoints for reporting issues to GitHub
"""

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException
from typing import Dict
import logging

# Add project root to path
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from api.models.schemas import IssueLogRequest, IssueLogResponse, IssueType, IssueSeverity
from api.utils.github_issue import create_github_issue

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/log", response_model=IssueLogResponse)
async def log_issue(request: IssueLogRequest):
    """
    Log an issue to GitHub.
    
    Creates a formatted GitHub issue with the provided information.
    Requires GITHUB_TOKEN environment variable to be set.
    """
    try:
        # Convert enum values to strings
        issue_type_str = request.issue_type.value if isinstance(request.issue_type, IssueType) else str(request.issue_type)
        severity_str = request.severity.value if request.severity and isinstance(request.severity, IssueSeverity) else (str(request.severity) if request.severity else None)
        
        # Create GitHub issue
        result = create_github_issue(
            title=request.title,
            description=request.description,
            issue_type=issue_type_str,
            severity=severity_str,
            environment=request.environment or {},
            steps_to_reproduce=request.steps_to_reproduce or [],
            expected_behavior=request.expected_behavior,
            actual_behavior=request.actual_behavior,
            additional_info=request.additional_info,
            user_email=request.user_email,
        )
        
        return IssueLogResponse(
            success=result["success"],
            issue_url=result.get("issue_url"),
            issue_number=result.get("issue_number"),
            message=result.get("message", "Issue logged successfully"),
        )
    except ValueError as e:
        # Missing GitHub token
        logger.error(f"Configuration error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Issue logging is not configured. GitHub token is required."
        )
    except Exception as e:
        logger.error(f"Error logging issue to GitHub: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to log issue: {str(e)}"
        )
