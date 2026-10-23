import datetime
import logging
from typing import Dict, Any, Optional
from models import AuditLog, Profile, SavedScheme, Application

logger = logging.getLogger(__name__)

def record_activity(db, user_id: int, action: str, details: Optional[Dict[str, Any]] = None, ip_address: Optional[str] = None):
    """
    Safely records a citizen activity into the audit_logs database table.
    """
    if not user_id:
        return None
    try:
        log = AuditLog(
            user_id=user_id,
            action=action,
            details=details or {},
            ip_address=ip_address,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(log)
        db.commit()
        return log
    except Exception as e:
        logger.warning(f"Failed to record activity '{action}' for user {user_id}: {e}")
        try:
            db.rollback()
        except Exception:
            pass
        return None

def compute_user_level(profile: Optional[Profile], activity_count: int = 0, saved_count: int = 0, application_count: int = 0) -> Dict[str, Any]:
    """
    Dynamically calculates citizen user level and entitlement progression:
    - Profile Completeness: up to 40 pts
    - Real Interactions / Searches: up to 30 pts (5 pts per activity, max 30)
    - Saved Schemes: up to 20 pts (10 pts per saved scheme, max 20)
    - Applications Drafted / Submitted: up to 10 pts (10 pts if any application exists)
    Total: 0 - 100 points
    """
    completeness = (profile.completeness_percent or 0) if profile else 0
    profile_pts = int(round(completeness * 0.4))
    
    activity_pts = min(30, activity_count * 5)
    saved_pts = min(20, saved_count * 10)
    app_pts = 10 if application_count > 0 else 0
    
    total_score = min(100, profile_pts + activity_pts + saved_pts + app_pts)
    
    if total_score < 25:
        level = 1
        level_name = "New Citizen"
        badge_color = "blue"
        next_level = 2
        next_threshold = 25
    elif total_score < 50:
        level = 2
        level_name = "Scheme Explorer"
        badge_color = "teal"
        next_level = 3
        next_threshold = 50
    elif total_score < 75:
        level = 3
        level_name = "Active Beneficiary"
        badge_color = "indigo"
        next_level = 4
        next_threshold = 75
    elif total_score < 90:
        level = 4
        level_name = "Verified Beneficiary"
        badge_color = "purple"
        next_level = 5
        next_threshold = 90
    else:
        level = 5
        level_name = "Scheme Champion"
        badge_color = "amber"
        next_level = 5
        next_threshold = 100
        
    points_to_next = max(0, next_threshold - total_score)
    
    return {
        "level": level,
        "levelName": level_name,
        "score": total_score,
        "maxScore": 100,
        "nextLevel": next_level,
        "nextThreshold": next_threshold,
        "pointsToNext": points_to_next,
        "badgeColor": badge_color,
        "progressPercent": total_score,
        "breakdown": {
            "profilePoints": profile_pts,
            "activityPoints": activity_pts,
            "savedSchemesPoints": saved_pts,
            "applicationPoints": app_pts,
        }
    }
