from fastapi import APIRouter, Query
from typing import Optional, List

router = APIRouter()

@router.get("/")
async def list_schemes(
    q: Optional[str] = Query(None, description="Search keyword"),
    state: Optional[str] = Query(None, description="State filter"),
    category: Optional[str] = Query(None, description="Beneficiary category")
):
    return {"schemes": [], "total": 0}

@router.get("/{scheme_id}")
async def get_scheme_detail(scheme_id: int):
    return {"scheme_id": scheme_id, "official_source": "https://india.gov.in"}
