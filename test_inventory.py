#!/usr/bin/env python3
"""
Quick script to get NGO and Volunteer tokens for testing inventory API
"""

import requests
import json
import random
import string

BASE = "http://localhost:3000"

def random_string(length=6):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def random_digits(length):
    return ''.join(random.choices(string.digits, k=length))

# Sign up NGO
ngo_email = f"ngo_test_{random_string()}@example.com"
ngo_payload = {
    "ngo_name": "Test NGO for Inventory",
    "registration_number": f"NGO-{random_digits(10)}",
    "ngo_type": "Relief",
    "year_established": 2020,
    "mission_statement": "Testing inventory management",
    "email": ngo_email,
    "password": "Test@123",
    "official_contact": "9876543210",
    "registered_address": "Test Address",
    "operational_areas": ["Delhi"],
    "admin_name": "Admin Test",
    "admin_designation": "Director",
    "admin_mobile": "9876543210",
    "admin_email": f"admin_{random_string()}@example.com",
    "aadhar_card": random_digits(12),
    "bank_account_number": random_digits(12),
}

print("🔄 Signing up NGO...")
ngo_response = requests.post(f"{BASE}/auth/signup/ngo", json=ngo_payload)
if ngo_response.status_code == 201:
    ngo_data = ngo_response.json()
    ngo_token = ngo_data.get("access_token")
    print(f"✅ NGO signed up successfully!")
    print(f"📧 Email: {ngo_email}")
    print(f"🔑 Token: {ngo_token}\n")
else:
    print(f"❌ NGO signup failed: {ngo_response.text}\n")
    ngo_token = None

# Sign up Volunteer
vol_email = f"vol_test_{random_string()}@example.com"
vol_payload = {
    "group_name": "Test Volunteer Group",
    "volunteer_type": "group",
    "group_size": 10,
    "operational_areas": ["Delhi"],
    "email": vol_email,
    "password": "Test@123",
    "leader_name": "Vol Leader",
    "leader_phone": "9876543210",
    "leader_email": f"leader_{random_string()}@example.com",
    "languages_spoken": ["Hindi", "English"],
}

print("🔄 Signing up Volunteer...")
vol_response = requests.post(f"{BASE}/auth/signup/volunteer", json=vol_payload)
if vol_response.status_code == 201:
    vol_data = vol_response.json()
    vol_token = vol_data.get("access_token")
    print(f"✅ Volunteer signed up successfully!")
    print(f"📧 Email: {vol_email}")
    print(f"🔑 Token: {vol_token}\n")
else:
    print(f"❌ Volunteer signup failed: {vol_response.text}\n")
    vol_token = None

# Test inventory creation with NGO token
if ngo_token:
    print("=" * 60)
    print("Testing Inventory API with NGO Token")
    print("=" * 60)
    
    inventory_payload = {
        "item": "Medical Kits",
        "total_quantity": 100,
        "remaining_quantity": 100
    }
    
    headers = {"Authorization": f"Bearer {ngo_token}"}
    inv_response = requests.post(
        "http://localhost:8081/inventory",
        json=inventory_payload,
        headers=headers
    )
    
    print(f"Status: {inv_response.status_code}")
    print(f"Response: {json.dumps(inv_response.json(), indent=2)}\n")
    
    # Get all inventory
    get_response = requests.get("http://localhost:8081/inventory", headers=headers)
    print(f"GET /inventory Status: {get_response.status_code}")
    print(f"Inventory List: {json.dumps(get_response.json(), indent=2)}\n")

# Test with Volunteer token
if vol_token:
    print("=" * 60)
    print("Testing Inventory API with Volunteer Token")
    print("=" * 60)
    
    inventory_payload = {
        "item": "Water Bottles",
        "total_quantity": 500
    }
    
    headers = {"Authorization": f"Bearer {vol_token}"}
    inv_response = requests.post(
        "http://localhost:8081/inventory",
        json=inventory_payload,
        headers=headers
    )
    
    print(f"Status: {inv_response.status_code}")
    print(f"Response: {json.dumps(inv_response.json(), indent=2)}\n")

print("\n💡 Save these tokens to test the API manually:")
if ngo_token:
    print(f"\nNGO Token:\n{ngo_token}")
if vol_token:
    print(f"\nVolunteer Token:\n{vol_token}")
