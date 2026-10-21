import sys
import os
import pytest

# Setup backend in path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from services.eligibility_service import SchemeEligibilityService
from models import Scheme, SchemeRule, Profile, User
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


# =========================================================================
# 1. Unit Tests for genders_match
# =========================================================================

def test_genders_match_basic():
    # genders_match(user_gender, target_gender)
    assert SchemeEligibilityService.genders_match("Male", "Male") is True
    assert SchemeEligibilityService.genders_match("Female", "Female") is True
    assert SchemeEligibilityService.genders_match("Male", "All") is True
    assert SchemeEligibilityService.genders_match("Female", "Any") is True
    assert SchemeEligibilityService.genders_match("Male", None) is True
    assert SchemeEligibilityService.genders_match("Male", "Female") is False
    assert SchemeEligibilityService.genders_match("Female", "Male") is False

def test_genders_match_multilingual_tokens():
    # Marathi / Hindi tokens: genders_match(user_gender, target_gender)
    assert SchemeEligibilityService.genders_match("महिला", "Female") is True
    assert SchemeEligibilityService.genders_match("स्त्री", "Female") is True
    assert SchemeEligibilityService.genders_match("Female", "महिला") is True
    assert SchemeEligibilityService.genders_match("पुरुष", "Male") is True
    assert SchemeEligibilityService.genders_match("Male", "पुरुष") is True
    assert SchemeEligibilityService.genders_match("तृतीयपंथी", "Transgender") is True
    assert SchemeEligibilityService.genders_match("पुरुष", "Female") is False
    assert SchemeEligibilityService.genders_match("Female", "पुरुष") is False


# =========================================================================
# 2. Scheme Relevance: Exclusion of Women & Child schemes for Male users
# =========================================================================

def test_male_user_cannot_access_female_schemes():
    """Male citizen must NOT be offered female schemes or Women & Child schemes."""
    female_scheme = Scheme(
        id=8801,
        slug="ladki-bahin-test",
        name="Mukhyamantri Majhi Ladki Bahin Yojana",
        category="Women & Child",
        gender="Female",
        state="Maharashtra",
        is_active=True,
        admin_review_status="approved",
        status="published"
    )

    male_profile = {
        "gender": "Male",
        "occupation": "Farmer",
        "state": "Maharashtra",
        "age": 35,
        "annual_income": "< 1 Lakh",
        "income_numeric": 75000,
        "caste_category": "General"
    }

    is_rel, rej_reason, _ = SchemeEligibilityService.is_scheme_relevant(female_scheme, male_profile)
    assert is_rel is False
    assert "female beneficiaries" in rej_reason.lower()

def test_male_user_cannot_access_women_and_child_category():
    """Category 'Women & Child' scheme without explicit gender must also be excluded for adult male."""
    women_child_scheme = Scheme(
        id=8802,
        slug="women-empowerment-test",
        name="Mahila Sakshamikaran Yojana",
        category="Women & Child",
        gender="All",  # Even if mislabeled as All
        state="Maharashtra",
        is_active=True,
        admin_review_status="approved",
        status="published"
    )

    male_profile = {
        "gender": "Male",
        "occupation": "Self-Employed",
        "state": "Maharashtra",
        "age": 30,
        "annual_income": "1-3 Lakhs"
    }

    is_rel, rej_reason, _ = SchemeEligibilityService.is_scheme_relevant(women_child_scheme, male_profile)
    assert is_rel is False
    assert "women & child" in rej_reason.lower() or "female" in rej_reason.lower()

def test_female_user_can_access_female_and_women_child_schemes():
    """Female citizen CAN access female schemes and Women & Child schemes."""
    female_scheme = Scheme(
        id=8803,
        slug="ladki-bahin-test-2",
        name="Mukhyamantri Majhi Ladki Bahin Yojana",
        category="Women & Child",
        gender="Female",
        state="Maharashtra",
        is_active=True,
        admin_review_status="approved",
        status="published"
    )

    female_profile = {
        "gender": "Female",
        "occupation": "Homemaker",
        "state": "Maharashtra",
        "age": 28,
        "annual_income": "< 1 Lakh",
        "income_numeric": 80000,
        "caste_category": "General"
    }

    is_rel, rej_reason, _ = SchemeEligibilityService.is_scheme_relevant(female_scheme, female_profile)
    assert is_rel is True
    assert rej_reason is None


# =========================================================================
# 3. Rule Evaluation: Transparent Disqualification for Male on Female Scheme
# =========================================================================

def test_evaluate_scheme_for_profile_mandatory_failure_on_gender():
    female_scheme = Scheme(
        id=8804,
        slug="pragati-scholarship-test",
        name="AICTE Pragati Scholarship for Girls",
        category="Education & Learning",
        gender="Female",
        state="All India",
        is_student_only=True,
        is_active=True,
        admin_review_status="approved",
        status="published"
    )

    male_student = {
        "gender": "Male",
        "occupation": "Student",
        "is_student": True,
        "state": "Maharashtra",
        "age": 20,
        "annual_income": "< 1 Lakh",
        "income_numeric": 60000
    }

    eval_result = SchemeEligibilityService.evaluate_scheme_for_profile(female_scheme, male_student)
    assert eval_result["eligibility_status"] == "not_eligible"
    assert eval_result["legacy_status"] == "ineligible"

    # Verify gender criterion failed in breakdown
    gender_criteria = [c for c in eval_result["criteria"] if c["id"] == "c_gender"]
    assert len(gender_criteria) > 0
    assert gender_criteria[0]["passed"] is False


# =========================================================================
# 4. API Integration Tests: Profile Normalization & Matching
# =========================================================================

def test_profile_update_normalizes_gender(client):
    res = client.put("/api/profile", json={
        "gender": "पुरुष",
        "age": 32,
        "state": "Maharashtra",
        "occupation": "Farmer"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["gender"] == "Male"

def test_schemes_match_excludes_female_schemes_for_male(client):
    res = client.post("/api/schemes/match", json={
        "profile": {
            "gender": "Male",
            "age": 28,
            "state": "Maharashtra",
            "occupation": "Farmer",
            "annual_income": "< 1 Lakh",
            "income_numeric": 75000,
            "caste_category": "General"
        },
        "include_ineligible": False
    })
    assert res.status_code == 200
    data = res.get_json()
    eligible = data.get("eligible", [])

    # None of the eligible schemes should be Women & Child or target Female
    for s in eligible:
        assert s.get("category") != "Women & Child", f"Male user received Women & Child scheme: {s.get('name')}"
        assert str(s.get("gender", "")).lower() != "female", f"Male user received female scheme: {s.get('name')}"

def test_schemes_match_includes_female_schemes_for_female(client):
    res = client.post("/api/schemes/match", json={
        "profile": {
            "gender": "Female",
            "age": 28,
            "state": "Maharashtra",
            "occupation": "Homemaker",
            "annual_income": "< 1 Lakh",
            "income_numeric": 75000,
            "caste_category": "General"
        },
        "include_ineligible": False
    })
    assert res.status_code == 200
    data = res.get_json()
    eligible = data.get("eligible", [])
    categories = [s.get("category") for s in eligible]

    # Female user in Maharashtra should receive Women & Child schemes (e.g. Majhi Ladki Bahin)
    assert any("Women" in (c or "") for c in categories), f"Female user did not receive Women & Child scheme. Categories received: {categories}"
