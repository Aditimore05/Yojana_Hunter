import os
import re
import time
import logging
from flask import Blueprint, request, jsonify, g
from sqlalchemy.orm import joinedload
from database import SessionLocal
from models import Scheme, SchemeDocumentRequirement, Profile, User
from utils.auth import optional_auth
from services.eligibility_service import SchemeEligibilityService
from services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

interview_bp = Blueprint("interview", __name__)

_last_gemini_quota_error = 0


def generate_gemini_chat_reply(
    system_instruction: str,
    user_message: str,
    history: list,
    user_context_str: str,
    schemes_context_str: str,
    lang: str
) -> str | None:
    """
    Safely invokes the Gemini API via the official GeminiService and google-genai SDK.
    Includes rate limit cooldown protection and zero secret exposure.
    """
    global _last_gemini_quota_error

    if not GeminiService.is_configured():
        return None

    # If recent 429 quota error within 90s, bypass to instant deterministic retrieval
    if time.time() - _last_gemini_quota_error < 90:
        return None

    try:
        from google.genai import types
        client = GeminiService.get_client()
        candidate_models = GeminiService.get_candidate_models()

        # Build formatted multi-turn conversational history
        history_text = ""
        if history:
            formatted_turns = []
            for h in history[-6:]:
                role = "User" if h.get("sender") in ("user", "citizen") else "Assistant"
                txt = (h.get("text") or h.get("message") or "").strip()
                if txt:
                    formatted_turns.append(f"{role}: {txt}")
            if formatted_turns:
                history_text = "Previous Conversation:\n" + "\n".join(formatted_turns) + "\n\n"

        full_prompt = (
            f"{user_context_str}\n"
            f"{schemes_context_str}\n"
            f"{history_text}"
            f"Current User Question: {user_message}\n\n"
            f"Provide a short, simple, actionable, and beginner-friendly response in {lang}."
        )

        for model in candidate_models:
            try:
                config = types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3,
                    max_output_tokens=650
                )
                response = client.models.generate_content(
                    model=model,
                    contents=full_prompt,
                    config=config
                )
                text = GeminiService.extract_text_from_response(response)
                if text and text.strip():
                    return text.strip()
            except Exception as e:
                err_str = GeminiService.sanitize_error_message(str(e))
                if "429" in err_str or "quota" in err_str.lower() or "resource_exhausted" in err_str.lower():
                    _last_gemini_quota_error = time.time()
                    logger.warning("Gemini quota limit reached (429). Activating grounded fallback retrieval.")
                    break
                logger.warning(f"Gemini chat generation attempt with model '{model}' failed: {err_str[:120]}")
                continue

    except Exception as e:
        logger.warning(f"Gemini client invocation exception: {e}")

    return None


@interview_bp.route("/chat", methods=["POST"])
@interview_bp.route("/interview/message", methods=["POST"])
@optional_auth
def handle_chat_message():
    """
    POST /api/chat
    Dynamic, application-specific AI assistant for the Yojana Hunter platform.
    Answers queries about platform navigation, registration, login, profile setup,
    conversational interview, scheme discovery, eligibility rules, and application procedures.
    """
    db = SessionLocal()
    try:
        data = request.get_json() or {}
        message = (data.get("message") or data.get("prompt") or "").strip()
        lang = data.get("language") or "en"
        history = data.get("history") or data.get("conversation_history") or []

        if not message:
            return jsonify({
                "reply": "Please enter a question about how to use Yojana Hunter, finding government schemes, checking eligibility, or application procedures.",
                "status": "success",
                "schemes": []
            }), 200

        # 1. Fetch user profile context if authenticated
        current_user = getattr(g, "current_user", None)
        user_profile = None
        if current_user:
            user_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

        profile_dict = user_profile.to_dict() if user_profile else {}
        user_occ = profile_dict.get("occupation", "")
        user_state = profile_dict.get("state", "")
        user_income = profile_dict.get("annualIncome", "")

        msg_lower = message.lower().strip()

        # 2. Query active published schemes from DB for knowledge grounding
        schemes = db.query(Scheme).options(
            joinedload(Scheme.document_requirements)
        ).filter(
            Scheme.is_active == True,
            (Scheme.status == "published") | (Scheme.status == None)
        ).all()

        STOP_WORDS = {"yojana", "scheme", "pradhan", "mantri", "national", "government", "hunter", "which", "about", "could", "would", "please", "hello", "there", "their", "these", "those", "india", "state"}

        # 3. Match schemes for grounding context
        matched_schemes = []
        for s in schemes:
            score = 0
            s_name = s.name.lower()
            s_slug = s.slug.lower()
            s_cat = (s.category or "").lower()
            s_target = [str(x).lower() for x in (s.target_occupations or [])]

            if s_slug in msg_lower:
                score += 20
            else:
                meaningful_words = [w for w in msg_lower.split() if len(w) > 4 and w not in STOP_WORDS]
                if any(w in s_name for w in meaningful_words):
                    score += 15

            if "vidyalakshmi" in msg_lower and "vidyalakshmi" in s_slug:
                score += 25
            if ("kisan" in msg_lower or "pm-kisan" in msg_lower) and "kisan" in s_slug:
                score += 25
            if "vishwakarma" in msg_lower and "vishwakarma" in s_slug:
                score += 25
            if "matric" in msg_lower and "matric" in s_slug:
                score += 25
            if ("jan arogya" in msg_lower or "arogya" in msg_lower or "ayushman" in msg_lower) and "arogya" in s_slug:
                score += 25
            if "stand-up" in msg_lower or ("stand up" in msg_lower and "stand-up" in s_slug):
                score += 25
            if "soil" in msg_lower and "soil" in s_slug:
                score += 25
            if ("fasal" in msg_lower or "bima" in msg_lower) and "pmfby" in s_slug:
                score += 25
            if "internship" in msg_lower and "internship" in s_slug:
                score += 25
            if "apprentice" in msg_lower and "apprenticeship" in s_slug:
                score += 25

            if any(w in msg_lower for w in ["farmer", "agriculture", "kisan", "crop", "farming"]):
                if s.is_farmer_only or s_cat == "agriculture":
                    score += 25
                elif "farmer" in s_target:
                    score += 6
            if any(w in msg_lower for w in ["student", "education", "scholarship", "study", "college", "school"]):
                if s.is_student_only or s_cat == "education":
                    score += 25
                elif "student" in s_target:
                    score += 6
            if any(w in msg_lower for w in ["business", "entrepreneur", "msme", "startup", "woman"]):
                if s.is_business_only or "stand-up" in s_slug:
                    score += 25
                elif s_cat in ("entrepreneurship", "skill development"):
                    score += 15
            if any(w in msg_lower for w in ["health", "hospital", "medical", "treatment"]):
                if s_cat == "health":
                    score += 20

            if score > 0:
                matched_schemes.append((score, s))

        matched_schemes.sort(key=lambda x: x[0], reverse=True)
        top_schemes = [item[1] for item in matched_schemes[:4]]

        # 4. Comprehensive Application & Scheme Context for Gemini
        system_instruction = (
            "You are the official Yojana Hunter AI Assistant, an empathetic, concise, and beginner-friendly help guide for the Yojana Hunter platform and Indian welfare schemes.\n\n"
            "ABOUT YOJANA HUNTER & HOW CITIZENS USE IT:\n"
            "• Registration & Login: Citizens create an account on the Register page (/register) with Name, Email, Password, and Mobile, or sign in via Login (/login). Admins access /admin/login.\n"
            "• Profile Management (/profile): Citizens fill their state domicile, gender, age, caste/category, annual income, occupation, and education to unlock automatic scheme matching.\n"
            "• Conversational Interview (/interview): A friendly 7-step guided chat questionnaire that helps users quickly answer key questions to build their profile (Occupation, Gender, Annual Income, Age, State, Education, Category) and detect their occupation without long forms.\n"
            "• Scheme Discovery (/schemes): Browse 45+ verified Indian central and state government schemes with real-time filters by Category, State, Target Occupation, and Income Ceiling.\n"
            "• Eligibility Checking: Every scheme displays a match indicator. On the Scheme Details page (/schemes/:id), the 'Check Eligibility' breakdown shows exact criteria (age, income ceiling, state domicile, occupation) and what matches.\n"
            "• Action Plan & Applications (/action-plan): Provides step-by-step guidance on how to apply on official portals (.gov.in) and a checklist of mandatory certificates (Aadhaar, Income Certificate, Domicile, Caste, Bank Passbook).\n"
            "• Saved Schemes (/saved-schemes): Users can bookmark and manage schemes to review later.\n"
            "• Navigation: Top navigation bar and mobile bottom navigation allow switching between Schemes, Action Plan, Interview, Profile, and Saved Schemes.\n\n"
            "RULES FOR YOUR RESPONSES:\n"
            "1. Answer naturally, concisely, and actionably (2-4 short bullet points or brief paragraphs). Never give rambling answers.\n"
            "2. If the user asks how to use the app (e.g. how to register, how to complete profile, how to check eligibility, how to navigate), provide clear step-by-step guidance referencing the relevant page.\n"
            "3. If the user asks about specific government schemes or benefits, use the verified schemes provided in the context.\n"
            "4. Follow-up Context: Use previous conversation history to understand follow-up questions (e.g. 'How do I apply for that?', 'What documents do I need?').\n"
            "5. Polite Redirection: If the user asks questions completely UNRELATED to Yojana Hunter, government welfare schemes, or citizen benefits (e.g. coding, movies, sports, recipes, general trivia), politely guide them back:\n"
            "   'I am your Yojana Hunter Assistant dedicated to helping you discover government schemes, check eligibility, and navigate our platform. How can I assist you with government schemes or using Yojana Hunter today?'\n"
            "6. Security: NEVER reveal API keys, database credentials, server configuration, or internal code traces.\n"
        )

        user_context_str = ""
        if user_profile:
            user_context_str = (
                f"Logged-in Citizen Profile: Occupation: {user_occ or 'Not specified'}, "
                f"State: {user_state or 'Not specified'}, Annual Income: {user_income or 'Not specified'}, "
                f"Age: {profile_dict.get('age') or 'Not specified'}, Category: {profile_dict.get('category') or 'General'}.\n"
            )

        schemes_context_str = "Verified Schemes in Yojana Hunter Database:\n"
        candidate_list = top_schemes if top_schemes else schemes[:6]
        for s in candidate_list:
            docs = [d.document_name for d in s.document_requirements]
            schemes_context_str += (
                f"- Name: {s.name} (Category: {s.category}, State: {s.state}, Level: {s.level})\n"
                f"  Benefits: {s.benefits[:200]}\n"
                f"  Target: {s.target_occupations or s.occupation or 'All'}\n"
                f"  Income Max: ₹{s.income_max:,.0f}\n" if s.income_max else ""
                f"  Required Documents: {', '.join(docs[:4]) if docs else 'Aadhaar Card, Bank Passbook'}\n"
                f"  Portal: {s.application_url or s.official_source_url}\n"
            )

        # Attempt dynamic Gemini generation
        gemini_reply = generate_gemini_chat_reply(
            system_instruction=system_instruction,
            user_message=message,
            history=history,
            user_context_str=user_context_str,
            schemes_context_str=schemes_context_str,
            lang=lang
        )

        if gemini_reply:
            return jsonify({
                "reply": gemini_reply,
                "status": "success",
                "source": "gemini_ai",
                "matched_schemes_count": len(top_schemes)
            }), 200

        # =========================================================================
        # 5. HIGH-FIDELITY APPLICATION-SPECIFIC GROUNDED FALLBACK ENGINE
        # Used when external LLM is offline, key is unconfigured, or quota is paused.
        # Handles user intents with zero mock data and accurate project workflows.
        # =========================================================================

        # Intent 1: Unrelated questions check
        unrelated_indicators = [
            "capital of", "weather in", "recipe for", "bake a cake", "write python", "write code",
            "who is cristiano", "who is messi", "movie", "song", "lyrics", "joke", "tell me a joke",
            "cricket match", "football", "who won", "president of usa", "france"
        ]
        has_app_scheme_intent = any(k in msg_lower for k in [
            "yojana", "scheme", "hunter", "profile", "interview", "register", "login", "apply",
            "eligib", "document", "kisan", "vidyalakshmi", "student", "farmer", "subsidy", "portal"
        ])
        if any(u in msg_lower for u in unrelated_indicators) and not has_app_scheme_intent:
            return jsonify({
                "reply": (
                    "I am your **Yojana Hunter Assistant**, designed specifically to help you discover Indian government "
                    "welfare schemes, verify eligibility criteria, and navigate the Yojana Hunter platform.\n\n"
                    "How can I help you with government schemes, your profile, or application procedures today?"
                ),
                "status": "success",
                "source": "polite_redirection"
            }), 200

        # Intent 2: Registration & Login help
        if any(w in msg_lower for w in ["register", "sign up", "signup", "create account", "new account", "how to register"]):
            return jsonify({
                "reply": (
                    "### How to Register on Yojana Hunter:\n\n"
                    "1. Click **Register** on the top navigation bar or go to `/register`.\n"
                    "2. Enter your **Full Name**, **Email Address**, **Mobile Number**, and a secure **Password**.\n"
                    "3. Click **Create Account** to sign up.\n\n"
                    "Once registered, you can complete your profile or start the **Conversational Interview** to find personalized welfare schemes!"
                ),
                "status": "success",
                "source": "app_guidance_registration"
            }), 200

        if any(w in msg_lower for w in ["how to login", "how do i login", "sign in", "signin", "login help", "forgot password"]):
            return jsonify({
                "reply": (
                    "### How to Log In to Yojana Hunter:\n\n"
                    "• **Citizen Login**: Visit `/login` and enter your registered email and password.\n"
                    "• **Admin Portal**: Administrators can log in separately at `/admin/login`.\n\n"
                    "After logging in, your saved profile, matched schemes, and action plan will be instantly accessible."
                ),
                "status": "success",
                "source": "app_guidance_login"
            }), 200

        # Intent 3: Profile & Occupation setup
        if any(w in msg_lower for w in ["profile", "occupation", "update details", "income details", "change state", "edit profile"]):
            return jsonify({
                "reply": (
                    "### Managing Your Profile on Yojana Hunter:\n\n"
                    "1. Navigate to the **Profile** tab (`/profile`) from the top or bottom navigation bar.\n"
                    "2. Fill in or update your key criteria:\n"
                    "   • **Occupation** (e.g. Student, Farmer, Salaried Employee, Business Owner, Woman Entrepreneur)\n"
                    "   • **State Domicile** (e.g. Maharashtra, Karnataka, All India)\n"
                    "   • **Annual Family Income**\n"
                    "   • **Age & Social Category**\n"
                    "3. Click **Save Profile**.\n\n"
                    "Your details are saved securely and used by our eligibility engine to compute exact match scores for every government scheme."
                ),
                "status": "success",
                "source": "app_guidance_profile"
            }), 200

        # Intent 4: Conversational Interview
        if any(w in msg_lower for w in ["conversational interview", "interview page", "chat interview", "what is interview", "how does interview work"]):
            return jsonify({
                "reply": (
                    "### Conversational Interview on Yojana Hunter:\n\n"
                    "The **Conversational Interview** (`/interview`) is an interactive, step-by-step chat guide that helps you build your profile in under 2 minutes without filling out lengthy forms:\n\n"
                    "• It asks 7 simple questions (Occupation, Gender, Income, Age, State, Education, and Category).\n"
                    "• Gender validation automatically filters out non-applicable schemes (e.g. Women & Child schemes for male citizens).\n"
                    "• You can choose from quick-select option buttons or type custom answers (e.g. 'Other' occupation or custom gender).\n"
                    "• Once finished, your profile is complete and the system instantly ranks all matching government welfare schemes for you!"
                ),
                "status": "success",
                "source": "app_guidance_interview"
            }), 200

        # Intent 5: Scheme Discovery & Catalog
        if any(w in msg_lower for w in ["discover scheme", "search scheme", "filter scheme", "scheme catalog", "find scheme", "browse scheme", "all schemes"]):
            return jsonify({
                "reply": (
                    f"### Discovering Schemes on Yojana Hunter:\n\n"
                    f"Yojana Hunter indexes **{len(schemes)} verified central and state welfare schemes** across Agriculture, Education, Healthcare, and Entrepreneurship.\n\n"
                    "To find schemes:\n"
                    "1. Go to the **Schemes** tab (`/schemes`).\n"
                    "2. Use the **Search bar** to search by name or keyword.\n"
                    "3. Use the filter dropdowns to filter by **Category**, **State**, or **Target Occupation**.\n"
                    "4. Click on any scheme card to view full criteria, benefits, and required certificates."
                ),
                "status": "success",
                "source": "app_guidance_schemes"
            }), 200

        # Intent 6: Eligibility Checking
        if any(w in msg_lower for w in ["am i eligible", "check my eligibility", "how to check eligibility", "eligibility check", "match score"]):
            if user_occ:
                user_schemes = SchemeEligibilityService.get_ranked_schemes_for_profile(profile_dict)
                eligible_names = [f"**{s['name']}** ({s['category']})" for s in user_schemes[:4]]
                if eligible_names:
                    reply = (
                        f"Based on your profile as a **{user_occ}** from **{user_state or 'India'}** "
                        f"with family income **{user_income or '< 1 Lakh'}**, you match the following schemes:\n\n"
                        + "\n".join([f"• {name}" for name in eligible_names]) +
                        "\n\nYou can review complete criteria breakdowns and apply directly under the **Schemes** tab."
                    )
                else:
                    reply = (
                        f"Based on your current profile as a **{user_occ}**, we evaluated 40+ government schemes. "
                        "Some mandatory criteria (such as income ceiling or state domicile) require review. "
                        "Please check your **Profile** to ensure all details are up-to-date."
                    )
            else:
                reply = (
                    "### How to Check Your Eligibility:\n\n"
                    "1. Set up your profile on the **Profile** page (`/profile`) or through the **Conversational Interview** (`/interview`).\n"
                    "2. Visit the **Schemes** page (`/schemes`) to see match percentages automatically calculated for your profile.\n"
                    "3. Open any scheme detail page (`/schemes/:id`) and click **Check Eligibility** to see a pass/fail breakdown of Age, Income Ceiling, State, and Occupation requirements."
                )
            return jsonify({"reply": reply, "status": "success", "source": "eligibility_guidance"}), 200

        # Intent 7: Application procedures & Action Plan
        if any(w in msg_lower for w in ["how to apply", "application procedure", "application process", "action plan", "portal"]):
            if top_schemes:
                primary = top_schemes[0]
                reply = (
                    f"### How to Apply for {primary.name}:\n\n"
                    f"1. **Review Criteria**: Ensure you satisfy the age and income ceiling.\n"
                    f"2. **Prepare Certificates**: Gather mandatory documents listed on the scheme page.\n"
                    f"3. **Submit Application**: Apply directly through the official government portal:\n"
                    f"   🔗 [Official Portal]({primary.application_url or primary.official_source_url})\n\n"
                    f"You can also visit your **Action Plan** (`/action-plan`) for a personalized application roadmap."
                )
            else:
                reply = (
                    "### How to Apply for Government Schemes on Yojana Hunter:\n\n"
                    "1. Find your desired scheme on the **Schemes** page (`/schemes`).\n"
                    "2. Open the scheme card to inspect the official requirements, deadlines, and benefits.\n"
                    "3. Click **Apply Online** to navigate directly to the verified official government portal (`.gov.in`).\n"
                    "4. Use the **Action Plan** tab (`/action-plan`) to track required certificates and steps."
                )
            return jsonify({"reply": reply, "status": "success", "source": "application_procedure"}), 200

        # Intent 8: Documents and Certificates
        if any(w in msg_lower for w in ["document", "certificate", "paper", "proof", "upload"]):
            if top_schemes and top_schemes[0].document_requirements:
                primary = top_schemes[0]
                docs = [f"• **{d.document_name}**: {d.description or 'Mandatory verification document'}" for d in primary.document_requirements[:5]]
                reply = (
                    f"### Required Documents for {primary.name}:\n\n"
                    + "\n".join(docs) +
                    f"\n\n**Official Portal:** [Apply Online Here]({primary.application_url or primary.official_source_url})"
                )
            else:
                reply = (
                    "### Common Documents Required for Government Schemes:\n\n"
                    "• **Identity & Address**: Aadhaar Card, Voter ID, Ration Card\n"
                    "• **Income Proof**: Tahsildar Income Certificate / Salary Slip\n"
                    "• **Domicile Certificate**: State Residence Certificate\n"
                    "• **Category Certificate**: Caste Certificate (for SC/ST/OBC/EWS quotas)\n"
                    "• **Financial Details**: Bank Passbook linked with Aadhaar (DBT active)\n\n"
                    "You can view scheme-specific document requirements on each scheme detail page or under **Action Plan**."
                )
            return jsonify({"reply": reply, "status": "success", "source": "documents_guidance"}), 200

        # Intent 9: Specific Scheme Queries from Knowledge Base
        if top_schemes:
            primary = top_schemes[0]
            docs = [d.document_name for d in primary.document_requirements]
            doc_str = ", ".join(docs[:4]) if docs else "Aadhaar Card, Bank Passbook"

            if any(w in msg_lower for w in ["benefit", "money", "amount", "subsidy", "loan"]):
                reply = (
                    f"### Benefits of {primary.name}:\n\n"
                    f"{primary.benefits}\n\n"
                    f"• **Category:** {primary.category} | State: {primary.state}\n"
                    f"• **Official Portal:** [Official Guidelines & Application]({primary.application_url or primary.official_source_url})"
                )
            elif any(w in msg_lower for w in ["schemes for", "list", "all schemes"]) and len(top_schemes) > 1:
                target_title = "Farmers" if "farmer" in msg_lower else ("Students" if "student" in msg_lower else ("Women & Entrepreneurs" if ("woman" in msg_lower or "business" in msg_lower) else "Eligible Citizens"))
                reply_lines = [f"### Top Verified Schemes for {target_title}:\n"]
                for idx, sc in enumerate(top_schemes[:4], 1):
                    sc_docs = [d.document_name for d in sc.document_requirements]
                    doc_preview = ", ".join(sc_docs[:3]) if sc_docs else "Aadhaar, Bank Passbook"
                    reply_lines.append(
                        f"**{idx}. {sc.name}**\n"
                        f"• **Benefits:** {sc.benefits[:160]}...\n"
                        f"• **Eligibility:** {sc.occupation or 'All eligible'} | State: {sc.state}\n"
                        f"• **Key Documents:** {doc_preview}\n"
                        f"• **Portal:** [Apply Online]({sc.application_url or sc.official_source_url})\n"
                    )
                reply = "\n".join(reply_lines)
            else:
                reply = (
                    f"### {primary.name}\n\n"
                    f"{primary.short_description or primary.description[:250]}\n\n"
                    f"**Key Benefits:**\n{primary.benefits[:200]}...\n\n"
                    f"**Eligibility Highlights:**\n"
                    f"• Target Group: {primary.occupation or ', '.join(primary.target_occupations or ['Eligible citizens'])}\n"
                    f"• State: {primary.state}\n"
                    + (f"• Income Ceiling: Family income ≤ ₹{primary.income_max:,.0f}\n" if primary.income_max else "")
                    + f"• Key Documents: {doc_str}\n\n"
                    f"🔗 [Official Application Link]({primary.application_url or primary.official_source_url})"
                )

            return jsonify({
                "reply": reply,
                "status": "success",
                "source": "knowledge_base_retrieval",
                "scheme_slug": primary.slug
            }), 200

        # Intent 10: General greeting
        greeting_words = ["hello", "hi", "hey", "namaste", "greetings"]
        if any(w in msg_lower.split() for w in greeting_words) or len(msg_lower.split()) <= 2:
            reply = (
                "Hello and welcome to **Yojana Hunter**!\n\n"
                "I am your real-time assistant. I can help you with:\n"
                "• **How to use Yojana Hunter** (Registering, setting up your Profile, or taking the Conversational Interview)\n"
                "• **Discovering schemes** (Farmer subsidies, student scholarships, women empowerment loans)\n"
                "• **Checking eligibility** and understanding required official certificates\n"
                "• **Direct links to official government application portals**\n\n"
                "What would you like to explore today?"
            )
            return jsonify({"reply": reply, "status": "success", "source": "assistant_guide"}), 200

        # General Fallback
        reply = (
            f"I could not find a verified scheme or application guide matching \"{message}\".\n\n"
            "You can:\n"
            "• Ask about an occupation: *'What schemes are available for farmers or students?'*\n"
            "• Ask about platform features: *'How do I create my profile?'* or *'How do I check eligibility?'*\n"
            "• Search specific programs like **PM-KISAN**, **PM Vidyalakshmi**, or **Stand-Up India**."
        )
        return jsonify({
            "reply": reply,
            "status": "success",
            "source": "fallback_clarification"
        }), 200

    except Exception as e:
        logger.error(f"Chatbot processing error: {e}", exc_info=True)
        return jsonify({
            "reply": "I encountered a temporary issue processing your question. Please try asking again or explore schemes directly via the Schemes tab.",
            "status": "error"
        }), 200
    finally:
        db.close()
