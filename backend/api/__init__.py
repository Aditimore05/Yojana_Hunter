from fastapi import APIRouter

from .auth import router as auth_router
from .profile import router as profile_router
from .schemes import router as schemes_router
from .interview import router as interview_router
from .eligibility import router as eligibility_router
from .documents import router as documents_router
from .applications import router as applications_router
from .admin import router as admin_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(profile_router, prefix="/profile", tags=["Profile"])
api_router.include_router(schemes_router, prefix="/schemes", tags=["Schemes"])
api_router.include_router(interview_router, prefix="/interview", tags=["AI Interview"])
api_router.include_router(eligibility_router, prefix="/eligibility", tags=["Eligibility"])
api_router.include_router(documents_router, prefix="/documents", tags=["Documents"])
api_router.include_router(applications_router, prefix="/applications", tags=["Applications"])
api_router.include_router(admin_router, prefix="/admin", tags=["Administration"])
