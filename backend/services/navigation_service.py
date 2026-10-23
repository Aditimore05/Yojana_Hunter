"""
Navigation Service & MCP Registry for Yojana Hunter.
Provides dynamic route resolution, UI pathway instructions, role-based permission
enforcement, and MCP-compatible navigation tools.
"""

import os
from typing import Dict, Any, List, Optional

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

# Complete, verified registry of actual Next.js frontend routes
ROUTES_REGISTRY: List[Dict[str, Any]] = [
    {
        "id": "home",
        "title": "Home / Landing Page",
        "route": "/",
        "category": "public",
        "permission": "public",
        "requires_auth": False,
        "requires_admin": False,
        "description": "Main landing page showcasing Yojana Hunter features, benefits, and getting started options.",
        "ui_instructions": "Click the 'Yojana Hunter' logo in the top-left navigation bar, or click 'Home' in the navigation bar.",
        "keywords": ["home", "landing", "main page", "start", "welcome"]
    },
    {
        "id": "dashboard",
        "title": "Citizen Dashboard",
        "route": "/dashboard",
        "category": "citizen",
        "permission": "citizen_auth",
        "requires_auth": True,
        "requires_admin": False,
        "description": "Personalized citizen overview showing profile stats, matched schemes count, active beneficiary, and family profiles.",
        "ui_instructions": "Click 'Dashboard' in the top navigation bar, or open the user avatar menu (top-right) and select 'Dashboard'. On mobile, tap the 'Dashboard' icon in the bottom navigation bar.",
        "keywords": ["dashboard", "overview", "home dashboard", "stats", "my dashboard", "family profiles"]
    },
    {
        "id": "schemes",
        "title": "Schemes Explorer",
        "route": "/schemes",
        "category": "public_accessible",
        "permission": "public",
        "requires_auth": False,
        "requires_admin": False,
        "description": "Browse and search all verified central and state government schemes with category, state, and occupation filters.",
        "ui_instructions": "Click 'Schemes' in the top navigation bar. On mobile, tap the 'Schemes' icon in the bottom navigation bar.",
        "keywords": ["schemes", "scheme catalog", "browse schemes", "search schemes", "all schemes", "find schemes", "scholarships", "subsidies"]
    },
    {
        "id": "schemes_match",
        "title": "Scheme Eligibility Match",
        "route": "/schemes/match",
        "category": "citizen",
        "permission": "public",
        "requires_auth": False,
        "requires_admin": False,
        "description": "Compare your exact criteria against all published schemes to view percentage match scores and breakdown.",
        "ui_instructions": "Navigate to '/schemes' and click 'Check Eligibility Match', or click 'View Matched Schemes' from your dashboard.",
        "keywords": ["match", "eligibility match", "matched schemes", "am i eligible", "check match", "score"]
    },
    {
        "id": "interview",
        "title": "Conversational Profile Interview",
        "route": "/interview",
        "category": "citizen",
        "permission": "citizen_auth",
        "requires_auth": True,
        "requires_admin": False,
        "description": "AI-guided chatbot questionnaire to quickly set up or update your profile (Self or Family Member) without long forms.",
        "ui_instructions": "Click 'Start Now' in the top navigation bar, or tap 'Start Now' in the mobile bottom bar, or select 'Conversational Interview' on the Dashboard.",
        "keywords": ["interview", "conversational interview", "bot interview", "chat interview", "ai interview", "setup profile"]
    },
    {
        "id": "profile",
        "title": "Profile & Family Management",
        "route": "/profile",
        "category": "citizen",
        "permission": "citizen_auth",
        "requires_auth": True,
        "requires_admin": False,
        "description": "Manage your personal and family member profiles (Father, Mother, Child, Spouse, Other), occupation, income, and domicile.",
        "ui_instructions": "Click your avatar/name in the top-right header and select 'My Profile', or tap 'My Profile' in the mobile bottom navigation bar.",
        "keywords": ["profile", "my profile", "edit profile", "family profile", "add relative", "update occupation", "income details"]
    },
    {
        "id": "documents",
        "title": "Documents Vault & Locker",
        "route": "/documents",
        "category": "citizen",
        "permission": "citizen_auth",
        "requires_auth": True,
        "requires_admin": False,
        "description": "Secure document locker to store and manage Aadhaar, Income Certificate, Domicile Certificate, and Caste Certificate.",
        "ui_instructions": "Click 'Documents' in the top navigation bar, or access the Document Locker card directly from your Citizen Dashboard.",
        "keywords": ["documents", "document locker", "vault", "upload certificates", "aadhaar", "income certificate", "files"]
    },
    {
        "id": "applications",
        "title": "Application Tracker",
        "route": "/applications",
        "category": "citizen",
        "permission": "citizen_auth",
        "requires_auth": True,
        "requires_admin": False,
        "description": "Track status of submitted and draft welfare scheme applications and action items.",
        "ui_instructions": "Click 'Applications' in the top navigation bar, or open the user dropdown menu and select 'Applications'.",
        "keywords": ["applications", "my applications", "track application", "submitted", "application status"]
    },
    {
        "id": "application_draft",
        "title": "Application Draft",
        "route": "/application-draft",
        "category": "citizen",
        "permission": "citizen_auth",
        "requires_auth": True,
        "requires_admin": False,
        "description": "Draft your scheme application form, review auto-filled data from your profile, and export/submit.",
        "ui_instructions": "Click 'Apply' on any scheme detail card, or open 'Draft Application' from your Action Plan.",
        "keywords": ["draft", "application draft", "form", "fill application", "apply form"]
    },
    {
        "id": "action_plan",
        "title": "Personalized Action Plan",
        "route": "/action-plan",
        "category": "citizen",
        "permission": "citizen_auth",
        "requires_auth": True,
        "requires_admin": False,
        "description": "Step-by-step roadmap to apply for matched government schemes, document checklists, and official portal links.",
        "ui_instructions": "Navigate to the Schemes page and click 'View Action Plan', or open '/action-plan' directly from your dashboard.",
        "keywords": ["action plan", "roadmap", "how to apply", "application guide", "checklist", "steps"]
    },
    {
        "id": "saved_schemes",
        "title": "Saved Schemes (Bookmarks)",
        "route": "/saved-schemes",
        "category": "citizen",
        "permission": "citizen_auth",
        "requires_auth": True,
        "requires_admin": False,
        "description": "Access your bookmarked schemes for quick comparison, deadline tracking, and review.",
        "ui_instructions": "Click 'My Schemes' in the top navigation bar, or open the user avatar menu and click 'My Schemes'.",
        "keywords": ["saved schemes", "bookmarks", "my schemes", "saved", "favorite schemes"]
    },
    {
        "id": "settings",
        "title": "Account Settings",
        "route": "/settings",
        "category": "citizen",
        "permission": "citizen_auth",
        "requires_auth": True,
        "requires_admin": False,
        "description": "Manage account preferences, password changes, notification alerts, and language preferences.",
        "ui_instructions": "Click your user avatar in the top-right header and select 'Settings'.",
        "keywords": ["settings", "account settings", "preferences", "notifications", "change password"]
    },
    {
        "id": "subscription",
        "title": "Premium Subscription & Plans",
        "route": "/subscription",
        "category": "citizen",
        "permission": "citizen_auth",
        "requires_auth": True,
        "requires_admin": False,
        "description": "Upgrade to Premium for unlimited scheme matching, AI auto-apply assistance, priority notifications, and SMS alerts.",
        "ui_instructions": "Click 'Upgrade to Premium' in the dashboard header or user profile dropdown menu.",
        "keywords": ["subscription", "upgrade", "premium", "pricing", "plans", "vip", "pro"]
    },
    {
        "id": "onboarding",
        "title": "Onboarding Quiz",
        "route": "/onboarding",
        "category": "public",
        "permission": "public",
        "requires_auth": False,
        "requires_admin": False,
        "description": "Interactive onboarding quiz to introduce citizens to welfare schemes and determine initial profile settings.",
        "ui_instructions": "Click 'Get Started' on the landing page, or click 'Start Now' in the top navigation bar.",
        "keywords": ["onboarding", "get started", "welcome quiz", "intro"]
    },
    {
        "id": "login",
        "title": "Citizen Login",
        "route": "/login",
        "category": "public",
        "permission": "public",
        "requires_auth": False,
        "requires_admin": False,
        "description": "Sign in with your registered email and password to access your personalized schemes, profile, and documents.",
        "ui_instructions": "Click 'Sign In' or 'Login' in the top-right corner of the header. On mobile, tap 'Sign In' in the bottom navigation bar.",
        "keywords": ["login", "sign in", "signin", "log in", "citizen login", "auth"]
    },
    {
        "id": "register",
        "title": "Citizen Registration",
        "route": "/register",
        "category": "public",
        "permission": "public",
        "requires_auth": False,
        "requires_admin": False,
        "description": "Create a free Yojana Hunter account with your Full Name, Email Address, Mobile Number, and Password.",
        "ui_instructions": "Click 'Register' or 'Sign Up' in the top-right corner of the header.",
        "keywords": ["register", "sign up", "signup", "create account", "new user"]
    },
    {
        "id": "forgot_password",
        "title": "Forgot Password",
        "route": "/forgot-password",
        "category": "public",
        "permission": "public",
        "requires_auth": False,
        "requires_admin": False,
        "description": "Request a secure password reset link sent to your registered email.",
        "ui_instructions": "Click 'Forgot Password?' on the Login page (`/login`).",
        "keywords": ["forgot password", "reset password link", "recover account"]
    },
    {
        "id": "admin_login",
        "title": "Admin Portal Login",
        "route": "/admin/login",
        "category": "admin",
        "permission": "admin_credentials",
        "requires_auth": False,
        "requires_admin": False,
        "description": "Administrative authentication portal for platform administrators and editors.",
        "ui_instructions": "Access `/admin/login` directly via URL, or click 'Admin Portal' in the website footer.",
        "keywords": ["admin login", "admin portal login", "administrator sign in", "admin signin"]
    },
    {
        "id": "admin_dashboard",
        "title": "Admin Dashboard & Analytics",
        "route": "/admin/dashboard",
        "category": "admin",
        "permission": "admin_auth",
        "requires_auth": True,
        "requires_admin": True,
        "description": "Overview of platform metrics: total published schemes, citizen profiles, active discovery jobs, and system health.",
        "ui_instructions": "Log in at `/admin/login`, then click 'Dashboard' in the left-hand Admin Sidebar.",
        "keywords": ["admin dashboard", "admin overview", "admin metrics", "admin analytics", "control panel", "admin panel"]
    },
    {
        "id": "admin_discovery",
        "title": "AI Scheme Discovery Console",
        "route": "/admin/discovery",
        "category": "admin",
        "permission": "admin_auth",
        "requires_admin": True,
        "requires_auth": True,
        "description": "Admin AI scraper and discovery console to crawl official Indian portals (.gov.in), ingest new schemes, and auto-verify criteria.",
        "ui_instructions": "Log in to the Admin Portal (`/admin/login`), open the left Admin Sidebar, and click 'AI Scheme Discovery' (Sparkles icon).",
        "keywords": ["ai scheme discovery", "discovery", "scheme discovery", "crawler", "scraper", "ingest schemes", "gemini discovery", "crawl portals"]
    },
    {
        "id": "admin_schemes",
        "title": "Admin Schemes Management",
        "route": "/admin/schemes",
        "category": "admin",
        "permission": "admin_auth",
        "requires_auth": True,
        "requires_admin": True,
        "description": "Publish, review, edit, and deactivate schemes in the official PostgreSQL database.",
        "ui_instructions": "Log in at `/admin/login`, open the left Admin Sidebar, and click 'Manage Schemes'.",
        "keywords": ["manage schemes", "admin schemes", "edit scheme", "delete scheme", "publish scheme"]
    },
    {
        "id": "admin_schemes_new",
        "title": "Admin Add New Scheme",
        "route": "/admin/schemes/new",
        "category": "admin",
        "permission": "admin_auth",
        "requires_auth": True,
        "requires_admin": True,
        "description": "Manual form to create and publish a new government welfare scheme with eligibility criteria and document rules.",
        "ui_instructions": "In the Admin Portal, click 'Add New Scheme' in the sidebar or '+ Add Scheme' in Manage Schemes.",
        "keywords": ["add new scheme", "create scheme", "new scheme", "admin add scheme"]
    },
    {
        "id": "admin_subscriptions",
        "title": "Admin Subscriptions Management",
        "route": "/admin/subscriptions",
        "category": "admin",
        "permission": "admin_auth",
        "requires_auth": True,
        "requires_admin": True,
        "description": "Manage citizen subscriptions, view payment logs, and monitor tier distribution.",
        "ui_instructions": "In the Admin Portal, click 'Subscriptions' in the left-hand sidebar.",
        "keywords": ["admin subscriptions", "manage subscriptions", "revenue", "user tiers"]
    }
]

class NavigationService:
    @staticmethod
    def get_all_routes() -> List[Dict[str, Any]]:
        """Returns all registered frontend routes with full URLs and metadata."""
        routes = []
        for r in ROUTES_REGISTRY:
            route_copy = dict(r)
            route_copy["full_url"] = f"{FRONTEND_BASE_URL}{r['route']}"
            routes.append(route_copy)
        return routes

    @staticmethod
    def resolve_navigation_intent(query: str) -> Optional[Dict[str, Any]]:
        """
        Dynamically resolves user natural language intent to the best matching frontend route.
        Returns the route metadata, full URL, UI access guide, and permissions.
        """
        q = (query or "").lower().strip()
        if not q:
            return None

        # Check for navigation action indicators
        nav_verbs = [
            "navigate", "go to", "open", "take me to", "show me", "where is", "where can i find",
            "redirect", "visit", "how to reach", "view", "access", "lead me to", "bring me to",
            "switch to", "jump to"
        ]
        
        is_explicit_nav = any(v in q for v in nav_verbs)

        best_match = None
        highest_score = 0

        for r in ROUTES_REGISTRY:
            score = 0
            route_name = r["title"].lower()
            route_path = r["route"].lower().strip("/")
            is_admin_target = (
                r.get("requires_admin", False) or 
                r.get("category") == "admin" or 
                r.get("route", "").startswith("/admin")
            )

            # Route contains "admin"
            if "admin" in q:
                if is_admin_target:
                    score += 45
                    if ("login" in q or "signin" in q) and r["id"] == "admin_login":
                        score += 50
                else:
                    score -= 50
            else:
                if is_admin_target:
                    # Penalize admin routes when user didn't mention admin, unless searching discovery/crawler
                    if "discovery" not in q and "scraper" not in q and "crawler" not in q:
                        score -= 50

            # Exact route path match (e.g. "go to /admin/discovery" or "/schemes")
            if f"/{route_path}" in q or (route_path and route_path in q.split()):
                score += 60

            # Match keywords
            for kw in r["keywords"]:
                if kw in q:
                    # Longer keyword match gets more weight
                    score += 25 + len(kw.split()) * 10

            # Specific check for Saved Schemes vs General Schemes
            if "saved" in q or "bookmark" in q or "favorite" in q:
                if r["id"] == "saved_schemes":
                    score += 60
                elif r["id"] == "schemes":
                    score -= 30

            # Specific check for AI Scheme Discovery / Discovery
            if "discovery" in q or "scraper" in q or "crawler" in q:
                if r["id"] == "admin_discovery":
                    score += 70

            # Specific check for Admin Dashboard vs Citizen Dashboard
            if "admin" in q and "dashboard" in q:
                if r["id"] == "admin_dashboard":
                    score += 60
            elif "dashboard" in q and "admin" not in q:
                if r["id"] == "dashboard":
                    score += 50

            # Specific check for Schemes
            if "scheme" in q and ("catalog" in q or "browse" in q or "all" in q or "explore" in q or q.strip() in ["schemes", "scheme"]):
                if r["id"] == "schemes":
                    score += 40

            # Specific check for Profile / Relative
            if ("profile" in q or "relative" in q or "family" in q) and "admin" not in q:
                if r["id"] == "profile":
                    score += 40

            if score > highest_score:
                highest_score = score
                best_match = r

        # Threshold: if explicit navigation verb was used, lower threshold
        min_threshold = 15 if is_explicit_nav else 25

        if best_match and highest_score >= min_threshold:
            full_url = f"{FRONTEND_BASE_URL}{best_match['route']}"
            return {
                "id": best_match["id"],
                "title": best_match["title"],
                "route": best_match["route"],
                "full_url": full_url,
                "category": best_match["category"],
                "requires_auth": best_match["requires_auth"],
                "requires_admin": best_match["requires_admin"],
                "description": best_match["description"],
                "ui_instructions": best_match["ui_instructions"],
                "match_score": highest_score,
            }

        return None

    @staticmethod
    def format_navigation_reply(match: Dict[str, Any], lang: str = "en") -> str:
        """
        Formats a structured, user-friendly navigation message with exact URL,
        UI access instructions, permissions, and clickable links.
        """
        title = match["title"]
        route = match["route"]
        url = match["full_url"]
        desc = match["description"]
        ui_path = match["ui_instructions"]
        req_auth = match["requires_auth"]
        req_admin = match["requires_admin"]

        # Permission statement
        if req_admin:
            perm_text = "**Prerequisite**: Requires **Administrator Role & Login**. You must sign in at `/admin/login` first; citizens cannot access this page."
        elif req_auth:
            perm_text = "**Prerequisite**: Requires **Citizen Login**. If not logged in, you will be redirected to `/login`."
        else:
            perm_text = "**Access**: Open to all citizens and visitors (No login required)."

        reply = (
            f"### Navigation: {title}\n\n"
            f"{desc}\n\n"
            f"- **Exact URL**: [{url}]({url})\n"
            f"- **Internal Route**: `{route}`\n"
            f"- {perm_text}\n\n"
            f"**How to reach this page in the UI:**\n"
            f"{ui_path}\n\n"
            f"Direct Link: [{title}]({url})"
        )
        return reply

# MCP-compatible tool definitions
def mcp_list_application_routes() -> Dict[str, Any]:
    """MCP Tool: List all application routes with URLs, permissions, and UI steps."""
    return {
        "status": "success",
        "routes": NavigationService.get_all_routes(),
        "total_routes": len(ROUTES_REGISTRY)
    }

def mcp_navigate_to_page(page_name_or_query: str) -> Dict[str, Any]:
    """
    MCP Tool: Resolves any page name or user navigation request to the exact
    frontend URL, route path, permissions, and UI navigation instructions.
    """
    match = NavigationService.resolve_navigation_intent(page_name_or_query)
    if not match:
        return {
            "status": "not_found",
            "message": f"Could not find a matching application page for '{page_name_or_query}'.",
            "available_pages": [r["title"] for r in ROUTES_REGISTRY]
        }
    return {
        "status": "success",
        "destination": match,
        "formatted_guide": NavigationService.format_navigation_reply(match)
    }
