from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import SourceProvider, User
from app.schemas.schemas import SourceProviderResponse, SourceProviderUpdate
from app.core.security import encrypt_credential, decrypt_credential
from app.api.v1.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[SourceProviderResponse])
def list_providers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    providers = db.query(SourceProvider).all()
    results = []
    for p in providers:
        results.append(SourceProviderResponse(
            id=p.id,
            name=p.name,
            provider_type=p.provider_type,
            base_url=p.base_url,
            is_active=p.is_active,
            rate_limit_per_minute=p.rate_limit_per_minute,
            daily_quota=p.daily_quota,
            current_day_requests=p.current_day_requests,
            has_api_key=bool(p.api_key_encrypted)
        ))
    return results


@router.patch("/{provider_id}", response_model=SourceProviderResponse)
def update_provider(
    provider_id: str,
    update_data: SourceProviderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    provider = db.query(SourceProvider).filter(SourceProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Source provider not found")

    if update_data.is_active is not None:
        provider.is_active = update_data.is_active
    if update_data.rate_limit_per_minute is not None:
        provider.rate_limit_per_minute = update_data.rate_limit_per_minute
    if update_data.daily_quota is not None:
        provider.daily_quota = update_data.daily_quota
    if update_data.api_key is not None:
        provider.api_key_encrypted = encrypt_credential(update_data.api_key)

    db.commit()
    db.refresh(provider)

    return SourceProviderResponse(
        id=provider.id,
        name=provider.name,
        provider_type=provider.provider_type,
        base_url=provider.base_url,
        is_active=provider.is_active,
        rate_limit_per_minute=provider.rate_limit_per_minute,
        daily_quota=provider.daily_quota,
        current_day_requests=provider.current_day_requests,
        has_api_key=bool(provider.api_key_encrypted)
    )


@router.post("/{provider_id}/test")
def test_provider_connectivity(
    provider_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    provider = db.query(SourceProvider).filter(SourceProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Source provider not found")

    # Offline providers are always reachable
    if provider.name == "libphonenumber_engine":
        return {"status": "online", "message": "Google libphonenumber engine operational and responsive."}

    has_key = bool(provider.api_key_encrypted)
    return {
        "status": "configured" if has_key else "missing_key",
        "message": f"Provider {provider.name} registered. API Key is {'configured' if has_key else 'not configured'}."
    }
