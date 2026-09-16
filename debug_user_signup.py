#!/usr/bin/env python3
"""
debug_user_signup.py
Debug User signup issue
"""

import requests
import json
import random
import string

def random_digits(length: int) -> str:
    return ''.join(random.choices(string.digits, k=length))

def random_email(prefix: str) -> str:
    rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"{prefix}{rand}@example.com"

# Minimal payload with only required fields
minimal_payload = {
    "email": random_email("test"),
    "password": "Test@123",
    "full_name": "Test User",
    "phone_number": "9876543210",
    "current_address": "Test Address",
    "pincode": "110001",
    "city": "Delhi",
    "state": "Delhi",
    "aadhar_id": random_digits(12),
    "emergency_contact_name": "Emergency Contact",
    "emergency_contact_relation": "Father",
    "emergency_contact_phone": "9999999999",
    "primary_language": "English"
}

print("Testing with minimal required fields:")
print(json.dumps(minimal_payload, indent=2))

try:
    r = requests.post("http://localhost:3000/auth/signup/user", json=minimal_payload, timeout=10)
    print(f"\nStatus Code: {r.status_code}")
    try:
        print("Response:", json.dumps(r.json(), indent=2))
    except:
        print("Response Text:", r.text)
except Exception as e:
    print(f"Error: {e}")

# Now test with all fields including dob
print("\n" + "="*60)
print("Testing with all fields including dob:")

full_payload = {
    **minimal_payload,
    "email": random_email("test2"),
    "aadhar_id": random_digits(12),
    "dob": "1998-04-12",
    "gender": "male",
    "alternate_phone": "9123456780",
    "country": "India",
    "blood_group": "O+",
    "medical_conditions": "None",
    "allergies": "None",
    "disabilities": "None",
    "secondary_language": "Hindi",
    "communication_assistance": False,
    "live_location_permission": True,
    "home_location_lat": 28.6139,
    "home_location_lng": 77.2090
}

print(json.dumps(full_payload, indent=2))

try:
    r = requests.post("http://localhost:3000/auth/signup/user", json=full_payload, timeout=10)
    print(f"\nStatus Code: {r.status_code}")
    try:
        print("Response:", json.dumps(r.json(), indent=2))
    except:
        print("Response Text:", r.text)
except Exception as e:
    print(f"Error: {e}")
