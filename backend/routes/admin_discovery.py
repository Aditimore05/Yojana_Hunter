import datetime
import logging
from flask import Blueprint, request, jsonify, g
from database import SessionLocal
from models import Scheme, SchemeReviewHistory, SchemeChangeLog, DiscoveryJob, DiscoveryJobLog
from utils.auth import admin_required
from services.discovery_service import DiscoveryService
from services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

admin_discovery_bp = Blueprint("admin_discovery", __name__)


# ==========================================
# 1. DISCOVERY JOBS LIFECYCLE
# ==========================================

@admin_discovery_bp.route("/discovery-jobs", methods=["POST"])
@admin_required
def create_discovery_job():
    """
    POST /api/admin/discovery-jobs
    Triggers a new Gemini Google Search grounded scheme discovery job.
    """
    data = request.get_json() or {}
    admin_id = getattr(g.current_user, "id", None)

    raw_limit = data.get("maxQueries") or data.get("max_queries") or data.get("searchLimit") or data.get("limit") or 4
    try:
        max_queries = max(1, min(int(raw_limit), 10))
    except (ValueError, TypeError):
        max_queries = 4

    state_val = str(data.get("state") or "").strip()
    if not state_val or state_val.lower() == "all":
        state_val = "All India"

    cat_val = str(data.get("category") or "").strip()
    if not cat_val or cat_val.lower() in ("all", "all beneficiary categories"):
        cat_val = "All"

    parameters = {
        "state": state_val,
        "category": cat_val,
        "department": (data.get("department") or "").strip() or None,
        "query": (data.get("query") or "").strip() or None,
        "max_queries": max_queries,
    }

    result = DiscoveryService.start_discovery_job(
        parameters=parameters,
        admin_user_id=admin_id
    )

    status_code = 201 if result.get("success") else 400
    return jsonify(result), status_code


@admin_discovery_bp.route("/discovery-jobs", methods=["GET"])
@admin_required
def list_discovery_jobs():
    """
    GET /api/admin/discovery-jobs
    Returns paginated history of discovery jobs.
    """
    db = SessionLocal()
    try:
        limit = min(int(request.args.get("limit", 20)), 100)
        offset = max(int(request.args.get("offset", 0)), 0)
        status_filter = request.args.get("status")

        query = db.query(DiscoveryJob)
        if status_filter and status_filter.lower() != "all":
            query = query.filter(DiscoveryJob.status == status_filter)

        total_count = query.count()
        jobs = query.order_by(DiscoveryJob.created_at.desc()).offset(offset).limit(limit).all()

        return jsonify({
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "activeJobId": DiscoveryService.get_active_job_id(),
            "jobs": [j.to_dict(include_logs=False) for j in jobs]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@admin_discovery_bp.route("/discovery-jobs/<string:job_id>", methods=["GET"])
@admin_required
def get_discovery_job(job_id: str):
    """
    GET /api/admin/discovery-jobs/<job_id>
    Returns detailed statistics, parameters, and logs for a specific discovery job.
    """
    db = SessionLocal()
    try:
        job = None
        if job_id.isdigit():
            job = db.query(DiscoveryJob).filter(DiscoveryJob.id == int(job_id)).first()
        if not job:
            job = db.query(DiscoveryJob).filter(DiscoveryJob.job_id == job_id).first()

        if not job:
            return jsonify({"error": f"Discovery job '{job_id}' not found", "status_code": 404}), 404

        data = job.to_dict(include_logs=True)
        # Fetch discovered schemes summary
        schemes = db.query(Scheme).filter(Scheme.discovery_job_id == job.id).all()
        data["discoveredSchemes"] = [
            {
                "id": s.id,
                "slug": s.slug,
                "name": s.name,
                "category": s.category,
                "state": s.state,
                "adminReviewStatus": s.admin_review_status,
                "applicationStatus": s.application_status
            }
            for s in schemes
        ]

        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@admin_discovery_bp.route("/discovery-jobs/<string:job_id>/cancel", methods=["POST"])
@admin_required
def cancel_discovery_job(job_id: str):
    """
    POST /api/admin/discovery-jobs/<job_id>/cancel
    Signals a running discovery job to gracefully cancel.
    """
    success = DiscoveryService.request_cancel(job_id)
    if success:
        return jsonify({"message": f"Cancellation requested for job {job_id}.", "success": True}), 200
    return jsonify({"error": "Job is not actively running or cannot be cancelled.", "success": False}), 400


# ==========================================
# 2. SCHEME REVIEW & APPROVAL WORKFLOW
# ==========================================

@admin_discovery_bp.route("/schemes/pending-review", methods=["GET"])
@admin_required
def list_schemes_pending_review():
    """
    GET /api/admin/schemes/pending-review
    Returns discovered schemes awaiting administrative approval or verification.
    """
    db = SessionLocal()
    try:
        review_status = request.args.get("reviewStatus", "pending_review")
        limit = min(int(request.args.get("limit", 50)), 100)

        query = db.query(Scheme)
        if review_status and review_status != "all":
            query = query.filter(Scheme.admin_review_status == review_status)

        schemes = query.order_by(Scheme.created_at.desc()).limit(limit).all()

        return jsonify({
            "count": len(schemes),
            "schemes": [s.to_dict(include_rules=False) for s in schemes]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@admin_discovery_bp.route("/schemes/<string:scheme_id>/approve", methods=["POST"])
@admin_required
def approve_scheme(scheme_id: str):
    """
    POST /api/admin/schemes/<scheme_id>/approve
    Approves a candidate scheme, marks it as published and active,
    and records an audit entry in SchemeReviewHistory.
    """
    data = request.get_json() or {}
    db = SessionLocal()
    try:
        scheme = None
        if scheme_id.isdigit():
            scheme = db.query(Scheme).filter(Scheme.id == int(scheme_id)).first()
        if not scheme:
            scheme = db.query(Scheme).filter(Scheme.slug == scheme_id).first()

        if not scheme:
            return jsonify({"error": f"Scheme '{scheme_id}' was not found"}), 404

        prev_data = {
            "status": scheme.status,
            "isActive": scheme.is_active,
            "adminReviewStatus": scheme.admin_review_status
        }

        # Apply approval
        scheme.status = "published"
        scheme.is_active = True
        scheme.admin_review_status = "approved"
        scheme.rejection_reason = None
        scheme.updated_by_admin_id = getattr(g.current_user, "id", None)
        scheme.updated_at = datetime.datetime.utcnow()

        # Audit review history
        review_entry = SchemeReviewHistory(
            scheme_id=scheme.id,
            admin_id=getattr(g.current_user, "id", None),
            action="approve",
            reason=data.get("notes") or "Scheme officially approved and published to citizen portal.",
            previous_data=prev_data,
            new_data={"status": "published", "isActive": True, "adminReviewStatus": "approved"},
            timestamp=datetime.datetime.utcnow()
        )
        db.add(review_entry)
        db.commit()

        return jsonify({
            "message": f"Scheme '{scheme.name}' approved and published successfully.",
            "scheme": scheme.to_dict(include_rules=False)
        }), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@admin_discovery_bp.route("/schemes/<string:scheme_id>/reject", methods=["POST"])
@admin_required
def reject_scheme(scheme_id: str):
    """
    POST /api/admin/schemes/<scheme_id>/reject
    Rejects a candidate scheme with a required reason, marks it as draft/inactive,
    and records an audit entry in SchemeReviewHistory.
    """
    data = request.get_json() or {}
    reason = str(data.get("reason") or "").strip()
    if not reason:
        return jsonify({"error": "A rejection reason is required."}), 400

    db = SessionLocal()
    try:
        scheme = None
        if scheme_id.isdigit():
            scheme = db.query(Scheme).filter(Scheme.id == int(scheme_id)).first()
        if not scheme:
            scheme = db.query(Scheme).filter(Scheme.slug == scheme_id).first()

        if not scheme:
            return jsonify({"error": f"Scheme '{scheme_id}' was not found"}), 404

        prev_data = {
            "status": scheme.status,
            "isActive": scheme.is_active,
            "adminReviewStatus": scheme.admin_review_status
        }

        scheme.status = "draft"
        scheme.is_active = False
        scheme.admin_review_status = "rejected"
        scheme.rejection_reason = reason
        scheme.updated_by_admin_id = getattr(g.current_user, "id", None)
        scheme.updated_at = datetime.datetime.utcnow()

        review_entry = SchemeReviewHistory(
            scheme_id=scheme.id,
            admin_id=getattr(g.current_user, "id", None),
            action="reject",
            reason=reason,
            previous_data=prev_data,
            new_data={"status": "draft", "isActive": False, "adminReviewStatus": "rejected", "reason": reason},
            timestamp=datetime.datetime.utcnow()
        )
        db.add(review_entry)
        db.commit()

        return jsonify({
            "message": f"Scheme '{scheme.name}' has been rejected.",
            "scheme": scheme.to_dict(include_rules=False)
        }), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@admin_discovery_bp.route("/schemes/<string:scheme_id>/reverify", methods=["POST"])
@admin_required
def reverify_scheme(scheme_id: str):
    """
    POST /api/admin/schemes/<scheme_id>/reverify
    Flags a scheme for re-verification due to conflicting sources or stale deadlines.
    """
    data = request.get_json() or {}
    notes = data.get("notes") or "Admin requested re-verification."

    db = SessionLocal()
    try:
        scheme = None
        if scheme_id.isdigit():
            scheme = db.query(Scheme).filter(Scheme.id == int(scheme_id)).first()
        if not scheme:
            scheme = db.query(Scheme).filter(Scheme.slug == scheme_id).first()

        if not scheme:
            return jsonify({"error": f"Scheme '{scheme_id}' was not found"}), 404

        prev_status = scheme.admin_review_status
        scheme.admin_review_status = "needs_verification"
        scheme.verification_notes = notes
        scheme.updated_by_admin_id = getattr(g.current_user, "id", None)
        scheme.updated_at = datetime.datetime.utcnow()

        review_entry = SchemeReviewHistory(
            scheme_id=scheme.id,
            admin_id=getattr(g.current_user, "id", None),
            action="reverify",
            reason=notes,
            previous_data={"adminReviewStatus": prev_status},
            new_data={"adminReviewStatus": "needs_verification"},
            timestamp=datetime.datetime.utcnow()
        )
        db.add(review_entry)
        db.commit()

        return jsonify({
            "message": f"Scheme '{scheme.name}' marked for re-verification.",
            "scheme": scheme.to_dict(include_rules=False)
        }), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@admin_discovery_bp.route("/schemes/<string:scheme_id>/history", methods=["GET"])
@admin_required
def get_scheme_review_history(scheme_id: str):
    """
    GET /api/admin/schemes/<scheme_id>/history
    Returns audit review history and change logs for a scheme.
    """
    db = SessionLocal()
    try:
        scheme = None
        if scheme_id.isdigit():
            scheme = db.query(Scheme).filter(Scheme.id == int(scheme_id)).first()
        if not scheme:
            scheme = db.query(Scheme).filter(Scheme.slug == scheme_id).first()

        if not scheme:
            return jsonify({"error": f"Scheme '{scheme_id}' was not found"}), 404

        reviews = db.query(SchemeReviewHistory).filter(SchemeReviewHistory.scheme_id == scheme.id).order_by(SchemeReviewHistory.timestamp.desc()).all()
        changes = db.query(SchemeChangeLog).filter(SchemeChangeLog.scheme_id == scheme.id).order_by(SchemeChangeLog.detected_at.desc()).all()

        return jsonify({
            "schemeId": scheme.slug,
            "schemeName": scheme.name,
            "reviewHistory": [r.to_dict() for r in reviews],
            "changeLogs": [
                {
                    "id": c.id,
                    "summary": c.change_summary,
                    "detectedAt": c.detected_at.isoformat() if c.detected_at else None
                }
                for c in changes
            ]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@admin_discovery_bp.route("/gemini/status", methods=["GET"])
@admin_required
def get_gemini_status():
    """
    GET /api/admin/gemini/status
    Tests and returns server-side Gemini connectivity and Google Search grounding status.
    """
    status = GeminiService.test_connection()
    return jsonify(status), 200


@admin_discovery_bp.route("/gemini/test", methods=["GET", "POST"])
@admin_required
def test_gemini_connection():
    """
    POST /api/admin/gemini/test
    Tests live Gemini API gateway, model connectivity, and Google Search grounding.
    """
    status = GeminiService.test_connection()
    return jsonify({
        "success": status.get("connected", False),
        "message": status.get("message", "Connection test completed."),
        "model": status.get("model"),
        "groundingSupported": status.get("groundingSupported", False),
        "groundingStatus": status.get("groundingStatus", ""),
        "latencyMs": status.get("latencyMs", 0),
        "details": status
    }), 200


# ==========================================
# 4. AUTOMATED SCHEDULED DISCOVERY
# ==========================================

@admin_discovery_bp.route("/discovery/schedule", methods=["GET"])
@admin_required
def get_discovery_schedule():
    """
    GET /api/admin/discovery/schedule
    Returns current automated discovery schedule configuration and execution status.
    """
    try:
        from services.scheduler_service import SchedulerService
        data = SchedulerService.get_schedule_info()
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Failed to fetch discovery schedule: {e}")
        return jsonify({"error": str(e)}), 500


@admin_discovery_bp.route("/discovery/schedule", methods=["POST", "PUT"])
@admin_required
def update_discovery_schedule():
    """
    POST /api/admin/discovery/schedule
    Updates automated background discovery interval and active toggle.
    """
    data = request.get_json() or {}
    try:
        from services.scheduler_service import SchedulerService
        res = SchedulerService.update_schedule(
            is_enabled=data.get("isEnabled"),
            frequency_hours=data.get("frequencyHours"),
            parameters=data.get("parameters")
        )
        return jsonify({
            "message": "Automated discovery schedule updated successfully.",
            "schedule": res
        }), 200
    except Exception as e:
        logger.error(f"Failed to update discovery schedule: {e}")
        return jsonify({"error": str(e)}), 500


@admin_discovery_bp.route("/discovery/schedule/run-now", methods=["POST"])
@admin_required
def trigger_scheduled_discovery_now():
    """
    POST /api/admin/discovery/schedule/run-now
    Triggers an immediate scheduled discovery run.
    """
    try:
        from services.scheduler_service import SchedulerService
        res = SchedulerService.trigger_scheduled_run(reason="manual_admin_trigger")
        status_code = 200 if res.get("success") else 400
        return jsonify(res), status_code
    except Exception as e:
        logger.error(f"Failed to trigger scheduled discovery: {e}")
        return jsonify({"error": str(e)}), 500

