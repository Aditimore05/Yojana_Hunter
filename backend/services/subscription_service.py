import datetime
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.orm import joinedload
from models import SubscriptionRequest, User, Profile

FREE_SCHEMES_LIMIT = 5

SUBSCRIPTION_PLANS: Dict[str, Dict[str, Any]] = {
    "monthly": {
        "id": "monthly",
        "name": "Monthly Access",
        "price": 50,
        "currency": "INR",
        "duration_days": 30,
        "duration_label": "1 Month",
        "popular": False,
        "badge": "Flexible",
        "description": "Ideal for immediate scheme applications and fast verification.",
        "features": [
            "Full access to all matching government schemes (unlimited)",
            "Instant AI eligibility evaluation & detailed criteria breakdown",
            "Direct application portal links & procedure guidance",
            "Complete document checklists for every scheme",
            "Priority scheme update notifications",
            "30 days uninterrupted validity"
        ]
    },
    "two_months": {
        "id": "two_months",
        "name": "2 Months Standard",
        "price": 100,
        "currency": "INR",
        "duration_days": 60,
        "duration_label": "2 Months",
        "popular": False,
        "badge": "Standard",
        "description": "Perfect for seasonal schemes and continuous tracking across cycles.",
        "features": [
            "Full access to all matching government schemes (unlimited)",
            "Instant AI eligibility evaluation & detailed criteria breakdown",
            "Direct application portal links & procedure guidance",
            "Complete document checklists for every scheme",
            "Multi-scheme tracking & application reminders",
            "60 days uninterrupted validity"
        ]
    },
    "yearly": {
        "id": "yearly",
        "name": "Yearly Premium Pass",
        "price": 500,  # Configurable price
        "currency": "INR",
        "duration_days": 365,
        "duration_label": "12 Months (1 Year)",
        "popular": True,
        "badge": "Best Value (Save ₹100)",
        "description": "Complete year-round coverage for your entire family across Central and State schemes.",
        "features": [
            "Full access to all matching government schemes (unlimited)",
            "Instant AI eligibility evaluation & detailed criteria breakdown",
            "Direct application portal links & procedure guidance",
            "Complete document checklists for every scheme",
            "Priority AI scheme discovery alerts for newly launched schemes",
            "Dedicated family benefit tracking",
            "365 days uninterrupted full access"
        ]
    }
}

PLAN_COMPARISON = [
    {
        "feature": "View Matching Scheme Count",
        "free": "Yes (Total count shown)",
        "premium": "Yes (Total count shown)"
    },
    {
        "feature": "Accessible Scheme Details",
        "free": "First 5 matching schemes",
        "premium": "All matching schemes (Unlimited)"
    },
    {
        "feature": "Official Application Portal Links",
        "free": "First 5 schemes only",
        "premium": "All verified government schemes"
    },
    {
        "feature": "Required Document Checklists",
        "free": "First 5 schemes only",
        "premium": "Full checklists for all schemes"
    },
    {
        "feature": "Detailed Eligibility Explanations",
        "free": "First 5 schemes only",
        "premium": "Instant AI explanations on every scheme"
    },
    {
        "feature": "Application Tracking & Drafts",
        "free": "Limited",
        "premium": "Unlimited draft and application tracking"
    },
    {
        "feature": "New Scheme Launch Alerts",
        "free": "Standard",
        "premium": "Priority automated alerts"
    }
]


class SubscriptionService:
    """
    Manages citizen subscription tiers, manual admin approval workflow,
    and access limits without real payment processing.
    """

    @classmethod
    def get_plans(cls) -> Dict[str, Any]:
        """Returns all configured subscription plans and comparison matrix."""
        return {
            "plans": list(SUBSCRIPTION_PLANS.values()),
            "comparison": PLAN_COMPARISON,
            "free_limit": FREE_SCHEMES_LIMIT
        }

    @classmethod
    def get_active_subscription(cls, db, user_id: Optional[int]) -> Optional[SubscriptionRequest]:
        """
        Retrieves the active, non-expired approved subscription for a user.
        If an approved subscription has expired, marks it inactive.
        """
        if not user_id:
            return None

        now = datetime.datetime.utcnow()
        # Find approved subscriptions for this user
        sub = db.query(SubscriptionRequest).filter(
            SubscriptionRequest.user_id == user_id,
            SubscriptionRequest.status.in_(["approved", "Approved"])
        ).order_by(SubscriptionRequest.expires_at.desc()).first()

        if not sub:
            return None

        if sub.expires_at and sub.expires_at > now:
            if not sub.is_active:
                sub.is_active = True
                db.commit()
            return sub
        else:
            # Expired
            if sub.is_active:
                sub.is_active = False
                db.commit()
            return None

    @classmethod
    def is_user_premium(cls, db, user_id: Optional[int]) -> bool:
        """Determines if a user currently has an approved, unexpired premium pass."""
        if not user_id:
            return False
        return cls.get_active_subscription(db, user_id) is not None

    @classmethod
    def get_user_subscription_status(cls, db, user_id: Optional[int]) -> Dict[str, Any]:
        """
        Returns a rich status overview for the citizen profile:
        is_premium, active subscription details, pending request (if any),
        latest rejection (if any), and free tier limit.
        """
        if not user_id:
            return {
                "is_premium": False,
                "tier": "free",
                "free_limit": FREE_SCHEMES_LIMIT,
                "active_subscription": None,
                "pending_request": None,
                "has_pending_request": False,
                "latest_request": None
            }

        active = cls.get_active_subscription(db, user_id)
        
        # Check for pending request
        pending = db.query(SubscriptionRequest).filter(
            SubscriptionRequest.user_id == user_id,
            SubscriptionRequest.status.in_(["pending", "Pending"])
        ).order_by(SubscriptionRequest.requested_at.desc()).first()

        # Check latest request of any status
        latest = db.query(SubscriptionRequest).filter(
            SubscriptionRequest.user_id == user_id
        ).order_by(SubscriptionRequest.requested_at.desc()).first()

        days_remaining = None
        if active and active.expires_at:
            delta = active.expires_at - datetime.datetime.utcnow()
            days_remaining = max(0, delta.days)

        return {
            "is_premium": bool(active is not None),
            "tier": "premium" if active else "free",
            "free_limit": FREE_SCHEMES_LIMIT,
            "active_subscription": active.to_dict(include_user=False) if active else None,
            "days_remaining": days_remaining,
            "pending_request": pending.to_dict(include_user=False) if pending else None,
            "has_pending_request": pending is not None,
            "latest_request": latest.to_dict(include_user=False) if latest else None
        }

    @classmethod
    def create_subscription_request(
        cls, 
        db, 
        user_id: int, 
        plan_id: str, 
        admin_notes: Optional[str] = None
    ) -> Tuple[bool, str, Optional[SubscriptionRequest]]:
        """
        Submits a demo subscription request for admin approval.
        Prevents duplicate pending requests for the same user.
        """
        if plan_id not in SUBSCRIPTION_PLANS:
            return False, f"Invalid plan '{plan_id}'. Choose from: {', '.join(SUBSCRIPTION_PLANS.keys())}", None

        plan = SUBSCRIPTION_PLANS[plan_id]

        # 1. Prevent duplicate pending requests
        existing_pending = db.query(SubscriptionRequest).filter(
            SubscriptionRequest.user_id == user_id,
            SubscriptionRequest.status == "pending"
        ).first()

        if existing_pending:
            return False, f"You already have a pending subscription request for the {existing_pending.plan_name}. Please wait for admin approval or cancel your current request.", existing_pending

        # 2. Check if user already has an active subscription
        active = cls.get_active_subscription(db, user_id)
        if active:
            # User can still request extending/changing, but flag note
            note = f"User has active subscription until {active.expires_at.strftime('%d %b %Y')}. {admin_notes or ''}".strip()
        else:
            note = admin_notes

        req = SubscriptionRequest(
            user_id=user_id,
            plan_id=plan["id"],
            plan_name=plan["name"],
            amount=float(plan["price"]),
            currency=plan["currency"],
            duration_days=int(plan["duration_days"]),
            status="pending",
            admin_notes=note,
            requested_at=datetime.datetime.utcnow(),
            is_active=False
        )

        db.add(req)
        db.commit()
        db.refresh(req)

        return True, "Your subscription request has been submitted and is awaiting admin approval.", req

    @classmethod
    def cancel_subscription_request(cls, db, user_id: int, request_id: int) -> Tuple[bool, str]:
        """Allows a user to cancel their own pending subscription request."""
        req = db.query(SubscriptionRequest).filter(
            SubscriptionRequest.id == request_id,
            SubscriptionRequest.user_id == user_id
        ).first()

        if not req:
            return False, "Subscription request not found."

        if req.status != "pending":
            return False, f"Cannot cancel request with status '{req.status}'."

        req.status = "cancelled"
        req.is_active = False
        db.commit()
        return True, "Subscription request cancelled successfully."

    @classmethod
    def approve_subscription_request(
        cls, 
        db, 
        request_id: int, 
        admin_id: int
    ) -> Tuple[bool, str, Optional[SubscriptionRequest]]:
        """
        Admin action: Approves a pending subscription request, activates premium access,
        and sets starts_at and expires_at timestamps.
        """
        req = db.query(SubscriptionRequest).filter(
            SubscriptionRequest.id == request_id
        ).first()

        if not req:
            return False, "Subscription request not found.", None

        if req.status == "approved" and req.is_active:
            return False, "This subscription request has already been approved.", req

        now = datetime.datetime.utcnow()
        # Deactivate any previous active subscriptions for this user
        db.query(SubscriptionRequest).filter(
            SubscriptionRequest.user_id == req.user_id,
            SubscriptionRequest.id != req.id,
            SubscriptionRequest.status == "approved"
        ).update({"is_active": False})

        # Calculate validity
        starts_at = now
        expires_at = now + datetime.timedelta(days=req.duration_days)

        req.status = "approved"
        req.reviewed_at = now
        req.reviewed_by_admin_id = admin_id
        req.starts_at = starts_at
        req.expires_at = expires_at
        req.is_active = True
        req.rejection_reason = None

        db.commit()
        db.refresh(req)

        return True, f"Subscription for {req.plan_name} approved successfully. Valid until {expires_at.strftime('%d %b %Y')}.", req

    @classmethod
    def reject_subscription_request(
        cls, 
        db, 
        request_id: int, 
        admin_id: int, 
        rejection_reason: Optional[str] = None
    ) -> Tuple[bool, str, Optional[SubscriptionRequest]]:
        """
        Admin action: Rejects a subscription request with an optional note.
        """
        req = db.query(SubscriptionRequest).filter(
            SubscriptionRequest.id == request_id
        ).first()

        if not req:
            return False, "Subscription request not found.", None

        now = datetime.datetime.utcnow()
        req.status = "rejected"
        req.reviewed_at = now
        req.reviewed_by_admin_id = admin_id
        req.rejection_reason = (rejection_reason or "Request rejected by administrator.").strip()
        req.is_active = False

        db.commit()
        db.refresh(req)

        return True, "Subscription request rejected.", req

    @classmethod
    def list_admin_subscription_requests(
        cls, 
        db, 
        status_filter: Optional[str] = None, 
        search_query: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Returns all subscription requests for the admin portal with counts and user metadata.
        """
        query = db.query(SubscriptionRequest).options(
            joinedload(SubscriptionRequest.user).joinedload(User.profile)
        )

        if status_filter and status_filter.lower() != "all":
            query = query.filter(SubscriptionRequest.status == status_filter.lower())

        if search_query and search_query.strip():
            sq = f"%{search_query.strip().lower()}%"
            query = query.join(User, SubscriptionRequest.user_id == User.id).outerjoin(Profile, User.id == Profile.user_id).filter(
                (User.email.ilike(sq)) | (Profile.full_name.ilike(sq)) | (SubscriptionRequest.plan_name.ilike(sq))
            )

        requests = query.order_by(SubscriptionRequest.requested_at.desc()).all()

        # Compute counts across all statuses
        all_reqs = db.query(SubscriptionRequest.status).all()
        pending_count = sum(1 for (s,) in all_reqs if s == "pending")
        approved_count = sum(1 for (s,) in all_reqs if s == "approved")
        rejected_count = sum(1 for (s,) in all_reqs if s == "rejected")
        total_count = len(all_reqs)

        return {
            "requests": [r.to_dict(include_user=True) for r in requests],
            "stats": {
                "total": total_count,
                "pending": pending_count,
                "approved": approved_count,
                "rejected": rejected_count
            }
        }
