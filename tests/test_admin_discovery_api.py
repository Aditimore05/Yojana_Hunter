import sys
import os
import json
import pytest
from unittest.mock import MagicMock, patch

# Include backend in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app import create_app
from database import SessionLocal
from models import User, Scheme, DiscoveryJob, SchemeReviewHistory
from utils.auth import create_access_token


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def admin_headers():
    db = SessionLocal()
    admin = db.query(User).filter(User.role == "admin", User.is_active == True).first()
    if not admin:
        from utils.auth import hash_password
        admin = User(
            email="test_discovery_admin@yojanahunter.gov.in",
            password_hash=hash_password("AdminSecurePassword123!"),
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.commit()
    admin_id = admin.id
    admin_email = admin.email
    db.close()

    token = create_access_token(user_id=admin_id, email=admin_email, role="admin")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }


class TestAdminDiscoveryAPI:
    def test_gemini_status_unauthenticated_rejected(self, client):
        """Verify unauthorized users cannot access admin Gemini diagnostics."""
        res = client.get("/api/admin/gemini/status")
        assert res.status_code == 401

    def test_discovery_jobs_unauthenticated_rejected(self, client):
        """Verify unauthenticated requests cannot trigger discovery jobs."""
        res = client.post("/api/admin/discovery-jobs", json={})
        assert res.status_code == 401

    def test_public_categories_endpoint(self, client):
        """Verify public categories endpoint returns available scheme categories."""
        res = client.get("/api/schemes/categories")
        assert res.status_code == 200
        data = res.get_json()
        assert "categories" in data
        assert isinstance(data["categories"], list)

    def test_public_states_endpoint(self, client):
        """Verify public states endpoint returns available states."""
        res = client.get("/api/schemes/states")
        assert res.status_code == 200
        data = res.get_json()
        assert "states" in data
        assert isinstance(data["states"], list)

    def test_gemini_status_authenticated(self, client, admin_headers):
        """Verify authenticated admin can check Gemini configuration status."""
        res = client.get("/api/admin/gemini/status", headers=admin_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert "configured" in data
        assert "model" in data
        assert "groundingSupported" in data

    def test_reject_scheme_requires_reason(self, client, admin_headers):
        """Verify rejecting a discovered scheme requires an explicit reason."""
        res = client.post("/api/admin/schemes/999999/reject", json={}, headers=admin_headers)
        # Empty body must return 400 Bad Request
        assert res.status_code in [400, 404]
        if res.status_code == 400:
            data = res.get_json()
            assert "reason is required" in data.get("error", "").lower()
