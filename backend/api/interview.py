from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class InterviewMessageIn(BaseModel):
    message: str
    language: str = "en"

@router.post("/message")
async def send_interview_message(payload: InterviewMessageIn):
    return {
        "reply": "नमस्ते! Aapki umar aur occupation kya hai?",
        "suggested_options": ["Farmer", "Student", "Business Owner", "Other"]
    }
