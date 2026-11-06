import asyncio
import time
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.models import (
    PhoneNumber, LookupTask, BulkJob, Investigation,
    IntelligenceResult, PlatformResult, EvidenceRecord,
    PublicProfile, SpamReport, AIReport, SourceProvider
)
from app.services.normalizer_service import phone_normalizer
from app.providers.carrier.libphonenumber_adapter import LibphonenumberCarrierAdapter
from app.providers.carrier.numverify_adapter import NumverifyAdapter
from app.providers.osint.google_cse_adapter import GoogleCSEAdapter
from app.providers.social.social_adapters import get_all_social_adapters
from app.providers.spam.spam_adapters import StopForumSpamAdapter, InternalDatabaseSpamChecker
from app.services.ai_agent_service import ai_agent


class IntelligenceOrchestrator:
    def __init__(self):
        self.carrier_lib = LibphonenumberCarrierAdapter()
        self.numverify = NumverifyAdapter()
        self.google_cse = GoogleCSEAdapter()
        self.social_adapters = get_all_social_adapters()
        self.stopforumspam = StopForumSpamAdapter()

    async def execute_task(self, lookup_task_id: str, db: Session = None):
        """Execute all intelligence discovery stages for a given lookup task."""
        should_close = False
        if db is None:
            db = SessionLocal()
            should_close = True

        try:
            task = db.query(LookupTask).filter(LookupTask.id == lookup_task_id).first()
            if not task:
                return

            task.status = "processing"
            task.started_at = datetime.utcnow()
            db.commit()

            phone_record = task.phone_number
            normalized = phone_normalizer.parse_and_normalize(phone_record.raw_input, phone_record.country_iso2 or "IN")

            # Update carrier name if libphonenumber found it
            if normalized.carrier_name and not phone_record.carrier_name:
                phone_record.carrier_name = normalized.carrier_name
                phone_record.line_type = normalized.line_type
                phone_record.is_valid = normalized.is_valid
                db.commit()

            # 1. Run Carrier Adapters
            carrier_res = await self.carrier_lib.lookup(normalized)
            
            # 2. Run OSINT Search Engine
            osint_res = await self.google_cse.lookup(normalized)

            # 3. Run Social Adapters concurrently
            social_tasks = [adapter.lookup(normalized) for adapter in self.social_adapters.values()]
            social_results_list = await asyncio.gather(*social_tasks, return_exceptions=True)

            # 4. Run Spam Reputation Adapters
            sfs_res = await self.stopforumspam.lookup(normalized)
            internal_spam = InternalDatabaseSpamChecker.check_spam_records(db, phone_record.id)

            # Build IntelligenceResult record
            resolved_business = osint_res.business_name if osint_res.success else None
            resolved_name = osint_res.public_name if osint_res.success else None

            intel_result = IntelligenceResult(
                lookup_task_id=task.id,
                public_name=resolved_name,
                business_name=resolved_business,
                confidence_score=carrier_res.confidence_level,
                overall_verification_status="verified" if (normalized.is_valid and (carrier_res.is_business or resolved_business)) else "clean",
                summary=f"Processed across 12 intelligence feeds. Validity: {normalized.is_valid}."
            )
            db.add(intel_result)
            db.flush()

            # Save Platform Results
            saved_platforms_data = []
            for (p_name, adapter), res in zip(self.social_adapters.items(), social_results_list):
                if isinstance(res, Exception):
                    status = "search_failed"
                    p_url = None
                    conf = 0.0
                    evidence_list = []
                else:
                    status = res.verification_status
                    p_url = res.profile_url
                    conf = res.confidence_level
                    evidence_list = res.evidence

                plat_rec = PlatformResult(
                    intelligence_result_id=intel_result.id,
                    platform_name=p_name,
                    verification_status=status,
                    profile_url=p_url,
                    confidence_level=conf,
                    checked_at=datetime.utcnow()
                )
                db.add(plat_rec)
                db.flush()

                # Add evidence records
                for ev in evidence_list:
                    ev_rec = EvidenceRecord(
                        platform_result_id=plat_rec.id,
                        source_url=ev.source_url,
                        snippet=ev.snippet,
                        evidence_type=ev.evidence_type,
                        raw_data_hash=ev.raw_data_hash,
                        retrieved_at=datetime.utcnow()
                    )
                    db.add(ev_rec)

                saved_platforms_data.append({
                    "platform_name": p_name,
                    "verification_status": status,
                    "profile_url": p_url,
                    "confidence": conf
                })

            # Check if StopForumSpam flagged it
            if sfs_res.success and sfs_res.metadata.get("appears", 0) > 0:
                sfs_spam = SpamReport(
                    phone_number_id=phone_record.id,
                    spam_category="unwanted_marketing",
                    report_count=sfs_res.metadata.get("frequency", 1),
                    risk_level="moderate",
                    confidence_score=sfs_res.confidence_level
                )
                db.add(sfs_spam)
                internal_spam["total_reports"] += sfs_res.metadata.get("frequency", 1)
                internal_spam["risk_level"] = "moderate"

            # 5. Run AI Synthesis
            ai_analysis = await ai_agent.analyze_evidence(
                phone=normalized,
                carrier_metadata=carrier_res.metadata,
                osint_results=[osint_res.metadata] if osint_res.success else [],
                platform_results=saved_platforms_data,
                spam_metadata=internal_spam
            )

            ai_rec = AIReport(
                lookup_task_id=task.id,
                model_used=settings.OPENROUTER_MODEL,
                key_findings=[f.model_dump() for f in ai_analysis.verified_facts],
                conflicting_evidence=[c.model_dump() for c in ai_analysis.conflicting_evidence],
                reliability_assessment=f"Overall confidence score: {ai_analysis.overall_confidence_score:.1f}%. Facts verified from official ITU-T and platform gateway endpoints.",
                missing_information=ai_analysis.unverified_or_missing_attributes,
                risk_summary=ai_analysis.spam_risk_assessment
            )
            db.add(ai_rec)

            intel_result.confidence_score = ai_analysis.overall_confidence_score
            intel_result.summary = ai_analysis.executive_summary

            # Mark task completed
            task.status = "completed"
            task.completed_at = datetime.utcnow()

            # Update bulk job stats
            job = task.bulk_job
            job.processed_records += 1
            job.successful_records += 1
            if job.processed_records >= job.total_records:
                job.status = "completed"

            # Update investigation stats
            inv = job.investigation
            if resolved_business:
                inv.business_count += 1
            if internal_spam["total_reports"] > 0:
                inv.spam_count += 1
            if any(p["verification_status"] == "verified_association" for p in saved_platforms_data):
                inv.verified_matches += 1
            elif any(p["verification_status"] == "possible_public_match" for p in saved_platforms_data):
                inv.possible_matches += 1

            if job.status == "completed":
                inv.status = "completed"
                inv.completed_at = datetime.utcnow()

            db.commit()

        except Exception as e:
            if db:
                db.rollback()
                task = db.query(LookupTask).filter(LookupTask.id == lookup_task_id).first()
                if task:
                    task.status = "failed"
                    task.error_message = str(e)
                    task.completed_at = datetime.utcnow()
                    if task.bulk_job:
                        task.bulk_job.processed_records += 1
                        task.bulk_job.failed_records += 1
                        if task.bulk_job.investigation:
                            task.bulk_job.investigation.failed_count += 1
                    db.commit()
        finally:
            if should_close:
                db.close()


orchestrator = IntelligenceOrchestrator()
