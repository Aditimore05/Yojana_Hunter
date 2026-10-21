import sys
import os
import pytest

# Setup backend in path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from services.eligibility_service import SchemeEligibilityService
from models import Scheme, SchemeRule, Profile, User
from utils.auth import hash_password, create_admin_token
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
# 10 SCENARIO TESTS: Personalized Scheme Filtering
# =========================================================================

def test_scenario_1_student_does_not_receive_farmer_schemes():
    """Scenario 1: Student profile does not receive farmer-specific schemes."""
    farmer_scheme = Scheme(
        id=901,
        slug="pm-kisan-demo",
        name="PM Kisan Samman Nidhi",
        category="Agriculture",
        state="All India",
        is_farmer_only=True,
        target_occupations=["Farmer"],
        is_active=True,
        status="published"
    )

    student_profile = {
        "occupation": "Student",
        "is_student": True,
        "is_farmer": False,
        "state": "Maharashtra",
        "age": 21,
        "annual_income": "< 1 Lakh",
        "income_numeric": 95000
    }

    is_relevant, rejection_reason, match_reason = SchemeEligibilityService.is_scheme_relevant(
        farmer_scheme, student_profile
    )
    assert is_relevant is False
    assert rejection_reason is not None
    assert "farmer" in rejection_reason.lower()


def test_scenario_2_farmer_does_not_receive_student_schemes():
    """Scenario 2: Farmer profile does not receive student-specific schemes."""
    student_scheme = Scheme(
        id=902,
        slug="pm-vidyalakshmi-demo",
        name="PM Vidyalakshmi Scheme",
        category="Education",
        state="All India",
        is_student_only=True,
        target_occupations=["Student"],
        is_active=True,
        status="published"
    )

    farmer_profile = {
        "occupation": "Farmer",
        "is_farmer": True,
        "is_student": False,
        "state": "Uttar Pradesh",
        "age": 35,
        "annual_income": "1 - 3 Lakh",
        "income_numeric": 180000
    }

    is_relevant, rejection_reason, match_reason = SchemeEligibilityService.is_scheme_relevant(
        student_scheme, farmer_profile
    )
    assert is_relevant is False
    assert rejection_reason is not None
    assert "student" in rejection_reason.lower()


def test_scenario_3_multi_group_scheme_matches_either_student_or_farmer():
    """Scenario 3: A scheme covering both students and farmers matches either."""
    multi_scheme = Scheme(
        id=903,
        slug="skill-india-demo",
        name="Skill India Mission Training",
        category="Skill Development",
        state="All India",
        target_occupations=["Student", "Farmer", "Youth", "Unemployed"],
        target_beneficiary_groups=["Youth", "Students", "Farmers", "Job Seekers"],
        is_active=True,
        status="published"
    )

    student_profile = {
        "occupation": "Student",
        "is_student": True,
        "state": "Maharashtra",
        "age": 21
    }
    farmer_profile = {
        "occupation": "Farmer",
        "is_farmer": True,
        "state": "Punjab",
        "age": 32
    }

    is_rel_student, rej_student, match_student = SchemeEligibilityService.is_scheme_relevant(
        multi_scheme, student_profile
    )
    is_rel_farmer, rej_farmer, match_farmer = SchemeEligibilityService.is_scheme_relevant(
        multi_scheme, farmer_profile
    )

    assert is_rel_student is True
    assert match_student is not None
    assert is_rel_farmer is True
    assert match_farmer is not None


def test_scenario_4_state_specific_scheme_excluded_for_outside_residents():
    """Scenario 4: State-specific schemes are excluded for users outside that state."""
    mh_scheme = Scheme(
        id=904,
        slug="mjp-jan-arogya-demo",
        name="Mahatma Jyotirao Phule Jan Arogya Yojana",
        category="Health & Wellness",
        level="State Scheme",
        state="Maharashtra",
        eligible_states=["Maharashtra"],
        target_occupations=["All"],
        is_active=True,
        status="published"
    )

    up_profile = {
        "occupation": "Salaried Employee",
        "state": "Uttar Pradesh",
        "age": 29
    }
    mh_profile = {
        "occupation": "Salaried Employee",
        "state": "Maharashtra",
        "age": 29
    }

    is_rel_up, rej_up, _ = SchemeEligibilityService.is_scheme_relevant(mh_scheme, up_profile)
    is_rel_mh, _, match_mh = SchemeEligibilityService.is_scheme_relevant(mh_scheme, mh_profile)

    assert is_rel_up is False
    assert "Maharashtra" in rej_up
    assert is_rel_mh is True
    assert "Maharashtra" in match_mh or "profile" in match_mh


def test_scenario_5_age_and_income_restrictions_respected():
    """Scenario 5: Age and income restrictions are respected when verified."""
    youth_scholarship = Scheme(
        id=905,
        slug="youth-post-matric",
        name="Post Matric Higher Education Support",
        category="Education",
        state="All India",
        age_min=17,
        age_max=25,
        income_max=250000,
        target_occupations=["Student"],
        is_student_only=True,
        is_active=True,
        status="published"
    )

    # Over age (age 30 > 25)
    over_age_student = {
        "occupation": "Student",
        "is_student": True,
        "age": 30,
        "income_numeric": 120000,
        "state": "Delhi"
    }
    is_rel_age, rej_age, _ = SchemeEligibilityService.is_scheme_relevant(youth_scholarship, over_age_student)
    assert is_rel_age is False
    assert "Age restriction" in rej_age

    # Over income (income 400000 > 250000)
    over_income_student = {
        "occupation": "Student",
        "is_student": True,
        "age": 21,
        "income_numeric": 400000,
        "state": "Delhi"
    }
    is_rel_inc, rej_inc, _ = SchemeEligibilityService.is_scheme_relevant(youth_scholarship, over_income_student)
    assert is_rel_inc is False
    assert "Income restriction" in rej_inc


def test_scenario_6_incomplete_information_does_not_claim_false_eligibility():
    """Scenario 6: Unknown information does not produce false eligibility claims."""
    scheme = Scheme(
        id=906,
        slug="pm-vidyalakshmi-thorough",
        name="PM Vidyalakshmi Scheme",
        category="Education",
        state="All India",
        age_min=18,
        age_max=30,
        income_max=800000,
        education="12th Pass",
        target_occupations=["Student"],
        is_student_only=True,
        is_active=True,
        status="published"
    )

    # Profile lacks education and income details
    incomplete_student = {
        "occupation": "Student",
        "is_student": True,
        "state": "Maharashtra",
        "age": 21
    }

    eval_result = SchemeEligibilityService.evaluate_scheme_for_profile(scheme, incomplete_student)

    # Must NOT claim 100% eligible
    assert eval_result["eligibility_status"] == SchemeEligibilityService.STATUS_POSSIBLY_ELIGIBLE
    assert len(eval_result["missing_information"]) > 0
    # Explanation must clearly warn that verification is still required
    assert "Eligibility still requires verification" in eval_result["why_matched"]


def test_scenario_7_relevant_schemes_displayed_across_different_categories():
    """Scenario 7: Relevant schemes are displayed across different valid categories for matching profiles."""
    db = SessionLocal()
    try:
        student_schemes = SchemeEligibilityService.get_ranked_schemes_for_profile(
            profile_data={
                "occupation": "Student",
                "is_student": True,
                "is_farmer": False,
                "state": "Maharashtra",
                "age": 21,
                "income_numeric": 95000,
                "education": "B.E. (Final Year)"
            },
            include_ineligible=False
        )
        assert len(student_schemes) > 0
        categories = {s["category"] for s in student_schemes}
        # A student can receive Education, Skill Development, Health, and Social Welfare schemes
        assert "Education" in categories

        # No agricultural farmer-only schemes should appear for student
        for s in student_schemes:
            assert s["category"] != "Agriculture" or s.get("target_occupations") != ["Farmer"]
            assert not s.get("isFarmerOnly")
    finally:
        db.close()


def test_scenario_8_unapproved_and_inactive_schemes_never_returned():
    """Scenario 8: Unapproved or inactive schemes are never returned to citizens."""
    draft_scheme = Scheme(
        id=908,
        slug="draft-scholarship",
        name="Draft Scholarship Proposal",
        category="Education",
        state="All India",
        target_occupations=["Student"],
        is_active=True,
        status="draft"
    )
    inactive_scheme = Scheme(
        id=909,
        slug="inactive-scholarship",
        name="Discontinued Scholarship Scheme",
        category="Education",
        state="All India",
        target_occupations=["Student"],
        is_active=False,
        status="published"
    )

    profile = {"occupation": "Student", "is_student": True, "state": "Maharashtra", "age": 21}

    is_rel_draft, rej_draft, _ = SchemeEligibilityService.is_scheme_relevant(draft_scheme, profile)
    is_rel_inactive, rej_inactive, _ = SchemeEligibilityService.is_scheme_relevant(inactive_scheme, profile)

    assert is_rel_draft is False
    assert is_rel_inactive is False


def test_scenario_9_empty_or_invalid_profile_does_not_bypass_filtering(client):
    """Scenario 9: Empty or invalid profile does not bypass filtering (returns empty list)."""
    # Empty dictionary profile
    empty_res = SchemeEligibilityService.get_ranked_schemes_for_profile(
        profile_data={},
        include_ineligible=False
    )
    assert empty_res == []

    # API call with explicit empty query parameter
    resp = client.get("/api/schemes?empty_profile=true")
    assert resp.status_code == 200
    data = resp.get_json()
    schemes_data = data.get("schemes", data) if isinstance(data, dict) else data
    assert schemes_data == []


def test_scenario_10_search_and_profile_updates_preserve_filtering(client):
    """Scenario 10: Search and profile updates preserve filtering rules via API."""
    # 1. Calling schemes with student profile override
    student_resp = client.get("/api/schemes?profile_occupation=Student&profile_state=Maharashtra&profile_is_student=true&profile_is_farmer=false")
    assert student_resp.status_code == 200
    res1 = student_resp.get_json()
    student_schemes = res1.get("schemes", res1) if isinstance(res1, dict) else res1
    assert len(student_schemes) > 0
    # None of the schemes should be farmer-only
    for s in student_schemes:
        assert s.get("isFarmerOnly") is not True

    # 2. Search query within student profile preserves filtering
    search_resp = client.get("/api/schemes?profile_occupation=Student&q=Scholarship")
    assert search_resp.status_code == 200
    res2 = search_resp.get_json()
    search_schemes = res2.get("schemes", res2) if isinstance(res2, dict) else res2
    for s in search_schemes:
        full_text = f"{s['name']} {s.get('shortDescription', '')} {s.get('description', '')} {s.get('benefits', '')}".lower()
        assert "scholarship" in full_text

    # 3. Switching profile to Farmer via API excludes student schemes
    farmer_resp = client.get("/api/schemes?profile_occupation=Farmer&profile_state=Uttar+Pradesh&profile_is_farmer=true&profile_is_student=false")
    assert farmer_resp.status_code == 200
    res3 = farmer_resp.get_json()
    farmer_schemes = res3.get("schemes", res3) if isinstance(res3, dict) else res3
    assert len(farmer_schemes) > 0
    for s in farmer_schemes:
        assert s.get("isStudentOnly") is not True
