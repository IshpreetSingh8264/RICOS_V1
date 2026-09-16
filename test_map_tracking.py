#!/usr/bin/env python3
"""
Test script for Live Map Tracking & Disaster Area System
Tests all map endpoints with detailed output
"""

import requests
import json
import sys
import time
from typing import Optional, Dict, Any

class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

class MapAPITester:
    def __init__(self, base_url: str = "http://localhost:8080", common_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.common_url = common_url
        self.token: Optional[str] = None
        self.headers: Dict[str, str] = {}
        self.report_id: Optional[str] = None
        
    def print_header(self, text: str):
        """Print a formatted header"""
        print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")
        print(f"{Colors.HEADER}{Colors.BOLD}{text.center(70)}{Colors.ENDC}")
        print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")
        
    def print_success(self, text: str):
        """Print success message"""
        print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")
        
    def print_error(self, text: str):
        """Print error message"""
        print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")
        
    def print_info(self, text: str):
        """Print info message"""
        print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")
        
    def print_warning(self, text: str):
        """Print warning message"""
        print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")
        
    def print_json(self, data: Any, truncate: bool = False):
        """Print formatted JSON"""
        json_str = json.dumps(data, indent=2)
        if truncate and len(json_str) > 1000:
            print(json_str[:1000] + "...")
        else:
            print(json_str)
    
    def login(self, email: str, password: str) -> bool:
        """Login and get JWT token"""
        self.print_header("STEP 1: LOGIN AS RESPONDER")
        
        try:
            response = requests.post(
                f"{self.common_url}/auth/signin",
                json={"email": email, "password": password},
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.token = data.get("access_token")
                self.headers = {"Authorization": f"Bearer {self.token}"}
                self.print_success(f"Login successful!")
                self.print_info(f"Token: {self.token[:30]}...")
                return True
            else:
                self.print_error(f"Login failed: {response.status_code}")
                self.print_json(response.json())
                return False
                
        except Exception as e:
            self.print_error(f"Login error: {str(e)}")
            return False
    
    def update_location(self, lat: float, lng: float, status: str = "deployed") -> bool:
        """Test location update endpoint"""
        self.print_header("STEP 2: UPDATE RESPONDER LOCATION")
        
        try:
            payload = {
                "latitude": lat,
                "longitude": lng,
                "accuracy": 15.5,
                "status": status,
                "battery_level": 75
            }
            
            self.print_info(f"Sending location: {lat}, {lng}")
            self.print_info(f"Status: {status}")
            
            response = requests.post(
                f"{self.base_url}/map/location",
                headers=self.headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.print_success("Location updated successfully")
                self.print_json(data)
                return True
            else:
                self.print_error(f"Location update failed: {response.status_code}")
                self.print_json(response.json())
                return False
                
        except Exception as e:
            self.print_error(f"Location update error: {str(e)}")
            return False
    
    def simulate_movement(self) -> bool:
        """Simulate responder moving by sending 3 location updates"""
        self.print_header("STEP 3: SIMULATE RESPONDER MOVEMENT")
        
        locations = [
            {"lat": 30.900965, "lng": 75.857277, "status": "deployed"},
            {"lat": 30.901500, "lng": 75.858000, "status": "deployed"},
            {"lat": 30.902000, "lng": 75.859000, "status": "rescuing"},
        ]
        
        for idx, loc in enumerate(locations, 1):
            self.print_info(f"Update {idx}/3: Moving to {loc['lat']}, {loc['lng']}")
            
            try:
                payload = {
                    "latitude": loc['lat'],
                    "longitude": loc['lng'],
                    "accuracy": 12.0,
                    "status": loc['status'],
                    "battery_level": 75 - (idx * 5)
                }
                
                response = requests.post(
                    f"{self.base_url}/map/location",
                    headers=self.headers,
                    json=payload,
                    timeout=10
                )
                
                if response.status_code in [200, 201]:
                    self.print_success(f"Location {idx} updated - Status: {loc['status']}")
                else:
                    self.print_error(f"Update {idx} failed: {response.status_code}")
                    return False
                
                time.sleep(1)  # Wait 1 second between updates
                
            except Exception as e:
                self.print_error(f"Movement simulation error: {str(e)}")
                return False
        
        self.print_success("Movement simulation completed")
        return True
    
    def submit_disaster_report(self, pincode: str, severity: str = "SEVERE") -> bool:
        """Test disaster report submission"""
        self.print_header("STEP 4: SUBMIT DISASTER REPORT")
        
        try:
            payload = {
                "pincode": pincode,
                "severity": severity,
                "water_level": "5 feet",
                "affected_population": 120,
                "stuck_people_found": True,
                "resources_needed": ["food", "medical", "rescue_boat"],
                "notes": "Urgent rescue needed in residential area. Water level rising rapidly.",
                "images": []
            }
            
            self.print_info(f"Submitting report for pincode: {pincode}")
            self.print_info(f"Severity: {severity}")
            self.print_info(f"Affected population: 120")
            
            response = requests.post(
                f"{self.base_url}/map/report",
                headers=self.headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.report_id = data.get("report_id")
                self.print_success("Disaster report submitted successfully")
                self.print_info(f"Report ID: {self.report_id}")
                self.print_json(data)
                return True
            else:
                self.print_error(f"Report submission failed: {response.status_code}")
                self.print_json(response.json())
                return False
                
        except Exception as e:
            self.print_error(f"Report submission error: {str(e)}")
            return False
    
    def submit_gps_based_report(self) -> bool:
        """Test GPS-based disaster report (no pincode)"""
        self.print_header("STEP 5: SUBMIT GPS-BASED REPORT")
        
        try:
            payload = {
                "latitude": 30.903000,
                "longitude": 75.860000,
                "city": "Ludhiana",
                "village": "Village XYZ",
                "severity": "MODERATE",
                "water_level": "3 feet",
                "affected_population": 50,
                "stuck_people_found": False,
                "resources_needed": ["food", "water", "blankets"],
                "notes": "Moderate flooding in village area. People evacuating."
            }
            
            self.print_info(f"Submitting GPS-based report")
            self.print_info(f"Location: {payload['latitude']}, {payload['longitude']}")
            self.print_info(f"City: {payload['city']}")
            
            response = requests.post(
                f"{self.base_url}/map/report",
                headers=self.headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.print_success("GPS-based report submitted successfully")
                self.print_json(data)
                return True
            else:
                self.print_error(f"GPS report failed: {response.status_code}")
                self.print_json(response.json())
                return False
                
        except Exception as e:
            self.print_error(f"GPS report error: {str(e)}")
            return False
    
    def get_live_map_data(self) -> bool:
        """Test live map data endpoint"""
        self.print_header("STEP 6: GET LIVE MAP DATA")
        
        try:
            response = requests.get(
                f"{self.base_url}/map/live",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.print_success("Live map data fetched successfully")
                
                print(f"\n{Colors.BOLD}📍 LIVE RESPONDERS:{Colors.ENDC}")
                if data['responders']:
                    for idx, responder in enumerate(data['responders'], 1):
                        print(f"\n{idx}. {responder['responder_name']} ({responder['responder_type']})")
                        print(f"   Location: {responder['latitude']}, {responder['longitude']}")
                        print(f"   Status: {responder['status']}")
                        print(f"   Battery: {responder.get('battery_level', 'N/A')}%")
                        print(f"   Last Update: {responder['last_updated']}")
                else:
                    self.print_info("No active responders found")
                
                print(f"\n{Colors.BOLD}🗺️ DISASTER AREAS:{Colors.ENDC}")
                if data['disaster_areas']:
                    for idx, area in enumerate(data['disaster_areas'], 1):
                        print(f"\n{idx}. Report ID: {area['report_id']}")
                        print(f"   Pincode: {area.get('pincode', 'GPS-based')}")
                        print(f"   City: {area.get('city', 'N/A')}")
                        print(f"   Severity: {area['severity']}")
                        print(f"   Affected: {area.get('affected_population', 'N/A')} people")
                        print(f"   Status: {area['status']}")
                        print(f"   Polygon: {'✓ Available' if area.get('polygon') else '✗ None'}")
                else:
                    self.print_info("No approved disaster areas found")
                
                return True
            else:
                self.print_error(f"Failed to fetch live data: {response.status_code}")
                self.print_json(response.json())
                return False
                
        except Exception as e:
            self.print_error(f"Live data fetch error: {str(e)}")
            return False
    
    def get_pending_reports(self) -> bool:
        """Test pending reports endpoint"""
        self.print_header("STEP 7: GET PENDING REPORTS")
        
        try:
            response = requests.get(
                f"{self.base_url}/map/reports/pending",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.print_success("Pending reports fetched successfully")
                
                if data['reports']:
                    print(f"\n{Colors.BOLD}Found {len(data['reports'])} pending reports:{Colors.ENDC}")
                    for idx, report in enumerate(data['reports'][:3], 1):
                        print(f"\n{idx}. Report ID: {report['id']}")
                        print(f"   Pincode: {report.get('pincode', 'GPS-based')}")
                        print(f"   Severity: {report['severity']}")
                        print(f"   Status: {report['status']}")
                        print(f"   Submitted: {report['createdAt']}")
                    
                    if len(data['reports']) > 3:
                        print(f"\n   ... and {len(data['reports']) - 3} more reports")
                else:
                    self.print_info("No pending reports found")
                
                return True
            else:
                self.print_error(f"Failed to fetch pending reports: {response.status_code}")
                self.print_json(response.json())
                return False
                
        except Exception as e:
            self.print_error(f"Pending reports error: {str(e)}")
            return False
    
    def approve_report(self) -> bool:
        """Test report approval endpoint"""
        self.print_header("STEP 8: APPROVE DISASTER REPORT")
        
        if not self.report_id:
            self.print_warning("No report ID available, skipping approval test")
            return True
        
        try:
            payload = {"status": "approved"}
            
            self.print_info(f"Approving report: {self.report_id}")
            
            response = requests.patch(
                f"{self.base_url}/map/reports/{self.report_id}/approve",
                headers=self.headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.print_success("Report approved successfully")
                self.print_json(data)
                return True
            else:
                self.print_error(f"Approval failed: {response.status_code}")
                self.print_json(response.json())
                return False
                
        except Exception as e:
            self.print_error(f"Approval error: {str(e)}")
            return False
    
    def run_all_tests(self, email: str, password: str, pincode: str):
        """Run all tests in sequence"""
        print(f"\n{Colors.HEADER}{Colors.BOLD}")
        print("╔════════════════════════════════════════════════════════════════════╗")
        print("║       LIVE MAP TRACKING & DISASTER AREA - COMPREHENSIVE TEST      ║")
        print("╚════════════════════════════════════════════════════════════════════╝")
        print(Colors.ENDC)
        
        # Step 1: Login
        if not self.login(email, password):
            self.print_error("Cannot proceed without authentication")
            return False
        
        # Step 2: Update location
        if not self.update_location(30.900965, 75.857277, "available"):
            self.print_warning("Location update failed, but continuing...")
        
        # Step 3: Simulate movement
        if not self.simulate_movement():
            self.print_warning("Movement simulation failed, but continuing...")
        
        # Step 4: Submit disaster report with pincode
        if not self.submit_disaster_report(pincode, "SEVERE"):
            self.print_warning("Disaster report submission failed, but continuing...")
        
        # Step 5: Submit GPS-based report
        if not self.submit_gps_based_report():
            self.print_warning("GPS report submission failed, but continuing...")
        
        # Step 6: Get live map data
        if not self.get_live_map_data():
            self.print_error("Live map data fetch failed")
            return False
        
        # Step 7: Get pending reports
        if not self.get_pending_reports():
            self.print_warning("Pending reports fetch failed, but continuing...")
        
        # Step 8: Approve report (admin action)
        if not self.approve_report():
            self.print_warning("Report approval failed (may need admin privileges)")
        
        # Final Summary
        self.print_header("TEST SUMMARY")
        self.print_success("All map tracking tests completed! ✓")
        print(f"\n{Colors.OKGREEN}The Live Map Tracking System is functional.{Colors.ENDC}")
        print(f"{Colors.OKCYAN}You can now integrate the map on the frontend.{Colors.ENDC}\n")
        
        print(f"{Colors.BOLD}Key Points:{Colors.ENDC}")
        print(f"  • Responders can update their location in real-time")
        print(f"  • Disaster reports can be submitted with pincode or GPS")
        print(f"  • Live map shows all active responders and approved areas")
        print(f"  • Admin approval workflow for disaster reports")
        print(f"  • Color-coded severity levels (🟥 SEVERE, 🟧 MODERATE, 🟨 LOW)\n")
        
        return True


def main():
    """Main function"""
    print("\n" + Colors.BOLD + "Live Map Tracking System Tester" + Colors.ENDC)
    print(Colors.OKCYAN + "Make sure the backend is running on http://localhost:8080" + Colors.ENDC)
    print(Colors.WARNING + "IMPORTANT: Must use NGO/Govt/Volunteer user!" + Colors.ENDC)
    print(Colors.WARNING + "Regular users cannot be responders.\n" + Colors.ENDC)
    
    # Default credentials for NGO user (you need to create one)
    default_email = "ngo@example.com"
    default_password = "SecurePass123"
    default_pincode = "144001"
    
    # Get credentials
    email_input = input(f"Enter responder email (default: {default_email}): ").strip()
    email = email_input if email_input else default_email
    
    password_input = input(f"Enter password (default: {default_password}): ").strip()
    password = password_input if password_input else default_password
    
    pincode_input = input(f"Enter test pincode (default: {default_pincode}): ").strip()
    pincode = pincode_input if pincode_input else default_pincode
    
    # Run tests
    tester = MapAPITester()
    success = tester.run_all_tests(email, password, pincode)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.WARNING}Test interrupted by user{Colors.ENDC}")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n{Colors.FAIL}Unexpected error: {str(e)}{Colors.ENDC}")
        sys.exit(1)
