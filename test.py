#!/usr/bin/env python3
"""
test.py
Comprehensive tests for signup/signin flows aligned with your schema + DTOs.
Saves results to auth_test_results.json
"""

import requests
import json
import random
import string
from datetime import datetime

BASE = "http://localhost:3000"
ENDPOINTS = {
    "signup_user": f"{BASE}/auth/signup/user",
    "signup_ngo": f"{BASE}/auth/signup/ngo",
    "signup_govt": f"{BASE}/auth/signup/govt",
    "signup_vol": f"{BASE}/auth/signup/volunteer",
    "signin": f"{BASE}/auth/signin",
    "health_user": "http://localhost:8080/health",
    "health_official": "http://localhost:8081/health",
}

def random_email(prefix: str) -> str:
    rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"{prefix}{rand}@example.com"

def random_digits(length: int) -> str:
    return ''.join(random.choices(string.digits, k=length))

def pretty(title, payload):
    print(f"\n=== {title} ===")
    try:
        print(json.dumps(payload, indent=2))
    except Exception:
        print(payload)

def post(url, data, headers=None, timeout=10):
    try:
        r = requests.post(url, json=data, headers=headers, timeout=timeout)
        try:
            return {"status_code": r.status_code, "json": r.json()}
        except ValueError:
            return {"status_code": r.status_code, "text": r.text}
    except Exception as e:
        return {"error": str(e)}

def get(url, headers=None, timeout=10):
    try:
        r = requests.get(url, headers=headers, timeout=timeout)
        try:
            return {"status_code": r.status_code, "json": r.json()}
        except ValueError:
            return {"status_code": r.status_code, "text": r.text}
    except Exception as e:
        return {"error": str(e)}

def main():
    results = {"signup": {}, "signin": {}, "tokens": {}, "protected_calls": {}}

    # ---- USER ----
    user_email = random_email("user")
    user_password = "Test@123"
    user_payload = {
        "full_name": "Rohan Sharma",
        "dob": "1998-04-12",  # DTO expects string (will be converted to DateTime by Prisma)
        "gender": "male",
        "phone_number": "9876543210",
        "alternate_phone": "9123456780",
        "email": user_email,
        "password": user_password,
        "current_address": "221B Baker Street",
        "pincode": "110001",
        "city": "New Delhi",
        "state": "Delhi",
        "country": "India",
        "aadhar_id": random_digits(12),  # UNIQUE - generate random
        "blood_group": "O+",
        "medical_conditions": "Asthma",
        "allergies": "Dust",
        "disabilities": "",
        "emergency_contact_name": "Raj Sharma",
        "emergency_contact_relation": "Father",
        "emergency_contact_phone": "9811111111",
        "primary_language": "Hindi",
        "secondary_language": "English",
        "communication_assistance": False,
        "live_location_permission": True,
        "home_location_lat": 28.6139,
        "home_location_lng": 77.2090
    }
    results["signup"]["user"] = post(ENDPOINTS["signup_user"], user_payload)
    pretty("User Signup -> response", results["signup"]["user"])

    # ---- NGO ----
    ngo_email = random_email("ngo")
    ngo_admin_email = random_email("admin")
    ngo_password = "Ngopass@123"
    ngo_payload = {
        "ngo_name": "Helping Hands Foundation",
        "registration_number": "NGO-" + random_digits(10),  # UNIQUE - generate random
        "ngo_type": "Health",
        "year_established": 2010,
        "mission_statement": "Providing medical help to underserved areas.",
        "email": ngo_email,
        "password": ngo_password,
        "official_contact": "9876543211",
        "alternate_contact": "9876500000",
        "website": "https://helpinghands.org",
        "registered_address": "Sector-22, Noida",
        "operational_areas": ["Delhi", "Noida"],  # Array - will be JSON.stringify() by service
        "location_lat": 28.5355,
        "location_lng": 77.3910,
        "admin_name": "Priya Gupta",
        "admin_designation": "Director",
        "admin_mobile": "9811223344",
        "admin_email": ngo_admin_email,
        "aadhar_card": random_digits(12),  # Generate random
        "resource_types": ["Medical Kits", "Ambulances"],  # Array
        "team_strength": 120,
        "bank_account_number": random_digits(12),  # Generate random
        # DO NOT include services_provided - it's NOT in NGO table/DTO
    }
    results["signup"]["ngo"] = post(ENDPOINTS["signup_ngo"], ngo_payload)
    pretty("NGO Signup -> response", results["signup"]["ngo"])

    # ---- GOVERNMENT ----
    govt_email = random_email("govt")
    govt_incharge_email = random_email("incharge")
    govt_password = "Govt@123"
    govt_payload = {
        "agency_name": "Delhi Disaster Management Authority",
        "department": "Relief Department",
        "govt_level": "state",
        "official_id": "DDMA-" + random_digits(6),  # UNIQUE - generate random
        "department_code": "REL-21",
        "email": govt_email,
        "password": govt_password,
        "hq_address": "Civil Lines, Delhi",
        "incharge_name": "Amit Verma",
        "incharge_mobile": "9822001122",
        "incharge_email": govt_incharge_email,
        "control_room_number": "1077",
        "jurisdiction_area": ["Delhi NCR"],  # Array
        "resource_types": ["Rescue Vehicles", "Medical Units"],  # Array
        "resource_capacity": 12,
        "bank_account_number": random_digits(12),  # Generate random
        # DO NOT include services_provided - it's NOT in Government table/DTO
    }
    results["signup"]["govt"] = post(ENDPOINTS["signup_govt"], govt_payload)
    pretty("Government Signup -> response", results["signup"]["govt"])

    # ---- VOLUNTEER ----
    vol_email = random_email("vol")
    vol_leader_email = random_email("leader")
    vol_password = "Volun@123"
    vol_payload = {
        "group_name": "Rapid Response Team",
        "volunteer_type": "group",
        "group_size": 15,
        "operational_areas": ["Delhi", "Faridabad"],  # Array
        "email": vol_email,
        "password": vol_password,
        "social_media_link": "https://instagram.com/rrt",
        "leader_name": "Suresh Kumar",
        "leader_phone": "9877001122",
        "leader_email": vol_leader_email,
        "id_proof": "Aadhar-" + random_digits(10),
        "has_medical_training": True,
        "has_first_aid_cert": True,
        "has_vehicle": False,
        "languages_spoken": ["Hindi", "English"],  # Array
        # DO NOT include bank_account_number - it's NOT in Volunteer table/DTO
        # DO NOT include services_provided - it's NOT in Volunteer table/DTO
    }
    results["signup"]["volunteer"] = post(ENDPOINTS["signup_vol"], vol_payload)
    pretty("Volunteer Signup -> response", results["signup"]["volunteer"])

    # ---- Signin attempts for each created user_type (try to collect tokens) ----
    accounts = [
        ("user", user_email, user_password),
        ("ngo", ngo_email, ngo_password),
        ("govt", govt_email, govt_password),
        ("volunteer", vol_email, vol_password)
    ]

    for role, email, pwd in accounts:
        payload = {"email": email, "password": pwd}  # No user_type needed - seamless!
        r = post(ENDPOINTS["signin"], payload)
        results["signin"][role] = r
        pretty(f"Signin ({role}) -> response", r)
        
        # Extract token
        token = None
        if isinstance(r, dict):
            if "json" in r and isinstance(r["json"], dict):
                token = r["json"].get("access_token")
        
        if token:
            results["tokens"][role] = token
        else:
            results["tokens"][role] = None

    # ---- Try protected /health endpoints with each token ----
    # User tokens -> user_backend health (port 8080)
    # NGO/Govt/Volunteer tokens -> official_backend health (port 8081)
    
    for role, token in results["tokens"].items():
        if token:
            headers = {"Authorization": f"Bearer {token}"}
            
            # Determine which health endpoint to call
            if role == "user":
                health_url = ENDPOINTS["health_user"]
            else:
                health_url = ENDPOINTS["health_official"]
            
            r = get(health_url, headers=headers)
            results["protected_calls"][role] = r
            pretty(f"/health with token ({role}) -> response", r)
        else:
            results["protected_calls"][role] = {"error": "no token available"}

    # Save results file
    with open("auth_test_results.json", "w") as fh:
        json.dump(results, fh, indent=2)

    print("\n✅ Saved auth_test_results.json")
    
    # Print summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    signup_success = sum(1 for v in results["signup"].values() if isinstance(v, dict) and v.get("status_code") == 201)
    signin_success = sum(1 for v in results["signin"].values() if isinstance(v, dict) and v.get("status_code") == 200 or (isinstance(v, dict) and "json" in v and "access_token" in v.get("json", {})))
    
    print(f"Signups Successful: {signup_success}/4")
    print(f"Signins Successful: {signin_success}/4")
    print(f"Tokens Obtained: {sum(1 for v in results['tokens'].values() if v)}/4")
    print("="*60)

if __name__ == "__main__":
    main()
