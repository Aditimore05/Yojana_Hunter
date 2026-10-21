import logging
from flask import Blueprint, request, jsonify, g
from database import SessionLocal
from utils.auth import token_required, optional_auth
from services.subscription_service import SubscriptionService

logger = logging.getLogger(__name__)

subscriptions_bp = Blueprint("subscriptions", __name__)

@subscriptions_bp.route("/plans", methods=["GET"])
def get_subscription_plans():
    """
    GET /api/subscriptions/plans
    Returns list of active subscription plans, pricing, and Free vs Premium comparison.
    """
    plans_data = SubscriptionService.get_plans()
    return jsonify(plans_data)

@subscriptions_bp.route("/my-status", methods=["GET"])
@token_required
def get_my_subscription_status():
    """
    GET /api/subscriptions/my-status
    Returns the authenticated user's active plan, expiry date, and pending requests.
    """
    db = SessionLocal()
    try:
        user = g.current_user
        status = SubscriptionService.get_user_subscription_status(db, user.id)
        return jsonify(status)
    except Exception as e:
        logger.error(f"Error fetching subscription status for user {g.current_user.id}: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@subscriptions_bp.route("/request", methods=["POST"])
@token_required
def submit_subscription_request():
    """
    POST /api/subscriptions/request
    Submits a demo subscription request for admin review and approval.
    Does NOT charge real money or connect to a payment gateway.
    """
    db = SessionLocal()
    try:
        user = g.current_user
        payload = request.get_json() or {}
        plan_id = payload.get("plan_id") or payload.get("planId")
        notes = payload.get("admin_notes") or payload.get("notes")

        if not plan_id:
            return jsonify({
                "error": "Plan selection required",
                "message": "Please choose a valid subscription plan (monthly, two_months, yearly)."
            }), 400

        success, message, sub_req = SubscriptionService.create_subscription_request(
            db, 
            user_id=user.id, 
            plan_id=plan_id, 
            admin_notes=notes
        )

        if not success:
            return jsonify({
                "error": "Request rejected",
                "message": message,
                "request": sub_req.to_dict(include_user=False) if sub_req else None
            }), 400

        return jsonify({
            "message": message,
            "request": sub_req.to_dict(include_user=False)
        }), 201

    except Exception as e:
        db.rollback()
        logger.error(f"Error submitting subscription request: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@subscriptions_bp.route("/cancel", methods=["POST"])
@token_required
def cancel_subscription_request():
    """
    POST /api/subscriptions/cancel
    Allows a citizen to cancel their pending subscription request.
    """
    db = SessionLocal()
    try:
        user = g.current_user
        payload = request.get_json() or {}
        request_id = payload.get("request_id") or payload.get("requestId")

        if not request_id:
            return jsonify({"error": "Request ID is required."}), 400

        success, message = SubscriptionService.cancel_subscription_request(
            db, 
            user_id=user.id, 
            request_id=int(request_id)
        )

        if not success:
            return jsonify({"error": message}), 400

        return jsonify({"message": message}), 200

    except Exception as e:
        db.rollback()
        logger.error(f"Error cancelling subscription request: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
