import unittest
import requests
import uuid

BASE_URL = "http://127.0.0.1:5000/api"

class TestNewRequirements(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            res = requests.get(f"{BASE_URL}/health", timeout=3)
            if res.status_code != 200:
                raise unittest.SkipTest("Backend not accessible")
        except Exception as e:
            raise unittest.SkipTest(f"Live backend server not reachable: {e}")

    def test_01_new_user_registration_fresh_blank_profile(self):
        """Requirement 1: Every new user starts with a fresh, blank profile without reusing previous user details."""
        email1 = f"user1_{uuid.uuid4().hex[:8]}@example.com"
        reg1 = requests.post(f"{BASE_URL}/auth/register", json={
            "name": "User One",
            "email": email1,
            "password": "Password123!"
        }).json()
        token1 = reg1["token"]
        h1 = {"Authorization": f"Bearer {token1}"}

        # User 1 sets extensive profile details
        requests.put(f"{BASE_URL}/profile", json={
            "name": "User One Patil",
            "occupation": "Farmer",
            "state": "Maharashtra",
            "age": 45,
            "annualIncome": "₹1,50,000",
            "incomeNumeric": 150000,
            "category": "OBC"
        }, headers=h1)

        # Now register a brand new User 2
        email2 = f"user2_{uuid.uuid4().hex[:8]}@example.com"
        reg2 = requests.post(f"{BASE_URL}/auth/register", json={
            "name": "User Two",
            "email": email2,
            "password": "Password123!"
        }).json()
        token2 = reg2["token"]
        h2 = {"Authorization": f"Bearer {token2}"}

        # Check User 2 profile returned at registration
        prof2_reg = reg2["profile"]
        self.assertEqual(prof2_reg["name"], "User Two")
        self.assertFalse(prof2_reg["occupation"])
        self.assertFalse(prof2_reg["state"])
        self.assertEqual(prof2_reg["age"], 0)
        self.assertEqual(prof2_reg["completenessPercent"], 0)
        self.assertFalse(prof2_reg["isProfileSaved"])

        # Check User 2 profile via GET /api/profile
        prof2_get = requests.get(f"{BASE_URL}/profile", headers=h2).json()
        self.assertFalse(prof2_get["occupation"])
        self.assertFalse(prof2_get["state"])
        self.assertEqual(prof2_get["completenessPercent"], 0)
        self.assertFalse(prof2_get["isProfileSaved"])

        # Confirm User 1 details were not leaked or reused
        prof1_get = requests.get(f"{BASE_URL}/profile", headers=h1).json()
        self.assertEqual(prof1_get["occupation"], "Farmer")
        self.assertEqual(prof1_get["state"], "Maharashtra")

    def test_02_registration_validation_unregistered_login(self):
        """Requirement 2: If a user tries to log in without being registered, display 'You are not registered. Please register first.'"""
        non_existent_email = f"unregistered_{uuid.uuid4().hex[:10]}@notregistered.com"
        res = requests.post(f"{BASE_URL}/auth/login", json={
            "email": non_existent_email,
            "password": "AnyPassword123!"
        })
        self.assertEqual(res.status_code, 404)
        data = res.json()
        self.assertEqual(data.get("message"), "You are not registered. Please register first.")
        self.assertEqual(data.get("error"), "Not registered")

    def test_03_profile_validation_is_profile_saved(self):
        """Requirement 3: Profile validation flag indicates whether profile is saved and validated."""
        email = f"validation_{uuid.uuid4().hex[:8]}@example.com"
        reg = requests.post(f"{BASE_URL}/auth/register", json={
            "name": "Validation User",
            "email": email,
            "password": "Password123!"
        }).json()
        token = reg["token"]
        h = {"Authorization": f"Bearer {token}"}

        # Initially unsaved
        get_init = requests.get(f"{BASE_URL}/profile", headers=h).json()
        self.assertFalse(get_init.get("isProfileSaved"))

        # Save profile details
        put_res = requests.put(f"{BASE_URL}/profile", json={
            "name": "Validation User",
            "occupation": "Student",
            "state": "Delhi",
            "age": 21,
            "annualIncome": "< 1 Lakh",
            "education": "Graduate"
        }, headers=h).json()
        self.assertTrue(put_res.get("isProfileSaved"))

        # Re-fetch and verify isProfileSaved persists as True
        get_after = requests.get(f"{BASE_URL}/profile", headers=h).json()
        self.assertTrue(get_after.get("isProfileSaved"))

    def test_04_dynamic_recent_activity_from_database(self):
        """Requirement 4: Real activities fetched from database, empty states when no activity."""
        email = f"activity_{uuid.uuid4().hex[:8]}@example.com"
        reg = requests.post(f"{BASE_URL}/auth/register", json={
            "name": "Activity User",
            "email": email,
            "password": "Password123!"
        }).json()
        token = reg["token"]
        h = {"Authorization": f"Bearer {token}"}

        # Check activities right after registration (contains registration action)
        res_acts = requests.get(f"{BASE_URL}/profile/activities", headers=h).json()
        self.assertIn("activities", res_acts)
        self.assertTrue(len(res_acts["activities"]) >= 1)
        self.assertEqual(res_acts["activities"][-1]["action"], "user_registered")

        # Perform profile update activity
        requests.put(f"{BASE_URL}/profile", json={
            "name": "Activity User",
            "occupation": "Teacher",
            "state": "Rajasthan",
            "age": 32
        }, headers=h)

        # Check that new profile update activity was recorded in database
        res_acts2 = requests.get(f"{BASE_URL}/profile/activities", headers=h).json()
        actions = [a["action"] for a in res_acts2["activities"]]
        self.assertIn("profile_updated", actions)

    def test_05_dynamic_user_level_computation(self):
        """Requirement 5: Dynamic user level calculated based on profile completion and activity."""
        email = f"level_{uuid.uuid4().hex[:8]}@example.com"
        reg = requests.post(f"{BASE_URL}/auth/register", json={
            "name": "Level User",
            "email": email,
            "password": "Password123!"
        }).json()
        token = reg["token"]
        h = {"Authorization": f"Bearer {token}"}

        # Initial level for blank profile
        lvl_init = requests.get(f"{BASE_URL}/profile/level", headers=h).json()
        self.assertEqual(lvl_init["level"], 1)
        self.assertEqual(lvl_init["levelName"], "New Citizen")

        # Save complete profile
        requests.put(f"{BASE_URL}/profile", json={
            "name": "Level User",
            "occupation": "Farmer",
            "state": "Maharashtra",
            "district": "Pune",
            "age": 38,
            "gender": "Male",
            "annualIncome": "1 – 2.5 Lakh",
            "incomeNumeric": 180000,
            "education": "Graduate",
            "category": "General",
            "fatherName": "Father Name",
            "dateOfBirth": "1988-05-15"
        }, headers=h)

        # Re-check level after profile completion and updates
        lvl_after = requests.get(f"{BASE_URL}/profile/level", headers=h).json()
        self.assertGreater(lvl_after["score"], lvl_init["score"])
        self.assertGreaterEqual(lvl_after["level"], 2)

if __name__ == "__main__":
    unittest.main()
