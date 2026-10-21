import os
import sys
import time
import requests

sys.stdout.reconfigure(line_buffering=True)

from database import SessionLocal
from models import User, Scheme, DiscoveryJob, SchemeCitation, DiscoverySchedule
from utils.auth import create_access_token

BASE_URL = "http://127.0.0.1:5000"


def run_tests():
    print("=" * 60)
    print("STEP 1: Setting up Admin Authentication")
    print("=" * 60)
    db = SessionLocal()
    admin_user = db.query(User).filter(User.role == "admin", User.is_active == True).first()
    if not admin_user:
        print("Creating test admin user...")
        admin_user = User(
            name="Admin User",
            email="admin@yojanahunter.gov.in",
            password_hash="test",
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
    
    token = create_access_token(user_id=admin_user.id, email=admin_user.email, role="admin")
    db.close()
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    print(f"Admin token generated for {admin_user.email} (ID: {admin_user.id})")

    # ---------------------------------------------------------
    print("\n" + "=" * 60)
    print("STEP 2: Testing Gemini API & Grounding Connection (/gemini/test)")
    print("=" * 60)
    res = requests.post(f"{BASE_URL}/api/admin/gemini/test", headers=headers, json={})
    print(f"Status Code: {res.status_code}")
    data = res.json()
    print(f"Response: {data}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert data.get("success") == True, "Expected success to be True"
    assert data.get("details", {}).get("connected") == True, "Gemini not connected"
    print(f"Gemini connected: {data.get('details', {}).get('connected')}")
    print(f"Active model: {data.get('model')}")
    print(f"Grounding status: {data.get('groundingStatus')}")

    # ---------------------------------------------------------
    print("\n" + "=" * 60)
    print("STEP 3: Testing Discovery Schedule API (/discovery/schedule)")
    print("=" * 60)
    res = requests.get(f"{BASE_URL}/api/admin/discovery/schedule", headers=headers)
    print(f"GET Schedule: {res.status_code} -> {res.json()}")
    assert res.status_code == 200

    # Update schedule to enabled, 6 hours
    res = requests.post(f"{BASE_URL}/api/admin/discovery/schedule", headers=headers, json={
        "isEnabled": True,
        "frequencyHours": 6,
        "parameters": {
            "state": "Maharashtra",
            "category": "Agriculture & Farming",
            "maxQueries": 2
        }
    })
    print(f"POST Schedule: {res.status_code} -> {res.json()}")
    assert res.status_code == 200
    sched_info = res.json().get("schedule", {})
    assert sched_info.get("isEnabled") == True

    # ---------------------------------------------------------
    print("\n" + "=" * 60)
    print("STEP 4: Launching Live Scheme Discovery Job (/discovery-jobs)")
    print("=" * 60)
    job_payload = {
        "state": "Maharashtra",
        "category": "Agriculture & Farming",
        "department": "Department of Agriculture",
        "customQuery": "Maharashtra farmer financial assistance subsidy scheme",
        "maxQueries": 2
    }
    res = requests.post(f"{BASE_URL}/api/admin/discovery-jobs", headers=headers, json=job_payload)
    print(f"POST discovery-jobs: {res.status_code} -> {res.json()}")
    assert res.status_code in [201, 202]
    job_id = res.json().get("jobId") or res.json().get("numericId")
    numeric_id = res.json().get("numericId")
    print(f"Job started with ID: {job_id} (numeric ID: {numeric_id})")

    # ---------------------------------------------------------
    print("\n" + "=" * 60)
    print(f"STEP 5: Polling Job {job_id} until completion")
    print("=" * 60)
    max_wait = 120
    start_time = time.time()
    final_job = None
    while time.time() - start_time < max_wait:
        res = requests.get(f"{BASE_URL}/api/admin/discovery-jobs/{job_id}", headers=headers)
        if res.status_code == 200:
            job_data = res.json()
            status = job_data.get("status")
            print(f"  [T+{int(time.time() - start_time)}s] Job status: {status} | Discovered: {job_data.get('discoveredCount', 0)} | Inserted: {job_data.get('insertedCount', 0)} | Duplicates: {job_data.get('duplicateCount', 0)}")
            if status in ["completed", "failed"]:
                final_job = job_data
                break
        time.sleep(4)

    assert final_job is not None, "Job timed out"
    print(f"Final Job Status: {final_job.get('status')}")
    print(f"Total Discovered: {final_job.get('discoveredCount')}")
    print(f"Total Inserted: {final_job.get('insertedCount')}")
    print(f"Total Duplicates: {final_job.get('duplicateCount')}")
    print(f"Total Rejected: {final_job.get('rejectedCount')}")
    assert final_job.get("status") == "completed", f"Job failed: {final_job.get('errorMessage')}"

    # ---------------------------------------------------------
    print("\n" + "=" * 60)
    print("STEP 6: Verifying Discovered Schemes in PostgreSQL")
    print("=" * 60)
    db = SessionLocal()
    schemes = db.query(Scheme).filter(Scheme.discovery_job_id == numeric_id).all()
    print(f"Found {len(schemes)} schemes in DB for job ID {numeric_id}:")
    discovered_scheme_ids = []
    for s in schemes:
        print(f"  - [{s.id}] {s.name} (Slug: {s.slug})")
        print(f"    Status: {s.status} | Review: {s.admin_review_status} | Category: {s.category}")
        print(f"    Official URL: {s.official_source_url}")
        assert s.admin_review_status == "pending_review", f"Scheme {s.id} not pending_review"
        assert s.status == "draft", f"Scheme {s.id} not in draft status"
        discovered_scheme_ids.append(s.id)
        
        # Verify citations
        citations = db.query(SchemeCitation).filter(SchemeCitation.scheme_id == s.id).all()
        print(f"    Citations ({len(citations)}): {[c.source_url for c in citations]}")

    # ---------------------------------------------------------
    print("\n" + "=" * 60)
    print("STEP 7: Verifying Duplicate Prevention")
    print("=" * 60)
    print("Re-running discovery with identical parameters to verify deduplication...")
    res = requests.post(f"{BASE_URL}/api/admin/discovery-jobs", headers=headers, json=job_payload)
    dup_job_id = res.json().get("jobId") or res.json().get("numericId")
    print(f"Deduplication test job ID: {dup_job_id}")

    start_time = time.time()
    final_dup_job = None
    while time.time() - start_time < 120:
        res = requests.get(f"{BASE_URL}/api/admin/discovery-jobs/{dup_job_id}", headers=headers)
        if res.status_code == 200:
            job_data = res.json()
            status = job_data.get("status")
            if status in ["completed", "failed"]:
                final_dup_job = job_data
                break
        time.sleep(4)

    print(f"Deduplication Run Final Status: {final_dup_job.get('status')}")
    print(f"Discovered: {final_dup_job.get('discoveredCount')} | Inserted: {final_dup_job.get('insertedCount')} | Duplicates: {final_dup_job.get('duplicateCount')}")
    if final_dup_job.get("discoveredCount", 0) > 0:
        assert final_dup_job.get("duplicateCount", 0) > 0, "Expected duplicate detection on rerun!"
        print("[SUCCESS] Duplicate prevention verified: duplicate schemes were accurately flagged.")

    # ---------------------------------------------------------
    print("\n" + "=" * 60)
    print("STEP 8: Verification Queue & Approval Workflow")
    print("=" * 60)
    res = requests.get(f"{BASE_URL}/api/admin/schemes/pending-review", headers=headers)
    print(f"GET /schemes/pending-review status: {res.status_code}")
    queue_data = res.json().get("schemes", [])
    print(f"Queue count: {len(queue_data)}")
    assert len(queue_data) > 0, "Verification queue should contain pending schemes"

    target_scheme_item = queue_data[0]
    target_scheme_slug = target_scheme_item.get("slug") or target_scheme_item.get("id")
    target_numeric_id = target_scheme_item.get("numericId")
    print(f"Approving scheme: {target_scheme_slug} (numeric ID: {target_numeric_id})...")
    res = requests.post(f"{BASE_URL}/api/admin/schemes/{target_scheme_slug}/approve", headers=headers, json={
        "notes": "Verified by automated integration test"
    })
    print(f"Approve response: {res.status_code} -> {res.json()}")
    assert res.status_code == 200

    approved_scheme = db.query(Scheme).filter(Scheme.slug == target_scheme_slug).first()
    print(f"Scheme {target_scheme_slug} after approval: status={approved_scheme.status}, review_status={approved_scheme.admin_review_status}, is_active={approved_scheme.is_active}")
    assert approved_scheme.status == "published", "Approved scheme status should be published"
    assert approved_scheme.admin_review_status == "approved", "Approved scheme review_status should be approved"
    assert approved_scheme.is_active == True, "Approved scheme must be active"

    # ---------------------------------------------------------
    print("\n" + "=" * 60)
    print("STEP 9: Citizen Portal Dynamic Verification (/api/schemes)")
    print("=" * 60)
    res = requests.get(f"{BASE_URL}/api/schemes?limit=50")
    print(f"GET /api/schemes status: {res.status_code}")
    citizen_schemes = res.json() if isinstance(res.json(), list) else res.json().get("data", [])
    citizen_slugs = [s.get("slug") or s.get("id") for s in citizen_schemes]
    citizen_numeric_ids = [s.get("numericId") for s in citizen_schemes if s.get("numericId")]
    print(f"Total schemes returned to citizen portal: {len(citizen_schemes)}")
    assert (target_scheme_slug in citizen_slugs or target_numeric_id in citizen_numeric_ids), f"Approved scheme {target_scheme_slug} NOT found in citizen portal results!"
    print(f"[SUCCESS] Approved scheme {target_scheme_slug} is dynamically accessible on citizen portal.")

    unapproved_schemes = db.query(Scheme).filter(Scheme.admin_review_status == "pending_review").all()
    for us in unapproved_schemes:
        assert (us.slug not in citizen_slugs and us.id not in citizen_numeric_ids), f"CRITICAL: Unapproved draft scheme {us.slug} is leaking to citizen portal!"
    print(f"[SUCCESS] Unapproved pending schemes ({len(unapproved_schemes)}) are strictly isolated from citizen portal.")

    # ---------------------------------------------------------
    print("\n" + "=" * 60)
    print("STEP 10: Testing Scheduled Run-Now Endpoint")
    print("=" * 60)
    res = requests.post(f"{BASE_URL}/api/admin/discovery/schedule/run-now", headers=headers)
    print(f"POST run-now response: {res.status_code} -> {res.json()}")
    assert res.status_code == 200
    print("[SUCCESS] Scheduled run-now executed cleanly.")

    db.close()
    print("\n" + "=" * 60)
    print("ALL 10 VERIFICATION STEPS PASSED WITH 100% SUCCESS!")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()
