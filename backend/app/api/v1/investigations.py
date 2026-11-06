import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.models import Investigation, BulkJob, LookupTask, PhoneNumber, IntelligenceResult, PlatformResult, SpamReport, User
from app.schemas.schemas import (
    InvestigationResponse, PaginatedTableResponse, BulkResultTableItem
)
from app.api.v1.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[InvestigationResponse])
def list_investigations(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Investigation).filter(Investigation.user_id == current_user.id)
    investigations = query.order_by(desc(Investigation.created_at)).offset(skip).limit(limit).all()
    return investigations


@router.post("", response_model=InvestigationResponse, status_code=status.HTTP_201_CREATED)
def create_investigation(
    title: str = "Investigation Case",
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = Investigation(
        user_id=current_user.id,
        title=title,
        description=description,
        status="pending"
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.get("/{investigation_id}", response_model=InvestigationResponse)
def get_investigation(
    investigation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(
        Investigation.id == investigation_id,
        Investigation.user_id == current_user.id
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return inv


@router.delete("/{investigation_id}")
def delete_investigation(
    investigation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(
        Investigation.id == investigation_id,
        Investigation.user_id == current_user.id
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    db.delete(inv)
    db.commit()
    return {"message": "Investigation deleted successfully"}


@router.get("/{investigation_id}/table", response_model=PaginatedTableResponse)
def get_investigation_table(
    investigation_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(
        Investigation.id == investigation_id,
        Investigation.user_id == current_user.id
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Query tasks through bulk jobs
    query = (
        db.query(LookupTask)
        .join(BulkJob, LookupTask.bulk_job_id == BulkJob.id)
        .filter(BulkJob.investigation_id == investigation_id)
        .join(PhoneNumber, LookupTask.phone_number_id == PhoneNumber.id)
    )

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (PhoneNumber.e164_format.ilike(search_pattern)) |
            (PhoneNumber.raw_input.ilike(search_pattern)) |
            (PhoneNumber.carrier_name.ilike(search_pattern))
        )

    if status_filter:
        query = query.filter(LookupTask.status == status_filter)

    total_records = query.count()
    total_pages = max(1, math.ceil(total_records / page_size))
    tasks = query.order_by(desc(LookupTask.scheduled_at)).offset((page - 1) * page_size).limit(page_size).all()

    items: List[BulkResultTableItem] = []
    for t in tasks:
        p = t.phone_number
        intel = t.intelligence_result
        
        # Social statuses
        wa_status = "not_found"
        tg_status = "not_found"
        profile_count = 0
        if intel and intel.platform_results:
            for plat in intel.platform_results:
                if plat.platform_name == "whatsapp":
                    wa_status = plat.verification_status
                elif plat.platform_name == "telegram":
                    tg_status = plat.verification_status
                if plat.verification_status in ["verified_association", "possible_public_match"]:
                    profile_count += 1

        # Spam status
        spam_level = "low"
        if p.spam_reports:
            spam_level = p.spam_reports[0].risk_level

        # Derive avatar & handle
        avatar_url = None
        user_handle = None
        if intel and intel.platform_results:
            for plat in intel.platform_results:
                if plat.public_username and not user_handle:
                    user_handle = f"@{plat.public_username.lstrip('@')}"
                for prof in plat.public_profiles:
                    if prof.avatar_url and not avatar_url:
                        avatar_url = prof.avatar_url

        if not avatar_url:
            safe_seed = (intel.public_name if intel and intel.public_name else p.e164_format).replace(" ", "+")
            avatar_url = f"https://api.dicebear.com/7.x/initials/svg?seed={safe_seed}&backgroundColor=0f172a&textColor=38bdf8"

        carrier_circle = "Delhi NCR" if p.country_iso2 == "IN" else "Standard Region"

        item = BulkResultTableItem(
            task_id=t.id,
            phone_number_id=p.id,
            raw_input=p.raw_input,
            e164_format=p.e164_format,
            country_iso2=p.country_iso2 or "",
            country_code=p.country_code or "",
            number_type=p.number_type,
            is_valid=p.is_valid,
            carrier_name=p.carrier_name,
            carrier_circle=carrier_circle,
            public_name=intel.public_name if intel else None,
            business_name=intel.business_name if intel else None,
            avatar_url=avatar_url,
            user_handle=user_handle,
            confidence_score=intel.confidence_score if intel else 0.0,
            overall_status=intel.overall_verification_status if intel else "unverified",
            whatsapp_status=wa_status,
            telegram_status=tg_status,
            social_profiles_count=profile_count,
            spam_risk_level=spam_level,
            task_status=t.status,
            created_at=t.scheduled_at
        )
        items.append(item)

    return PaginatedTableResponse(
        items=items,
        total=total_records,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )
