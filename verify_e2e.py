import urllib.request
import json
import sys

def req(url, method='GET', data=None, headers=None):
    if headers is None:
        headers = {}
    body = None
    if data is not None:
        body = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

print("=== Starting 10-Step Verification of Yojana Hunter Admin Panel & Scheme Management ===")

# 1. Admin Login
status, login_res = req(
    'http://127.0.0.1:5000/api/admin/login',
    'POST',
    {'email': 'admin@yojanahunter.gov.in', 'password': 'Admin@12345'}
)
if status != 200:
    print(f"[FAIL] Step 1: Admin login failed: {login_res}")
    sys.exit(1)
token = login_res['token']
auth_headers = {'Authorization': f'Bearer {token}'}
print(f"[PASS] 1. Admin login successful. Token acquired for {login_res['user']['email']}.")

# 2. Initial Dashboard Stats
status, stats1 = req('http://127.0.0.1:5000/api/admin/dashboard', headers=auth_headers)
if status != 200:
    print(f"[FAIL] Step 2: Dashboard stats fetch failed: {stats1}")
    sys.exit(1)
print(f"[PASS] 2. Dashboard metrics from DB: Total={stats1['totalSchemes']}, Published={stats1['publishedSchemes']}, Drafts={stats1['draftSchemes']}, Archived={stats1['archivedSchemes']}.")

# 3. Create Draft Scheme
scheme_payload = {
    'name': 'PM Surya Ghar Muft Bijli Yojana',
    'short_description': 'Free electricity scheme providing up to 300 units of free power each month for 1 crore households.',
    'full_description': 'A pioneering central sector initiative providing up to Rs. 78,000 subsidy directly into citizens bank accounts for installing rooftop solar panels.',
    'category': 'Renewable Energy & Power',
    'department': 'Ministry of New and Renewable Energy',
    'scheme_level': 'Central',
    'state': 'All India',
    'benefits': 'Subsidy of Rs. 30,000 for 1kW, Rs. 60,000 for 2kW, Rs. 78,000 for 3kW or higher solar systems.',
    'criteria': 'Applicant must be an Indian citizen possessing residential rooftop and valid electricity connection.',
    'age_min': 18,
    'age_max': 75,
    'income_max': 600000,
    'occupation': 'All Categories',
    'education': 'Any',
    'documents': ['Aadhaar Card', 'Electricity Bill of last 6 months', 'Proof of Roof Ownership', 'Bank Passbook'],
    'application_process': 'Register on the National Solar Portal, apply for rooftop installation, and receive subsidy directly in bank account.',
    'application_url': 'https://pmsuryaghar.gov.in',
    'source_url': 'https://mnre.gov.in',
    'status': 'draft'
}
status, new_scheme_resp = req('http://127.0.0.1:5000/api/admin/schemes', 'POST', scheme_payload, auth_headers)
if status != 201:
    print(f"[FAIL] Step 3: Create scheme failed: {new_scheme_resp}")
    sys.exit(1)
scheme_data = new_scheme_resp.get('scheme', new_scheme_resp)
scheme_id = scheme_data['id']
slug = scheme_data['slug']
print(f"[PASS] 3. Created draft scheme (ID: {scheme_id}, Slug: '{slug}', Status: '{scheme_data['status']}').")

# 4. Check Citizen Schemes (Must NOT contain draft)
status, cit_schemes = req('http://127.0.0.1:5000/api/schemes')
cit_list = cit_schemes if isinstance(cit_schemes, list) else cit_schemes.get('schemes', [])
found_in_cit = any(s.get('id') == scheme_id or s.get('slug') == slug for s in cit_list)
if found_in_cit:
    print("[FAIL] Step 4: Draft scheme is erroneously visible in citizen schemes list!")
    sys.exit(1)
print("[PASS] 4. Citizen catalog strictly conceals the draft scheme.")

# 5. Check Citizen direct access (Must return 404 for draft)
status, cit_detail = req(f'http://127.0.0.1:5000/api/schemes/{slug}')
if status != 404:
    print(f"[FAIL] Step 5: Direct citizen query for draft scheme should be 404, got {status}!")
    sys.exit(1)
print("[PASS] 5. Citizen direct access to draft scheme is blocked with HTTP 404.")

# 6. Publish the Draft Scheme
status, patch_res = req(
    f'http://127.0.0.1:5000/api/admin/schemes/{scheme_id}/status',
    'PATCH',
    {'status': 'published'},
    auth_headers
)
if status != 200 or patch_res['scheme']['status'] != 'published':
    print(f"[FAIL] Step 6: Status update failed: {patch_res}")
    sys.exit(1)
print(f"[PASS] 6. Scheme status transitioned to 'published'.")

# 7. Check Citizen Schemes (Must NOW contain published scheme)
status, cit_schemes2 = req('http://127.0.0.1:5000/api/schemes')
cit_list2 = cit_schemes2 if isinstance(cit_schemes2, list) else cit_schemes2.get('schemes', [])
found_in_cit2 = any(s.get('id') == scheme_id or s.get('slug') == slug for s in cit_list2)
if not found_in_cit2:
    print("[FAIL] Step 7: Published scheme was not found in public citizen list!")
    sys.exit(1)
print(f"[PASS] 7. Scheme is immediately discoverable and accessible on citizen portal.")

# 8. Archive the Scheme
status, patch_res2 = req(
    f'http://127.0.0.1:5000/api/admin/schemes/{scheme_id}/status',
    'PATCH',
    {'status': 'archived'},
    auth_headers
)
if status != 200 or patch_res2['scheme']['status'] != 'archived':
    print(f"[FAIL] Step 8: Transition to archived failed: {patch_res2}")
    sys.exit(1)
print(f"[PASS] 8. Scheme archived successfully.")

# 9. Verify Citizen Schemes hides archived scheme
status, cit_schemes3 = req('http://127.0.0.1:5000/api/schemes')
cit_list3 = cit_schemes3 if isinstance(cit_schemes3, list) else cit_schemes3.get('schemes', [])
found_in_cit3 = any(s.get('id') == scheme_id or s.get('slug') == slug for s in cit_list3)
if found_in_cit3:
    print("[FAIL] Step 9: Archived scheme is still visible in citizen portal!")
    sys.exit(1)
print("[PASS] 9. Citizen portal automatically excludes archived schemes.")

# 10. Clean up Test Scheme
status, del_res = req(f'http://127.0.0.1:5000/api/admin/schemes/{scheme_id}', 'DELETE', headers=auth_headers)
if status != 200:
    print(f"[FAIL] Step 10: Failed to delete scheme: {del_res}")
    sys.exit(1)
print(f"[PASS] 10. Test scheme cleanly removed from DB. ALL 10 VERIFICATION CHECKS PASSED!")
