import urllib.request
import urllib.parse
import json
import sys

BASE_URL = 'http://127.0.0.1:5000/api'

def call_api(endpoint, method='GET', payload=None, params=None, token=None):
    url = f"{BASE_URL}/{endpoint}"
    if params:
        query = urllib.parse.urlencode(params)
        url = f"{url}?{query}"
    
    data = None
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    
    if payload is not None:
        data = json.dumps(payload).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {'error': err_body}

def run_tests():
    print("=" * 70)
    print("YOJANA HUNTER: 9-SCENARIO AUTOMATED VERIFICATION SUITE")
    print("=" * 70)
    
    passed_tests = 0
    total_tests = 9

    # ---------------------------------------------------------
    # SCENARIO 1: Student Profile Strictly Receives Student/Education/Skill Schemes
    # Excludes farmer/agriculture schemes completely
    # ---------------------------------------------------------
    print("\n[Scenario 1] Student profile receives student schemes; 0 farmer schemes")
    student_payload = {
        'occupation': 'Student',
        'is_student': True,
        'is_farmer': False,
        'state': 'Uttar Pradesh',
        'age': 20,
        'annual_income': 150000,
        'education': 'Undergraduate'
    }
    status, res = call_api('schemes/recommendations', params=student_payload)
    recs = res.get('recommendations', [])
    farmer_schemes_found = [
        s['name'] for s in recs 
        if s.get('category') == 'Agriculture' or 'farmer' in s.get('targetGroup', '').lower()
    ]
    print(f"  Total recommendations for student: {len(recs)}")
    for s in recs:
        print(f"   - [{s.get('category')}] {s.get('name')}")
    assert len(farmer_schemes_found) == 0, f"Found farmer schemes for student: {farmer_schemes_found}"
    assert len(recs) > 0, "Student should have matching education/skill schemes"
    print("  => PASSED: 0 farmer schemes found for student, education/skill schemes returned.")
    passed_tests += 1

    # ---------------------------------------------------------
    # SCENARIO 2: Farmer Profile Receives Agricultural Schemes; 0 Student-only Schemes
    # ---------------------------------------------------------
    print("\n[Scenario 2] Farmer profile receives agricultural schemes; 0 student-only schemes")
    farmer_payload = {
        'occupation': 'Farmer',
        'is_farmer': True,
        'is_student': False,
        'state': 'Maharashtra',
        'age': 35,
        'land_holding_acres': 3.5,
        'annual_income': 180000
    }
    status, res = call_api('schemes/recommendations', params=farmer_payload)
    recs = res.get('recommendations', [])
    student_schemes_found = [
        s['name'] for s in recs 
        if s.get('category') == 'Education' or s.get('slug') == 'pm-vidyalakshmi'
    ]
    print(f"  Total recommendations for farmer: {len(recs)}")
    for s in recs[:5]:
        print(f"   - [{s.get('category')}] {s.get('name')}")
    assert len(student_schemes_found) == 0, f"Found student schemes for farmer: {student_schemes_found}"
    assert any(s.get('category') == 'Agriculture' for s in recs), "Farmer should have agriculture schemes"
    print("  => PASSED: 0 student schemes found for farmer, agriculture schemes returned.")
    passed_tests += 1

    # ---------------------------------------------------------
    # SCENARIO 3: Business Owner & Job Seeker Schemes
    # ---------------------------------------------------------
    print("\n[Scenario 3] Business Owner & Job Seeker Profiles")
    biz_payload = {
        'occupation': 'Business Owner',
        'has_business': True,
        'is_farmer': False,
        'is_student': False,
        'state': 'All India',
        'age': 32,
        'annual_income': 400000
    }
    status, res = call_api('schemes/recommendations', params=biz_payload)
    recs = res.get('recommendations', [])
    print(f"  Business Owner Recs ({len(recs)}): {[s['name'] for s in recs]}")
    assert not any(s.get('slug') == 'pm-vidyalakshmi' for s in recs), "Business owner should not get student-only schemes"
    assert not any(s.get('slug') == 'pm-kisan' for s in recs), "Business owner should not get PM-KISAN"
    
    seeker_payload = {
        'occupation': 'Unemployed',
        'employment_status': 'Unemployed',
        'is_student': False,
        'is_farmer': False,
        'state': 'All India',
        'age': 22
    }
    status, res = call_api('schemes/recommendations', params=seeker_payload)
    recs_seeker = res.get('recommendations', [])
    print(f"  Job Seeker Recs ({len(recs_seeker)}): {[s['name'] for s in recs_seeker]}")
    assert not any(s.get('slug') == 'pm-kisan' for s in recs_seeker), "Unemployed job seeker should not get PM-KISAN"
    print("  => PASSED: Business owner and job seeker receive targeted schemes without farmer leaks.")
    passed_tests += 1

    # ---------------------------------------------------------
    # SCENARIO 4: Dual / Multiple Category Qualifying Schemes
    # E.g. A user who is both a Student and a Farmer (owns land)
    # ---------------------------------------------------------
    print("\n[Scenario 4] Dual category (Student + Farmer with landholding)")
    dual_payload = {
        'occupation': 'Student',
        'is_student': True,
        'is_farmer': True,
        'land_holding_acres': 2.5,
        'state': 'Uttar Pradesh',
        'age': 22,
        'annual_income': 120000,
        'education': 'Undergraduate'
    }
    status, res = call_api('schemes/recommendations', params=dual_payload)
    recs = res.get('recommendations', [])
    categories = set(s.get('category') for s in recs)
    print(f"  Dual Profile Recs ({len(recs)}), Categories: {categories}")
    has_agri = any(s.get('category') == 'Agriculture' for s in recs)
    has_edu_or_skill = any(s.get('category') in ['Education', 'Skill Development', 'Employment'] for s in recs)
    assert has_agri, "Dual profile with landholding should qualify for agricultural schemes"
    assert has_edu_or_skill, "Dual profile should also qualify for education/skill schemes"
    print("  => PASSED: Dual category legitimately receives qualifying schemes from both sectors.")
    passed_tests += 1

    # ---------------------------------------------------------
    # SCENARIO 5: Dynamic Filtering on Profile Updates (State, Age, Income)
    # ---------------------------------------------------------
    print("\n[Scenario 5] Dynamic Switching on State, Age, Income")
    # 5a: Maharashtra vs UP for farmer
    _, res_mh = call_api('schemes/recommendations', params={'occupation': 'Farmer', 'is_farmer': True, 'state': 'Maharashtra'})
    _, res_up = call_api('schemes/recommendations', params={'occupation': 'Farmer', 'is_farmer': True, 'state': 'Uttar Pradesh'})
    mh_names = [s['name'] for s in res_mh.get('recommendations', [])]
    up_names = [s['name'] for s in res_up.get('recommendations', [])]
    assert any('Maha' in name or 'Shettale' in name for name in mh_names), "Maharashtra farmer should see Maharashtra-specific schemes"
    assert not any('Maha' in name or 'Shettale' in name for name in up_names), "UP farmer should NOT see Maharashtra-specific schemes"
    
    # 5b: Age threshold check on PM-KMY (Max age 40)
    match_url = 'schemes/match'
    _, res_young = call_api(match_url, method='POST', payload={'occupation': 'Farmer', 'is_farmer': True, 'age': 30, 'land_holding_acres': 2.0})
    _, res_old = call_api(match_url, method='POST', payload={'occupation': 'Farmer', 'is_farmer': True, 'age': 55, 'land_holding_acres': 2.0})
    kmy_young = next((s for s in res_young['schemes'] if s['slug'] == 'pm-kmy'), None)
    kmy_old = next((s for s in res_old['schemes'] if s['slug'] == 'pm-kmy'), None)
    assert kmy_young and kmy_young['eligibilityStatus'] in ['eligible', 'possibly_eligible'], "Age 30 should qualify for PM-KMY"
    assert kmy_old and kmy_old['eligibilityStatus'] in ['ineligible', 'not_eligible'], "Age 55 must be ineligible for PM-KMY"
    print("  => PASSED: State isolation and age/income rules dynamically update eligibility.")
    passed_tests += 1

    # ---------------------------------------------------------
    # SCENARIO 6: Incomplete Data Flags as POSSIBLY_ELIGIBLE with missing_information
    # Never makes false claims of 100% ELIGIBLE when missing criteria
    # ---------------------------------------------------------
    print("\n[Scenario 6] Incomplete Data flags POSSIBLY_ELIGIBLE with missing_information")
    sparse_payload = {
        'occupation': 'Farmer',
        'is_farmer': True
        # Missing state, age, income, land_holding_acres
    }
    status, res = call_api('schemes/match', method='POST', payload=sparse_payload)
    pm_kisan = next((s for s in res['schemes'] if s['slug'] == 'pm-kisan'), None)
    assert pm_kisan is not None, "PM-KISAN scheme should be in evaluation"
    assert pm_kisan['eligibilityStatus'] == 'possibly_eligible', f"Expected possibly_eligible, got {pm_kisan['eligibilityStatus']}"
    assert len(pm_kisan.get('missingInformation', [])) > 0, "Should have missing criteria flagged"
    print(f"  PM-KISAN status: {pm_kisan['eligibilityStatus']}, Missing info: {pm_kisan.get('missingInformation')}")
    print("  => PASSED: Sparse data produces 'possibly_eligible' with detailed missing requirements.")
    passed_tests += 1

    # ---------------------------------------------------------
    # SCENARIO 7: No-match Profiles Return Clean Empty Results
    # ---------------------------------------------------------
    print("\n[Scenario 7] Impossible / Unmatched Profile returns empty recommendation list")
    impossible_payload = {
        'occupation': 'Astronomer',
        'is_farmer': False,
        'is_student': False,
        'has_business': False,
        'state': 'NonExistentState',
        'annual_income': 99999999, # Excessively high income exceeding all scheme caps
        'age': 99
    }
    status, res = call_api('schemes/recommendations', params=impossible_payload)
    recs = res.get('recommendations', [])
    print(f"  Recommendations returned for outlier: {len(recs)}")
    assert len(recs) == 0, f"Expected 0 recommendations, got {len(recs)}"
    print("  => PASSED: Clean empty result returned without fallback or ineligible padding.")
    passed_tests += 1

    # ---------------------------------------------------------
    # SCENARIO 8: Direct Unauthenticated API Requests Never Leak Schemes to Non-Farmers
    # ---------------------------------------------------------
    print("\n[Scenario 8] Direct API Request Filtering & Unauthenticated Behavior")
    # 8a: Unauthenticated GET /api/schemes/recommendations with no params
    status, res = call_api('schemes/recommendations')
    recs_unauth = res.get('recommendations', [])
    print(f"  Unauthenticated without params recs: {len(recs_unauth)}")
    farmer_exclusive = [s['name'] for s in recs_unauth if s.get('slug') in ['pm-kisan', 'pmfby', 'pm-kmy']]
    assert len(farmer_exclusive) == 0, f"Unauthenticated request leaked farmer schemes: {farmer_exclusive}"
    
    # 8b: GET /api/schemes (catalog) with category filter
    status, res_cat = call_api('schemes', params={'category': 'Education'})
    edu_schemes = res_cat if isinstance(res_cat, list) else res_cat.get('schemes', [])
    assert len(edu_schemes) > 0, "Category filter for Education should return schemes"
    assert all(s.get('category') == 'Education' for s in edu_schemes), "All returned schemes must be Education"
    print("  => PASSED: Direct API calls enforce strict boundaries and zero unauthorized leakage.")
    passed_tests += 1

    # ---------------------------------------------------------
    # SCENARIO 9: Existing Authentication, Profile & System Functions Intact
    # ---------------------------------------------------------
    print("\n[Scenario 9] Health Check & Core API Architecture Verification")
    status, res_health = call_api('health')
    print(f"  Health check status: {status}, response: {res_health}")
    assert status == 200 and res_health.get('status') == 'healthy', "Health check failed"
    
    # Verify schemes endpoint listing
    status, res_schemes = call_api('schemes')
    schemes_list = res_schemes if isinstance(res_schemes, list) else res_schemes.get('schemes', [])
    assert status == 200 and len(schemes_list) > 0, "Schemes listing failed"
    print("  => PASSED: Health checks, scheme catalog, and routing remain fully operational.")
    passed_tests += 1

    print("\n" + "=" * 70)
    print(f"ALL {passed_tests}/{total_tests} SCENARIOS TESTED AND PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == '__main__':
    run_tests()
