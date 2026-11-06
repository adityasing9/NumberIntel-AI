import sys
import os
import asyncio
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.models.models import (
    Role, User, UserSettings, Investigation, BulkJob, LookupTask,
    PhoneNumber, IntelligenceResult, PlatformResult, EvidenceRecord,
    PublicProfile, SpamReport, AIReport, SourceProvider, AuditLog
)
from app.core.security import get_password_hash
from app.services.normalizer_service import phone_normalizer
from app.services.orchestrator_service import orchestrator


async def seed():
    print("Beginning NumberIntel AI Seed Initialization...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Roles
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin", description="System Administrator")
            db.add(admin_role)

        inv_role = db.query(Role).filter(Role.name == "investigator").first()
        if not inv_role:
            inv_role = Role(name="investigator", description="Senior OSINT Investigator")
            db.add(inv_role)

        db.commit()
        db.refresh(admin_role)
        db.refresh(inv_role)

        # 2. Users
        admin_user = db.query(User).filter(User.email == "admin@numberintel.ai").first()
        if not admin_user:
            admin_user = User(
                email="admin@numberintel.ai",
                password_hash=get_password_hash("Admin@NumberIntel2026!"),
                full_name="Lead Intelligence Architect",
                role_id=admin_role.id,
                is_active=True,
                api_quota=50000
            )
            db.add(admin_user)
            db.flush()
            db.add(UserSettings(user_id=admin_user.id, default_country="IN"))
            db.commit()
            print("Admin user created: admin@numberintel.ai / Admin@NumberIntel2026!")

        # 3. Sample Numbers for Initial Investigations
        sample_numbers = [
            ("+919876543210", "IN", "Mobile", "Airtel", "Customer Support Desk"),
            ("+911800266001", "IN", "Toll Free", "Tata Teleservices", "Public Enterprise Helpline"),
            ("+18002738255", "US", "Toll Free", "T-Mobile USA", "National Helpline Bureau"),
            ("+442079460912", "GB", "Fixed Line", "British Telecom", "London Executive Offices"),
            ("+919999988888", "IN", "Mobile", "Reliance Jio", "Reported Telemarketing Line")
        ]

        # Check if sample investigation exists
        existing_inv = db.query(Investigation).filter(Investigation.user_id == admin_user.id).first()
        if not existing_inv:
            print("Creating sample investigation case...")
            inv = Investigation(
                user_id=admin_user.id,
                title="Q4 Enterprise Fraud & OSINT Footprint Audit",
                description="Cross-border digital footprint discovery and spam reputation review.",
                status="completed",
                total_numbers=len(sample_numbers),
                created_at=datetime.utcnow() - timedelta(days=2),
                completed_at=datetime.utcnow() - timedelta(days=2) + timedelta(minutes=4)
            )
            db.add(inv)
            db.flush()

            job = BulkJob(
                investigation_id=inv.id,
                total_records=len(sample_numbers),
                processed_records=len(sample_numbers),
                successful_records=len(sample_numbers),
                status="completed"
            )
            db.add(job)
            db.flush()

            for raw_num, c_iso, n_type, carrier_name, label in sample_numbers:
                norm = phone_normalizer.parse_and_normalize(raw_num, c_iso)
                
                phone_rec = db.query(PhoneNumber).filter(PhoneNumber.e164_format == norm.e164_format).first()
                if not phone_rec:
                    phone_rec = PhoneNumber(
                        raw_input=raw_num,
                        e164_format=norm.e164_format,
                        national_format=norm.national_format,
                        country_code=norm.country_code,
                        country_iso2=norm.country_iso2,
                        number_type=norm.number_type,
                        is_valid=norm.is_valid,
                        carrier_name=carrier_name,
                        line_type=norm.line_type
                    )
                    db.add(phone_rec)
                    db.flush()

                task = LookupTask(
                    bulk_job_id=job.id,
                    phone_number_id=phone_rec.id,
                    status="pending",
                    scheduled_at=datetime.utcnow() - timedelta(days=2)
                )
                db.add(task)
                db.commit()

                # Execute task orchestrator to generate full realistic intelligence
                await orchestrator.execute_task(task.id, db)

            print("Sample investigations and tasks successfully generated!")

        # Add sample spam reports to populate risk charts
        flagged_num = db.query(PhoneNumber).filter(PhoneNumber.raw_input == "+919999988888").first()
        if flagged_num:
            spam_rep = db.query(SpamReport).filter(SpamReport.phone_number_id == flagged_num.id).first()
            if not spam_rep:
                db.add(SpamReport(
                    phone_number_id=flagged_num.id,
                    spam_category="telemarketing",
                    report_count=14,
                    risk_level="high",
                    confidence_score=92.0,
                    created_at=datetime.utcnow() - timedelta(days=1)
                ))
                db.commit()

        print("Seeding complete! Database is ready.")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(seed())
