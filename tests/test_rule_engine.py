import sys
import os

# Include backend in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from services.rule_engine import RuleEngine

def test_rule_engine_eligible():
    rule_logic = {
        "operator": "AND",
        "conditions": [
            {"field": "age", "op": ">=", "value": 18},
            {"field": "age", "op": "<=", "value": 40},
            {"field": "annual_income", "op": "<=", "value": 250000},
            {"field": "occupation", "op": "eq", "value": "Farmer"}
        ]
    }

    profile = {
        "age": 25,
        "annual_income": 180000,
        "occupation": "Farmer"
    }

    result = RuleEngine.evaluate_scheme(rule_logic, profile)
    assert result["status"] == "eligible"
    assert result["passed_count"] == 4

def test_rule_engine_ineligible():
    rule_logic = {
        "operator": "AND",
        "conditions": [
            {"field": "annual_income", "op": "<=", "value": 200000}
        ]
    }

    profile = {
        "annual_income": 350000
    }

    result = RuleEngine.evaluate_scheme(rule_logic, profile)
    assert result["status"] == "ineligible"
    assert result["passed_count"] == 0

def test_rule_engine_needs_info():
    rule_logic = {
        "operator": "AND",
        "conditions": [
            {"field": "land_holding_acres", "op": "<=", "value": 5.0}
        ]
    }

    profile = {}  # Land holding missing

    result = RuleEngine.evaluate_scheme(rule_logic, profile)
    assert result["status"] == "needs_info"
    assert "land_holding_acres" in result["missing_fields"]
