from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import PhoneNumber, SpamReport, User
from app.schemas.schemas import SpamReportCreate, SpamReportResponse
from app.services.normalizer_service import phone_normalizer
from app.core.security import hash_sensitive_data
from app.api.v1.deps import get_current_user

router = APIRouter()


@router.post("/report", response_model=SpamReportResponse, status_code=status.HTTP_201_CREATED)
def submit_spam_report(
    payload: SpamReportCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    normalized = phone_normalizer.parse_and_normalize(payload.phone_number)
    if not normalized.is_valid:
        raise HTTPException(status_code=400, detail="Invalid telephone number format.")

    # Find or create PhoneNumber record
    phone_rec = db.query(PhoneNumber).filter(PhoneNumber.e164_format == normalized.e164_format).first()
    if not phone_rec:
        phone_rec = PhoneNumber(
            raw_input=payload.phone_number,
            e164_format=normalized.e164_format,
            national_format=normalized.national_format,
            country_code=normalized.country_code,
            country_iso2=normalized.country_iso2,
            number_type=normalized.number_type,
            is_valid=normalized.is_valid
        )
        db.add(phone_rec)
        db.flush()

    # Hash IP for privacy and duplicate prevention
    client_ip = request.client.host if request.client else "127.0.0.1"
    ip_hash = hash_sensitive_data(client_ip)

    # Check existing report from same IP in last 24h
    existing = db.query(SpamReport).filter(
        SpamReport.phone_number_id == phone_rec.id,
        SpamReport.reporter_ip_hash == ip_hash
    ).first()

    if existing:
        existing.report_count += 1
        existing.spam_category = payload.spam_category
        db.commit()
        db.refresh(existing)
        report = existing
    else:
        report = SpamReport(
            phone_number_id=phone_rec.id,
            spam_category=payload.spam_category,
            report_count=1,
            risk_level="moderate" if payload.spam_category in ["suspected_fraud", "financial_scam"] else "low",
            confidence_score=75.0,
            reporter_ip_hash=ip_hash
        )
        db.add(report)
        db.commit()
        db.refresh(report)

    return SpamReportResponse(
        id=report.id,
        spam_category=report.spam_category,
        report_count=report.report_count,
        risk_level=report.risk_level,
        confidence_score=report.confidence_score,
        created_at=report.created_at
    )
