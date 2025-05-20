#!/usr/bin/env python3
"""
NVIDIA API Integration with SSL Verification Disabled
For testing and development purposes only.
"""

import requests
import urllib3
import os
import sys
import json

# Disable SSL verification warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def main():
    """Test NVIDIA API connection with SSL verification disabled"""
    # Get API key from environment
    api_key = os.environ.get("NVIDIA_API_KEY", "")
    org_id = os.environ.get("NVIDIA_ORG_ID", "")
    base_url = os.environ.get("NVIDIA_API_BASE_URL", "https://api.nvidia.com/v1")
    
    if not api_key:
        print("Error: NVIDIA_API_KEY not set. Please run 'source nvapi/setup_env.sh' first.")
        sys.exit(1)
    
    print("\n=== Testing NVIDIA API Connection ===\n")
    print(f"API Key: {api_key[:10]}...{api_key[-5:]}")
    print(f"Organization ID: {org_id}")
    print(f"Base URL: {base_url}")
    
    # Headers for requests
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    # Test endpoints (simple GET requests to verify connectivity)
    test_endpoints = [
        {"url": f"{base_url}/health", "method": "GET", "name": "Health Check"},
        {"url": "https://api.ngc.nvidia.com/v2/org", "method": "GET", "name": "NGC Organization"},
        {"url": "https://api.nemo.nvidia.com/v1/models", "method": "GET", "name": "NeMo Models"}
    ]
    
    for endpoint in test_endpoints:
        try:
            print(f"\nTesting endpoint: {endpoint['name']} ({endpoint['url']})")
            
            if endpoint['method'] == "GET":
                response = requests.get(
                    endpoint['url'], 
                    headers=headers, 
                    verify=False  # Disable SSL verification
                )
            else:
                response = requests.post(
                    endpoint['url'], 
                    headers=headers, 
                    verify=False  # Disable SSL verification
                )
            
            # Check response
            print(f"Status code: {response.status_code}")
            print(f"Response body: {response.text[:200]}...")
            
            # Try to parse as JSON
            try:
                json_response = response.json()
                print(f"JSON keys: {list(json_response.keys())}")
            except json.JSONDecodeError:
                print("Response is not JSON")
                
        except Exception as e:
            print(f"Error: {e}")
    
    print("\n=== Connection Test Complete ===\n")
    
if __name__ == "__main__":
    main()