import sys
import os
import pytest
from datetime import datetime, timezone, timedelta

# Setup backend in path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from models import Scheme, Profile, User, SubscriptionRequest
from services.subscription_service import SubscriptionService
from services.eligibility_service import SchemeEligibilityService
from utils.auth import hash_password, create_admin_token, create_access_token
from app import create_app
from database import engine, Base, SessionLocal

@pytest.fixture(scope="session")
def test_app():
    Base.metadata.create_all(bind=engine)
    app = create_app()
    app.config["TESTING"] = True
    yield app
    SessionLocal.remove()

@pytest.fixture(scope="session")
def client(test_app):
    return test_app.test_client()

@pytest.fixture(autouse=True)
def clean_session():
    SessionLocal.remove()
    yield
    SessionLocal.remove()


# Helper to create clean test users
def get_or_create_test_user(db, email, role="citizen"):
    user = db.query(User).filter_by(email=email).first()
    if not user:
        # Generate a unique mobile number
        seed_num = abs(hash(email)) % 900000000 + 100000000
        mobile = f"9{seed_num}"[:10]
        while db.query(User).filter_by(mobile=mobile).first():
            seed_num += 1
            mobile = f"9{seed_num}"[:10]

        user = User(
            email=email,
            mobile=mobile,
            password_hash=hash_password("TestPassword123!"),
            role=role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_or_create_profile(db, user_id, occupation="Student", state="Maharashtra", gender="Female"):
    profile = db.query(Profile).filter_by(user_id=user_id).first()
    if not profile:
        profile = Profile(
            user_id=user_id,
            full_name="Test Citizen",
            occupation=occupation,
            state=state,
            gender=gender,
            age=22,
            annual_income=150000,
            education="Graduate",
            category="General",
            is_student=True,
            is_farmer=False,
            has_business=False,
            is_disabled=False
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def ensure_test_schemes(db, count=8):
    """Ensure at least count active schemes exist for student profile matching"""
    existing_count = db.query(Scheme).filter_by(is_active=True, status="published").count()
    if existing_count < count:
        for i in range(existing_count + 1, count + 1):
            scheme = Scheme(
                slug=f"test-student-scheme-{i}",
                name=f"Student Scholarship Grant Level {i}",
                short_description=f"Educational fellowship and scholarship grant test scheme {i}",
                description=f"Detailed educational assistance scheme for college students tier {i}",
                category="Education",
                department="Ministry of Education",
                level="Central Scheme",
                state="All India",
                status="published",
                is_active=True,
                is_student_only=True,
                benefit=f"₹{i * 10000} per academic year",
                last_verified_date=datetime.now(timezone.utc)
            )
            db.add(scheme)
        db.commit()


# =========================================================================
# COMPREHENSIVE SUBSCRIPTION WORKFLOW TESTS
# =========================================================================

def test_1_subscription_plans_endpoint(client):
    """Test public plans endpoint returns monthly, two_months, and yearly plans with comparison."""
    resp = client.get("/api/subscriptions/plans")
    assert resp.status_code == 200
    data = resp.get_json()

    assert "plans" in data
    assert "comparison" in data
    assert data["free_limit"] == 5

    plans = data["plans"]
    plan_ids = [p["id"] for p in plans]
    assert "monthly" in plan_ids
    assert "two_months" in plan_ids
    assert "yearly" in plan_ids

    monthly_plan = next(p for p in plans if p["id"] == "monthly")
    assert monthly_plan["price"] == 50
    assert monthly_plan["duration_days"] == 30

    two_months_plan = next(p for p in plans if p["id"] == "two_months")
    assert two_months_plan["price"] == 100
    assert two_months_plan["duration_days"] == 60


def test_2_free_user_scheme_limit_enforcement(client):
    """Test free user sees total matching count, but accessible schemes are capped at 5."""
    db = SessionLocal()
    user = get_or_create_test_user(db, "free_citizen_sub_test@example.com")
    get_or_create_profile(db, user.id, occupation="Student", state="Maharashtra", gender="Female")
    ensure_test_schemes(db, count=8)

    token = create_access_token(user.id, user.role)
    headers = {"Authorization": f"Bearer {token}"}

    # Clean existing subscriptions
    db.query(SubscriptionRequest).filter_by(user_id=user.id).delete()
    db.commit()

    resp = client.get(
        "/api/schemes?profile_occupation=Student&profile_state=Maharashtra&profile_gender=Female",
        headers=headers
    )
    assert resp.status_code == 200
    data = resp.get_json()

    assert data["is_premium"] is False
    assert data["free_limit"] == 5
    assert data["accessible_count"] <= 5
    assert len(data["schemes"]) <= 5
    # Total matching count can be >= 5
    assert data["total_matching_count"] >= len(data["schemes"])

    # First accessible scheme details should be 200
    first_scheme_id = data["schemes"][0]["id"]
    detail_resp = client.get(
        f"/api/schemes/{first_scheme_id}?profile_occupation=Student&profile_state=Maharashtra&profile_gender=Female",
        headers=headers
    )
    assert detail_resp.status_code == 200


def test_3_free_user_locked_scheme_returns_403(client):
    """Test scheme beyond free limit returns 403 Forbidden with is_locked=True."""
    db = SessionLocal()
    user = get_or_create_test_user(db, "free_citizen_sub_test@example.com")
    token = create_access_token(user.id, user.role)
    headers = {"Authorization": f"Bearer {token}"}

    # Ensure user has no active subscriptions
    db.query(SubscriptionRequest).filter_by(user_id=user.id).delete()
    db.commit()

    # Find ranked matching schemes with the user's full profile
    ranked_matches = SchemeEligibilityService.get_ranked_schemes_for_profile(
        profile_data={
            "occupation": "Student",
            "state": "Maharashtra",
            "gender": "Female",
            "age": 22,
            "annual_income": 150000,
            "education": "Graduate",
            "category": "General",
            "is_student": True
        },
        include_ineligible=False
    )
    assert len(ranked_matches) > 5
    locked_item = ranked_matches[5] # 6th ranked scheme
    target_id = locked_item.get("slug") or locked_item.get("id")

    resp = client.get(
        f"/api/schemes/{target_id}?profile_occupation=Student&profile_state=Maharashtra&profile_gender=Female",
        headers=headers
    )
    assert resp.status_code == 403
    data = resp.get_json()
    assert data.get("is_locked") is True
    assert data.get("rank") == 6
    assert "Subscription required" in data.get("error", "")


def test_4_submit_subscription_request_workflow(client):
    """Test user submits demo subscription request, initial status is Pending, no instant activation."""
    db = SessionLocal()
    user = get_or_create_test_user(db, "free_citizen_sub_test@example.com")
    token = create_access_token(user.id, user.role)
    headers = {"Authorization": f"Bearer {token}"}

    # Clean previous requests
    db.query(SubscriptionRequest).filter_by(user_id=user.id).delete()
    db.commit()

    # Submit request for 2 months plan (₹100)
    resp = client.post(
        "/api/subscriptions/request",
        headers=headers,
        json={"plan_id": "two_months"}
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert "request" in data
    req_record = data["request"]
    assert req_record["status"] == "Pending"
    assert req_record["plan_id"] == "two_months"
    assert req_record["amount"] == 100
    assert req_record["duration_days"] == 60
    assert req_record["is_active"] is False

    # Check status endpoint
    status_resp = client.get("/api/subscriptions/my-status", headers=headers)
    assert status_resp.status_code == 200
    status_data = status_resp.get_json()
    assert status_data["is_premium"] is False
    assert status_data["has_pending_request"] is True
    assert status_data["pending_request"]["plan_id"] == "two_months"
    assert status_data["active_subscription"] is None


def test_5_duplicate_pending_request_prevented(client):
    """Test submitting duplicate pending request without resolving the existing one is blocked."""
    db = SessionLocal()
    user = get_or_create_test_user(db, "free_citizen_sub_test@example.com")
    token = create_access_token(user.id, user.role)
    headers = {"Authorization": f"Bearer {token}"}

    # Try submitting another request while previous is still pending
    resp = client.post(
        "/api/subscriptions/request",
        headers=headers,
        json={"plan_id": "monthly"}
    )
    assert resp.status_code == 400
    data = resp.get_json()
    err_text = (data.get("message", "") + " " + data.get("error", "")).lower()
    assert "pending subscription request" in err_text


def test_6_admin_access_control(client):
    """Test non-admin is blocked from admin subscription endpoints."""
    db = SessionLocal()
    user = get_or_create_test_user(db, "free_citizen_sub_test@example.com", role="citizen")
    token = create_access_token(user.id, user.role)
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to access admin subscription list
    resp = client.get("/api/admin/subscriptions", headers=headers)
    assert resp.status_code == 403


def test_7_admin_approval_activates_premium_access(client):
    """Test admin approves pending request: start/expiry recorded, user unlocked, all schemes accessible."""
    db = SessionLocal()
    user = get_or_create_test_user(db, "free_citizen_sub_test@example.com")
    admin = get_or_create_test_user(db, "super_admin_test@yojanahunter.gov.in", role="admin")

    user_token = create_access_token(user.id, user.role)
    admin_token = create_admin_token(admin.id, admin.email)

    user_headers = {"Authorization": f"Bearer {user_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin lists pending requests
    list_resp = client.get("/api/admin/subscriptions?status=pending", headers=admin_headers)
    assert list_resp.status_code == 200
    list_data = list_resp.get_json()
    assert "requests" in list_data
    assert "stats" in list_data

    target_req = next((r for r in list_data["requests"] if r["user_id"] == user.id and r["status"] == "Pending"), None)
    assert target_req is not None
    req_id = target_req["id"]

    # Admin approves
    approve_resp = client.post(
        f"/api/admin/subscriptions/{req_id}/approve",
        headers=admin_headers,
        json={"admin_notes": "Demo verification approved"}
    )
    assert approve_resp.status_code == 200
    approve_data = approve_resp.get_json()
    assert approve_data["subscription"]["status"] == "Approved"
    assert approve_data["subscription"]["is_active"] is True
    assert approve_data["subscription"]["starts_at"] is not None
    assert approve_data["subscription"]["expires_at"] is not None

    # Now verify user status reflects premium
    status_resp = client.get("/api/subscriptions/my-status", headers=user_headers)
    assert status_resp.status_code == 200
    status_data = status_resp.get_json()
    assert status_data["is_premium"] is True
    assert status_data["active_subscription"] is not None
    assert status_data["active_subscription"]["plan_id"] == "two_months"
    assert status_data["days_remaining"] is not None
    assert status_data["days_remaining"] > 0

    # User can now view all schemes without the 5-scheme cap!
    schemes_resp = client.get(
        "/api/schemes?profile_occupation=Student&profile_state=Maharashtra&profile_gender=Female",
        headers=user_headers
    )
    assert schemes_resp.status_code == 200
    schemes_data = schemes_resp.get_json()
    assert schemes_data["is_premium"] is True
    assert schemes_data["has_more"] is False
    assert len(schemes_data["schemes"]) >= 6

    # 6th scheme details are now accessible (200 OK, not 403)
    ranked_matches = SchemeEligibilityService.get_ranked_schemes_for_profile(
        profile_data={
            "occupation": "Student",
            "state": "Maharashtra",
            "gender": "Female",
            "age": 22,
            "annual_income": 150000,
            "education": "Graduate",
            "category": "General",
            "is_student": True
        },
        include_ineligible=False
    )
    locked_item = ranked_matches[5]
    target_id = locked_item.get("slug") or locked_item.get("id")
    detail_resp = client.get(
        f"/api/schemes/{target_id}?profile_occupation=Student&profile_state=Maharashtra&profile_gender=Female",
        headers=user_headers
    )
    assert detail_resp.status_code == 200
    detail_data = detail_resp.get_json()
    assert detail_data.get("is_locked", False) is False


def test_8_admin_rejection_flow(client):
    """Test admin rejects subscription request with reason, user remains on free tier."""
    db = SessionLocal()
    user2 = get_or_create_test_user(db, "user_reject_test@example.com")
    get_or_create_profile(db, user2.id, occupation="Student", state="Maharashtra", gender="Female")
    admin = get_or_create_test_user(db, "super_admin_test@yojanahunter.gov.in", role="admin")

    user_token = create_access_token(user2.id, user2.role)
    admin_token = create_admin_token(admin.id, admin.email)

    user_headers = {"Authorization": f"Bearer {user_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Clean existing
    db.query(SubscriptionRequest).filter_by(user_id=user2.id).delete()
    db.commit()

    # User submits monthly request
    submit_resp = client.post("/api/subscriptions/request", headers=user_headers, json={"plan_id": "monthly"})
    assert submit_resp.status_code == 201
    req_id = submit_resp.get_json()["request"]["id"]

    # Admin rejects
    reject_resp = client.post(
        f"/api/admin/subscriptions/{req_id}/reject",
        headers=admin_headers,
        json={"rejection_reason": "Incomplete profile test"}
    )
    assert reject_resp.status_code == 200
    reject_data = reject_resp.get_json()
    assert reject_data["subscription"]["status"] == "Rejected"
    assert reject_data["subscription"]["rejection_reason"] == "Incomplete profile test"

    # User status remains free
    status_resp = client.get("/api/subscriptions/my-status", headers=user_headers)
    assert status_resp.status_code == 200
    status_data = status_resp.get_json()
    assert status_data["is_premium"] is False
    assert status_data["latest_request"]["status"] == "Rejected"
    assert status_data["latest_request"]["rejection_reason"] == "Incomplete profile test"


def test_9_expired_subscription_automatically_reverts_to_free(client):
    """Test that expired subscriptions automatically revert to the 5-scheme limit."""
    db = SessionLocal()
    user3 = get_or_create_test_user(db, "user_expired_test@example.com")
    get_or_create_profile(db, user3.id, occupation="Student", state="Maharashtra", gender="Female")

    # Clean existing
    db.query(SubscriptionRequest).filter_by(user_id=user3.id).delete()
    db.commit()

    # Insert an expired subscription directly
    now = datetime.now(timezone.utc)
    expired_req = SubscriptionRequest(
        user_id=user3.id,
        plan_id="monthly",
        plan_name="Monthly Plan",
        amount=50,
        currency="INR",
        duration_days=30,
        status="Approved",
        requested_at=now - timedelta(days=60),
        reviewed_at=now - timedelta(days=60),
        starts_at=now - timedelta(days=60),
        expires_at=now - timedelta(days=30), # expired 30 days ago
        is_active=True
    )
    db.add(expired_req)
    db.commit()

    # Verify SubscriptionService correctly detects expiration
    is_premium = SubscriptionService.is_user_premium(db, user3.id)
    assert is_premium is False

    # Check via API
    user_token = create_access_token(user3.id, user3.role)
    user_headers = {"Authorization": f"Bearer {user_token}"}

    status_resp = client.get("/api/subscriptions/my-status", headers=user_headers)
    assert status_resp.status_code == 200
    assert status_resp.get_json()["is_premium"] is False

    # Schemes endpoint enforces free limit
    schemes_resp = client.get(
        "/api/schemes?profile_occupation=Student&profile_state=Maharashtra&profile_gender=Female",
        headers=user_headers
    )
    assert schemes_resp.status_code == 200
    data = schemes_resp.get_json()
    assert data["is_premium"] is False
    assert data["free_limit"] == 5
    assert len(data["schemes"]) <= 5
