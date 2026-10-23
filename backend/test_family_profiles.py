import unittest
import json
from app import create_app
from database import SessionLocal
from models import User, Profile, Scheme
from services.eligibility_service import SchemeEligibilityService

class TestFamilyProfilesMultiLogin(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.db = SessionLocal()

        # Create or fetch test user
        self.test_email = "family_tester@yojana.gov.in"
        user = self.db.query(User).filter(User.email == self.test_email).first()
        if not user:
            user = User(
                email=self.test_email,
                password_hash="mock_hash_for_test",
                role="citizen",
                is_active=True
            )
            self.db.add(user)
            self.db.commit()
        self.user = user

        # Clear existing profiles for this test user
        self.db.query(Profile).filter(Profile.user_id == user.id).delete()
        self.db.commit()

        # Generate auth token
        from utils.auth import create_access_token
        self.token = create_access_token(self.user.id, self.user.email, self.user.role)
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def tearDown(self):
        self.db.query(Profile).filter(Profile.user_id == self.user.id).delete()
        self.db.commit()
        self.db.close()

    def test_create_and_list_multiple_family_profiles(self):
        """Verify multiple family profiles can be created and listed under single user."""
        # 1. Create Self Profile
        res = self.client.post("/api/profiles", headers=self.headers, json={
            "relationship": "Self",
            "name": "Ramesh Verma",
            "age": 28,
            "gender": "Male",
            "occupation": "Shopkeeper",
            "state": "Maharashtra",
            "district": "Pune",
            "annualIncome": "2.5 – 5 Lakh",
            "incomeNumeric": 350000,
            "education": "Graduate (B.Com)",
            "category": "OBC"
        })
        self.assertEqual(res.status_code, 201)
        self_id = res.get_json()["id"]

        # 2. Create Father Profile (Elderly Farmer)
        res = self.client.post("/api/profiles", headers=self.headers, json={
            "relationship": "Father",
            "name": "Ramlal Verma",
            "age": 62,
            "gender": "Male",
            "occupation": "Farmer",
            "isFarmer": True,
            "landHoldingAcres": 2.5,
            "state": "Maharashtra",
            "district": "Pune",
            "annualIncome": "< 1 Lakh",
            "incomeNumeric": 80000,
            "education": "10th Pass",
            "category": "OBC"
        })
        self.assertEqual(res.status_code, 201)
        father_id = res.get_json()["id"]

        # 3. Create Mother Profile (Homemaker)
        res = self.client.post("/api/profiles", headers=self.headers, json={
            "relationship": "Mother",
            "name": "Sunita Verma",
            "age": 58,
            "gender": "Female",
            "occupation": "Homemaker",
            "state": "Maharashtra",
            "district": "Pune",
            "annualIncome": "< 1 Lakh",
            "incomeNumeric": 50000,
            "education": "8th Pass",
            "category": "OBC"
        })
        self.assertEqual(res.status_code, 201)
        mother_id = res.get_json()["id"]

        # 4. Create Child Profile (Student)
        res = self.client.post("/api/profiles", headers=self.headers, json={
            "relationship": "Child",
            "name": "Aarav Verma",
            "age": 16,
            "gender": "Male",
            "occupation": "Student",
            "isStudent": True,
            "education": "10th Pass",
            "state": "Maharashtra",
            "district": "Pune",
            "annualIncome": "< 1 Lakh",
            "incomeNumeric": 0,
            "category": "OBC"
        })
        self.assertEqual(res.status_code, 201)
        child_id = res.get_json()["id"]

        # 5. List all profiles via GET /api/profiles/all
        res = self.client.get("/api/profiles/all", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["count"], 4)
        
        relationships = [p["relationship"] for p in data["profiles"]]
        self.assertIn("Self", relationships)
        self.assertIn("Father", relationships)
        self.assertIn("Mother", relationships)
        self.assertIn("Child", relationships)

        # Self must be first
        self.assertEqual(data["profiles"][0]["relationship"], "Self")

    def test_scheme_eligibility_isolation_between_family_members(self):
        """Verify scheme eligibility is calculated strictly using selected family member's profile."""
        # Create Father (Farmer, 62 yrs, UP)
        res_father = self.client.post("/api/profiles", headers=self.headers, json={
            "relationship": "Father",
            "name": "Kisan Dad",
            "age": 62,
            "gender": "Male",
            "occupation": "Farmer",
            "isFarmer": True,
            "landHoldingAcres": 2.0,
            "state": "Uttar Pradesh",
            "annualIncome": "< 1 Lakh",
            "education": "Primary School",
            "category": "General"
        })
        father_id = res_father.get_json()["id"]

        # Create Child (Student, 17 yrs, UP)
        res_child = self.client.post("/api/profiles", headers=self.headers, json={
            "relationship": "Child",
            "name": "Student Kid",
            "age": 17,
            "gender": "Female",
            "occupation": "Student",
            "isStudent": True,
            "state": "Uttar Pradesh",
            "annualIncome": "< 1 Lakh",
            "education": "10th Pass",
            "category": "General"
        })
        child_id = res_child.get_json()["id"]

        # Fetch schemes for Father
        res_f_schemes = self.client.get(f"/api/schemes?profile_id={father_id}&filter=eligible", headers=self.headers)
        self.assertEqual(res_f_schemes.status_code, 200)
        father_schemes = res_f_schemes.get_json().get("schemes", [])

        # Fetch schemes for Child
        res_c_schemes = self.client.get(f"/api/schemes?profile_id={child_id}&filter=eligible", headers=self.headers)
        self.assertEqual(res_c_schemes.status_code, 200)
        child_schemes = res_c_schemes.get_json().get("schemes", [])

        # Check farmer schemes vs student schemes
        father_names = [s["name"].lower() for s in father_schemes]
        child_names = [s["name"].lower() for s in child_schemes]

        # Father should have agricultural/farmer schemes (e.g. PM-Kisan) and 0 student scholarships
        has_farmer_scheme = any("kisan" in name or "farmer" in name or "agri" in name or "krishi" in name for name in father_names)
        self.assertTrue(has_farmer_scheme, f"Father should receive farmer schemes: {father_names}")

        has_student_only_in_father = any("scholarship" in name for name in father_names)
        self.assertFalse(has_student_only_in_father, "Father should NOT receive student scholarships")

        # Child should have student/education schemes and NO PM-Kisan (requires land/farming)
        has_pm_kisan_in_child = any("pm-kisan" in name or "pm kisan" in name for name in child_names)
        self.assertFalse(has_pm_kisan_in_child, "Child student should NOT receive PM-Kisan farmer scheme")

if __name__ == "__main__":
    unittest.main()
