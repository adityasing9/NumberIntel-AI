from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import (
    Investigation, PhoneNumber, LookupTask, PlatformResult, SpamReport, User
)
from app.schemas.schemas import (
    DashboardAnalyticsResponse, TimeSeriesPoint, PlatformBreakdown,
    CountryBreakdown, SpamDistribution
)
from app.api.v1.deps import get_current_user

router = APIRouter()


@router.get("/dashboard", response_model=DashboardAnalyticsResponse)
def get_dashboard_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. High-level metric counts
    total_processed = db.query(func.count(LookupTask.id)).filter(LookupTask.status == "completed").scalar() or 0
    total_failed = db.query(func.count(LookupTask.id)).filter(LookupTask.status == "failed").scalar() or 0
    
    verified_matches = (
        db.query(func.count(PlatformResult.id))
        .filter(PlatformResult.verification_status == "verified_association")
        .scalar() or 0
    )
    
    possible_matches = (
        db.query(func.count(PlatformResult.id))
        .filter(PlatformResult.verification_status == "possible_public_match")
        .scalar() or 0
    )
    
    spam_count = db.query(func.count(func.distinct(SpamReport.phone_number_id))).scalar() or 0
    
    business_count = (
        db.query(func.count(PhoneNumber.id))
        .filter(PhoneNumber.number_type.in_(["toll_free", "premium_rate", "uan"]))
        .scalar() or 0
    )

    metrics = {
        "total_numbers_processed": total_processed,
        "verified_public_matches": verified_matches,
        "possible_profile_matches": possible_matches,
        "spam_associated_numbers": spam_count,
        "business_numbers_identified": business_count,
        "failed_lookups": total_failed,
    }

    # 2. Timeline series (last 7 days)
    now = datetime.utcnow()
    timeline: List[TimeSeriesPoint] = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        searches = db.query(func.count(LookupTask.id)).filter(
            LookupTask.scheduled_at >= day_start,
            LookupTask.scheduled_at < day_end
        ).scalar() or 0
        
        verified = db.query(func.count(PlatformResult.id)).filter(
            PlatformResult.checked_at >= day_start,
            PlatformResult.checked_at < day_end,
            PlatformResult.verification_status == "verified_association"
        ).scalar() or 0
        
        spam = db.query(func.count(SpamReport.id)).filter(
            SpamReport.created_at >= day_start,
            SpamReport.created_at < day_end
        ).scalar() or 0

        timeline.append(TimeSeriesPoint(
            date=day_start.strftime("%b %d"),
            searches=searches,
            verified=verified,
            spam=spam
        ))

    # 3. Platform Breakdown
    platform_names = ["whatsapp", "telegram", "signal", "instagram", "facebook", "linkedin", "x", "tiktok", "snapchat"]
    platforms: List[PlatformBreakdown] = []
    for p_name in platform_names:
        v_count = db.query(func.count(PlatformResult.id)).filter(
            PlatformResult.platform_name == p_name,
            PlatformResult.verification_status == "verified_association"
        ).scalar() or 0
        pos_count = db.query(func.count(PlatformResult.id)).filter(
            PlatformResult.platform_name == p_name,
            PlatformResult.verification_status == "possible_public_match"
        ).scalar() or 0
        unver_count = db.query(func.count(PlatformResult.id)).filter(
            PlatformResult.platform_name == p_name,
            PlatformResult.verification_status.in_(["not_found", "not_publicly_verifiable"])
        ).scalar() or 0
        
        platforms.append(PlatformBreakdown(
            platform=p_name.capitalize(),
            verified=v_count,
            possible=pos_count,
            unverified=unver_count
        ))

    # 4. Results by Country
    country_query = (
        db.query(PhoneNumber.country_iso2, func.count(PhoneNumber.id))
        .filter(PhoneNumber.country_iso2.isnot(None))
        .group_by(PhoneNumber.country_iso2)
        .order_by(func.count(PhoneNumber.id).desc())
        .limit(6)
        .all()
    )
    countries = [
        CountryBreakdown(
            country=iso or "Unknown",
            code=iso or "XX",
            count=count
        )
        for iso, count in country_query
    ]
    if not countries:
        countries = [CountryBreakdown(country="India", code="IN", count=0)]

    # 5. Spam Category Distribution
    spam_query = (
        db.query(SpamReport.spam_category, func.count(SpamReport.id))
        .group_by(SpamReport.spam_category)
        .all()
    )
    spam_distribution = [
        SpamDistribution(category=cat.replace("_", " ").title(), count=cnt)
        for cat, cnt in spam_query
    ]
    if not spam_distribution:
        spam_distribution = [
            SpamDistribution(category="Telemarketing", count=0),
            SpamDistribution(category="Robocall", count=0),
            SpamDistribution(category="Suspected Fraud", count=0)
        ]

    return DashboardAnalyticsResponse(
        metrics=metrics,
        timeline=timeline,
        platforms=platforms,
        countries=countries,
        spam_distribution=spam_distribution
    )
