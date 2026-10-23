import sys
import os
import pytest

# Point to local sqlite database file for tests before any backend modules are imported
test_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "test_temp.db"))
if os.path.exists(test_db_path):
    try:
        os.remove(test_db_path)
    except Exception:
        pass

os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path}"

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from database import engine, Base, SessionLocal
import models
from models import User, Scheme, Profile
from utils.auth import hash_password, create_admin_token
from app import create_app

@pytest.fixture(scope="session")
def test_app():
    Base.metadata.create_all(bind=engine)
    app = create_app()
    app.config["TESTING"] = True
    yield app
    # Teardown
    SessionLocal.remove()
    if os.path.exists(test_db_path):
        try:
            os.remove(test_db_path)
        except Exception:
            pass

@pytest.fixture(scope="session")
def client(test_app):
    return test_app.test_client()

@pytest.fixture(scope="session", autouse=True)
def init_data(test_app):
    db = SessionLocal()

    admin = db.query(User).filter(User.email == "testadmin@yojanahunter.gov.in").first()
    if not admin:
        admin = User(
            email="testadmin@yojanahunter.gov.in",
            mobile="9999999999",
            password_hash=hash_password("AdminSecurePassword123!"),
            role="admin",
            is_active=True
        )
        db.add(admin)
    else:
        admin.password_hash = hash_password("AdminSecurePassword123!")
        admin.role = "admin"
        admin.is_active = True

    citizen = db.query(User).filter(User.email == "citizen@example.com").first()
    if not citizen:
        citizen = User(
            email="citizen@example.com",
            mobile="8888888888",
            password_hash=hash_password("CitizenPass123!"),
            role="citizen",
            is_active=True
        )
        db.add(citizen)
        db.flush()

        profile = Profile(
            user_id=citizen.id,
            full_name="Citizen Tester",
            age=22,
            gender="Female",
            occupation="Student",
            annual_income="< 1 Lakh",
            income_numeric=85000,
            education="Graduate",
            state="Maharashtra"
        )
        db.add(profile)
    else:
        citizen.password_hash = hash_password("CitizenPass123!")
        citizen.role = "citizen"
        citizen.is_active = True

    db.commit()
    db.close()

def test_admin_login_success(client):
    """Test 1: Admin logs in successfully with valid credentials."""
    resp = client.post("/api/admin/login", json={
        "email": "testadmin@yojanahunter.gov.in",
        "password": "AdminSecurePassword123!"
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert "token" in data
    assert data["user"]["email"] == "testadmin@yojanahunter.gov.in"
    assert data["user"]["role"] == "admin"

def test_admin_login_invalid_credentials(client):
    """Test 2: Invalid password and non-existent users are rejected."""
    # Wrong password
    resp = client.post("/api/admin/login", json={
        "email": "testadmin@yojanahunter.gov.in",
        "password": "WrongPassword!"
    })
    assert resp.status_code == 401
    assert "Invalid credentials" in resp.get_json()["error"]

    # Citizen trying to login as admin
    resp = client.post("/api/admin/login", json={
        "email": "citizen@example.com",
        "password": "CitizenPass123!"
    })
    assert resp.status_code == 401

def test_unauthenticated_requests_rejected(client):
    """Test 3: Unauthenticated requests to admin endpoints return 401."""
    resp = client.get("/api/admin/dashboard")
    assert resp.status_code == 401

    resp = client.get("/api/admin/schemes")
    assert resp.status_code == 401

    resp = client.post("/api/admin/schemes", json={})
    assert resp.status_code == 401

def test_admin_scheme_management_workflow(client):
    """Test 4-11: Complete scheme management workflow (create, draft, publish, view, edit, archive, delete)."""
    login_resp = client.post("/api/admin/login", json={
        "email": "testadmin@yojanahunter.gov.in",
        "password": "AdminSecurePassword123!"
    })
    token = login_resp.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_payload = {
        "name": "Pradhan Mantri Yuva Sambal Yojana",
        "shortDescription": "Financial stipend and skill mentorship for youth",
        "description": "Comprehensive skill training and monthly stipend of ₹5,000 for 12 months for underprivileged students.",
        "category": "Youth & Education",
        "department": "Ministry of Youth Affairs and Sports",
        "level": "Central Scheme",
        "state": "All India",
        "benefits": "₹5,000 per month stipend + Certification",
        "officialUrl": "https://yuvasambal.gov.in",
        "applicationUrl": "https://apply.yuvasambal.gov.in",
        "sourceUrl": "https://pib.gov.in/yuva",
        "status": "draft",
        "ageMin": 18,
        "ageMax": 28,
        "incomeMax": 300000,
        "education": "Graduate",
        "requiredDocuments": ["Aadhaar Card", "Income Certificate", "Degree Certificate"]
    }

    # Step 4: Admin creates draft scheme
    create_resp = client.post("/api/admin/schemes", json=create_payload, headers=headers)
    assert create_resp.status_code == 201
    data = create_resp.get_json()["scheme"]
    assert data["name"] == "Pradhan Mantri Yuva Sambal Yojana"
    assert data["status"] == "draft"
    assert data["isActive"] == False

    scheme_slug = data["slug"]

    # Step 5: Scheme appears in admin scheme list
    list_resp = client.get("/api/admin/schemes", headers=headers)
    assert list_resp.status_code == 200
    admin_schemes = list_resp.get_json()
    assert any(s["slug"] == scheme_slug for s in admin_schemes)

    # Step 6: Draft scheme is HIDDEN from public users
    pub_list_resp = client.get("/api/schemes?q=Yuva Sambal")
    assert pub_list_resp.status_code == 200
    pub_json = pub_list_resp.get_json()
    public_schemes = pub_json.get("schemes", pub_json) if isinstance(pub_json, dict) else pub_json
    assert not any(s.get("id") == scheme_slug or s.get("slug") == scheme_slug for s in public_schemes)

    pub_detail_resp = client.get(f"/api/schemes/{scheme_slug}")
    assert pub_detail_resp.status_code == 404

    # Step 7: Admin publishes the scheme
    patch_resp = client.patch(f"/api/admin/schemes/{scheme_slug}/status", json={"status": "published"}, headers=headers)
    assert patch_resp.status_code == 200
    assert patch_resp.get_json()["status"] == "published"
    assert patch_resp.get_json()["isActive"] == True

    # Step 8: Published scheme now APPEARS on public scheme listing and details
    pub_list_after = client.get("/api/schemes?q=Yuva Sambal")
    assert pub_list_after.status_code == 200
    pub_after_json = pub_list_after.get_json()
    public_schemes_after = pub_after_json.get("schemes", pub_after_json) if isinstance(pub_after_json, dict) else pub_after_json
    assert any(s.get("id") == scheme_slug or s.get("slug") == scheme_slug for s in public_schemes_after)

    pub_detail_after = client.get(f"/api/schemes/{scheme_slug}")
    assert pub_detail_after.status_code == 200
    detail_data = pub_detail_after.get_json()
    assert detail_data["name"] == "Pradhan Mantri Yuva Sambal Yojana"
    assert detail_data["benefit"] == "₹5,000 per month stipend + Certification"

    # Step 9: Edits persist after updating
    edit_resp = client.put(f"/api/admin/schemes/{scheme_slug}", json={
        "benefits": "₹6,000 per month stipend + Free Laptop",
        "description": "Updated full description with enhanced laptop benefit."
    }, headers=headers)
    assert edit_resp.status_code == 200
    assert edit_resp.get_json()["scheme"]["benefits"] == "₹6,000 per month stipend + Free Laptop"

    # Verify update is reflected on public details
    pub_detail_updated = client.get(f"/api/schemes/{scheme_slug}")
    assert pub_detail_updated.get_json()["benefit"] == "₹6,000 per month stipend + Free Laptop"

    # Step 10: Admin archives scheme, verified that it is hidden from public
    archive_resp = client.patch(f"/api/admin/schemes/{scheme_slug}/status", json={"status": "archived"}, headers=headers)
    assert archive_resp.status_code == 200
    assert archive_resp.get_json()["status"] == "archived"

    pub_detail_archived = client.get(f"/api/schemes/{scheme_slug}")
    assert pub_detail_archived.status_code == 404

    # Step 11: Verify Admin Dashboard counts reflect real DB values
    dash_resp = client.get("/api/admin/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    stats = dash_resp.get_json()
    assert stats["totalSchemes"] >= 1
    assert stats["archivedSchemes"] >= 1

    # Step 12: Admin deletes scheme
    del_resp = client.delete(f"/api/admin/schemes/{scheme_slug}", headers=headers)
    assert del_resp.status_code == 200
    assert client.get(f"/api/admin/schemes/{scheme_slug}", headers=headers).status_code == 404
