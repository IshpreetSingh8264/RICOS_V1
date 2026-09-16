#!/usr/bin/env python3
"""
check_backend_status.py
Check if all backend services are running
"""

import requests
import json

services = {
    "Common (Auth)": "http://localhost:3000",
    "User Backend": "http://localhost:8080",
    "Official Backend": "http://localhost:8081"
}

print("Backend Services Status Check")
print("="*60)

for name, url in services.items():
    try:
        # Try root endpoint
        r = requests.get(url, timeout=2)
        print(f"✅ {name:20} | {url:30} | Status: {r.status_code}")
    except requests.exceptions.ConnectionError:
        print(f"❌ {name:20} | {url:30} | NOT RUNNING")
    except Exception as e:
        print(f"⚠️  {name:20} | {url:30} | Error: {str(e)[:40]}")

print("="*60)
print("\nTo start services:")
print("  cd BE")
print("  npm run start:dev common         # Port 3000")
print("  npm run start:dev user_backend    # Port 8080")
print("  npm run start:dev official_backend # Port 8081")
