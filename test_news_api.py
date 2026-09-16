#!/usr/bin/env python3
"""
Test script for Disaster News API
Tests all endpoints and provides detailed output
"""

import requests
import json
import sys
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

class NewsAPITester:
    def __init__(self, base_url: str = "http://localhost:8080", common_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.common_url = common_url
        self.token: Optional[str] = None
        self.headers: Dict[str, str] = {}
        
    def print_header(self, text: str):
        """Print a formatted header"""
        print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
        print(f"{Colors.HEADER}{Colors.BOLD}{text.center(60)}{Colors.ENDC}")
        print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")
        
    def print_success(self, text: str):
        """Print success message"""
        print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")
        
    def print_error(self, text: str):
        """Print error message"""
        print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")
        
    def print_info(self, text: str):
        """Print info message"""
        print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")
        
    def print_json(self, data: Any, truncate: bool = False):
        """Print formatted JSON"""
        json_str = json.dumps(data, indent=2)
        if truncate and len(json_str) > 1000:
            print(json_str[:1000] + "...")
        else:
            print(json_str)
    
    def login(self, email: str, password: str) -> bool:
        """Login and get JWT token"""
        self.print_header("STEP 1: LOGIN")
        
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
                self.print_info(f"Token: {self.token[:20]}...")
                return True
            else:
                self.print_error(f"Login failed: {response.status_code}")
                self.print_json(response.json())
                return False
                
        except Exception as e:
            self.print_error(f"Login error: {str(e)}")
            return False
    
    def test_health_check(self) -> bool:
        """Test news service health endpoint"""
        self.print_header("STEP 2: HEALTH CHECK")
        
        try:
            response = requests.get(
                f"{self.base_url}/news/health",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.print_success("News service is healthy")
                self.print_json(data)
                return True
            else:
                self.print_error(f"Health check failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_error(f"Health check error: {str(e)}")
            return False
    
    def test_disaster_news(self, location: Optional[str] = None) -> Optional[str]:
        """Test disaster news endpoint and return first slug"""
        self.print_header("STEP 3: GET DISASTER NEWS")
        
        try:
            url = f"{self.base_url}/news/disaster"
            if location:
                url += f"?location={location}"
                self.print_info(f"Using location: {location}")
            else:
                self.print_info("Using user's database location (trying without location first)")
            
            response = requests.get(
                url,
                headers=self.headers,
                timeout=30
            )
            
            # If no location provided and we get 404/400, try with default location
            if response.status_code in [400, 404] and not location:
                self.print_info("User location not found in DB, using default: India")
                url = f"{self.base_url}/news/disaster?location=India"
                response = requests.get(
                    url,
                    headers=self.headers,
                    timeout=30
                )
            
            if response.status_code == 200:
                data = response.json()
                self.print_success(f"Found {data['totalResults']} disaster news articles")
                self.print_info(f"Location: {data['location']['state']}, {data['location'].get('city', 'N/A')}")
                
                if data['bundledNews']:
                    print(f"\n{Colors.BOLD}News Summary:{Colors.ENDC}")
                    for idx, news in enumerate(data['bundledNews'][:3], 1):
                        print(f"\n{idx}. {news['title']}")
                        print(f"   Slug: {news['slug']}")
                        print(f"   Sources: {news['totalArticles']} ({', '.join([s['name'] for s in news['sources']])})")
                        print(f"   Published: {news['publishedAt']}")
                    
                    if len(data['bundledNews']) > 3:
                        print(f"\n   ... and {len(data['bundledNews']) - 3} more articles")
                    
                    return data['bundledNews'][0]['slug']
                else:
                    self.print_info("No disaster news found for this location")
                    return None
            else:
                self.print_error(f"Failed to fetch news: {response.status_code}")
                self.print_json(response.json())
                return None
                
        except Exception as e:
            self.print_error(f"Disaster news error: {str(e)}")
            return None
    
    def test_news_detail(self, slug: str) -> bool:
        """Test news detail endpoint"""
        self.print_header("STEP 4: GET NEWS DETAIL")
        self.print_info(f"Fetching details for slug: {slug}")
        
        try:
            response = requests.get(
                f"{self.base_url}/news/detail/{slug}",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                news = data['news']
                
                self.print_success("News detail fetched successfully")
                print(f"\n{Colors.BOLD}Title:{Colors.ENDC} {news['title']}")
                print(f"{Colors.BOLD}Description:{Colors.ENDC} {news['description'][:200]}...")
                print(f"{Colors.BOLD}Sources:{Colors.ENDC} {news['totalArticles']}")
                
                for source in news['sources']:
                    print(f"  • {source['name']}")
                    print(f"    URL: {source['url'][:60]}...")
                
                print(f"\n{Colors.BOLD}Full Articles:{Colors.ENDC} {len(data['fullArticles'])}")
                for idx, article in enumerate(data['fullArticles'], 1):
                    print(f"\n{idx}. {article['source']['name']}")
                    if article['content']:
                        print(f"   Content: {article['content'][:150]}...")
                
                return True
            else:
                self.print_error(f"Failed to fetch news detail: {response.status_code}")
                self.print_json(response.json())
                return False
                
        except Exception as e:
            self.print_error(f"News detail error: {str(e)}")
            return False
    
    def test_llm_chat(self, slug: str, custom_message: Optional[str] = None) -> bool:
        """Test LLM chat endpoint"""
        self.print_header("STEP 5: CHAT WITH LLM")
        self.print_info(f"Asking LLM about news: {slug}")
        
        if custom_message:
            questions = [custom_message]
        else:
            questions = [
                "Is this news legitimate? What sources reported it?",
            ]
        
        conversation_history = []
        
        for idx, question in enumerate(questions, 1):
            print(f"\n{Colors.BOLD}Question {idx}:{Colors.ENDC} {question}")
            
            try:
                response = requests.post(
                    f"{self.base_url}/news/{slug}/chat",
                    headers=self.headers,
                    json={
                        "message": question,
                        "conversationHistory": conversation_history
                    },
                    timeout=60
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    answer = data['response']
                    
                    print(f"{Colors.OKGREEN}AI Response:{Colors.ENDC}")
                    print(answer[:500] + ("..." if len(answer) > 500 else ""))
                    
                    # Update conversation history
                    conversation_history.append({
                        "role": "user",
                        "content": question
                    })
                    conversation_history.append({
                        "role": "assistant",
                        "content": answer
                    })
                    
                    if idx < len(questions):
                        print(f"\n{Colors.OKCYAN}Continuing conversation...{Colors.ENDC}")
                else:
                    self.print_error(f"LLM chat failed: {response.status_code}")
                    self.print_json(response.json())
                    return False
                    
            except Exception as e:
                self.print_error(f"LLM chat error: {str(e)}")
                return False
        
        self.print_success("LLM chat test completed successfully")
        return True
    
    def test_cache_clear(self) -> bool:
        """Test cache clear endpoint"""
        self.print_header("STEP 6: CLEAR CACHE")
        
        try:
            response = requests.post(
                f"{self.base_url}/news/cache/clear",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.print_success(data['message'])
                return True
            else:
                self.print_error(f"Cache clear failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_error(f"Cache clear error: {str(e)}")
            return False
    
    def run_all_tests(self, email: str, password: str, location: Optional[str] = None, llm_message: Optional[str] = None):
        """Run all tests in sequence"""
        print(f"\n{Colors.HEADER}{Colors.BOLD}")
        print("╔════════════════════════════════════════════════════════════╗")
        print("║          DISASTER NEWS API - COMPREHENSIVE TEST            ║")
        print("╚════════════════════════════════════════════════════════════╝")
        print(Colors.ENDC)
        
        # Step 1: Login
        if not self.login(email, password):
            self.print_error("Cannot proceed without authentication")
            return False
        
        # Step 2: Health Check
        if not self.test_health_check():
            self.print_error("Service health check failed")
            return False
        
        # Step 3: Get Disaster News
        slug = self.test_disaster_news(location)
        if not slug:
            self.print_error("No news found to test with")
            return False
        
        # Step 4: Get News Detail
        if not self.test_news_detail(slug):
            self.print_error("News detail test failed")
            return False
        
        # Step 5: Chat with LLM
        if not self.test_llm_chat(slug, llm_message):
            self.print_error("LLM chat test failed")
            return False
        
        # Step 6: Clear Cache
        self.test_cache_clear()
        
        # Final Summary
        self.print_header("TEST SUMMARY")
        self.print_success("All tests completed successfully! ✓")
        print(f"\n{Colors.OKGREEN}The Disaster News API is fully functional.{Colors.ENDC}")
        print(f"{Colors.OKCYAN}You can now integrate it with the frontend.{Colors.ENDC}\n")
        
        return True


def main():
    """Main function"""
    print("\n" + Colors.BOLD + "Disaster News API Tester" + Colors.ENDC)
    print(Colors.OKCYAN + "Make sure the backend is running on http://localhost:8080" + Colors.ENDC)
    
    # Default credentials
    default_email = "john@example.com"
    default_password = "SecurePass123"
    
    # Get credentials (with defaults)
    email_input = input(f"\nEnter email (default: {default_email}): ").strip()
    email = email_input if email_input else default_email
    
    password_input = input(f"Enter password (default: {default_password}): ").strip()
    password = password_input if password_input else default_password
    
    location = input("Enter location override (or press Enter to use DB location): ").strip()
    location = location if location else None
    
    llm_message = input("Enter LLM question (or press Enter for default): ").strip()
    llm_message = llm_message if llm_message else None
    
    # Run tests
    tester = NewsAPITester()
    success = tester.run_all_tests(email, password, location, llm_message)
    
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
