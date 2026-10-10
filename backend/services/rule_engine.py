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
        "eq": lambda a, b: str(a).lower() == str(b).lower(),
        "neq": lambda a, b: str(a).lower() != str(b).lower(),
        "in": lambda a, b: a in b if isinstance(b, list) else False,
        "not_in": lambda a, b: a not in b if isinstance(b, list) else True,
    }

    @classmethod
    def evaluate_condition(cls, condition: Dict[str, Any], profile: Dict[str, Any]) -> Tuple[bool, str]:
        field = condition.get("field")
        op = condition.get("op")
        target_val = condition.get("value")

        if field not in profile or profile[field] is None:
            return False, f"Missing parameter: {field}"

        actual_val = profile[field]
        eval_fn = cls.OPERATORS.get(op)

        if not eval_fn:
            return False, f"Unsupported operator: {op}"

        try:
            passed = eval_fn(actual_val, target_val)
            reason = f"{field} ({actual_val}) {op} {target_val}"
            return passed, reason
        except Exception as e:
            return False, f"Evaluation error for {field}: {str(e)}"

    @classmethod
    def evaluate_scheme(cls, rule_logic: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates a rule tree (AND / OR) against citizen profile.
        Returns deterministic pass/fail status and detailed breakdown.
        """
        operator = rule_logic.get("operator", "AND").upper()
        conditions = rule_logic.get("conditions", [])

        breakdown = []
        missing_fields = []
        passed_conditions = 0

        for cond in conditions:
            passed, reason = cls.evaluate_condition(cond, profile)
            if "Missing parameter" in reason:
                missing_fields.append(cond.get("field"))

            breakdown.append({
                "field": cond.get("field"),
                "required": f"{cond.get('op')} {cond.get('value')}",
                "passed": passed,
                "reason": reason
            })

            if passed:
                passed_conditions += 1

        if missing_fields:
            status = "needs_info"
        elif operator == "AND":
            status = "eligible" if passed_conditions == len(conditions) else "ineligible"
        elif operator == "OR":
            status = "eligible" if passed_conditions > 0 else "ineligible"
        else:
            status = "ineligible"

        return {
            "status": status,
            "passed_count": passed_conditions,
            "total_count": len(conditions),
            "missing_fields": missing_fields,
            "criteria_breakdown": breakdown
        }
