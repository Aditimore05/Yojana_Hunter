import unittest
import json
import subprocess
import sys
import os

class TestMCPNavigation(unittest.TestCase):
    def test_navigation_service_direct(self):
        backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
        sys.path.insert(0, backend_dir)
        from services.navigation_service import NavigationService, mcp_navigate_to_page, mcp_list_application_routes

        routes_res = mcp_list_application_routes()
        self.assertEqual(routes_res["status"], "success")
        self.assertGreaterEqual(routes_res["total_routes"], 20)

        # Test Citizen Dashboard
        dash = mcp_navigate_to_page("Take me to Dashboard")
        self.assertEqual(dash["status"], "success")
        self.assertEqual(dash["destination"]["route"], "/dashboard")
        self.assertTrue(dash["destination"]["requires_auth"])
        self.assertFalse(dash["destination"]["requires_admin"])

        # Test Schemes Explorer
        schemes = mcp_navigate_to_page("Open Schemes")
        self.assertEqual(schemes["status"], "success")
        self.assertEqual(schemes["destination"]["route"], "/schemes")

        # Test Profile
        profile = mcp_navigate_to_page("Navigate to Profile")
        self.assertEqual(profile["status"], "success")
        self.assertEqual(profile["destination"]["route"], "/profile")

        # Test AI Scheme Discovery (Admin)
        discovery = mcp_navigate_to_page("Open AI Scheme Discovery")
        self.assertEqual(discovery["status"], "success")
        self.assertEqual(discovery["destination"]["route"], "/admin/discovery")
        self.assertTrue(discovery["destination"]["requires_admin"])

        # Test Admin Dashboard
        admin_dash = mcp_navigate_to_page("Admin Dashboard")
        self.assertEqual(admin_dash["status"], "success")
        self.assertEqual(admin_dash["destination"]["route"], "/admin/dashboard")
        self.assertTrue(admin_dash["destination"]["requires_admin"])

    def test_mcp_server_stdio(self):
        root_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
        proc = subprocess.Popen(
            [sys.executable, "backend/mcp_server.py"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=root_dir
        )

        requests = [
            {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
            {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}},
            {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "navigate_to_page", "arguments": {"page_name_or_query": "AI Scheme Discovery"}}}
        ]

        for req in requests:
            proc.stdin.write(json.dumps(req) + "\n")
        proc.stdin.flush()

        # Read initialize
        line1 = proc.stdout.readline()
        resp1 = json.loads(line1)
        self.assertEqual(resp1["result"]["serverInfo"]["name"], "yojana-hunter-navigation")

        # Read tools/list
        line2 = proc.stdout.readline()
        resp2 = json.loads(line2)
        tool_names = [t["name"] for t in resp2["result"]["tools"]]
        self.assertIn("navigate_to_page", tool_names)
        self.assertIn("list_application_routes", tool_names)

        # Read tools/call
        line3 = proc.stdout.readline()
        resp3 = json.loads(line3)
        content = json.loads(resp3["result"]["content"][0]["text"])
        self.assertEqual(content["destination"]["route"], "/admin/discovery")
        self.assertTrue(content["destination"]["requires_admin"])

        proc.terminate()

if __name__ == "__main__":
    unittest.main()
