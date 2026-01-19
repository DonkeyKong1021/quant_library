#!/usr/bin/env python3
"""
Test script for issue logging functionality
Run this script to test creating a GitHub issue via the API
"""

import sys
from pathlib import Path
import requests
import json
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

API_BASE_URL = "http://localhost:8000"

def test_issue_logging():
    """Test the issue logging endpoint"""
    
    print("Testing Issue Logging API")
    print("=" * 50)
    
    # Test data
    test_issue = {
        "title": f"Test Issue - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "description": "This is a test issue created to verify the issue logging functionality works correctly.",
        "issue_type": "bug",
        "severity": "low",
        "environment": {
            "browser": "Test Script",
            "os": "Test Environment",
            "url": "http://localhost:8000/test",
        },
        "steps_to_reproduce": [
            "Run the test script",
            "Verify the issue is created",
            "Check GitHub for the new issue",
        ],
        "expected_behavior": "Issue should be created successfully on GitHub",
        "actual_behavior": "Testing in progress...",
        "additional_info": "This is a test issue created by the test_issue_logging.py script.",
    }
    
    print(f"\nSending request to: {API_BASE_URL}/api/issues/log")
    print(f"\nIssue data:")
    print(json.dumps(test_issue, indent=2))
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/issues/log",
            json=test_issue,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ Success!")
            print(f"Issue URL: {result.get('issue_url', 'N/A')}")
            print(f"Issue Number: {result.get('issue_number', 'N/A')}")
            print(f"Message: {result.get('message', 'N/A')}")
            
            if result.get('issue_url'):
                print(f"\n🔗 View the issue: {result['issue_url']}")
        else:
            print("\n❌ Error!")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 503:
                print("\n⚠️  Note: This might mean GITHUB_TOKEN is not set.")
                print("   Set it in your environment: export GITHUB_TOKEN=your_token")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to API")
        print(f"   Make sure the API server is running on {API_BASE_URL}")
        print("   Start it with: uvicorn api.main:app --reload")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Check if GITHUB_TOKEN is set
    import os
    if not os.getenv("GITHUB_TOKEN"):
        print("⚠️  Warning: GITHUB_TOKEN environment variable is not set")
        print("   The API endpoint will return an error without it.")
        print("   Set it with: export GITHUB_TOKEN=your_token")
        print()
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    test_issue_logging()
