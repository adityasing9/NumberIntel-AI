import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, Enum, JSON, Numeric, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


# 1. roles
class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True) # admin, investigator, analyst, viewer
    permissions = Column(JSON, nullable=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="role")


# 2. users
class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=True)
    is_active = Column(Boolean, default=True)
    api_quota = Column(Integer, default=10000)
    quota_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    role = relationship("Role", back_populates="users")
    investigations = relationship("Investigation", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    api_usages = relationship("APIUsage", back_populates="user")
    consent_records = relationship("ConsentRecord", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")


# 3. investigations
class Investigation(Base):
    __tablename__ = "investigations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="pending", index=True) # pending, processing, completed, partial, failed
    total_numbers = Column(Integer, default=0)
    verified_matches = Column(Integer, default=0)
    possible_matches = Column(Integer, default=0)
    spam_count = Column(Integer, default=0)
    business_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="investigations")
    bulk_jobs = relationship("BulkJob", back_populates="investigation", cascade="all, delete-orphan")


# 4. phone_numbers
class PhoneNumber(Base):
    __tablename__ = "phone_numbers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    raw_input = Column(String(50), nullable=False, index=True)
    e164_format = Column(String(30), unique=True, nullable=False, index=True)
    national_format = Column(String(50), nullable=True)
    country_code = Column(String(10), nullable=True)
    country_iso2 = Column(String(5), nullable=True, index=True)
    number_type = Column(String(50), default="unknown") # mobile, fixed_line, voip, toll_free, etc.
    is_valid = Column(Boolean, default=False)
    carrier_name = Column(String(150), nullable=True)
    line_type = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lookup_tasks = relationship("LookupTask", back_populates="phone_number")
    spam_reports = relationship("SpamReport", back_populates="phone_number", cascade="all, delete-orphan")


# 5. bulk_jobs
class BulkJob(Base):
    __tablename__ = "bulk_jobs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    investigation_id = Column(String(36), ForeignKey("investigations.id"), nullable=False, index=True)
    total_records = Column(Integer, default=0)
    processed_records = Column(Integer, default=0)
    successful_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    status = Column(String(50), default="pending", index=True) # pending, queued, processing, completed, cancelled, failed
    error_log = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    investigation = relationship("Investigation", back_populates="bulk_jobs")
    lookup_tasks = relationship("LookupTask", back_populates="bulk_job", cascade="all, delete-orphan")


# 6. lookup_tasks
class LookupTask(Base):
    __tablename__ = "lookup_tasks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    bulk_job_id = Column(String(36), ForeignKey("bulk_jobs.id"), nullable=False, index=True)
    phone_number_id = Column(String(36), ForeignKey("phone_numbers.id"), nullable=False, index=True)
    status = Column(String(50), default="pending", index=True) # pending, processing, completed, partial, failed
    retry_count = Column(Integer, default=0)
    scheduled_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    bulk_job = relationship("BulkJob", back_populates="lookup_tasks")
    phone_number = relationship("PhoneNumber", back_populates="lookup_tasks")
    intelligence_result = relationship("IntelligenceResult", back_populates="lookup_task", uselist=False, cascade="all, delete-orphan")
    ai_report = relationship("AIReport", back_populates="lookup_task", uselist=False, cascade="all, delete-orphan")


# 7. intelligence_results
class IntelligenceResult(Base):
    __tablename__ = "intelligence_results"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    lookup_task_id = Column(String(36), ForeignKey("lookup_tasks.id"), unique=True, nullable=False, index=True)
    public_name = Column(String(255), nullable=True)
    business_name = Column(String(255), nullable=True)
    confidence_score = Column(Float, default=0.0)
    overall_verification_status = Column(String(50), default="unverified") # verified, possible_match, unverified, clean, suspicious
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lookup_task = relationship("LookupTask", back_populates="intelligence_result")
    platform_results = relationship("PlatformResult", back_populates="intelligence_result", cascade="all, delete-orphan")


# 8. platform_results
class PlatformResult(Base):
    __tablename__ = "platform_results"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    intelligence_result_id = Column(String(36), ForeignKey("intelligence_results.id"), nullable=False, index=True)
    platform_name = Column(String(50), nullable=False) # whatsapp, telegram, signal, instagram, facebook, linkedin, x, tiktok, snapchat
    verification_status = Column(String(50), default="not_found") # verified_association, possible_public_match, not_found, not_publicly_verifiable, api_unavailable, search_failed
    profile_url = Column(String(500), nullable=True)
    public_username = Column(String(150), nullable=True)
    public_display_name = Column(String(255), nullable=True)
    is_business = Column(Boolean, default=False)
    confidence_level = Column(Float, default=0.0)
    checked_at = Column(DateTime, default=datetime.utcnow)

    intelligence_result = relationship("IntelligenceResult", back_populates="platform_results")
    public_profiles = relationship("PublicProfile", back_populates="platform_result", cascade="all, delete-orphan")
    evidence_records = relationship("EvidenceRecord", back_populates="platform_result", cascade="all, delete-orphan")


# 9. public_profiles
class PublicProfile(Base):
    __tablename__ = "public_profiles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    platform_result_id = Column(String(36), ForeignKey("platform_results.id"), nullable=False, index=True)
    profile_identifier = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    public_contact_info = Column(JSON, nullable=True)
    has_verified_badge = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    platform_result = relationship("PlatformResult", back_populates="public_profiles")


# 10. source_providers
class SourceProvider(Base):
    __tablename__ = "source_providers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False, index=True)
    provider_type = Column(String(50), nullable=False) # telecom, osint_search, social_api, spam_db, ai_llm
    base_url = Column(String(255), nullable=True)
    api_key_encrypted = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    rate_limit_per_minute = Column(Integer, default=60)
    daily_quota = Column(Integer, default=10000)
    current_day_requests = Column(Integer, default=0)
    timeout_seconds = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    evidence_records = relationship("EvidenceRecord", back_populates="source_provider")
    api_usages = relationship("APIUsage", back_populates="source_provider")
    spam_reports = relationship("SpamReport", back_populates="source_provider")


# 11. evidence_records
class EvidenceRecord(Base):
    __tablename__ = "evidence_records"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    platform_result_id = Column(String(36), ForeignKey("platform_results.id"), nullable=False, index=True)
    source_provider_id = Column(String(36), ForeignKey("source_providers.id"), nullable=True, index=True)
    source_url = Column(String(1000), nullable=True)
    snippet = Column(Text, nullable=True)
    evidence_type = Column(String(50), nullable=False) # official_api_response, indexed_business_listing, public_directory_match, search_engine_hit, spam_report_citation
    raw_data_hash = Column(String(64), nullable=True) # SHA-256
    retrieved_at = Column(DateTime, default=datetime.utcnow)

    platform_result = relationship("PlatformResult", back_populates="evidence_records")
    source_provider = relationship("SourceProvider", back_populates="evidence_records")


# 12. spam_reports
class SpamReport(Base):
    __tablename__ = "spam_reports"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    phone_number_id = Column(String(36), ForeignKey("phone_numbers.id"), nullable=False, index=True)
    source_provider_id = Column(String(36), ForeignKey("source_providers.id"), nullable=True, index=True)
    spam_category = Column(String(50), default="unknown") # telemarketing, suspected_fraud, financial_scam, robocall, unwanted_marketing, unknown
    report_count = Column(Integer, default=1)
    risk_level = Column(String(20), default="low") # low, moderate, high, critical
    confidence_score = Column(Float, default=0.0)
    reporter_ip_hash = Column(String(64), nullable=True) # Salted SHA-256
    created_at = Column(DateTime, default=datetime.utcnow)

    phone_number = relationship("PhoneNumber", back_populates="spam_reports")
    source_provider = relationship("SourceProvider", back_populates="spam_reports")


# 13. ai_reports
class AIReport(Base):
    __tablename__ = "ai_reports"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    lookup_task_id = Column(String(36), ForeignKey("lookup_tasks.id"), unique=True, nullable=False, index=True)
    model_used = Column(String(100), nullable=False)
    key_findings = Column(JSON, nullable=True)
    conflicting_evidence = Column(JSON, nullable=True)
    reliability_assessment = Column(Text, nullable=True)
    missing_information = Column(JSON, nullable=True)
    risk_summary = Column(Text, nullable=True)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    lookup_task = relationship("LookupTask", back_populates="ai_report")


# 14. api_usage
class APIUsage(Base):
    __tablename__ = "api_usage"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    source_provider_id = Column(String(36), ForeignKey("source_providers.id"), nullable=True, index=True)
    endpoint = Column(String(255), nullable=False)
    status_code = Column(Integer, default=200)
    latency_ms = Column(Integer, default=0)
    units_consumed = Column(Integer, default=1)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="api_usages")
    source_provider = relationship("SourceProvider", back_populates="api_usages")


# 15. audit_logs
class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(String(50), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="audit_logs")


# 16. consent_records
class ConsentRecord(Base):
    __tablename__ = "consent_records"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    purpose = Column(String(255), nullable=False)
    legal_basis = Column(String(50), default="legitimate_interest") # legitimate_interest, explicit_consent, legal_obligation
    consent_given_at = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45), nullable=True)
    valid_until = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="consent_records")


# 17. user_settings
class UserSettings(Base):
    __tablename__ = "user_settings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    default_country = Column(String(5), default="IN")
    notify_on_job_completion = Column(Boolean, default=True)
    preferred_ai_model = Column(String(100), default="anthropic/claude-3.5-sonnet")
    table_column_prefs = Column(JSON, nullable=True)
    theme = Column(String(20), default="dark")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="settings")
