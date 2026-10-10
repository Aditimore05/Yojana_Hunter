from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class ProfileSchema(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    annual_income: Optional[float] = None
    state: Optional[str] = None
    district: Optional[str] = None
    category: Optional[str] = None
    land_holding_acres: Optional[float] = 0.0
    is_disabled: Optional[bool] = False
    preferred_language: Optional[str] = "en"

@router.get("/me")
async def get_my_profile():
    return {"message": "Citizen profile endpoint"}

@router.put("/me")
async def update_my_profile(profile: ProfileSchema):
    return {"message": "Profile updated", "data": profile}
