from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

router = APIRouter()

@router.post("/upload")
async def upload_document(
    document_type: str = Form(...),
    file: UploadFile = File(...)
):
    return {
        "filename": file.filename,
        "document_type": document_type,
        "status": "uploaded",
        "ocr_status": "queued"
    }

@router.get("/checklist/{scheme_id}")
async def get_document_checklist(scheme_id: int):
    return {
        "scheme_id": scheme_id,
        "required_documents": [
            {"name": "Aadhaar Card", "is_mandatory": True, "uploaded": False},
            {"name": "Income Certificate", "is_mandatory": True, "uploaded": False},
            {"name": "Bank Passbook", "is_mandatory": True, "uploaded": False}
        ]
    }
