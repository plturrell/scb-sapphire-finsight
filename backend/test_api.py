#!/usr/bin/env python3
"""
Test script for the Sapphire FinSight API server
"""

import requests
import json
import sys
from pprint import pprint

# API base URL
BASE_URL = "http://localhost:8888"

def test_all_endpoints():
    """Test all API endpoints"""
    endpoints = [
        "/api/metrics",
        "/api/impacts",
        "/api/finance-options",
        "/api/recommendations",
        "/api/real-time-update",
        "/health"
    ]
    
    print("\n===== Sapphire FinSight API Test =====\n")
    
    # Test each endpoint
    for endpoint in endpoints:
        url = f"{BASE_URL}{endpoint}"
        print(f"Testing endpoint: {url}")
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            
            print(f"Status: {response.status_code}")
            data = response.json()
            
            # Pretty print a truncated version of the response
            print("Response (truncated):")
            if isinstance(data, list) and len(data) > 3:
                print(json.dumps(data[:3], indent=2))
                print(f"... and {len(data) - 3} more items")
            elif isinstance(data, dict) and len(data) > 10:
                sample = dict(list(data.items())[:5])
                print(json.dumps(sample, indent=2))
                print(f"... and {len(data) - 5} more keys")
            else:
                print(json.dumps(data, indent=2))
            
            print("\n" + "-" * 50 + "\n")
        
        except requests.exceptions.RequestException as e:
            print(f"Error: {e}")
            return False
    
    print("All API tests passed successfully!\n")
    return True

if __name__ == "__main__":
    # Make sure the API server is running
    try:
        requests.get(f"{BASE_URL}/health")
    except requests.exceptions.ConnectionError:
        print("ERROR: API server is not running. Please start it with:")
        print("  python start_backend.py --api-only")
        sys.exit(1)
    
    # Run the tests
    test_all_endpoints()