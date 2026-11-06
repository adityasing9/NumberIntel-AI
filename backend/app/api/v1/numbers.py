from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import (
    PhoneNumber, LookupTask, BulkJob, Investigation, IntelligenceResult,
    PlatformResult, EvidenceRecord, PublicProfile, SpamReport, AIReport, User
)
from app.services.normalizer_service import phone_normalizer
from app.services.orchestrator_service import orchestrator
from app.schemas.schemas import (
    SingleLookupRequest, FullNumberReportResponse, PlatformResultResponse,
    EvidenceRecordResponse, PublicProfileResponse, SpamReportResponse, AIReportResponse
)
from app.api.v1.deps import get_current_user

router = APIRouter()


@router.post("/single", response_model=FullNumberReportResponse)
async def single_number_lookup(
    payload: SingleLookupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    normalized = phone_normalizer.parse_and_normalize(payload.phone_number, payload.default_country or "IN")
    if not normalized.is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"The supplied input '{payload.phone_number}' is not a valid telephone number for region {payload.default_country}."
        )

    # Find or create PhoneNumber
    phone_rec = db.query(PhoneNumber).filter(PhoneNumber.e164_format == normalized.e164_format).first()
    if not phone_rec:
        phone_rec = PhoneNumber(
            raw_input=payload.phone_number,
            e164_format=normalized.e164_format,
            national_format=normalized.national_format,
            country_code=normalized.country_code,
            country_iso2=normalized.country_iso2,
            number_type=normalized.number_type,
            is_valid=normalized.is_valid,
            carrier_name=normalized.carrier_name,
            line_type=normalized.line_type
        )
        db.add(phone_rec)
        db.flush()

    # Create Investigation
    inv = Investigation(
        user_id=current_user.id,
        title=payload.investigation_title or f"Lookup: {normalized.e164_format}",
        status="processing",
        total_numbers=1
    )
    db.add(inv)
    db.flush()

    # Create Bulk Job
    job = BulkJob(
        investigation_id=inv.id,
        total_records=1,
        status="processing"
    )
    db.add(job)
    db.flush()

    # Create LookupTask
    task = LookupTask(
        bulk_job_id=job.id,
        phone_number_id=phone_rec.id,
        status="pending"
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Execute orchestrator directly
    await orchestrator.execute_task(task.id, db)
    db.refresh(task)

    return get_task_report(task.id, db, current_user)


@router.get("/{task_id}/report", response_model=FullNumberReportResponse)
def get_task_report(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.expire_all()
    task = db.query(LookupTask).filter(LookupTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Lookup task not found")

    phone = task.phone_number
    intel = task.intelligence_result
    ai = task.ai_report

    # Collect platforms
    platform_responses: List[PlatformResultResponse] = []
    if intel and intel.platform_results:
        for p in intel.platform_results:
            evs = [
                EvidenceRecordResponse(
                    id=e.id,
                    source_url=e.source_url,
                    snippet=e.snippet,
                    evidence_type=e.evidence_type,
                    retrieved_at=e.retrieved_at
                )
                for e in p.evidence_records
            ]
            profs = [
                PublicProfileResponse(
                    id=prof.id,
                    profile_identifier=prof.profile_identifier,
                    avatar_url=prof.avatar_url,
                    bio=prof.bio,
                    public_contact_info=prof.public_contact_info,
                    has_verified_badge=prof.has_verified_badge
                )
                for prof in p.public_profiles
            ]
            platform_responses.append(PlatformResultResponse(
                id=p.id,
                platform_name=p.platform_name,
                verification_status=p.verification_status,
                profile_url=p.profile_url,
                public_username=p.public_username,
                public_display_name=p.public_display_name,
                is_business=p.is_business,
                confidence_level=p.confidence_level,
                checked_at=p.checked_at,
                evidence_records=evs,
                public_profiles=profs
            ))

    # Collect spam reports
    spam_responses = [
        SpamReportResponse(
            id=s.id,
            spam_category=s.spam_category,
            report_count=s.report_count,
            risk_level=s.risk_level,
            confidence_score=s.confidence_score,
            created_at=s.created_at
        )
        for s in phone.spam_reports
    ]

    ai_response = None
    if ai:
        ai_response = AIReportResponse(
            id=ai.id,
            model_used=ai.model_used,
            key_findings=ai.key_findings or [],
            conflicting_evidence=ai.conflicting_evidence or [],
            reliability_assessment=ai.reliability_assessment,
            missing_information=ai.missing_information or [],
            risk_summary=ai.risk_summary,
            created_at=ai.created_at
        )

    return FullNumberReportResponse(
        phone_number=phone.raw_input,
        e164_format=phone.e164_format,
        national_format=phone.national_format,
        country_iso2=phone.country_iso2,
        country_code=phone.country_code,
        number_type=phone.number_type,
        is_valid=phone.is_valid,
        carrier_name=phone.carrier_name,
        line_type=phone.line_type,
        public_name=intel.public_name if intel else None,
        business_name=intel.business_name if intel else None,
        confidence_score=intel.confidence_score if intel else 0.0,
        overall_verification_status=intel.overall_verification_status if intel else "unverified",
        summary=intel.summary if intel else None,
        platforms=platform_responses,
        spam_reports=spam_responses,
        ai_report=ai_response,
        task_id=task.id,
        task_status=task.status,
        created_at=task.scheduled_at
    )
