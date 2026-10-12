from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ProfileInputSchema(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    annualIncome: Optional[str] = None
    incomeNumeric: Optional[float] = None
    education: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    category: Optional[str] = None
    fatherName: Optional[str] = None
    dateOfBirth: Optional[str] = None
    language: Optional[str] = "en"

class EligibilityEvaluationRequest(BaseModel):
    scheme_id: str
    profile: Dict[str, Any]

class ChatMessageRequest(BaseModel):
    message: str
    language: Optional[str] = "en"
