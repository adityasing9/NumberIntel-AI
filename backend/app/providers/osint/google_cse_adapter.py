import time
import hashlib
from typing import Optional, List
import httpx
from app.providers.base import BaseIntelligenceProvider, ProviderLookupResult, ProviderEvidence
from app.schemas.schemas import NormalizedPhoneResult
from app.core.config import settings


class GoogleCSEAdapter(BaseIntelligenceProvider):
    name = "google_cse"
    provider_type = "osint_search"
    base_url = "https://www.googleapis.com/customsearch/v1"

    async def lookup(self, phone: NormalizedPhoneResult, api_key: Optional[str] = None) -> ProviderLookupResult:
        key = api_key or settings.GOOGLE_CSE_API_KEY
        cx = settings.GOOGLE_CSE_CX
        
        if not key or not cx:
            return ProviderLookupResult(
                provider_name=self.name,
                success=False,
                status_code=401,
                verification_status="api_unavailable",
                error_message="Google Custom Search API Key or Search Engine ID (CX) not configured."
            )

        start_time = time.time()
        # Search query format: exact match on E.164 or national format
        query = f'"{phone.e164_format}" OR "{phone.national_format}"'
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(self.base_url, params={
                    "key": key,
                    "cx": cx,
                    "q": query,
                    "num": 5
                })
                latency = int((time.time() - start_time) * 1000)
                data = resp.json()
                
                if resp.status_code != 200 or "items" not in data:
                    return ProviderLookupResult(
                        provider_name=self.name,
                        success=True,
                        status_code=resp.status_code,
                        latency_ms=latency,
                        verification_status="not_found",
                        confidence_level=0.0,
                        metadata={"total_results": data.get("searchInformation", {}).get("totalResults", "0")}
                    )

                items = data.get("items", [])
                evidence_list: List[ProviderEvidence] = []
                discovered_business: Optional[str] = None
                discovered_name: Optional[str] = None

                for item in items:
                    title = item.get("title", "")
                    link = item.get("link", "")
                    snippet = item.get("snippet", "")
                    
                    # Compute integrity hash
                    h = hashlib.sha256(f"{link}:{snippet}".encode('utf-8')).hexdigest()
                    evidence_list.append(ProviderEvidence(
                        source_url=link,
                        snippet=f"[{title}] {snippet}",
                        evidence_type="indexed_business_listing" if any(b in snippet.lower() for b in ["ltd", "inc", "company", "services", "pvt", "shop", "clinic"]) else "search_engine_hit",
                        raw_data_hash=h
                    ))
                    
                    if not discovered_business and any(b in title.lower() for b in ["company", "pvt", "ltd", "firm", "store", "services"]):
                        discovered_business = title.split("-")[0].split("|")[0].strip()

                return ProviderLookupResult(
                    provider_name=self.name,
                    success=True,
                    status_code=200,
                    latency_ms=latency,
                    verification_status="possible_public_match" if items else "not_found",
                    confidence_level=75.0 if items else 0.0,
                    business_name=discovered_business,
                    public_name=discovered_name,
                    evidence=evidence_list,
                    metadata={"items_count": len(items)}
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
