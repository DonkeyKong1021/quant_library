"""
Utility for creating GitHub issues from user reports
"""

import os
import logging
from typing import Dict, Optional, List
import requests
from datetime import datetime

logger = logging.getLogger(__name__)

# Try to import API key storage (optional, falls back to env var if not available)
try:
    from api.utils.api_key_storage import get_api_key_storage
    API_KEY_STORAGE_AVAILABLE = True
except ImportError:
    API_KEY_STORAGE_AVAILABLE = False

# GitHub repository configuration
GITHUB_OWNER = os.getenv("GITHUB_OWNER", "DonkeyKong1021")
GITHUB_REPO = os.getenv("GITHUB_REPO", "quant_library")
GITHUB_API_BASE = "https://api.github.com"


def format_issue_body(
    description: str,
    issue_type: str,
    severity: Optional[str] = None,
    environment: Optional[Dict[str, str]] = None,
    steps_to_reproduce: Optional[List[str]] = None,
    expected_behavior: Optional[str] = None,
    actual_behavior: Optional[str] = None,
    additional_info: Optional[str] = None,
    user_email: Optional[str] = None,
) -> str:
    """
    Format issue body in a structured markdown format for GitHub.
    
    Args:
        description: Main description of the issue
        issue_type: Type of issue (bug, feature_request, etc.)
        severity: Severity level (optional)
        environment: Environment details (optional)
        steps_to_reproduce: List of steps to reproduce (optional)
        expected_behavior: Expected behavior (optional)
        actual_behavior: Actual behavior (optional)
        additional_info: Additional information (optional)
        user_email: User email for follow-up (optional)
    
    Returns:
        Formatted markdown string for GitHub issue body
    """
    body_parts = []
    
    # Add description
    body_parts.append(f"## Description\n\n{description}\n")
    
    # Add issue metadata
    metadata = []
    metadata.append(f"- **Type**: {issue_type}")
    if severity:
        metadata.append(f"- **Severity**: {severity}")
    metadata.append(f"- **Reported**: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    if user_email:
        metadata.append(f"- **User Email**: {user_email}")
    
    body_parts.append(f"## Issue Information\n\n" + "\n".join(metadata) + "\n")
    
    # Add environment details
    if environment:
        env_lines = ["- " + f"**{k}**: {v}" for k, v in environment.items()]
        body_parts.append(f"## Environment\n\n" + "\n".join(env_lines) + "\n")
    
    # Add steps to reproduce
    if steps_to_reproduce:
        steps_lines = [f"{i+1}. {step}" for i, step in enumerate(steps_to_reproduce)]
        body_parts.append(f"## Steps to Reproduce\n\n" + "\n".join(steps_lines) + "\n")
    
    # Add expected vs actual behavior
    if expected_behavior or actual_behavior:
        behavior_parts = []
        if expected_behavior:
            behavior_parts.append(f"### Expected Behavior\n\n{expected_behavior}\n")
        if actual_behavior:
            behavior_parts.append(f"### Actual Behavior\n\n{actual_behavior}\n")
        body_parts.append(f"## Behavior\n\n" + "\n".join(behavior_parts))
    
    # Add additional information
    if additional_info:
        body_parts.append(f"## Additional Information\n\n{additional_info}\n")
    
    # Add footer
    body_parts.append("---\n\n*This issue was automatically created from the application issue reporter.*")
    
    return "\n".join(body_parts)


def create_github_issue(
    title: str,
    description: str,
    issue_type: str,
    severity: Optional[str] = None,
    environment: Optional[Dict[str, str]] = None,
    steps_to_reproduce: Optional[List[str]] = None,
    expected_behavior: Optional[str] = None,
    actual_behavior: Optional[str] = None,
    additional_info: Optional[str] = None,
    user_email: Optional[str] = None,
    github_token: Optional[str] = None,
) -> Dict:
    """
    Create a GitHub issue using the GitHub API.
    
    Args:
        title: Issue title
        description: Issue description
        issue_type: Type of issue
        severity: Severity level (optional)
        environment: Environment details (optional)
        steps_to_reproduce: Steps to reproduce (optional)
        expected_behavior: Expected behavior (optional)
        actual_behavior: Actual behavior (optional)
        additional_info: Additional information (optional)
        user_email: User email (optional)
        github_token: GitHub personal access token (optional, falls back to env var)
    
    Returns:
        Dictionary with 'success', 'issue_url', 'issue_number', and 'message' keys
    
    Raises:
        Exception: If issue creation fails
    """
    # Get GitHub token (check storage first, then env var, then parameter)
    token = github_token
    
    if not token and API_KEY_STORAGE_AVAILABLE:
        try:
            storage = get_api_key_storage()
            token = storage.get_key('github')
        except Exception as e:
            logger.debug(f"Could not retrieve GitHub token from storage: {e}")
    
    if not token:
        token = os.getenv("GITHUB_TOKEN")
    
    if not token:
        raise ValueError(
            "GitHub token is required. Set it in Settings, set GITHUB_TOKEN environment variable, "
            "or provide github_token parameter."
        )
    
    # Format issue body
    body = format_issue_body(
        description=description,
        issue_type=issue_type,
        severity=severity,
        environment=environment,
        steps_to_reproduce=steps_to_reproduce,
        expected_behavior=expected_behavior,
        actual_behavior=actual_behavior,
        additional_info=additional_info,
        user_email=user_email,
    )
    
    # Determine labels based on issue type and severity
    labels = [f"type:{issue_type}"]
    if severity:
        labels.append(f"severity:{severity}")
    
    # Prepare issue data
    issue_data = {
        "title": title,
        "body": body,
        "labels": labels,
    }
    
    # Make API request
    url = f"{GITHUB_API_BASE}/repos/{GITHUB_OWNER}/{GITHUB_REPO}/issues"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    }
    
    try:
        response = requests.post(url, json=issue_data, headers=headers, timeout=30)
        response.raise_for_status()
        
        issue_info = response.json()
        
        return {
            "success": True,
            "issue_url": issue_info.get("html_url"),
            "issue_number": issue_info.get("number"),
            "message": f"Issue #{issue_info.get('number')} created successfully",
        }
    except requests.exceptions.HTTPError as e:
        error_msg = f"GitHub API error: {e.response.status_code}"
        if e.response.text:
            try:
                error_data = e.response.json()
                error_msg += f" - {error_data.get('message', 'Unknown error')}"
            except:
                error_msg += f" - {e.response.text[:200]}"
        
        logger.error(error_msg)
        raise Exception(error_msg) from e
    except requests.exceptions.RequestException as e:
        error_msg = f"Failed to create GitHub issue: {str(e)}"
        logger.error(error_msg)
        raise Exception(error_msg) from e
