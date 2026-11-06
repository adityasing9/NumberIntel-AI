from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Investigation, BulkJob, LookupTask, PhoneNumber, IntelligenceResult, User
from app.services.export_service import export_service
from app.api.v1.deps import get_current_user

router = APIRouter()


@router.get("/{investigation_id}/export")
def export_investigation(
    investigation_id: str,
    format: str = Query("csv", regex="^(csv|xlsx|json)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(
        Investigation.id == investigation_id,
        Investigation.user_id == current_user.id
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    tasks = (
        db.query(LookupTask)
        .join(BulkJob, LookupTask.bulk_job_id == BulkJob.id)
        .filter(BulkJob.investigation_id == investigation_id)
        .all()
    )

    rows = []
    for t in tasks:
        p = t.phone_number
        intel = t.intelligence_result
        
        wa_status = "not_found"
        tg_status = "not_found"
        if intel and intel.platform_results:
            for plat in intel.platform_results:
                if plat.platform_name == "whatsapp":
                    wa_status = plat.verification_status
                elif plat.platform_name == "telegram":
                    tg_status = plat.verification_status

        rows.append({
            "Phone Number": p.e164_format,
            "Raw Input": p.raw_input,
            "Country": p.country_iso2,
            "Country Code": p.country_code,
            "Line Type": p.line_type or p.number_type,
            "Carrier": p.carrier_name or "Unknown",
            "Public Name": intel.public_name if intel else "",
            "Business Name": intel.business_name if intel else "",
            "Confidence Score": f"{intel.confidence_score:.1f}%" if intel else "0%",
            "Overall Status": intel.overall_verification_status if intel else "unverified",
            "WhatsApp Status": wa_status,
            "Telegram Status": tg_status,
            "Task Status": t.status,
            "Processed At": t.completed_at.isoformat() if t.completed_at else ""
        })

    safe_title = inv.title.replace(" ", "_").replace("/", "-")
    if format == "csv":
        data = export_service.export_to_csv(rows)
        return Response(
            content=data,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="NumberIntel_{safe_title}.csv"'}
        )
    elif format == "xlsx":
        data = export_service.export_to_excel(rows, title=inv.title)
        return Response(
            content=data,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="NumberIntel_{safe_title}.xlsx"'}
        )
    else:
        data = export_service.export_to_json(rows)
        return Response(
            content=data,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="NumberIntel_{safe_title}.json"'}
        )
