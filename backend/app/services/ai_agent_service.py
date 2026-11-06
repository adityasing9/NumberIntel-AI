import json
import logging
from typing import Dict, Any, List, Optional
import httpx
from pydantic import BaseModel, Field
from app.core.config import settings
from app.schemas.schemas import NormalizedPhoneResult

logger = logging.getLogger(__name__)


class ForensicFactItem(BaseModel):
    statement: str
    source_attribution: str
    confidence: float = Field(ge=0.0, le=1.0)


class ConflictingItem(BaseModel):
    attribute: str
    source_a: str
    value_a: str
    source_b: str
    value_b: str
    resolution_guidance: str


class AIIntelligenceAnalysis(BaseModel):
    executive_summary: str
    verified_facts: List[ForensicFactItem] = []
    inferences_with_reasoning: List[ForensicFactItem] = []
    conflicting_evidence: List[ConflictingItem] = []
    unverified_or_missing_attributes: List[str] = []
    spam_risk_assessment: str
    overall_confidence_score: float = Field(ge=0.0, le=100.0)


SYSTEM_PROMPT = """You are the Senior Forensic Analyst AI of NumberIntel AI.
Your job is to analyze gathered phone intelligence evidence strictly and impartially.

CRITICAL RULES:
1. NEVER fabricate or invent caller names, addresses, or private details.
2. Clearly distinguish VERIFIED FACTS from INFERENCES and UNVERIFIED/UNKNOWN data.
3. If multiple names or businesses appear across different sources, flag them as CONFLICTING EVIDENCE with resolution guidance.
4. If a platform is marked 'NOT_PUBLICLY_VERIFIABLE' or 'NOT_FOUND', state clearly that personal reverse lookup is not available through lawful public sources.
5. NEVER label a person as a fraudster or criminal without explicit authoritative citations.
6. Output MUST strictly conform to the requested JSON schema.
"""


class AIAgentService:
    @classmethod
    async def analyze_evidence(
        cls,
        phone: NormalizedPhoneResult,
        carrier_metadata: Dict[str, Any],
        osint_results: List[Dict[str, Any]],
        platform_results: List[Dict[str, Any]],
        spam_metadata: Dict[str, Any],
        model_override: Optional[str] = None
    ) -> AIIntelligenceAnalysis:
        """
        Synthesizes gathered evidence via OpenRouter API.
        Falls back cleanly to deterministic forensic synthesis if API key is not supplied.
        """
        api_key = settings.OPENROUTER_API_KEY
        model = model_override or settings.OPENROUTER_MODEL

        # Prepare evidence context bundle
        evidence_bundle = {
            "phone_number": phone.e164_format,
            "country": phone.country_iso2,
            "number_type": phone.number_type,
            "carrier_allocated": phone.carrier_name,
            "carrier_metadata": carrier_metadata,
            "osint_search_matches": osint_results,
            "platform_discovery": platform_results,
            "spam_reputation": spam_metadata
        }

        if api_key:
            try:
                prompt = (
                    f"Analyze the following evidence dossier for telephone number {phone.e164_format}:\n"
                    f"{json.dumps(evidence_bundle, indent=2)}\n\n"
                    "Provide a comprehensive, objective forensic intelligence assessment in strictly valid JSON format conforming to this schema:\n"
                    "{\n"
                    '  "executive_summary": "string",\n'
                    '  "verified_facts": [{"statement": "string", "source_attribution": "string", "confidence": 0.95}],\n'
                    '  "inferences_with_reasoning": [{"statement": "string", "source_attribution": "string", "confidence": 0.6}],\n'
                    '  "conflicting_evidence": [{"attribute": "string", "source_a": "string", "value_a": "string", "source_b": "string", "value_b": "string", "resolution_guidance": "string"}],\n'
                    '  "unverified_or_missing_attributes": ["string"],\n'
                    '  "spam_risk_assessment": "string",\n'
                    '  "overall_confidence_score": 85.0\n'
                    "}"
                )

                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        f"{settings.OPENROUTER_BASE_URL}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "HTTP-Referer": "https://numberintel.ai",
                            "X-Title": "NumberIntel AI",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": model,
                            "messages": [
                                {"role": "system", "content": SYSTEM_PROMPT},
                                {"role": "user", "content": prompt}
                            ],
                            "response_format": {"type": "json_object"},
                            "temperature": 0.1
                        }
                    )

                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"]
                        parsed_json = json.loads(content)
                        return AIIntelligenceAnalysis(**parsed_json)
                    else:
                        logger.warning(f"OpenRouter returned status {resp.status_code}: {resp.text}. Using forensic engine fallback.")
            except Exception as e:
                logger.error(f"Error calling OpenRouter: {e}. Executing forensic rule-based fallback.")

        # Deterministic Forensic Fallback Engine (Guarantees zero downtime & zero fabrication)
        return cls._deterministic_forensic_synthesis(phone, carrier_metadata, osint_results, platform_results, spam_metadata)

    @classmethod
    def _deterministic_forensic_synthesis(
        cls,
        phone: NormalizedPhoneResult,
        carrier_metadata: Dict[str, Any],
        osint_results: List[Dict[str, Any]],
        platform_results: List[Dict[str, Any]],
        spam_metadata: Dict[str, Any]
    ) -> AIIntelligenceAnalysis:
        verified_facts: List[ForensicFactItem] = []
        inferences: List[ForensicFactItem] = []
        conflicts: List[ConflictingItem] = []
        unverified: List[str] = []

        # 1. Telecom facts
        if phone.is_valid:
            verified_facts.append(ForensicFactItem(
                statement=f"E.164 number {phone.e164_format} is structurally valid in numbering region {phone.country_iso2} (+{phone.country_code}).",
                source_attribution="Google libphonenumber",
                confidence=1.0
            ))
            if phone.carrier_name:
                verified_facts.append(ForensicFactItem(
                    statement=f"Allocated to telecommunications network '{phone.carrier_name}' ({phone.number_type.replace('_', ' ')}).",
                    source_attribution="Telecom Numbering Authority / Geocoding",
                    confidence=0.95
                ))
        else:
            inferences.append(ForensicFactItem(
                statement="Phone number format does not comply with international ITU-T E.164 standards for the designated region.",
                source_attribution="ITU / libphonenumber",
                confidence=0.9
            ))

        # 2. OSINT & Identity
        discovered_names = []
        for match in osint_results:
            bname = match.get("business_name")
            pname = match.get("public_name")
            if bname:
                discovered_names.append((bname, match.get("provider_name", "OSINT Index")))
                inferences.append(ForensicFactItem(
                    statement=f"Associated with business listing '{bname}'.",
                    source_attribution=match.get("provider_name", "Search Engine"),
                    confidence=0.75
                ))
            if pname:
                discovered_names.append((pname, match.get("provider_name", "OSINT Index")))

        # Check for conflicts
        if len(discovered_names) > 1 and len(set(n[0] for n in discovered_names)) > 1:
            conflicts.append(ConflictingItem(
                attribute="Entity Name",
                source_a=discovered_names[0][1],
                value_a=discovered_names[0][0],
                source_b=discovered_names[1][1],
                value_b=discovered_names[1][0],
                resolution_guidance="Verify whether the number transferred between business entities or represents a shared directory listing."
            ))

        # 3. Social Footprint
        verified_platforms = [p.get("platform_name") for p in platform_results if p.get("verification_status") == "verified_association"]
        possible_platforms = [p.get("platform_name") for p in platform_results if p.get("verification_status") == "possible_public_match"]
        unverifiable_platforms = [p.get("platform_name") for p in platform_results if p.get("verification_status") == "not_publicly_verifiable"]

        if verified_platforms:
            verified_facts.append(ForensicFactItem(
                statement=f"Verified public association on platform(s): {', '.join(verified_platforms)}.",
                source_attribution="Official Platform API / Public Profile",
                confidence=0.90
            ))
        
        if possible_platforms:
            inferences.append(ForensicFactItem(
                statement=f"Publicly indexed citation found referencing platform(s): {', '.join(possible_platforms)}.",
                source_attribution="Search Engine Index",
                confidence=0.65
            ))

        if unverifiable_platforms:
            unverified.append(f"Private account status on {', '.join(unverifiable_platforms)} (protected by platform privacy architecture).")

        unverified.append("Subscriber residential address (telecom subscriber identity cannot be inferred from carrier metadata).")

        # 4. Spam Risk Assessment
        spam_reports_count = spam_metadata.get("total_reports", 0)
        risk_level = spam_metadata.get("risk_level", "low")
        if spam_reports_count > 0:
            spam_summary = f"Risk Level: {risk_level.upper()}. Number flagged in {spam_reports_count} community/threat reports ({', '.join(spam_metadata.get('categories', []))}). Exercise caution."
        else:
            spam_summary = "Risk Level: LOW. No reports detected in open spam directories or internal honeypots."

        # Overall confidence calculation
        score = 80.0 if phone.is_valid else 20.0
        if verified_platforms or discovered_names:
            score += 15.0
        if spam_reports_count > 0:
            score = max(50.0, score)

        executive_summary = (
            f"Telephone intelligence dossier compiled for {phone.e164_format}. "
            f"The number is a valid {phone.number_type} line in {phone.country_iso2} "
            f"{f'allocated to {phone.carrier_name}' if phone.carrier_name else ''}. "
            f"{f'Discovered {len(verified_platforms)} verified and {len(possible_platforms)} possible digital footprint matches.' if (verified_platforms or possible_platforms) else 'No public social profile matches discovered in searched sources.'} "
            f"Spam status is currently assessed as {risk_level.upper()}."
        )

        return AIIntelligenceAnalysis(
            executive_summary=executive_summary,
            verified_facts=verified_facts,
            inferences_with_reasoning=inferences,
            conflicting_evidence=conflicts,
            unverified_or_missing_attributes=unverified,
            spam_risk_assessment=spam_summary,
            overall_confidence_score=min(100.0, score)
        )


ai_agent = AIAgentService()
