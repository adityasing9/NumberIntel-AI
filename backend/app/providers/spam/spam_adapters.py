import time
import hashlib
from typing import Optional, List, Dict, Any
import httpx
from sqlalchemy.orm import Session
from app.providers.base import BaseIntelligenceProvider, ProviderLookupResult, ProviderEvidence
from app.schemas.schemas import NormalizedPhoneResult
from app.models.models import SpamReport, PhoneNumber


class StopForumSpamAdapter(BaseIntelligenceProvider):
    name = "stopforumspam"
    provider_type = "spam_db"
    base_url = "https://api.stopforumspam.org/api"

    async def lookup(self, phone: NormalizedPhoneResult, api_key: Optional[str] = None) -> ProviderLookupResult:
        start_time = time.time()
        # Query open reputation API
        clean_num = phone.e164_format.replace("+", "")
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                # StopForumSpam format: json query
                resp = await client.get(self.base_url, params={"username": clean_num, "json": 1})
                latency = int((time.time() - start_time) * 1000)
                data = resp.json()
                
                appears = data.get("username", {}).get("appears", 0)
                frequency = data.get("username", {}).get("frequency", 0)
                confidence = float(data.get("username", {}).get("confidence", 0.0))
                
                if appears > 0:
                    snippet = f"StopForumSpam entry found: frequency={frequency}, confidence={confidence}%"
                    h = hashlib.sha256(snippet.encode('utf-8')).hexdigest()
                    return ProviderLookupResult(
                        provider_name=self.name,
                        success=True,
                        status_code=200,
                        latency_ms=latency,
                        verification_status="verified_association",
                        confidence_level=min(100.0, max(50.0, confidence)),
                        evidence=[ProviderEvidence(
                            source_url=self.base_url,
                            snippet=snippet,
                            evidence_type="spam_report_citation",
                            raw_data_hash=h
                        )],
                        metadata={"frequency": frequency, "confidence": confidence, "appears": appears}
                    )
                else:
                    return ProviderLookupResult(
                        provider_name=self.name,
                        success=True,
                        status_code=200,
                        latency_ms=latency,
                        verification_status="not_found",
                        confidence_level=0.0,
                        metadata={"frequency": 0, "appears": 0}
                    )
        except Exception as e:
            latency = int((time.time() - start_time) * 1000)
            return ProviderLookupResult(
                provider_name=self.name,
                success=True,
                status_code=200,
                latency_ms=latency,
                verification_status="not_found",
                confidence_level=0.0,
                error_message=str(e)
            )


class InternalDatabaseSpamChecker:
    @staticmethod
    def check_spam_records(db: Session, phone_number_id: str) -> Dict[str, Any]:
        """Aggregate spam reports for the given phone number from local database."""
        reports = db.query(SpamReport).filter(SpamReport.phone_number_id == phone_number_id).all()
        if not reports:
            return {
                "total_reports": 0,
                "risk_level": "low",
                "categories": [],
                "confidence_score": 0.0,
                "summary": "Clean reputation in local threat database. No abuse reports logged."
            }

        total_count = sum(r.report_count for r in reports)
        categories = list(set(r.spam_category for r in reports))
        
        # Risk assessment
        has_fraud = any(c in ["suspected_fraud", "financial_scam"] for c in categories)
        if total_count >= 10 or (total_count >= 3 and has_fraud):
            risk = "critical"
            confidence = 95.0
        elif total_count >= 5 or has_fraud:
            risk = "high"
            confidence = 85.0
        elif total_count >= 2:
            risk = "moderate"
            confidence = 65.0
        else:
            risk = "low"
            confidence = 40.0

        return {
            "total_reports": total_count,
            "risk_level": risk,
            "categories": categories,
            "confidence_score": confidence,
            "summary": f"Identified {total_count} community report(s) spanning categories: {', '.join(categories)}."
        }
