#!/usr/bin/env python3
"""
Test script to verify NGO signup and inventory creation flow
"""

import requests
import json
import sys
from datetime import datetime

# API Base URLs
AUTH_URL = "http://localhost:3000"
OFFICIAL_URL = "http://localhost:8081"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")

def test_ngo_signup():
    """Test NGO signup"""
    print_section("TEST 1: NGO Signup")
    
    # Generate unique email to avoid conflicts
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    email = f"testngo{timestamp}@example.com"
    
    ngo_data = {
        "email": email,
        "password": "TestPassword123!",
        "ngo_name": "Test Relief Organization",
        "registration_number": f"TEST-REG-{timestamp}",
        "ngo_type": "Relief Organization",
        "year_established": 2020,
        "mission_statement": "Help people in need during disasters",
        "official_contact": "+919876543210",
        "alternate_contact": "+919876543211",
        "website": "https://testorg.com",
        "registered_address": "123 Test Street, Test City, Test State 12345",
        "operational_areas": ["Delhi", "Mumbai", "Bangalore"],
        "location_lat": 28.6139,
        "location_lng": 77.2090,
        "admin_name": "Admin Test",
        "admin_designation": "Director",
        "admin_mobile": "+919876543210",
        "admin_email": f"admin{timestamp}@testorg.com",
        "aadhar_card": "123456789012",
        "resource_types": ["Medical", "Food", "Shelter"],
        "team_strength": 50,
        "bank_account_number": "1234567890123456"
    }
    
    print_info(f"Creating NGO with email: {email}")
    
    try:
        response = requests.post(
            f"{AUTH_URL}/auth/signup/ngo",
            json=ngo_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            print_success("NGO signup successful!")
            print_info(f"Token received: {result.get('access_token', '')[:20]}...")
            print_info(f"User type: {result.get('user_type')}")
            return result.get('access_token'), email
        else:
            print_error(f"Signup failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return None, None
            
    except Exception as e:
        print_error(f"Error during signup: {str(e)}")
        return None, None

def test_inventory_creation(token):
    """Test creating inventory item"""
    print_section("TEST 2: Create Inventory Item")
    
    if not token:
        print_error("No token provided, skipping inventory test")
        return None
    
    inventory_data = {
        "item": "Medical Kit",
        "total_quantity": 100
    }
    
    print_info("Creating inventory item: Medical Kit (Qty: 100)")
    print_info("NOTE: remaining_quantity is NOT sent - it's auto-calculated!")
    
    try:
        response = requests.post(
            f"{OFFICIAL_URL}/inventory",
            json=inventory_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            print_success("Inventory item created successfully!")
            print_info(f"Item ID: {result.get('id')}")
            print_info(f"Item: {result.get('item')}")
            print_info(f"Total Quantity: {result.get('total_quantity')}")
            print_info(f"Remaining Quantity: {result.get('remaining_quantity')} (auto-calculated)")
            
            if result.get('remaining_quantity') == result.get('total_quantity'):
                print_success("✓ Remaining quantity correctly calculated as total_quantity!")
            else:
                print_error("✗ Remaining quantity calculation incorrect")
            
            return result.get('id')
        else:
            print_error(f"Inventory creation failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Error creating inventory: {str(e)}")
        return None

def test_get_inventory(token):
    """Test getting all inventory items"""
    print_section("TEST 3: Get All Inventory Items")
    
    if not token:
        print_error("No token provided, skipping get inventory test")
        return
    
    print_info("Fetching all inventory items...")
    
    try:
        response = requests.get(
            f"{OFFICIAL_URL}/inventory",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            items = response.json()
            print_success(f"Retrieved {len(items)} inventory item(s)")
            
            for idx, item in enumerate(items, 1):
                print(f"\n  Item {idx}:")
                print(f"    ID: {item.get('id')}")
                print(f"    Name: {item.get('item')}")
                print(f"    Total Qty: {item.get('total_quantity')}")
                print(f"    Remaining Qty: {item.get('remaining_quantity')} (auto-calculated)")
        else:
            print_error(f"Get inventory failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print_error(f"Error getting inventory: {str(e)}")

def test_create_group(token, inventory_item_id):
    """Test creating a group with resource allocation"""
    print_section("TEST 4: Create Group with Resource Allocation")
    
    if not token or not inventory_item_id:
        print_error("Missing token or inventory_item_id, skipping group test")
        return None
    
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    group_data = {
        "group_name": f"Test Group {timestamp}",
        "username": f"testgroup{timestamp}",
        "password": "GroupPass123!",
        "ttl_type": "5_days",
        "resource_allocations": [
            {
                "inventory_item_id": inventory_item_id,
                "allocated_quantity": 20
            }
        ]
    }
    
    print_info(f"Creating group: {group_data['group_name']}")
    print_info(f"Allocating 20 units of Medical Kit")
    
    try:
        response = requests.post(
            f"{OFFICIAL_URL}/groups",
            json=group_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            print_success("Group created successfully!")
            print_info(f"Group ID: {result.get('id')}")
            print_info(f"Group Name: {result.get('group_name')}")
            print_info(f"Allocations: {len(result.get('resourceAllocations', []))}")
            return result.get('id')
        else:
            print_error(f"Group creation failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Error creating group: {str(e)}")
        return None

def verify_remaining_quantity(token):
    """Verify remaining quantity decreased after allocation"""
    print_section("TEST 5: Verify Remaining Quantity After Allocation")
    
    if not token:
        print_error("No token provided, skipping verification")
        return
    
    print_info("Fetching inventory to check remaining_quantity...")
    
    try:
        response = requests.get(
            f"{OFFICIAL_URL}/inventory",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            items = response.json()
            if items:
                item = items[0]
                expected_remaining = item['total_quantity'] - 20  # We allocated 20
                actual_remaining = item['remaining_quantity']
                
                print_info(f"Total Quantity: {item['total_quantity']}")
                print_info(f"Allocated: 20")
                print_info(f"Expected Remaining: {expected_remaining}")
                print_info(f"Actual Remaining: {actual_remaining}")
                
                if actual_remaining == expected_remaining:
                    print_success("✓ Remaining quantity correctly decreased!")
                    print_success("✓ AUTO-CALCULATION WORKING PERFECTLY!")
                else:
                    print_error(f"✗ Remaining quantity mismatch! Expected {expected_remaining}, got {actual_remaining}")
        else:
            print_error("Failed to verify remaining quantity")
            
    except Exception as e:
        print_error(f"Error verifying: {str(e)}")

def main():
    """Run all tests"""
    print_section("RICOS Backend Integration Tests")
    print_info("Testing NGO signup and inventory with auto-calculated remaining_quantity")
    print_info(f"Auth URL: {AUTH_URL}")
    print_info(f"Official URL: {OFFICIAL_URL}")
    
    # Test 1: NGO Signup
    token, email = test_ngo_signup()
    if not token:
        print_error("Signup failed, cannot continue tests")
        sys.exit(1)
    
    # Test 2: Create Inventory
    inventory_id = test_inventory_creation(token)
    if not inventory_id:
        print_error("Inventory creation failed, cannot continue tests")
        sys.exit(1)
    
    # Test 3: Get Inventory
    test_get_inventory(token)
    
    # Test 4: Create Group with Allocation
    group_id = test_create_group(token, inventory_id)
    if not group_id:
        print_error("Group creation failed, skipping verification")
        sys.exit(1)
    
    # Test 5: Verify Remaining Quantity
    verify_remaining_quantity(token)
    
    # Final Summary
    print_section("TEST SUMMARY")
    print_success("All tests completed!")
    print_info(f"NGO Email: {email}")
    print_info("You can now use this account to test in the frontend")
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
