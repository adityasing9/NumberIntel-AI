import time
import hashlib
from typing import Optional
import httpx
from app.providers.base import BaseIntelligenceProvider, ProviderLookupResult, ProviderEvidence
from app.schemas.schemas import NormalizedPhoneResult
from app.core.config import settings


class NumverifyAdapter(BaseIntelligenceProvider):
    name = "numverify"
    provider_type = "telecom"
    base_url = "http://apilayer.net/api/validate"

    async def lookup(self, phone: NormalizedPhoneResult, api_key: Optional[str] = None) -> ProviderLookupResult:
        key = api_key or settings.NUMVERIFY_API_KEY
        if not key:
            return ProviderLookupResult(
                provider_name=self.name,
                success=False,
                status_code=401,
                verification_status="api_unavailable",
                error_message="Numverify API key not configured."
            )

        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(self.base_url, params={
                    "access_key": key,
                    "number": phone.e164_format,
                    "country_code": phone.country_iso2,
                    "format": 1
                })
                latency = int((time.time() - start_time) * 1000)
                data = resp.json()
                
                if "error" in data:
                    return ProviderLookupResult(
                        provider_name=self.name,
                        success=False,
                        status_code=resp.status_code,
                        latency_ms=latency,
                        verification_status="api_unavailable",
                        error_message=data["error"].get("info", "Numverify API error")
                    )

                valid = data.get("valid", False)
                carrier = data.get("carrier")
                line_type = data.get("line_type")
                
                snippet = f"Numverify verification: valid={valid}, carrier={carrier}, line_type={line_type}, location={data.get('location')}"
                data_hash = hashlib.sha256(resp.text.encode('utf-8')).hexdigest()

                return ProviderLookupResult(
                    provider_name=self.name,
                    success=True,
                    status_code=resp.status_code,
                    latency_ms=latency,
                    verification_status="verified_association" if valid else "not_found",
                    confidence_level=90.0 if valid else 10.0,
                    evidence=[
                        ProviderEvidence(
                            source_url=self.base_url,
                            snippet=snippet,
                            evidence_type="official_api_response",
                            raw_data_hash=data_hash
                        )
                    ],
                    metadata={"carrier": carrier, "line_type": line_type, "location": data.get("location")}
                )
        except Exception as e:
            latency = int((time.time() - start_time) * 1000)
            return ProviderLookupResult(
                provider_name=self.name,
                success=False,
                status_code=500,
                latency_ms=latency,
                verification_status="search_failed",
                error_message=str(e)
            )
