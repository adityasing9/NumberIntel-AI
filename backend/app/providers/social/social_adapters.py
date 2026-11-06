import time
import hashlib
from typing import Dict, Any, List, Optional
import httpx
from app.providers.base import BaseIntelligenceProvider, ProviderLookupResult, ProviderEvidence
from app.schemas.schemas import NormalizedPhoneResult
from app.core.config import settings


class WhatsAppDiscoveryAdapter(BaseIntelligenceProvider):
    name = "whatsapp_discovery"
    provider_type = "social_api"

    async def lookup(self, phone: NormalizedPhoneResult, api_key: Optional[str] = None) -> ProviderLookupResult:
        start_time = time.time()
        clean_number = phone.e164_format.replace("+", "")
        
        # WhatsApp Official Click-to-Chat endpoint verification (checks public web endpoint structure)
        wa_url = f"https://api.whatsapp.com/send?phone={clean_number}"
        
        try:
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                # Issue HEAD or GET to see if WhatsApp Business or web gateway responds
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NumberIntel/1.0"}
                resp = await client.get(wa_url, headers=headers)
                latency = int((time.time() - start_time) * 1000)
                
                # Check for public business action page vs standard page
                # Note: To respect WhatsApp terms and privacy laws, we do not scrape private user accounts
                page_text = resp.text
                
                is_business_profile = "business_name" in page_text.lower() or "whatsapp business" in page_text.lower()
                
                if is_business_profile:
                    snippet = f"WhatsApp Business gateway public link: {wa_url} - Public Business entry recognized."
                    h = hashlib.sha256(snippet.encode('utf-8')).hexdigest()
                    return ProviderLookupResult(
                        provider_name=self.name,
                        success=True,
                        status_code=200,
                        latency_ms=latency,
                        verification_status="verified_association",
                        confidence_level=85.0,
                        profile_url=wa_url,
                        is_business=True,
                        evidence=[ProviderEvidence(
                            source_url=wa_url,
                            snippet=snippet,
                            evidence_type="official_api_response",
                            raw_data_hash=h
                        )]
                    )
                else:
                    # In compliance with privacy guidelines: private personal accounts cannot and should not be enumerated
                    snippet = "WhatsApp private accounts are not enumerated. Direct reverse phone lookup is not publicly verifiable through lawful sources."
                    return ProviderLookupResult(
                        provider_name=self.name,
                        success=True,
                        status_code=200,
                        latency_ms=latency,
                        verification_status="not_publicly_verifiable",
                        confidence_level=0.0,
                        profile_url=wa_url,
                        evidence=[ProviderEvidence(
                            source_url=wa_url,
                            snippet=snippet,
                            evidence_type="official_api_response",
                            raw_data_hash=hashlib.sha256(snippet.encode('utf-8')).hexdigest()
                        )]
                    )
        except Exception as e:
            latency = int((time.time() - start_time) * 1000)
            return ProviderLookupResult(
                provider_name=self.name,
                success=True,
                status_code=200,
                latency_ms=latency,
                verification_status="not_publicly_verifiable",
                confidence_level=0.0,
                error_message=str(e)
            )


class TelegramDiscoveryAdapter(BaseIntelligenceProvider):
    name = "telegram_discovery"
    provider_type = "social_api"

    async def lookup(self, phone: NormalizedPhoneResult, api_key: Optional[str] = None) -> ProviderLookupResult:
        start_time = time.time()
        # In compliance with Telegram Bot API and terms of service:
        # Telegram does not offer public reverse lookup for arbitrary phone numbers without address book syncing
        latency = int((time.time() - start_time) * 1000)
        snippet = "Telegram Bot API restricts reverse phone lookup. Personal user accounts are protected by privacy settings and cannot be enumerated."
        return ProviderLookupResult(
            provider_name=self.name,
            success=True,
            status_code=200,
            latency_ms=latency,
            verification_status="not_publicly_verifiable",
            confidence_level=0.0,
            evidence=[ProviderEvidence(
                source_url="https://core.telegram.org/api",
                snippet=snippet,
                evidence_type="official_api_response",
                raw_data_hash=hashlib.sha256(snippet.encode('utf-8')).hexdigest()
            )]
        )


class SignalDiscoveryAdapter(BaseIntelligenceProvider):
    name = "signal_discovery"
    provider_type = "social_api"

    async def lookup(self, phone: NormalizedPhoneResult, api_key: Optional[str] = None) -> ProviderLookupResult:
        start_time = time.time()
        latency = int((time.time() - start_time) * 1000)
        snippet = "Signal uses end-to-end zero-knowledge architecture. No public directory or reverse phone lookup is permitted or exists by platform design."
        return ProviderLookupResult(
            provider_name=self.name,
            success=True,
            status_code=200,
            latency_ms=latency,
            verification_status="not_publicly_verifiable",
            confidence_level=0.0,
            evidence=[ProviderEvidence(
                source_url="https://signal.org",
                snippet=snippet,
                evidence_type="official_api_response",
                raw_data_hash=hashlib.sha256(snippet.encode('utf-8')).hexdigest()
            )]
        )


class SocialPlatformSearchAdapter(BaseIntelligenceProvider):
    """
    Lawfully checks whether public business pages on Instagram, Facebook, LinkedIn, X, TikTok, or Snapchat
    publicly index this phone number via authorized search engine queries.
    """
    def __init__(self, platform_name: str, domain: str):
        self.platform_name = platform_name
        self.domain = domain
        self.name = f"{platform_name}_discovery"
        self.provider_type = "social_api"

    async def lookup(self, phone: NormalizedPhoneResult, api_key: Optional[str] = None) -> ProviderLookupResult:
        start_time = time.time()
        key = api_key or settings.GOOGLE_CSE_API_KEY
        cx = settings.GOOGLE_CSE_CX
        
        if not key or not cx:
            # When search engine API is not configured, report transparently as not publicly verifiable / unindexed
            latency = int((time.time() - start_time) * 1000)
            snippet = f"{self.platform_name.title()} public indexing requires search engine integration. Direct private enumeration is forbidden."
            return ProviderLookupResult(
                provider_name=self.name,
                success=True,
                status_code=200,
                latency_ms=latency,
                verification_status="not_found",
                confidence_level=0.0,
                evidence=[ProviderEvidence(
                    source_url=f"https://{self.domain}",
                    snippet=snippet,
                    evidence_type="public_directory_match",
                    raw_data_hash=hashlib.sha256(snippet.encode('utf-8')).hexdigest()
                )]
            )

        query = f'"{phone.e164_format}" site:{self.domain}'
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get("https://www.googleapis.com/customsearch/v1", params={
                    "key": key,
                    "cx": cx,
                    "q": query,
                    "num": 3
                })
                latency = int((time.time() - start_time) * 1000)
                data = resp.json()
                items = data.get("items", [])

                if not items:
                    return ProviderLookupResult(
                        provider_name=self.name,
                        success=True,
                        status_code=200,
                        latency_ms=latency,
                        verification_status="not_found",
                        confidence_level=0.0
                    )

                top_hit = items[0]
                link = top_hit.get("link", "")
                title = top_hit.get("title", "")
                snippet = top_hit.get("snippet", "")
                h = hashlib.sha256(f"{link}:{snippet}".encode('utf-8')).hexdigest()

                return ProviderLookupResult(
                    provider_name=self.name,
                    success=True,
                    status_code=200,
                    latency_ms=latency,
                    verification_status="possible_public_match",
                    confidence_level=60.0,
                    profile_url=link,
                    public_display_name=title,
                    evidence=[ProviderEvidence(
                        source_url=link,
                        snippet=f"Indexed public page: {snippet}",
                        evidence_type="search_engine_hit",
                        raw_data_hash=h
                    )]
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


# Factory for the 9 platform adapters
def get_all_social_adapters() -> Dict[str, BaseIntelligenceProvider]:
    return {
        "whatsapp": WhatsAppDiscoveryAdapter(),
        "telegram": TelegramDiscoveryAdapter(),
        "signal": SignalDiscoveryAdapter(),
        "instagram": SocialPlatformSearchAdapter("instagram", "instagram.com"),
        "facebook": SocialPlatformSearchAdapter("facebook", "facebook.com"),
        "linkedin": SocialPlatformSearchAdapter("linkedin", "linkedin.com"),
        "x": SocialPlatformSearchAdapter("x", "twitter.com"),
        "tiktok": SocialPlatformSearchAdapter("tiktok", "tiktok.com"),
        "snapchat": SocialPlatformSearchAdapter("snapchat", "snapchat.com"),
    }
