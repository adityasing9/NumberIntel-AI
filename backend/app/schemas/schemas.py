from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# ---------------- Auth Schemas ----------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str
    full_name: Optional[str] = None


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role_name: Optional[str] = "investigator"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    api_quota: int
    quota_used: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------- Phone Number & Lookup Schemas ----------------
class NormalizedPhoneResult(BaseModel):
    raw_input: str
    e164_format: str
    national_format: str
    country_code: str
    country_iso2: str
    number_type: str
    is_valid: bool
    carrier_name: Optional[str] = None
    line_type: Optional[str] = None
    timezones: List[str] = []


class SingleLookupRequest(BaseModel):
    phone_number: str
    default_country: Optional[str] = "IN"
    investigation_title: Optional[str] = None


class BulkTextImportRequest(BaseModel):
    raw_text: str
    default_country: Optional[str] = "IN"
    investigation_title: Optional[str] = "Bulk Phone Intelligence Investigation"


class PreflightValidationResult(BaseModel):
    total_detected: int
    valid_count: int
    invalid_count: int
    duplicate_count: int
    valid_samples: List[NormalizedPhoneResult]
    invalid_samples: List[str]


# ---------------- Evidence & Platform Results ----------------
class EvidenceRecordResponse(BaseModel):
    id: str
    source_url: Optional[str]
    snippet: Optional[str]
    evidence_type: str
    retrieved_at: datetime

    class Config:
        from_attributes = True


class PublicProfileResponse(BaseModel):
    id: str
    profile_identifier: str
    avatar_url: Optional[str]
    bio: Optional[str]
    public_contact_info: Optional[Dict[str, Any]]
    has_verified_badge: bool

    class Config:
        from_attributes = True


class PlatformResultResponse(BaseModel):
    id: str
    platform_name: str
    verification_status: str
    profile_url: Optional[str]
    public_username: Optional[str]
    public_display_name: Optional[str]
    is_business: bool
    confidence_level: float
    checked_at: datetime
    evidence_records: List[EvidenceRecordResponse] = []
    public_profiles: List[PublicProfileResponse] = []

    class Config:
        from_attributes = True


class SpamReportResponse(BaseModel):
    id: str
    spam_category: str
    report_count: int
    risk_level: str
    confidence_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class SpamReportCreate(BaseModel):
    phone_number: str
    spam_category: str = Field(description="telemarketing, suspected_fraud, financial_scam, robocall, unwanted_marketing")
    description: Optional[str] = None


# ---------------- AI Intelligence Schema ----------------
class AIReportResponse(BaseModel):
    model_config = {"protected_namespaces": (), "from_attributes": True}
    id: str
    model_used: str
    key_findings: Optional[List[Dict[str, Any]]] = []
    conflicting_evidence: Optional[List[Dict[str, Any]]] = []
    reliability_assessment: Optional[str]
    missing_information: Optional[List[str]] = []
    risk_summary: Optional[str]
    created_at: datetime


# ---------------- Full Report Dossier ----------------
class FullNumberReportResponse(BaseModel):
    phone_number: str
    e164_format: str
    national_format: Optional[str]
    country_iso2: Optional[str]
    country_code: Optional[str]
    number_type: str
    is_valid: bool
    carrier_name: Optional[str]
    line_type: Optional[str]
    
    # Resolved identity
    public_name: Optional[str]
    business_name: Optional[str]
    confidence_score: float
    overall_verification_status: str
    summary: Optional[str]
    
    # Category Breakdowns
    platforms: List[PlatformResultResponse] = []
    spam_reports: List[SpamReportResponse] = []
    ai_report: Optional[AIReportResponse] = None
    
    # Metadata
    task_id: str
    task_status: str
    created_at: datetime


# ---------------- Investigation & Bulk Job Schemas ----------------
class InvestigationResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: str
    total_numbers: int
    verified_matches: int
    possible_matches: int
    spam_count: int
    business_count: int
    failed_count: int
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class BulkJobProgressResponse(BaseModel):
    id: str
    investigation_id: str
    total_records: int
    processed_records: int
    successful_records: int
    failed_records: int
    status: str
    progress_percentage: float
    error_log: Optional[str]


# ---------------- Table Item for Bulk Grid ----------------
class BulkResultTableItem(BaseModel):
    task_id: str
    phone_number_id: str
    raw_input: str
    e164_format: str
    country_iso2: str
    country_code: str
    number_type: str
    is_valid: bool
    carrier_name: Optional[str]
    public_name: Optional[str]
    business_name: Optional[str]
    confidence_score: float
    overall_status: str
    whatsapp_status: str
    telegram_status: str
    social_profiles_count: int
    spam_risk_level: str
    task_status: str
    created_at: datetime


class PaginatedTableResponse(BaseModel):
    items: List[BulkResultTableItem]
    total: int
    page: int
    page_size: int
    total_pages: int


# ---------------- Source Provider Schemas ----------------
class SourceProviderResponse(BaseModel):
    id: str
    name: str
    provider_type: str
    base_url: Optional[str]
    is_active: bool
    rate_limit_per_minute: int
    daily_quota: int
    current_day_requests: int
    has_api_key: bool

    class Config:
        from_attributes = True


class SourceProviderUpdate(BaseModel):
    is_active: Optional[bool] = None
    api_key: Optional[str] = None
    rate_limit_per_minute: Optional[int] = None
    daily_quota: Optional[int] = None


# ---------------- Analytics Dashboard Schemas ----------------
class MetricCard(BaseModel):
    title: str
    value: int
    change: Optional[str] = None
    trend: Optional[str] = "neutral"


class TimeSeriesPoint(BaseModel):
    date: str
    searches: int
    verified: int
    spam: int


class PlatformBreakdown(BaseModel):
    platform: str
    verified: int
    possible: int
    unverified: int


class CountryBreakdown(BaseModel):
    country: str
    code: str
    count: int


class SpamDistribution(BaseModel):
    category: str
    count: int


class DashboardAnalyticsResponse(BaseModel):
    metrics: Dict[str, int]
    timeline: List[TimeSeriesPoint]
    platforms: List[PlatformBreakdown]
    countries: List[CountryBreakdown]
    spam_distribution: List[SpamDistribution]
