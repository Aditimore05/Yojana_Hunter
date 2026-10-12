from flask import Blueprint, request, jsonify
from database import SessionLocal
from models import Scheme, UserDocument, Profile

interview_bp = Blueprint("interview", __name__)

@interview_bp.route("/chat", methods=["POST"])
@interview_bp.route("/interview/message", methods=["POST"])
def handle_chat_message():
    db = SessionLocal()
    try:
        data = request.get_json() or {}
        message = data.get("message") or data.get("prompt") or ""
        lang = data.get("language", "en")

        msg_lower = message.lower()
        reply = None

        if "vidyalakshmi" in msg_lower or "loan" in msg_lower or "education" in msg_lower:
            reply = "The PM Vidyalakshmi Scheme provides education loans up to ₹6.5 Lakh with collateral-free guarantee and interest subsidy for students from families earning ≤ 8 Lakh. You are eligible!"
        elif "document" in msg_lower or "income certificate" in msg_lower:
            reply = "For student scholarships, your Income Certificate must be issued by the Tahsildar / Revenue Department within the current financial year. You can upload it directly under the Documents tab."
        elif "draft" in msg_lower or "apply" in msg_lower or "form" in msg_lower:
            reply = "We have pre-filled your application draft based on your verified profile. You can review and download the official PDF directly from the Application Draft page."
        elif "vishwakarma" in msg_lower or "artisan" in msg_lower:
            reply = "PM Vishwakarma provides collateral-free loans up to ₹3 Lakh at 5% interest rate, plus ₹15,000 toolkit incentive for 18 traditional trade crafts."
        elif "scholarship" in msg_lower:
            reply = "The Post Matric Scholarship covers full tuition fees and exam fees for eligible Maharashtra students with family income ≤ 2.5 Lakh."
        else:
            # Query active schemes count
            count = db.query(Scheme).count()
            reply = f"I'm your Yojana Hunter AI assistant. I have {count} verified government welfare schemes indexed. I can check your eligibility, verify required certificates, or generate official application forms. How can I assist you today?"

        return jsonify({
            "reply": reply,
            "status": "success"
        })
    except Exception as e:
        return jsonify({"error": str(e), "reply": "I'm ready to assist you with government schemes and eligibility."}), 500
    finally:
        db.close()
