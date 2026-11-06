from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.providers.truecaller_provider import truecaller_provider
from app.api.v1.auth import get_current_user
from app.models.models import User

router = APIRouter(prefix="/truecaller", tags=["Truecaller Gateway"])

class SendOtpRequest(BaseModel):
    phone_number: str
    country_code: str = "IN"

class VerifyOtpRequest(BaseModel):
    phone_number: str
    request_id: str
    otp: str
    country_code: str = "IN"

class SearchRequest(BaseModel):
    phone_number: str
    country_code: str = "IN"
    installation_id: Optional[str] = None

@router.post("/send-otp")
async def send_truecaller_otp(payload: SendOtpRequest):
    """Initiate Truecaller SMS OTP login"""
    result = await truecaller_provider.send_otp(payload.phone_number, payload.country_code)
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@router.post("/verify-otp")
async def verify_truecaller_otp(payload: VerifyOtpRequest):
    """Verify Truecaller SMS OTP and retrieve installationId"""
    result = await truecaller_provider.verify_otp(
        phone_number=payload.phone_number,
        request_id=payload.request_id,
        otp=payload.otp,
        country_code=payload.country_code
    )
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@router.post("/search")
async def search_truecaller(payload: SearchRequest):
    """Execute live Truecaller search query for a phone number"""
    result = await truecaller_provider.search(
        phone_number=payload.phone_number,
        country_code=payload.country_code,
        installation_id=payload.installation_id
    )
    return result
