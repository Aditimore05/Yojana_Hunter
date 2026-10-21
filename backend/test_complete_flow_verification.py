import requests
import json
import time
import sys

# Ensure UTF-8 stdout on Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:5000"

def log(msg, status="INFO"):
    clean_msg = str(msg).encode('ascii', 'replace').decode('ascii')
    print(f"[{status}] {clean_msg}")

def run_tests():
    print("=" * 60)
    print("YOJANA HUNTER: END-TO-END FLOW & REGRESSION TEST SUITE")
    print("=" * 60)
    
    results = {}
    
    # Test 1: Citizen Registration
    test_user_email = f"citizen_{int(time.time())}@example.com"
    test_user_password = "Citizen@Password123"
    test_user_name = "Rajesh Ramesh Patil"
    
    reg_payload = {
        "fullName": test_user_name,
        "email": test_user_email,
        "password": test_user_password,
        "role": "citizen"
    }
    
    log(f"Testing Citizen Registration ({test_user_email})...")
    try:
        r = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload, timeout=10)
        assert r.status_code in [200, 201], f"Registration failed with status {r.status_code}: {r.text}"
        data = r.json()
        assert "token" in data, "Token missing in registration response"
        citizen_token = data["token"]
        log("Citizen Registration passed!", "PASS")
        results["Citizen Registration"] = "PASS"
    except Exception as e:
        log(f"Citizen Registration failed: {e}", "FAIL")
        results["Citizen Registration"] = f"FAIL: {e}"
        return results

    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

    # Test 2: Citizen Login
    log("Testing Citizen Login...")
    try:
        login_payload = {"email": test_user_email, "password": test_user_password}
        r = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload, timeout=10)
        assert r.status_code == 200, f"Login failed: {r.text}"
        data = r.json()
        assert data.get("user", {}).get("email") == test_user_email
        log("Citizen Login passed!", "PASS")
        results["Citizen Login"] = "PASS"
    except Exception as e:
        log(f"Citizen Login failed: {e}", "FAIL")
        results["Citizen Login"] = f"FAIL: {e}"

    # Test 3: Admin Login & Access Control
    log("Testing Admin Login with authorized credentials...")
    try:
        admin_login = {"email": "admin@yojanahunter.gov.in", "password": "Admin@12345"}
        r = requests.post(f"{BASE_URL}/api/auth/login", json=admin_login, timeout=10)
        assert r.status_code == 200, f"Admin login failed: {r.text}"
        admin_token = r.json().get("token")
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        log("Admin Login passed!", "PASS")
        results["Admin Login"] = "PASS"

        # Check admin endpoint access with admin token
        r_admin = requests.get(f"{BASE_URL}/api/admin/schemes", headers=admin_headers, timeout=10)
        assert r_admin.status_code == 200, f"Admin scheme access failed: {r_admin.text}"
        log("Admin endpoint access passed!", "PASS")
        results["Admin Access Authorized"] = "PASS"

        # Check citizen CANNOT access admin endpoint
        r_unauth = requests.get(f"{BASE_URL}/api/admin/schemes", headers=citizen_headers, timeout=10)
        assert r_unauth.status_code in [401, 403], f"Citizen was not blocked from admin endpoint! Status: {r_unauth.status_code}"
        log("Citizen access to Admin endpoint correctly blocked (403/401)!", "PASS")
        results["Admin Route Protection"] = "PASS"

    except Exception as e:
        log(f"Admin auth tests failed: {e}", "FAIL")
        results["Admin Auth"] = f"FAIL: {e}"

    # Test 4: Manual Profile Update & Persistence (Farmer Profile)
    log("Testing Manual Profile Update - Farmer with Land Holding...")
    try:
        farmer_profile = {
            "fullName": "Balaram Kisan Shinde",
            "age": 45,
            "dob": "1981-05-12",
            "gender": "male",
            "state": "Maharashtra",
            "district": "Pune",
            "category": "OBC",
            "occupation": "Farmer",
            "educationLevel": "High School",
            "annualFamilyIncome": 120000,
            "landHoldingAcres": 3.5,
            "ownsLand": True,
            "isFarmer": True,
            "isCultivator": True,
            "isIncomeTaxPayee": False,
            "isGovtEmployee": False,
            "isDifferentlyAbled": False
        }
        r = requests.put(f"{BASE_URL}/api/profile", json=farmer_profile, headers=citizen_headers, timeout=10)
        assert r.status_code == 200, f"Profile PUT failed: {r.text}"
        res_json = r.json()
        saved_p = res_json.get("profile") or res_json
        assert saved_p.get("occupation") == "Farmer"
        assert float(saved_p.get("landHoldingAcres", 0)) == 3.5
        
        # Verify persistence with GET
        r_get = requests.get(f"{BASE_URL}/api/profile", headers=citizen_headers, timeout=10)
        fetched_json = r_get.json()
        fetched_p = fetched_json.get("profile") or fetched_json
        assert fetched_p.get("fullName") == "Balaram Kisan Shinde"
        assert fetched_p.get("occupation") == "Farmer"
        log("Farmer Profile updated and persisted successfully!", "PASS")
        results["Farmer Profile Persistence"] = "PASS"

        # Scheme matching for Farmer
        r_match = requests.post(f"{BASE_URL}/api/schemes/match", json={"profile": fetched_p}, headers=citizen_headers, timeout=10)
        assert r_match.status_code == 200
        match_data = r_match.json()
        all_schemes = match_data.get("schemes", [])
        active_schemes = [s for s in all_schemes if s.get("eligibilityStatus") in ("eligible", "possibly_eligible")]
        active_titles = [s.get("title") or s.get("name") for s in active_schemes]
        log(f"Farmer Relevant Schemes count: {len(active_titles)}")
        
        has_pm_kisan = any("Kisan" in s or "Krishi" in s or "Fasal" in s or "Agriculture" in s for s in active_titles)
        has_scholarship = any("Pre-Matric" in s or "Post Matric" in s for s in active_titles)
        assert has_pm_kisan, f"Farmer should receive agricultural schemes! Got: {active_titles}"
        assert not has_scholarship, f"Farmer should NOT receive student scholarships! Got: {active_titles}"
        log("Farmer scheme filtering strictly matched agriculture and excluded student scholarships!", "PASS")
        results["Farmer Scheme Filtering"] = "PASS"

    except Exception as e:
        log(f"Farmer Profile & Scheme test failed: {e}", "FAIL")
        results["Farmer Scheme Filtering"] = f"FAIL: {e}"

    # Test 5: Manual Profile Update - Student Profile
    log("Testing Manual Profile Update - Student Profile...")
    try:
        student_profile = {
            "fullName": "Ananya Deshmukh",
            "age": 20,
            "dob": "2006-03-15",
            "gender": "female",
            "state": "Maharashtra",
            "district": "Pune",
            "category": "SC",
            "occupation": "Student",
            "educationLevel": "Undergraduate",
            "annualFamilyIncome": 95000,
            "isStudent": True,
            "course": "B.Tech Computer Engineering",
            "institution": "COEP Technological University",
            "isIncomeTaxPayee": False,
            "isGovtEmployee": False,
            "isDifferentlyAbled": False
        }
        r = requests.put(f"{BASE_URL}/api/profile", json=student_profile, headers=citizen_headers, timeout=10)
        assert r.status_code == 200
        res_json = r.json()
        saved_student = res_json.get("profile") or res_json
        assert saved_student.get("occupation") == "Student"

        # Scheme matching for Student
        r_match = requests.post(f"{BASE_URL}/api/schemes/match", json={"profile": saved_student}, headers=citizen_headers, timeout=10)
        assert r_match.status_code == 200
        match_data = r_match.json()
        all_schemes = match_data.get("schemes", [])
        active_schemes = [s for s in all_schemes if s.get("eligibilityStatus") in ("eligible", "possibly_eligible")]
        active_titles = [s.get("title") or s.get("name") for s in active_schemes]
        log(f"Student Relevant Schemes count: {len(active_titles)}")
        
        has_scholarship = any("Scholarship" in s or "Vidyalakshmi" in s or "Apprenticeship" in s for s in active_titles)
        has_pm_kisan = any("PM-KISAN" in s or "Kisan Samman" in s for s in active_titles)
        assert has_scholarship, f"Student should receive scholarships! Got: {active_titles}"
        assert not has_pm_kisan, f"Student should NOT receive PM-KISAN! Got: {active_titles}"
        log("Student scheme filtering strictly matched student schemes and excluded PM-KISAN!", "PASS")
        results["Student Scheme Filtering"] = "PASS"
    except Exception as e:
        log(f"Student Profile & Scheme test failed: {e}", "FAIL")
        results["Student Scheme Filtering"] = f"FAIL: {e}"

    # Test 6: Manual Profile Update - Woman Entrepreneur Profile
    log("Testing Manual Profile Update - Woman Entrepreneur Profile...")
    try:
        we_profile = {
            "fullName": "Sunita Sanjay Kulkarni",
            "age": 34,
            "dob": "1992-08-10",
            "gender": "female",
            "state": "Maharashtra",
            "district": "Mumbai",
            "category": "General",
            "occupation": "Woman Entrepreneur",
            "educationLevel": "Graduate",
            "annualFamilyIncome": 450000,
            "isBusinessOwner": True,
            "hasBusiness": True,
            "businessType": "Manufacturing",
            "enterpriseCategory": "Small",
            "isIncomeTaxPayee": False,
            "isGovtEmployee": False,
            "isDifferentlyAbled": False
        }
        r = requests.put(f"{BASE_URL}/api/profile", json=we_profile, headers=citizen_headers, timeout=10)
        assert r.status_code == 200
        res_json = r.json()
        saved_we = res_json.get("profile") or res_json
        assert saved_we.get("occupation") == "Woman Entrepreneur"

        # Scheme matching for Woman Entrepreneur
        r_match = requests.post(f"{BASE_URL}/api/schemes/match", json={"profile": saved_we}, headers=citizen_headers, timeout=10)
        assert r_match.status_code == 200
        match_data = r_match.json()
        all_schemes = match_data.get("schemes", [])
        active_schemes = [s for s in all_schemes if s.get("eligibilityStatus") in ("eligible", "possibly_eligible")]
        active_titles = [s.get("title") or s.get("name") for s in active_schemes]
        log(f"Woman Entrepreneur Relevant Schemes count: {len(active_titles)}")
        
        has_business = any("Stand-Up" in s or "Mudra" in s or "PMEGP" in s or "Skill" in s for s in active_titles)
        has_farmer = any("PM-KISAN" in s for s in active_titles)
        assert has_business, f"Woman Entrepreneur should receive Stand-Up India or business schemes! Got: {active_titles}"
        assert not has_farmer, f"Woman Entrepreneur should NOT receive PM-KISAN! Got: {active_titles}"
        log("Woman Entrepreneur scheme filtering strictly matched entrepreneur schemes!", "PASS")
        results["Woman Entrepreneur Scheme Filtering"] = "PASS"
    except Exception as e:
        log(f"Woman Entrepreneur Profile & Scheme test failed: {e}", "FAIL")
        results["Woman Entrepreneur Scheme Filtering"] = f"FAIL: {e}"

    # Test 7: Chatbot Natural Language Queries & Grounded Answers
    log("Testing Chatbot API (/api/chat)...")
    chat_tests = [
        {"prompt": "Hello, what is Yojana Hunter and how does it help me?", "expected_content": ["Yojana Hunter", "scheme", "discover"]},
        {"prompt": "Tell me about PM Vidyalakshmi Scheme", "expected_content": ["Vidyalakshmi", "loan", "education"]},
        {"prompt": "What documents do I need for PM Kisan?", "expected_content": ["PM-KISAN", "Aadhaar", "Land"]},
        {"prompt": "What schemes are available for farmers?", "expected_content": ["Farmers", "Kisan", "PM-KISAN"]},
        {"prompt": "What are the eligibility criteria for Stand-Up India?", "expected_content": ["Stand-Up India", "women", "SC"]}
    ]
    
    chat_passes = 0
    for idx, ct in enumerate(chat_tests):
        try:
            payload = {"message": ct["prompt"], "conversation_history": []}
            r = requests.post(f"{BASE_URL}/api/chat", json=payload, headers=citizen_headers, timeout=15)
            assert r.status_code == 200, f"Chat status {r.status_code}: {r.text}"
            res_json = r.json()
            reply = res_json.get("reply", "") or res_json.get("response", "")
            assert reply and len(reply) > 20, f"Empty or too short reply: {reply}"
            
            # Check if any expected keyword is present
            found_any = any(k.lower() in reply.lower() for k in ct["expected_content"])
            assert found_any, f"Expected keywords {ct['expected_content']} not in response: {reply[:100]}..."
            log(f"Chat Test {idx+1} ('{ct['prompt'][:35]}...') passed!", "PASS")
            chat_passes += 1
        except Exception as e:
            log(f"Chat Test {idx+1} failed: {e}", "FAIL")

    if chat_passes == len(chat_tests):
        results["Chatbot Grounded Retrieval"] = "PASS"
    else:
        results["Chatbot Grounded Retrieval"] = f"PARTIAL ({chat_passes}/{len(chat_tests)})"

    print("\n" + "=" * 60)
    print("FINAL TEST RESULTS SUMMARY")
    print("=" * 60)
    for test_name, result in results.items():
        print(f"[{result[:4]}] {test_name}: {result}")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
