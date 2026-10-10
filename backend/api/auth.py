from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter()

class UserRegister(BaseModel):
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None
    password: str
    role: str = "citizen"

class UserLogin(BaseModel):
    login: str  # email or mobile
    password: str

@router.post("/register")
async def register(payload: UserRegister):
    return {"message": "User registration endpoint", "role": payload.role}

@router.post("/login")
async def login(payload: UserLogin):
    return {"access_token": "sample_jwt_token", "token_type": "bearer"}
