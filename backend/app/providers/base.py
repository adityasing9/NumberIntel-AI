from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.schemas.schemas import NormalizedPhoneResult


class ProviderEvidence(BaseModel):
    source_url: Optional[str] = None
    snippet: str
    evidence_type: str # official_api_response, indexed_business_listing, public_directory_match, search_engine_hit, spam_report_citation
    raw_data_hash: Optional[str] = None


class ProviderLookupResult(BaseModel):
    provider_name: str
    success: bool
    status_code: int = 200
    latency_ms: int = 0
    verification_status: str = "not_found" # verified_association, possible_public_match, not_found, not_publicly_verifiable, api_unavailable, search_failed
    confidence_level: float = 0.0 # 0.0 to 100.0
    public_name: Optional[str] = None
    business_name: Optional[str] = None
    public_username: Optional[str] = None
    public_display_name: Optional[str] = None
    profile_url: Optional[str] = None
    is_business: bool = False
    evidence: List[ProviderEvidence] = []
    metadata: Dict[str, Any] = {}
    error_message: Optional[str] = None


class BaseIntelligenceProvider(ABC):
    name: str = "base"
    provider_type: str = "generic"

    @abstractmethod
    async def lookup(self, phone: NormalizedPhoneResult, api_key: Optional[str] = None) -> ProviderLookupResult:
        pass

    async def health_check(self) -> bool:
        return True
