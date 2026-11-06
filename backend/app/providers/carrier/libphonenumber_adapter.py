import time
import hashlib
from typing import Optional
from app.providers.base import BaseIntelligenceProvider, ProviderLookupResult, ProviderEvidence
from app.schemas.schemas import NormalizedPhoneResult


class LibphonenumberCarrierAdapter(BaseIntelligenceProvider):
    name = "libphonenumber_engine"
    provider_type = "telecom"

    async def lookup(self, phone: NormalizedPhoneResult, api_key: Optional[str] = None) -> ProviderLookupResult:
        start_time = time.time()
        
        evidence_snippet = (
            f"Google libphonenumber authoritative metadata: Country={phone.country_iso2} (+{phone.country_code}), "
            f"Type={phone.number_type}, Carrier={phone.carrier_name or 'Not statically allocated'}, "
            f"Valid={phone.is_valid}"
        )
        data_hash = hashlib.sha256(evidence_snippet.encode('utf-8')).hexdigest()
        
        evidence = [
            ProviderEvidence(
                source_url="https://github.com/google/libphonenumber",
                snippet=evidence_snippet,
                evidence_type="official_api_response",
                raw_data_hash=data_hash
            )
        ]
        
        latency = int((time.time() - start_time) * 1000)
        
        return ProviderLookupResult(
            provider_name=self.name,
            success=True,
            status_code=200,
            latency_ms=latency,
            verification_status="verified_association" if phone.is_valid else "not_found",
            confidence_level=95.0 if phone.is_valid else 0.0,
            is_business=(phone.number_type in ["toll_free", "premium_rate", "uan"]),
            evidence=evidence,
            metadata={
                "carrier": phone.carrier_name,
                "line_type": phone.line_type,
                "timezones": phone.timezones,
                "is_valid": phone.is_valid
            }
        )
