import re
from typing import Dict, Any, List, Tuple

class RuleEngine:
    """
    Deterministic Eligibility Rule Engine.
    Evaluates citizen profile attributes against structured scheme rules.
    The LLM NEVER determines eligibility alone.
    """

    OPERATORS = {
        ">=": lambda a, b: a >= b,
        "<=": lambda a, b: a <= b,
        ">": lambda a, b: a > b,
        "<": lambda a, b: a < b,
        "==": lambda a, b: a == b,
        "eq": lambda a, b: str(a).strip().lower() == str(b).strip().lower(),
        "neq": lambda a, b: str(a).strip().lower() != str(b).strip().lower(),
        "in": lambda a, b: (
            any(str(x).strip().lower() in str(a).strip().lower() or str(a).strip().lower() in str(x).strip().lower() for x in b)
            if isinstance(b, list)
            else (str(b).strip().lower() in str(a).strip().lower() or str(a).strip().lower() in str(b).strip().lower())
        ),
        "not_in": lambda a, b: (
            not any(str(x).strip().lower() in str(a).strip().lower() for x in b)
            if isinstance(b, list)
            else str(b).strip().lower() not in str(a).strip().lower()
        ),
    }

    @staticmethod
    def parse_numeric_income(income_val: Any) -> float:
        """Helper to convert income strings like '< 1 Lakh' or '2.5 Lakh' into numbers."""
        if isinstance(income_val, (int, float)):
            return float(income_val)
        if not income_val:
            return 0.0

        val_str = str(income_val).lower().replace(",", "")
        
        # Check for Lakh
        if "lakh" in val_str:
            numbers = re.findall(r"[-+]?\d*\.\d+|\d+", val_str)
            if numbers:
                # If range like '1 - 3 Lakh', take upper or lower appropriately
                return float(numbers[-1]) * 100000.0
        
        numbers = re.findall(r"\d+", val_str)
        if numbers:
            return float(numbers[0])
            
        return 0.0

    @classmethod
    def evaluate_condition(cls, condition: Dict[str, Any], profile: Dict[str, Any]) -> Tuple[bool, str, Any]:
        """
        Evaluates a single condition dictionary against user profile.
        Returns (passed, explanation, user_value).
        """
        field = condition.get("field")
        op = condition.get("op")
        target_val = condition.get("value")

        user_val = profile.get(field)

        # Normalize special fields
        if field in ("annual_income", "annualIncome", "incomeNumeric", "income_numeric"):
            actual_numeric = profile.get("income_numeric") or profile.get("incomeNumeric")
            if actual_numeric is None:
                actual_numeric = cls.parse_numeric_income(profile.get("annual_income") or profile.get("annualIncome"))
            
            target_numeric = cls.parse_numeric_income(target_val)
            eval_fn = cls.OPERATORS.get(op)
            if eval_fn:
                try:
                    passed = eval_fn(actual_numeric, target_numeric)
                    reason = f"Annual Income ₹{actual_numeric:,.0f} {op} ₹{target_numeric:,.0f}"
                    return passed, reason, profile.get("annualIncome") or profile.get("annual_income") or f"₹{actual_numeric:,.0f}"
                except Exception as e:
                    return False, f"Income eval error: {e}", actual_numeric

        # Normalize state
        if field == "state":
            target_state = str(target_val).strip().lower()
            actual_state = str(user_val or "").strip().lower()
            if target_state in ("all india", "national", "all", "any"):
                return True, "Scheme applicable across All India", user_val or "All India"
            passed = target_state == actual_state
            return passed, f"State: {user_val} (Required: {target_val})", user_val

        if field not in profile or profile[field] is None:
            return False, f"Missing parameter: {field}", None

        actual_val = profile[field]

        # Convert age if needed
        if field == "age" and op in (">=", "<=", ">", "<", "=="):
            try:
                actual_num = int(actual_val)
                target_num = int(target_val)
                eval_fn = cls.OPERATORS.get(op)
                passed = eval_fn(actual_num, target_num)
                return passed, f"Age {actual_num} {op} {target_num}", f"{actual_num} years"
            except Exception:
                pass

        eval_fn = cls.OPERATORS.get(op)
        if not eval_fn:
            return False, f"Unsupported operator: {op}", actual_val

        try:
            passed = eval_fn(actual_val, target_val)
            reason = f"{field} ({actual_val}) {op} {target_val}"
            return passed, reason, str(actual_val)
        except Exception as e:
            return False, f"Evaluation error for {field}: {str(e)}", str(actual_val)

    @classmethod
    def evaluate_scheme(cls, rules: List[Any], profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates all rules for a scheme against user profile.
        Returns status, match_score, breakdown, and reason.
        """
        if not rules:
            return {
                "status": "eligible",
                "match_score": 100,
                "passed_count": 0,
                "total_count": 0,
                "ineligible_reason": None,
                "criteria": []
            }

        breakdown = []
        passed_count = 0
        mandatory_failed = False
        missing_count = 0
        first_failure_reason = None

        for idx, rule in enumerate(rules):
            # Rule can be a SchemeRule model object or dict
            rule_id = getattr(rule, "id", idx + 1)
            rule_name = getattr(rule, "rule_name", None) or f"Criterion {idx + 1}"
            rule_desc = getattr(rule, "rule_description", "")
            rule_logic = getattr(rule, "rule_logic", {})
            is_mandatory = getattr(rule, "is_mandatory", True)

            passed, reason, user_value = cls.evaluate_condition(rule_logic, profile)

            if user_value is None:
                missing_count += 1

            if not passed:
                if is_mandatory:
                    mandatory_failed = True
                    if not first_failure_reason:
                        first_failure_reason = f"{rule_name} condition not met: {rule_desc}"
            else:
                passed_count += 1

            breakdown.append({
                "id": f"c{rule_id}",
                "name": rule_name,
                "condition": rule_desc,
                "userValue": str(user_value) if user_value is not None else "Not Provided",
                "passed": passed
            })

        total = len(rules)

        if missing_count > 0 and (passed_count + missing_count == total):
            status = "almost"
            match_score = max(50, int((passed_count / total) * 100))
        elif mandatory_failed:
            status = "ineligible"
            match_score = min(45, int((passed_count / total) * 100)) if total > 0 else 0
        elif passed_count == total:
            status = "eligible"
            match_score = 100
        else:
            status = "almost"
            match_score = int((passed_count / total) * 100)

        return {
            "status": status,
            "match_score": match_score,
            "passed_count": passed_count,
            "total_count": total,
            "ineligible_reason": first_failure_reason,
            "criteria": breakdown
        }
