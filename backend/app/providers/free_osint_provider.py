import time
import re
import urllib.parse
import hashlib
from typing import Optional, List, Dict, Any
import httpx
from bs4 import BeautifulSoup

from app.providers.base import BaseIntelligenceProvider, ProviderLookupResult, ProviderEvidence
from app.schemas.schemas import NormalizedPhoneResult


class FreeInternetOSINTProvider(BaseIntelligenceProvider):
    name = "free_osint"
    provider_type = "osint_search"
    base_url = "https://html.duckduckgo.com/html"

    async def lookup(self, phone: NormalizedPhoneResult, api_key: Optional[str] = None) -> ProviderLookupResult:
        start_time = time.time()
        clean_digits = re.sub(r"\D", "", phone.e164_format)
        ten_digits = clean_digits[-10:] if len(clean_digits) >= 10 else clean_digits
        country_code = phone.country_iso2.upper() if phone.country_iso2 else "IN"

        evidence_list: List[ProviderEvidence] = []
        discovered_name: Optional[str] = None
        discovered_business: Optional[str] = None
        discovered_carrier: Optional[str] = None
        discovered_profiles: List[Dict[str, str]] = []
        spam_reports_count = 0

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }

        async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
            # 1. DuckDuckGo HTML Open Recon
            try:
                query = f'"{ten_digits}"'
                ddg_resp = await client.get(self.base_url, params={"q": query})
                if ddg_resp.status_code == 200:
                    soup = BeautifulSoup(ddg_resp.text, "html.parser")
                    for res in soup.find_all("div", class_="result"):
                        title_elem = res.find("a", class_="result__a")
                        snippet_elem = res.find("a", class_="result__snippet")
                        url_elem = res.find("a", class_="result__url")

                        title = title_elem.get_text(" ", strip=True) if title_elem else ""
                        snippet = snippet_elem.get_text(" ", strip=True) if snippet_elem else ""
                        raw_href = url_elem.get("href", "") if url_elem else (title_elem.get("href", "") if title_elem else "")

                        # Decode URL
                        target_url = raw_href
                        if "uddg=" in raw_href:
                            try:
                                parsed = urllib.parse.parse_qs(urllib.parse.urlparse(raw_href).query)
                                target_url = parsed.get("uddg", [raw_href])[0]
                            except Exception:
                                pass

                        if title and snippet:
                            raw_hash = hashlib.sha256(f"{target_url}:{snippet}".encode("utf-8")).hexdigest()
                            evidence_list.append(ProviderEvidence(
                                source_url=target_url,
                                snippet=f"[{title}] {snippet}",
                                evidence_type="search_engine_hit",
                                raw_data_hash=raw_hash
                            ))

                            combined = f"{title} {snippet}".lower()

                            # LinkedIn Profile Detection
                            if "linkedin.com/in/" in target_url:
                                name_candidate = title.split("-")[0].split("|")[0].replace(ten_digits, "").strip()
                                if name_candidate and len(name_candidate) > 2 and not discovered_name:
                                    discovered_name = name_candidate
                                discovered_profiles.append({
                                    "platform": "LinkedIn",
                                    "url": target_url,
                                    "title": title
                                })

                            # Business Detection
                            if any(b in combined for b in ["store", "hospital", "clinic", "pvt ltd", "limited", "enterprise", "services"]):
                                if not discovered_business:
                                    candidate = title.split("-")[0].split("|")[0].strip()
                                    if len(candidate) < 50:
                                        discovered_business = candidate

                            # Carrier Mentions
                            for c in ["Bharti Airtel", "Vodafone Idea", "Reliance Jio", "BSNL", "MTNL", "Verizon", "AT&T", "T-Mobile"]:
                                if c.lower() in combined and not discovered_carrier:
                                    discovered_carrier = c

                            # Spam Mentions
                            if any(w in combined for w in ["scam", "fraud", "telemarketer", "cost trap", "harassment"]):
                                spam_reports_count += 1
            except Exception:
                pass

            # 2. Tellows Free Registry
            try:
                t_url = f"https://www.tellows.in/num/{ten_digits}" if country_code == "IN" else f"https://www.tellows.com/num/{clean_digits}"
                t_resp = await client.get(t_url)
                if t_resp.status_code == 200:
                    t_soup = BeautifulSoup(t_resp.text, "html.parser")
                    if t_soup.title:
                        t_title = t_soup.title.string.strip()
                        m = re.search(r"Who calls from \d+\s+(.*?)\s*\?.*?score:\s*(\d+)", t_title, re.I)
                        if m:
                            t_entity = m.group(1).strip()
                            t_score = int(m.group(2).strip())
                            if t_entity not in ["SMS Service", "unknown"]:
                                if any(x in t_entity for x in ["Airtel", "Vodafone", "Jio", "BSNL"]):
                                    if not discovered_carrier:
                                        discovered_carrier = t_entity
                                else:
                                    if not discovered_name:
                                        discovered_name = t_entity

                            raw_hash = hashlib.sha256(f"{t_url}:{t_title}".encode("utf-8")).hexdigest()
                            evidence_list.append(ProviderEvidence(
                                source_url=t_url,
                                snippet=f"[Tellows Community Rating] Caller/Operator: {t_entity}, Risk Score: {t_score}/9",
                                evidence_type="public_directory_match",
                                raw_data_hash=raw_hash
                            ))
            except Exception:
                pass

        latency = int((time.time() - start_time) * 1000)
        has_match = bool(discovered_name or discovered_business or evidence_list)

        return ProviderLookupResult(
            provider_name=self.name,
            success=True,
            status_code=200,
            latency_ms=latency,
            verification_status="verified_association" if (discovered_name or discovered_business) else ("possible_public_match" if evidence_list else "not_found"),
            confidence_level=85.0 if (discovered_name or discovered_business) else (60.0 if evidence_list else 0.0),
            public_name=discovered_name,
            business_name=discovered_business,
            is_business=bool(discovered_business),
            evidence=evidence_list,
            metadata={
                "evidence_count": len(evidence_list),
                "carrier": discovered_carrier,
                "spam_reports": spam_reports_count,
                "profiles": discovered_profiles
            }
        )
