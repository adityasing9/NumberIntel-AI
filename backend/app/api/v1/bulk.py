import asyncio
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.core.database import get_db, SessionLocal
from app.models.models import Investigation, BulkJob, LookupTask, PhoneNumber, User
from app.services.normalizer_service import phone_normalizer
from app.services.file_parser_service import file_parser
from app.services.orchestrator_service import orchestrator
from app.schemas.schemas import (
    BulkTextImportRequest, PreflightValidationResult, BulkJobProgressResponse
)
from app.api.v1.deps import get_current_user

router = APIRouter()


async def process_job_in_background(job_id: str):
    """Worker loop that executes pending tasks for a bulk job with controlled concurrency."""
    db = SessionLocal()
    try:
        job = db.query(BulkJob).filter(BulkJob.id == job_id).first()
        if not job or job.status == "cancelled":
            return

        job.status = "processing"
        db.commit()

        tasks = db.query(LookupTask).filter(
            LookupTask.bulk_job_id == job_id,
            LookupTask.status == "pending"
        ).all()

        # Controlled concurrency semaphore (process up to 5 numbers in parallel)
        sem = asyncio.Semaphore(5)

        async def worker(task_id: str):
            async with sem:
                await orchestrator.execute_task(task_id)

        coroutines = [worker(t.id) for t in tasks]
        await asyncio.gather(*coroutines, return_exceptions=True)

        job.status = "completed"
        db.commit()
    except Exception as e:
        if job:
            job.status = "failed"
            job.error_log = str(e)
            db.commit()
    finally:
        db.close()


@router.post("/preflight", response_model=PreflightValidationResult)
def preflight_check(
    request: BulkTextImportRequest,
    current_user: User = Depends(get_current_user)
):
    candidates = file_parser.extract_from_raw_text(request.raw_text)
    return file_parser.preflight_validate(candidates, request.default_country or "IN")


@router.post("/paste", response_model=BulkJobProgressResponse, status_code=status.HTTP_202_ACCEPTED)
async def submit_bulk_text(
    payload: BulkTextImportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    candidates = file_parser.extract_from_raw_text(payload.raw_text)
    if not candidates:
        raise HTTPException(status_code=400, detail="No telephone numbers detected in input.")

    if len(candidates) > 10000:
        raise HTTPException(status_code=400, detail="Batch exceeds maximum allowed quota of 10,000 numbers.")

    preflight = file_parser.preflight_validate(candidates, payload.default_country or "IN")
    if preflight.valid_count == 0:
        raise HTTPException(status_code=400, detail="None of the submitted inputs represent valid telephone numbers.")

    # Create Investigation
    inv = Investigation(
        user_id=current_user.id,
        title=payload.investigation_title or f"Bulk Lookup ({preflight.valid_count} numbers)",
        status="processing",
        total_numbers=preflight.valid_count
    )
    db.add(inv)
    db.flush()

    # Create Bulk Job
    job = BulkJob(
        investigation_id=inv.id,
        total_records=preflight.valid_count,
        status="queued"
    )
    db.add(job)
    db.flush()

    # Create or retrieve PhoneNumber records and schedule LookupTasks
    for item in preflight.valid_samples:
        phone_rec = db.query(PhoneNumber).filter(PhoneNumber.e164_format == item.e164_format).first()
        if not phone_rec:
            phone_rec = PhoneNumber(
                raw_input=item.raw_input,
                e164_format=item.e164_format,
                national_format=item.national_format,
                country_code=item.country_code,
                country_iso2=item.country_iso2,
                number_type=item.number_type,
                is_valid=item.is_valid,
                carrier_name=item.carrier_name,
                line_type=item.line_type
            )
            db.add(phone_rec)
            db.flush()

        task = LookupTask(
            bulk_job_id=job.id,
            phone_number_id=phone_rec.id,
            status="pending"
        )
        db.add(task)

    db.commit()
    db.refresh(job)

    # Dispatch processing in background
    background_tasks.add_task(process_job_in_background, job.id)

    return BulkJobProgressResponse(
        id=job.id,
        investigation_id=inv.id,
        total_records=job.total_records,
        processed_records=0,
        successful_records=0,
        failed_records=0,
        status="queued",
        progress_percentage=0.0,
        error_log=None
    )


@router.post("/upload", response_model=BulkJobProgressResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_bulk_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    default_country: str = Form("IN"),
    investigation_title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = await file.read()
    filename = file.filename.lower()

    if filename.endswith(".csv"):
        candidates = file_parser.parse_csv(content)
    elif filename.endswith(".xlsx") or filename.endswith(".xls"):
        candidates = file_parser.parse_excel(content)
    elif filename.endswith(".txt"):
        candidates = file_parser.extract_from_raw_text(content.decode("utf-8", errors="replace"))
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .csv, .xlsx, or .txt")

    if not candidates:
        raise HTTPException(status_code=400, detail="No candidate phone numbers discovered in the uploaded file.")

    preflight = file_parser.preflight_validate(candidates, default_country)
    if preflight.valid_count == 0:
        raise HTTPException(status_code=400, detail="No valid telephone numbers identified in the uploaded document.")

    title = investigation_title or f"File Import: {file.filename} ({preflight.valid_count} numbers)"
    inv = Investigation(
        user_id=current_user.id,
        title=title,
        status="processing",
        total_numbers=preflight.valid_count
    )
    db.add(inv)
    db.flush()

    job = BulkJob(
        investigation_id=inv.id,
        total_records=preflight.valid_count,
        status="queued"
    )
    db.add(job)
    db.flush()

    for item in preflight.valid_samples:
        phone_rec = db.query(PhoneNumber).filter(PhoneNumber.e164_format == item.e164_format).first()
        if not phone_rec:
            phone_rec = PhoneNumber(
                raw_input=item.raw_input,
                e164_format=item.e164_format,
                national_format=item.national_format,
                country_code=item.country_code,
                country_iso2=item.country_iso2,
                number_type=item.number_type,
                is_valid=item.is_valid,
                carrier_name=item.carrier_name,
                line_type=item.line_type
            )
            db.add(phone_rec)
            db.flush()

        task = LookupTask(
            bulk_job_id=job.id,
            phone_number_id=phone_rec.id,
            status="pending"
        )
        db.add(task)

    db.commit()
    db.refresh(job)

    background_tasks.add_task(process_job_in_background, job.id)

    return BulkJobProgressResponse(
        id=job.id,
        investigation_id=inv.id,
        total_records=job.total_records,
        processed_records=0,
        successful_records=0,
        failed_records=0,
        status="queued",
        progress_percentage=0.0,
        error_log=None
    )


@router.get("/jobs/{job_id}/progress", response_model=BulkJobProgressResponse)
def get_job_progress(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(BulkJob).filter(BulkJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Bulk job not found")

    pct = 0.0
    if job.total_records > 0:
        pct = round((job.processed_records / job.total_records) * 100, 1)

    return BulkJobProgressResponse(
        id=job.id,
        investigation_id=job.investigation_id,
        total_records=job.total_records,
        processed_records=job.processed_records,
        successful_records=job.successful_records,
        failed_records=job.failed_records,
        status=job.status,
        progress_percentage=min(100.0, pct),
        error_log=job.error_log
    )


@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(BulkJob).filter(BulkJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Bulk job not found")

    job.status = "cancelled"
    db.commit()
    return {"message": "Job cancellation requested"}
