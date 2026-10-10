from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class CreateDraftRequest(BaseModel):
    scheme_id: int

@router.post("/draft")
async def create_application_draft(payload: CreateDraftRequest):
    return {
        "application_id": 101,
        "scheme_id": payload.scheme_id,
        "status": "draft",
        "human_review_required": True
    }

@router.post("/{application_id}/confirm")
async def confirm_application(application_id: int):
    return {
        "application_id": application_id,
        "status": "confirmed_by_user",
        "affidavit_ready": True
    }
