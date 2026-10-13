import re
import datetime
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import joinedload
from database import SessionLocal
from models import Scheme, SchemeRule, Profile, SchemeDocumentRequirement
from services.rule_engine import RuleEngine

class SchemeEligibilityService:
    """
    Core Deterministic Eligibility and Matching Service for Yojana Hunter.
    Compares real citizen profile attributes against structured scheme criteria,
    evaluates application periods, detects exclusions, and produces transparent
    human-readable explanations for every match decision.
    """

    # Supported standardized statuses
    STATUS_ELIGIBLE = "eligible"
    STATUS_POSSIBLY_ELIGIBLE = "possibly_eligible"
    STATUS_NOT_ELIGIBLE = "not_eligible"
    STATUS_ELIGIBILITY_UNKNOWN = "eligibility_unknown"
    STATUS_APPLICATIONS_CLOSED = "applications_closed"

    @classmethod
    def parse_dob_to_age(cls, dob_str: Optional[str]) -> Optional[int]:
        """Calculates age in years from common date of birth string formats."""
        if not dob_str:
            return None
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d"):
            try:
                dob = datetime.datetime.strptime(str(dob_str).strip()[:10], fmt)
                today = datetime.datetime.now()
                return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            except Exception:
                continue
        return None

    @classmethod
    def evaluate_scheme_for_profile(
        cls, 
        scheme: Scheme, 
        profile_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluates a single scheme against a citizen profile.
        Returns a rich evaluation dictionary with status, match score, breakdown,
        and human-friendly 'Why am I seeing this scheme?' explanations.
        """
        profile = dict(profile_data or {})

        # Normalize age from DOB if age is missing
        if (profile.get("age") is None or profile.get("age") == 0) and profile.get("date_of_birth"):
            calculated_age = cls.parse_dob_to_age(profile.get("date_of_birth"))
            if calculated_age:
                profile["age"] = calculated_age
        elif (profile.get("age") is None or profile.get("age") == 0) and profile.get("dateOfBirth"):
            calculated_age = cls.parse_dob_to_age(profile.get("dateOfBirth"))
            if calculated_age:
                profile["age"] = calculated_age

        requirements_satisfied: List[str] = []
        requirements_not_satisfied: List[str] = []
        missing_information: List[str] = []
        criteria_breakdown: List[Dict[str, Any]] = []

        total_rules_evaluated = 0
        passed_rules_count = 0
        mandatory_failed = False
        is_unknown_rules = False

        # ---------------------------------------------------------------------
        # 1. APPLICATION WINDOW / STATUS EVALUATION
        # ---------------------------------------------------------------------
        app_window = (scheme.application_status or "open").lower().strip()
        now = datetime.datetime.now()

        # Check explicit dates if available
        if scheme.end_date and scheme.end_date < now:
            app_window = "closed"
        elif scheme.deadline and scheme.deadline < now:
            app_window = "closed"
        elif scheme.start_date and scheme.start_date > now:
            app_window = "upcoming"

        is_closed = (app_window == "closed")

        # ---------------------------------------------------------------------
        # 2. CHECK EXCLUSIONS (Disqualifications)
        # ---------------------------------------------------------------------
        exclusions = scheme.exclusions or []
        if isinstance(exclusions, str):
            exclusions = [e.strip() for e in exclusions.split(",") if e.strip()]

        for excl in exclusions:
            excl_lower = str(excl).lower()
            if "tax" in excl_lower:
                total_rules_evaluated += 1
                if profile.get("is_tax_payer") or profile.get("isTaxPayer"):
                    mandatory_failed = True
                    requirements_not_satisfied.append(f"Ineligible: Income tax payers are excluded ({excl})")
                elif profile.get("is_tax_payer") is False or profile.get("isTaxPayer") is False:
                    passed_rules_count += 1
                    requirements_satisfied.append("Non-taxpayer status verified")
            if "govt" in excl_lower or "government" in excl_lower:
                total_rules_evaluated += 1
                if profile.get("is_govt_employee") or profile.get("isGovtEmployee"):
                    mandatory_failed = True
                    requirements_not_satisfied.append(f"Ineligible: Government employees are excluded ({excl})")
                elif profile.get("is_govt_employee") is False or profile.get("isGovtEmployee") is False:
                    passed_rules_count += 1
                    requirements_satisfied.append("Non-government employee status verified")

        # ---------------------------------------------------------------------
        # 3. DIRECT SCHEME LEVEL & STATE RESTRICTIONS
        # ---------------------------------------------------------------------
        scheme_state = (scheme.state or "All India").strip()
        scheme_level = (scheme.level or "Central Scheme").strip()
        user_state = (profile.get("state") or "").strip()

        if scheme_state.lower() not in ("all india", "national", "central", "all"):
            total_rules_evaluated += 1
            if not user_state:
                missing_information.append(f"State of Residence required to verify {scheme_state} residency")
            elif user_state.lower() == scheme_state.lower():
                passed_rules_count += 1
                requirements_satisfied.append(f"Resident of {scheme_state}")
                criteria_breakdown.append({
                    "id": "c_state",
                    "name": "State Domicile",
                    "condition": f"Must be resident of {scheme_state}",
                    "userValue": user_state,
                    "passed": True
                })
            else:
                mandatory_failed = True
                requirements_not_satisfied.append(f"State: Restricted to residents of {scheme_state} (Your state: {user_state})")
                criteria_breakdown.append({
                    "id": "c_state",
                    "name": "State Domicile",
                    "condition": f"Must be resident of {scheme_state}",
                    "userValue": user_state,
                    "passed": False
                })

        # ---------------------------------------------------------------------
        # 4. AGE LIMITS (age_min, age_max)
        # ---------------------------------------------------------------------
        user_age = profile.get("age")
        if scheme.age_min is not None:
            total_rules_evaluated += 1
            if user_age is None or user_age == 0:
                missing_information.append(f"Age or Date of Birth required (Minimum age: {scheme.age_min} years)")
            elif user_age >= scheme.age_min:
                passed_rules_count += 1
                requirements_satisfied.append(f"Age {user_age} is above minimum limit of {scheme.age_min} years")
                criteria_breakdown.append({
                    "id": "c_age_min",
                    "name": "Minimum Age",
                    "condition": f"Age >= {scheme.age_min}",
                    "userValue": f"{user_age} years",
                    "passed": True
                })
            else:
                mandatory_failed = True
                requirements_not_satisfied.append(f"Age: Age {user_age} is below the minimum required age of {scheme.age_min} years")
                criteria_breakdown.append({
                    "id": "c_age_min",
                    "name": "Minimum Age",
                    "condition": f"Age >= {scheme.age_min}",
                    "userValue": f"{user_age} years",
                    "passed": False
                })

        if scheme.age_max is not None:
            total_rules_evaluated += 1
            if user_age is None or user_age == 0:
                missing_information.append(f"Age or Date of Birth required (Maximum age: {scheme.age_max} years)")
            elif user_age <= scheme.age_max:
                passed_rules_count += 1
                requirements_satisfied.append(f"Age {user_age} is within upper limit of {scheme.age_max} years")
                criteria_breakdown.append({
                    "id": "c_age_max",
                    "name": "Maximum Age",
                    "condition": f"Age <= {scheme.age_max}",
                    "userValue": f"{user_age} years",
                    "passed": True
                })
            else:
                mandatory_failed = True
                requirements_not_satisfied.append(f"Age: Age {user_age} exceeds the maximum limit of {scheme.age_max} years")
                criteria_breakdown.append({
                    "id": "c_age_max",
                    "name": "Maximum Age",
                    "condition": f"Age <= {scheme.age_max}",
                    "userValue": f"{user_age} years",
                    "passed": False
                })

        # ---------------------------------------------------------------------
        # 5. INCOME CEILING (income_max)
        # ---------------------------------------------------------------------
        if scheme.income_max is not None:
            total_rules_evaluated += 1
            actual_numeric = profile.get("income_numeric") or profile.get("incomeNumeric")
            if actual_numeric is None:
                actual_numeric = RuleEngine.parse_numeric_income(profile.get("annual_income") or profile.get("annualIncome"))

            if not actual_numeric and not profile.get("annual_income") and not profile.get("annualIncome"):
                missing_information.append(f"Annual family income required (Ceiling: ₹{scheme.income_max:,.0f})")
            elif actual_numeric <= scheme.income_max:
                passed_rules_count += 1
                requirements_satisfied.append(f"Family income ₹{actual_numeric:,.0f} is within ₹{scheme.income_max:,.0f} ceiling")
                criteria_breakdown.append({
                    "id": "c_income_max",
                    "name": "Annual Income Limit",
                    "condition": f"Income <= ₹{scheme.income_max:,.0f}",
                    "userValue": f"₹{actual_numeric:,.0f}",
                    "passed": True
                })
            else:
                mandatory_failed = True
                requirements_not_satisfied.append(f"Income: Family income ₹{actual_numeric:,.0f} exceeds the maximum limit of ₹{scheme.income_max:,.0f}")
                criteria_breakdown.append({
                    "id": "c_income_max",
                    "name": "Annual Income Limit",
                    "condition": f"Income <= ₹{scheme.income_max:,.0f}",
                    "userValue": f"₹{actual_numeric:,.0f}",
                    "passed": False
                })

        # ---------------------------------------------------------------------
        # 6. GENDER SPECIFICITY
        # ---------------------------------------------------------------------
        target_gender = (scheme.gender or "All").strip()
        if target_gender.lower() not in ("all", "any", "unrestricted", "all genders"):
            total_rules_evaluated += 1
            user_gender = (profile.get("gender") or "").strip()
            if not user_gender:
                missing_information.append(f"Gender information required (Target: {target_gender})")
            elif user_gender.lower() == target_gender.lower() or target_gender.lower() in user_gender.lower():
                passed_rules_count += 1
                requirements_satisfied.append(f"Gender matches criteria ({target_gender})")
                criteria_breakdown.append({
                    "id": "c_gender",
                    "name": "Gender Eligibility",
                    "condition": f"Gender: {target_gender}",
                    "userValue": user_gender,
                    "passed": True
                })
            else:
                mandatory_failed = True
                requirements_not_satisfied.append(f"Gender: Scheme is exclusively for {target_gender} beneficiaries (You are listed as {user_gender})")
                criteria_breakdown.append({
                    "id": "c_gender",
                    "name": "Gender Eligibility",
                    "condition": f"Gender: {target_gender}",
                    "userValue": user_gender,
                    "passed": False
                })

        # ---------------------------------------------------------------------
        # 7. FARMER STATUS & LANDHOLDING
        # ---------------------------------------------------------------------
        if scheme.is_farmer_only:
            total_rules_evaluated += 1
            user_farmer_val = profile.get("is_farmer") if profile.get("is_farmer") is not None else profile.get("isFarmer")
            occ = str(profile.get("occupation") or "").lower()
            is_user_farmer = bool(user_farmer_val is True or "farmer" in occ or "agri" in occ or "kisan" in occ)

            if is_user_farmer:
                passed_rules_count += 1
                requirements_satisfied.append("Agricultural Farmer status verified")
                criteria_breakdown.append({
                    "id": "c_farmer",
                    "name": "Farmer Beneficiary",
                    "condition": "Must be an active agricultural farmer",
                    "userValue": profile.get("occupation") or "Farmer",
                    "passed": True
                })
                # Check landholding if restricted
                if scheme.max_landholding_acres:
                    total_rules_evaluated += 1
                    user_land = profile.get("land_holding_acres")
                    if user_land is None:
                        user_land = profile.get("landholding_acres")
                    if user_land is None:
                        user_land = profile.get("landHoldingAcres")
                    if user_land is None:
                        missing_information.append(f"Landholding acreage required (Max permitted: {scheme.max_landholding_acres} acres)")
                    elif float(user_land) <= scheme.max_landholding_acres:
                        passed_rules_count += 1
                        requirements_satisfied.append(f"Landholding {user_land} acres is within {scheme.max_landholding_acres} acres limit")
                        criteria_breakdown.append({
                            "id": "c_land",
                            "name": "Landholding Limit",
                            "condition": f"Land <= {scheme.max_landholding_acres} acres",
                            "userValue": f"{user_land} acres",
                            "passed": True
                        })
                    else:
                        mandatory_failed = True
                        requirements_not_satisfied.append(f"Landholding: {user_land} acres exceeds the maximum limit of {scheme.max_landholding_acres} acres")
                        criteria_breakdown.append({
                            "id": "c_land",
                            "name": "Landholding Limit",
                            "condition": f"Land <= {scheme.max_landholding_acres} acres",
                            "userValue": f"{user_land} acres",
                            "passed": False
                        })
            elif user_farmer_val is None and not occ:
                missing_information.append("Farmer status / agricultural occupation required")
                criteria_breakdown.append({
                    "id": "c_farmer",
                    "name": "Farmer Beneficiary",
                    "condition": "Must be an active agricultural farmer",
                    "userValue": "Not Provided",
                    "passed": False
                })
            else:
                mandatory_failed = True
                requirements_not_satisfied.append(f"Occupation: Scheme exclusively for agricultural farmers (Your occupation: {profile.get('occupation') or 'Non-Farmer'})")
                criteria_breakdown.append({
                    "id": "c_farmer",
                    "name": "Farmer Beneficiary",
                    "condition": "Must be an active agricultural farmer",
                    "userValue": profile.get("occupation") or "Non-Farmer",
                    "passed": False
                })

        # ---------------------------------------------------------------------
        # 8. EDUCATION REQUIREMENT EVALUATION
        # ---------------------------------------------------------------------
        scheme_edu = (scheme.education or "").strip().lower()
        if scheme_edu and scheme_edu not in ("all", "any", "no formal education required", "no minimum education requirement", "no education barrier", "none"):
            total_rules_evaluated += 1
            user_edu = str(profile.get("education") or "").strip()
            user_edu_lower = user_edu.lower()

            if not user_edu:
                missing_information.append(f"Education level required (Scheme requirement: {scheme.education})")
            else:
                edu_rank = {
                    "illiterate": 0, "none": 0,
                    "primary": 1, "8th": 1, "8th pass": 1,
                    "10th": 2, "10th pass": 2, "matriculation": 2, "matric": 2, "ssc": 2,
                    "12th": 3, "12th pass": 3, "higher secondary": 3, "hsc": 3, "intermediate": 3,
                    "diploma": 3.5, "iti": 3.5,
                    "graduate": 4, "b.e.": 4, "b.e": 4, "b.tech": 4, "degree": 4, "b.sc": 4, "b.com": 4, "ba": 4,
                    "postgraduate": 5, "pg": 5, "master": 5, "m.tech": 5
                }
                user_level = 2  # default 10th pass if unrecognized
                for k, v in edu_rank.items():
                    if k in user_edu_lower:
                        user_level = max(user_level, v)

                req_level = 0
                for k, v in edu_rank.items():
                    if k in scheme_edu:
                        req_level = max(req_level, v)

                if user_level >= req_level or any(term in user_edu_lower for term in scheme_edu.split()):
                    passed_rules_count += 1
                    requirements_satisfied.append(f"Education requirement met ({user_edu})")
                    criteria_breakdown.append({
                        "id": "c_education",
                        "name": "Educational Qualification",
                        "condition": scheme.education,
                        "userValue": user_edu,
                        "passed": True
                    })
                else:
                    mandatory_failed = True
                    requirements_not_satisfied.append(f"Education: Requires {scheme.education} (Your qualification: {user_edu})")
                    criteria_breakdown.append({
                        "id": "c_education",
                        "name": "Educational Qualification",
                        "condition": scheme.education,
                        "userValue": user_edu,
                        "passed": False
                    })

        # ---------------------------------------------------------------------
        # 9. SOCIAL CATEGORY EVALUATION
        # ---------------------------------------------------------------------
        scheme_cat = (scheme.social_category or "All").strip().lower()
        user_cat = str(profile.get("category") or profile.get("social_category") or profile.get("socialCategory") or "General").strip()
        user_cat_lower = user_cat.lower()

        if scheme_cat not in ("all", "any", "unrestricted", "all categories"):
            total_rules_evaluated += 1
            if not profile.get("category") and not profile.get("social_category") and not profile.get("socialCategory"):
                missing_information.append(f"Social category required (Target: {scheme.social_category})")
            elif user_cat_lower in scheme_cat or scheme_cat in user_cat_lower:
                passed_rules_count += 1
                requirements_satisfied.append(f"Social Category ({user_cat}) qualifies for {scheme.social_category} allocation")
                criteria_breakdown.append({
                    "id": "c_category",
                    "name": "Social Category",
                    "condition": scheme.social_category,
                    "userValue": user_cat,
                    "passed": True
                })
            else:
                mandatory_failed = True
                requirements_not_satisfied.append(f"Social Category: Reserved for {scheme.social_category} beneficiaries (Your category: {user_cat})")
                criteria_breakdown.append({
                    "id": "c_category",
                    "name": "Social Category",
                    "condition": scheme.social_category,
                    "userValue": user_cat,
                    "passed": False
                })
        else:
            # Scheme is open to all; if user is OBC/SC/ST and scheme prioritizes it, note as satisfied
            if user_cat_lower in ("obc", "sc", "st"):
                requirements_satisfied.append(f"Beneficiary category {user_cat} verified")

        # ---------------------------------------------------------------------
        # 10. STUDENT / EDUCATION RESTRICTIONS
        # ---------------------------------------------------------------------
        if scheme.is_student_only:
            total_rules_evaluated += 1
            user_student_val = profile.get("is_student") if profile.get("is_student") is not None else profile.get("isStudent")
            occ = str(profile.get("occupation") or "").lower()
            if user_student_val is True or "student" in occ:
                passed_rules_count += 1
                requirements_satisfied.append("Enrolled student status verified")
            elif user_student_val is None and not occ:
                missing_information.append("Student enrollment required (Scheme exclusively for students)")
            else:
                mandatory_failed = True
                requirements_not_satisfied.append(f"Student Status: Requires active student enrollment (Your occupation: {profile.get('occupation') or 'Non-Student'})")

        # ---------------------------------------------------------------------
        # 11. BUSINESS / ENTERPRISE RESTRICTIONS
        # ---------------------------------------------------------------------
        if scheme.is_business_only:
            total_rules_evaluated += 1
            user_business_val = profile.get("has_business") if profile.get("has_business") is not None else profile.get("hasBusiness")
            occ = str(profile.get("occupation") or "").lower()
            if user_business_val is True or "business" in occ or "entrepreneur" in occ:
                passed_rules_count += 1
                requirements_satisfied.append("Business / Enterprise owner status verified")
            elif user_business_val is None and not occ:
                missing_information.append("Business / Enterprise ownership details required")
            else:
                mandatory_failed = True
                requirements_not_satisfied.append("Enterprise Status: Requires small business / MSME ownership")

        # ---------------------------------------------------------------------
        # 12. DISABILITY SPECIFICITY
        # ---------------------------------------------------------------------
        if scheme.is_disability_required:
            total_rules_evaluated += 1
            user_disabled_val = profile.get("is_disabled") if profile.get("is_disabled") is not None else profile.get("isDisabled")
            if user_disabled_val is True:
                passed_rules_count += 1
                requirements_satisfied.append("Differently-abled status verified")
            elif user_disabled_val is None:
                missing_information.append("Disability / Divyangjan status required")
            else:
                mandatory_failed = True
                requirements_not_satisfied.append("Disability Status: Scheme intended for Divyangjan / persons with disability")

        # ---------------------------------------------------------------------
        # 11. EVALUATE CUSTOM SCHEME RULES (From SchemeRule table)
        # ---------------------------------------------------------------------
        if scheme.rules:
            for idx, rule in enumerate(scheme.rules):
                total_rules_evaluated += 1
                passed, reason, user_val = RuleEngine.evaluate_condition(rule.rule_logic or {}, profile)
                r_name = rule.rule_name or f"Rule {idx + 1}"
                r_desc = rule.rule_description or ""

                if user_val is None:
                    missing_information.append(f"{r_name}: Information needed ({r_desc})")
                    criteria_breakdown.append({
                        "id": f"rule_{rule.id}",
                        "name": r_name,
                        "condition": r_desc,
                        "userValue": "Not Provided",
                        "passed": False
                    })
                elif passed:
                    passed_rules_count += 1
                    requirements_satisfied.append(f"{r_name}: {r_desc}")
                    criteria_breakdown.append({
                        "id": f"rule_{rule.id}",
                        "name": r_name,
                        "condition": r_desc,
                        "userValue": str(user_val),
                        "passed": True
                    })
                else:
                    if rule.is_mandatory:
                        mandatory_failed = True
                    requirements_not_satisfied.append(f"{r_name}: {r_desc} (Current value: {user_val})")
                    criteria_breakdown.append({
                        "id": f"rule_{rule.id}",
                        "name": r_name,
                        "condition": r_desc,
                        "userValue": str(user_val),
                        "passed": False
                    })

        # ---------------------------------------------------------------------
        # 12. DETERMINE FINAL ELIGIBILITY STATUS
        # ---------------------------------------------------------------------
        # Distinct statuses:
        # 1. 'applications_closed' - Scheme is closed according to verified information
        # 2. 'not_eligible' - At least one verified mandatory condition is not satisfied
        # 3. 'eligibility_unknown' - Reliable rules are unavailable or incomplete
        # 4. 'possibly_eligible' - No known mandatory condition failed, but some information missing
        # 5. 'eligible' - All mandatory conditions verified and satisfied
        if is_closed:
            status = cls.STATUS_APPLICATIONS_CLOSED
        elif mandatory_failed:
            status = cls.STATUS_NOT_ELIGIBLE
        elif total_rules_evaluated == 0:
            status = cls.STATUS_ELIGIBILITY_UNKNOWN
            is_unknown_rules = True
        elif len(missing_information) > 0:
            status = cls.STATUS_POSSIBLY_ELIGIBLE
        else:
            status = cls.STATUS_ELIGIBLE

        # ---------------------------------------------------------------------
        # 13. CALCULATE RELEVANCE & MATCH SCORE (0 - 100)
        # ---------------------------------------------------------------------
        if total_rules_evaluated > 0:
            base_score = int((passed_rules_count / total_rules_evaluated) * 100)
        else:
            base_score = 40

        # Adjust score according to status
        if status == cls.STATUS_ELIGIBLE:
            match_score = max(85, min(100, base_score))
        elif status == cls.STATUS_POSSIBLY_ELIGIBLE:
            match_score = max(50, min(80, base_score))
        elif status == cls.STATUS_APPLICATIONS_CLOSED:
            match_score = max(40, min(75, base_score))
        elif status == cls.STATUS_NOT_ELIGIBLE:
            match_score = min(40, base_score)
        else:
            match_score = 45

        # ---------------------------------------------------------------------
        # 14. GENERATE "WHY AM I SEEING THIS SCHEME?" EXPLANATION
        # ---------------------------------------------------------------------
        why_parts = ["Why am I seeing this scheme?"]
        if status == cls.STATUS_ELIGIBLE:
            why_parts.append(f"You qualify for {scheme.name} as all mandatory eligibility conditions are fully verified.")
            if requirements_satisfied:
                why_parts.append(f"Key verified criteria: {', '.join(requirements_satisfied[:3])}.")
        elif status == cls.STATUS_POSSIBLY_ELIGIBLE:
            why_parts.append(f"You appear potentially eligible based on your current profile.")
            if missing_information:
                why_parts.append(f"To confirm 100% eligibility, please verify: {', '.join(missing_information[:2])}.")
        elif status == cls.STATUS_APPLICATIONS_CLOSED:
            why_parts.append(f"This scheme is currently not accepting applications as the deadline has passed or applications are temporarily closed.")
        elif status == cls.STATUS_NOT_ELIGIBLE:
            why_parts.append(f"You currently do not meet mandatory eligibility requirements for this scheme.")
            if requirements_not_satisfied:
                why_parts.append(f"Reason: {requirements_not_satisfied[0]}.")
        else:
            why_parts.append("Official eligibility rules for this scheme are pending verification from government source portals.")

        why_matched = " ".join(why_parts)

        # Legacy backward-compatible mapping for existing frontend components:
        legacy_status_map = {
            cls.STATUS_ELIGIBLE: "eligible",
            cls.STATUS_POSSIBLY_ELIGIBLE: "almost",
            cls.STATUS_NOT_ELIGIBLE: "ineligible",
            cls.STATUS_ELIGIBILITY_UNKNOWN: "almost",
            cls.STATUS_APPLICATIONS_CLOSED: "ineligible",
        }

        return {
            "eligibility_status": status,
            "legacy_status": legacy_status_map.get(status, "almost"),
            "application_status": app_window,
            "match_score": match_score,
            "why_matched": why_matched,
            "requirements_satisfied": requirements_satisfied,
            "requirements_not_satisfied": requirements_not_satisfied,
            "missing_information": missing_information,
            "criteria": criteria_breakdown,
            "required_documents": [doc.document_name for doc in scheme.document_requirements] if scheme.document_requirements else [],
            "application_procedure": scheme.application_process or "Follow official portal guidelines to apply online.",
            "source_reference": {
                "official_url": scheme.official_source_url,
                "application_url": scheme.application_url or scheme.official_source_url,
                "source_url": scheme.source_url or scheme.official_source_url,
                "verification_status": scheme.source_verification_status or "verified_live",
                "last_fetched_at": scheme.last_fetched_at.isoformat() if scheme.last_fetched_at else None,
                "last_verified_date": scheme.last_verified_date or "12 Oct 2026",
                "is_verified": bool(scheme.official_source_url and scheme.last_verified_date)
            }
        }

    @classmethod
    def get_ranked_schemes_for_profile(
        cls, 
        profile_data: Dict[str, Any],
        category_filter: Optional[str] = None,
        state_filter: Optional[str] = None,
        status_filter: Optional[str] = None,
        search_query: Optional[str] = None,
        include_ineligible: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Retrieves all published schemes, evaluates each against the given profile,
        ranks them by priority and relevance, and returns the complete list.
        """
        db = SessionLocal()
        try:
            query = db.query(Scheme).options(
                joinedload(Scheme.rules),
                joinedload(Scheme.document_requirements)
            ).filter(
                Scheme.is_active == True,
                (Scheme.status == "published") | (Scheme.status == None)
            )

            if category_filter and category_filter.lower() != "all":
                query = query.filter(Scheme.category.ilike(f"%{category_filter}%"))

            if state_filter and state_filter.lower() != "all":
                query = query.filter(
                    (Scheme.state.ilike(f"%{state_filter}%")) | (Scheme.state.ilike("%all india%"))
                )

            schemes = query.all()
            results = []

            for scheme in schemes:
                # Text search filter
                if search_query:
                    q = search_query.lower().strip()
                    name_match = q in scheme.name.lower()
                    desc_match = q in (scheme.short_description or "").lower() or q in scheme.description.lower()
                    dept_match = q in (scheme.department or "").lower()
                    cat_match = q in (scheme.category or "").lower()
                    if not (name_match or desc_match or dept_match or cat_match):
                        continue

                eval_result = cls.evaluate_scheme_for_profile(scheme, profile_data)
                
                # Check status filter
                e_status = eval_result["eligibility_status"]
                leg_status = eval_result["legacy_status"]

                if status_filter and status_filter.lower() != "all":
                    s_filter = status_filter.lower()
                    if s_filter not in (e_status, leg_status):
                        continue

                # Prepare response dictionary with all rich metadata
                scheme_dict = scheme.to_dict(include_rules=False)
                scheme_dict["eligibilityStatus"] = eval_result["eligibility_status"]
                scheme_dict["legacyEligibilityStatus"] = eval_result["legacy_status"]
                scheme_dict["applicationStatus"] = eval_result["application_status"]
                scheme_dict["matchScore"] = eval_result["match_score"]
                scheme_dict["whyMatched"] = eval_result["why_matched"]
                scheme_dict["requirementsSatisfied"] = eval_result["requirements_satisfied"]
                scheme_dict["requirementsNotSatisfied"] = eval_result["requirements_not_satisfied"]
                scheme_dict["missingInformation"] = eval_result["missing_information"]
                scheme_dict["criteria"] = eval_result["criteria"]
                scheme_dict["requiredDocuments"] = eval_result["required_documents"]
                scheme_dict["applicationProcess"] = eval_result["application_procedure"]
                scheme_dict["sourceReference"] = eval_result["source_reference"]

                # First failure reason for backward compatibility
                if eval_result["requirements_not_satisfied"]:
                    scheme_dict["ineligibleReason"] = eval_result["requirements_not_satisfied"][0]
                else:
                    scheme_dict["ineligibleReason"] = None

                results.append(scheme_dict)

            # Sort:
            # 1. Eligible (highest match score)
            # 2. Possibly Eligible (highest match score)
            # 3. Applications Closed
            # 4. Eligibility Unknown
            # 5. Not Eligible
            priority_rank = {
                cls.STATUS_ELIGIBLE: 0,
                cls.STATUS_POSSIBLY_ELIGIBLE: 1,
                "almost": 1,
                cls.STATUS_APPLICATIONS_CLOSED: 2,
                cls.STATUS_ELIGIBILITY_UNKNOWN: 3,
                cls.STATUS_NOT_ELIGIBLE: 4,
                "ineligible": 4,
            }

            results.sort(key=lambda s: (
                priority_rank.get(s["eligibilityStatus"], 5),
                -s.get("matchScore", 0)
            ))

            return results
        finally:
            db.close()
