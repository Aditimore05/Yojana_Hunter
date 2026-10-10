from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from services.rule_engine import RuleEngine

router = APIRouter()

class CheckEligibilityRequest(BaseModel):
    scheme_id: int
    profile: Dict[str, Any]

@router.post("/evaluate")
async def evaluate_eligibility(payload: CheckEligibilityRequest):
    # Sample rule logic demonstration
    sample_rule = {
        "operator": "AND",
        "conditions": [
            {"field": "age", "op": ">=", "value": 18},
            {"field": "age", "op": "<=", "value": 50},
            {"field": "annual_income", "op": "<=", "value": 300000}
        ]
    }
    result = RuleEngine.evaluate_scheme(sample_rule, payload.profile)
    return {"scheme_id": payload.scheme_id, "evaluation": result}
