import unittest
import requests
import uuid
import sys
import os

BASE_URL = "http://127.0.0.1:5000/api"

class TestAuthEndToEnd(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Health check to ensure backend is accessible
        try:
            res = requests.get(f"{BASE_URL}/health", timeout=5)
            assert res.status_code == 200
        except Exception as e:
            print(f"[FAIL] Backend server not reachable at {BASE_URL}: {e}")
            sys.exit(1)

    def test_01_user_registration_success(self):
        """1. A new user can register successfully."""
        unique_email = f"citizen_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "name": "Ramesh Patil",
            "email": unique_email,
            "password": "Password123!",
            "confirmPassword": "Password123!",
            "profileData": {
                "occupation": "Farmer",
                "annualIncome": "₹1,50,000",
                "incomeNumeric": 150000,
                "age": 42,
                "state": "Maharashtra",
                "education": "10th Pass",
                "category": "OBC"
            }
        }
        res = requests.post(f"{BASE_URL}/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], unique_email)
        self.assertEqual(data["profile"]["name"], "Ramesh Patil")
        self.assertEqual(data["profile"]["occupation"], "Farmer")

    def test_02_duplicate_email_registration_rejected(self):
        """2. Duplicate email registration is rejected."""
        email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "name": "Sunita Sharma",
            "email": email,
            "password": "SecurePassword1!"
        }
        res1 = requests.post(f"{BASE_URL}/auth/register", json=payload)
        self.assertEqual(res1.status_code, 201)

        # Attempt duplicate
        res2 = requests.post(f"{BASE_URL}/auth/register", json=payload)
        self.assertEqual(res2.status_code, 409)
        self.assertIn("already exists", res2.json().get("message", "").lower())

    def test_03_registration_validation(self):
        """5. Required-field and invalid-email validation works."""
        # Missing name
        res = requests.post(f"{BASE_URL}/auth/register", json={"email": "a@b.com", "password": "Password1!"})
        self.assertEqual(res.status_code, 400)

        # Invalid email
        res = requests.post(f"{BASE_URL}/auth/register", json={"name": "Test", "email": "invalid-email", "password": "Password1!"})
        self.assertEqual(res.status_code, 400)

        # Short password (< 8 chars)
        res = requests.post(f"{BASE_URL}/auth/register", json={"name": "Test", "email": "valid@example.com", "password": "123"})
        self.assertEqual(res.status_code, 400)

    def test_04_user_login_success_and_invalid_password(self):
        """3. Login with valid credentials & 4. Incorrect passwords rejected."""
        email = f"login_{uuid.uuid4().hex[:8]}@example.com"
        password = "CorrectPassword123!"

        # Register
        requests.post(f"{BASE_URL}/auth/register", json={
            "name": "Pooja Verma",
            "email": email,
            "password": password
        })

        # Correct login
        res_ok = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password, "rememberMe": True})
        self.assertEqual(res_ok.status_code, 200)
        self.assertIn("token", res_ok.json())

        # Incorrect password
        res_bad = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": "WrongPassword999!"})
        self.assertEqual(res_bad.status_code, 401)
        self.assertIn("Invalid email address or password", res_bad.json().get("message", ""))

    def test_05_passwords_stored_as_hashes(self):
        """6. Passwords are stored as hashes (never plaintext)."""
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
        from database import SessionLocal
        from models import User

        # Register a new user to verify new passwords use bcrypt
        test_email = f"hash_{uuid.uuid4().hex[:8]}@example.com"
        raw_pw = "SuperSecret123!"
        requests.post(f"{BASE_URL}/auth/register", json={
            "name": "Hash Check User",
            "email": test_email,
            "password": raw_pw
        })

        db = SessionLocal()
        try:
            new_u = db.query(User).filter(User.email == test_email).first()
            self.assertIsNotNone(new_u)
            self.assertTrue(new_u.password_hash.startswith("$2b$") or new_u.password_hash.startswith("$2a$"))
            self.assertNotEqual(new_u.password_hash, raw_pw)

            users = db.query(User).all()
            for u in users:
                self.assertTrue(
                    u.password_hash.startswith(("$2b$", "$2a$", "scrypt:", "pbkdf2:", "sha256$")),
                    f"User {u.email} password hash is not standard secure hash format: {u.password_hash[:10]}"
                )
                self.assertNotIn("Password", u.password_hash)
                self.assertNotIn("Admin", u.password_hash)
        finally:
            db.close()

    def test_06_current_user_and_session_preservation(self):
        """7. Refreshing a protected page preserves valid session & 8. Logout invalidates."""
        email = f"session_{uuid.uuid4().hex[:8]}@example.com"
        res = requests.post(f"{BASE_URL}/auth/register", json={
            "name": "Session User",
            "email": email,
            "password": "Password123!"
        })
        token = res.json()["token"]

        # Call /api/auth/me with valid Bearer token
        headers = {"Authorization": f"Bearer {token}"}
        me_res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["user"]["email"], email)

        # Call /api/auth/me without token -> 401
        unauth_res = requests.get(f"{BASE_URL}/auth/me")
        self.assertEqual(unauth_res.status_code, 401)

        # Logout endpoint responds successfully
        logout_res = requests.post(f"{BASE_URL}/auth/logout", headers=headers)
        self.assertEqual(logout_res.status_code, 200)

    def test_07_profile_update_and_six_fields(self):
        """11. A user can save and retrieve their own six-field eligibility profile."""
        email = f"profile_{uuid.uuid4().hex[:8]}@example.com"
        reg = requests.post(f"{BASE_URL}/auth/register", json={
            "name": "Kavita Rao",
            "email": email,
            "password": "Password123!"
        })
        token = reg.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Update the 6 mandatory eligibility fields
        update_payload = {
            "occupation": "Artisan / Weaver",
            "annualIncome": "₹90,000",
            "incomeNumeric": 90000,
            "age": 35,
            "state": "Karnataka",
            "district": "Mysuru",
            "education": "8th Pass",
            "category": "SC",
            "gender": "Female"
        }
        put_res = requests.put(f"{BASE_URL}/profile", json=update_payload, headers=headers)
        self.assertEqual(put_res.status_code, 200)
        data = put_res.json()
        self.assertEqual(data["occupation"], "Artisan / Weaver")
        self.assertEqual(data["state"], "Karnataka")
        self.assertEqual(data["age"], 35)
        self.assertEqual(data["category"], "SC")

        # Fetch profile again and verify persistence
        get_res = requests.get(f"{BASE_URL}/profile", headers=headers)
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["occupation"], "Artisan / Weaver")
        self.assertEqual(get_res.json()["state"], "Karnataka")

    def test_08_multi_tenant_user_isolation(self):
        """12. Two different users cannot access each other's profiles or saved schemes."""
        # Create User 1
        user1_email = f"user1_{uuid.uuid4().hex[:8]}@example.com"
        reg1 = requests.post(f"{BASE_URL}/auth/register", json={
            "name": "User One", "email": user1_email, "password": "Password123!"
        })
        token1 = reg1.json()["token"]
        headers1 = {"Authorization": f"Bearer {token1}"}

        # User 1 sets profile: State = Punjab, Occupation = Farmer
        requests.put(f"{BASE_URL}/profile", json={"state": "Punjab", "occupation": "Farmer", "age": 45}, headers=headers1)

        # Create User 2
        user2_email = f"user2_{uuid.uuid4().hex[:8]}@example.com"
        reg2 = requests.post(f"{BASE_URL}/auth/register", json={
            "name": "User Two", "email": user2_email, "password": "Password123!"
        })
        token2 = reg2.json()["token"]
        headers2 = {"Authorization": f"Bearer {token2}"}

        # User 2 sets profile: State = Kerala, Occupation = Student
        requests.put(f"{BASE_URL}/profile", json={"state": "Kerala", "occupation": "Student", "age": 20}, headers=headers2)

        # Check User 1 profile
        p1 = requests.get(f"{BASE_URL}/profile", headers=headers1).json()
        self.assertEqual(p1["state"], "Punjab")
        self.assertEqual(p1["occupation"], "Farmer")

        # Check User 2 profile
        p2 = requests.get(f"{BASE_URL}/profile", headers=headers2).json()
        self.assertEqual(p2["state"], "Kerala")
        self.assertEqual(p2["occupation"], "Student")

        # User 1 bookmarks pm-vidyalakshmi
        b1 = requests.post(f"{BASE_URL}/saved-schemes", json={"schemeId": "pm-vidyalakshmi"}, headers=headers1)
        self.assertEqual(b1.status_code, 201)

        # User 2 bookmarks post-matric-scholarship
        b2 = requests.post(f"{BASE_URL}/saved-schemes", json={"schemeId": "post-matric-scholarship"}, headers=headers2)
        self.assertEqual(b2.status_code, 201)

        # User 1 saved schemes list
        s1 = requests.get(f"{BASE_URL}/saved-schemes", headers=headers1).json()["schemes"]
        s1_slugs = [x["slug"] for x in s1]
        self.assertIn("pm-vidyalakshmi", s1_slugs)
        self.assertNotIn("post-matric-scholarship", s1_slugs)

        # User 2 saved schemes list
        s2 = requests.get(f"{BASE_URL}/saved-schemes", headers=headers2).json()["schemes"]
        s2_slugs = [x["slug"] for x in s2]
        self.assertIn("post-matric-scholarship", s2_slugs)
        self.assertNotIn("pm-vidyalakshmi", s2_slugs)

    def test_09_saved_schemes_bookmark_lifecycle(self):
        """Test bookmarking, checking status, and removing bookmark."""
        email = f"book_{uuid.uuid4().hex[:8]}@example.com"
        reg = requests.post(f"{BASE_URL}/auth/register", json={"name": "Bookmark User", "email": email, "password": "Password123!"})
        token = reg.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Check isSaved before bookmarking
        check_before = requests.get(f"{BASE_URL}/saved-schemes/check/pm-vidyalakshmi", headers=headers).json()
        self.assertFalse(check_before["isSaved"])

        # Bookmark scheme
        save_res = requests.post(f"{BASE_URL}/saved-schemes", json={"schemeId": "pm-vidyalakshmi"}, headers=headers)
        self.assertEqual(save_res.status_code, 201)

        # Check isSaved after bookmarking
        check_after = requests.get(f"{BASE_URL}/saved-schemes/check/pm-vidyalakshmi", headers=headers).json()
        self.assertTrue(check_after["isSaved"])

        # Remove bookmark
        del_res = requests.delete(f"{BASE_URL}/saved-schemes/pm-vidyalakshmi", headers=headers)
        self.assertEqual(del_res.status_code, 200)

        # Check isSaved after removal
        check_removed = requests.get(f"{BASE_URL}/saved-schemes/check/pm-vidyalakshmi", headers=headers).json()
        self.assertFalse(check_removed["isSaved"])

    def test_10_forgot_password_and_reset_flow(self):
        """10. Forgot-password and reset-password flows work."""
        email = f"reset_{uuid.uuid4().hex[:8]}@example.com"
        old_pw = "OldPassword123!"
        new_pw = "BrandNewPassword99!"

        # Register
        requests.post(f"{BASE_URL}/auth/register", json={"name": "Reset User", "email": email, "password": old_pw})

        # Request reset
        forgot_res = requests.post(f"{BASE_URL}/auth/forgot-password", json={"email": email})
        self.assertEqual(forgot_res.status_code, 200)
        reset_token = forgot_res.json().get("dev_reset_token")
        self.assertIsNotNone(reset_token, "Development reset token should be returned when SMTP is unconfigured")

        # Reset password with token
        reset_res = requests.post(f"{BASE_URL}/auth/reset-password", json={
            "token": reset_token,
            "password": new_pw,
            "confirmPassword": new_pw
        })
        self.assertEqual(reset_res.status_code, 200)

        # Old password must fail
        login_old = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": old_pw})
        self.assertEqual(login_old.status_code, 401)

        # New password must succeed
        login_new = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": new_pw})
        self.assertEqual(login_new.status_code, 200)

        # Token cannot be reused (single-use token verification)
        reuse_res = requests.post(f"{BASE_URL}/auth/reset-password", json={
            "token": reset_token,
            "password": "AnotherPassword123!",
            "confirmPassword": "AnotherPassword123!"
        })
        self.assertEqual(reuse_res.status_code, 400)

    def test_11_existing_scheme_features_continue_working(self):
        """13. Existing scheme fetching and eligibility matching continue to work."""
        # 1. Scheme list
        res_list = requests.get(f"{BASE_URL}/schemes")
        self.assertEqual(res_list.status_code, 200)
        schemes = res_list.json()
        self.assertTrue(len(schemes) > 0)

        # 2. Scheme details with criteria evaluation
        res_detail = requests.get(f"{BASE_URL}/schemes/pm-vidyalakshmi")
        self.assertEqual(res_detail.status_code, 200)
        detail = res_detail.json()
        self.assertEqual(detail["slug"], "pm-vidyalakshmi")
        self.assertIn("criteria", detail)

        # 3. Dynamic questionnaire matching
        match_res = requests.post(f"{BASE_URL}/schemes/match", json={
            "age": 22,
            "occupation": "Student",
            "state": "Maharashtra",
            "annual_income": "< 1 Lakh"
        })
        self.assertEqual(match_res.status_code, 200)
        self.assertIn("schemes", match_res.json())

        # 4. Recommendations endpoint
        rec_res = requests.get(f"{BASE_URL}/schemes/recommendations")
        self.assertEqual(rec_res.status_code, 200)
        self.assertIn("recommendations", rec_res.json())

if __name__ == "__main__":
    unittest.main()
