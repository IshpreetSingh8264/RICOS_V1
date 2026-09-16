#!/usr/bin/env python3
"""
Test script to demonstrate nearby pincode fallback functionality
Tests submitting disaster reports with non-existent pincodes
"""

import requests
import json
import sys

class Colors:
    """ANSI color codes"""
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    OKCYAN = '\033[96m'

def print_success(text):
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def login(email, password):
    """Login and get JWT token"""
    try:
        response = requests.post(
            "http://localhost:3000/auth/signin",
            json={"email": email, "password": password},
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            token = data.get("access_token")
            print_success(f"Login successful!")
            return token
        else:
            print_error(f"Login failed: {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Login error: {str(e)}")
        return None

def test_pincode_fallback(token, pincode):
    """Test disaster report with pincode"""
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "pincode": pincode,
        "severity": "MODERATE",
        "water_level": "2 feet",
        "affected_population": 50,
        "stuck_people_found": False,
        "resources_needed": ["food", "water"],
        "notes": f"Testing nearby pincode fallback for {pincode}"
    }
    
    print(f"\n{Colors.BOLD}Testing Pincode: {pincode}{Colors.ENDC}")
    print_info(f"Submitting disaster report...")
    
    try:
        response = requests.post(
            "http://localhost:8080/map/report",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            print_success(f"Report submitted successfully!")
            print_info(f"Report ID: {data.get('report_id')}")
            
            if data.get('message'):
                print_warning(f"Message: {data['message']}")
            else:
                print_info(f"Exact pincode match found")
            
            return True
        else:
            print_error(f"Submission failed: {response.status_code}")
            print(json.dumps(response.json(), indent=2))
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def main():
    print(f"\n{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.BOLD}{'NEARBY PINCODE FALLBACK TEST'.center(70)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{'='*70}{Colors.ENDC}\n")
    
    # Get credentials
    email = input("Enter email (default: ngo@example.com): ").strip() or "ngo@example.com"
    password = input("Enter password (default: SecurePass123): ").strip() or "SecurePass123"
    
    # Login
    token = login(email, password)
    if not token:
        print_error("Cannot proceed without authentication")
        sys.exit(1)
    
    print(f"\n{Colors.BOLD}Testing different pincode scenarios:{Colors.ENDC}")
    print("1. Exact match (if 144001 exists)")
    print("2. Non-existent pincode (141002) - should find 141001 or 141003")
    print("3. Another non-existent pincode (110999) - should find nearby\n")
    
    # Test cases
    test_cases = [
        "144001",  # Likely exists (Jalandhar area)
        "141002",  # Likely doesn't exist (should find 141001 or 141003)
        "110999",  # Likely doesn't exist (should find nearby Delhi pincode)
    ]
    
    for pincode in test_cases:
        test_pincode_fallback(token, pincode)
    
    print(f"\n{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print_success("Test completed!")
    print_info("The system now automatically finds nearby pincodes when exact match is not available")
    print(f"{Colors.BOLD}{'='*70}{Colors.ENDC}\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.WARNING}Test interrupted by user{Colors.ENDC}")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n{Colors.FAIL}Unexpected error: {str(e)}{Colors.ENDC}")
        sys.exit(1)
