from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Yojana Hunter API Gateway"}

@router.get("/ingestion-jobs")
async def list_ingestion_jobs():
    return {"active_jobs": [], "total_schemes_indexed": 50}

@router.get("/audit-logs")
async def view_audit_logs():
    return {"logs": []}
