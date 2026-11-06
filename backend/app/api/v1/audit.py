from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.models import AuditLog, User
from app.api.v1.deps import get_current_user

router = APIRouter()


@router.get("/logs")
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AuditLog)
    if current_user.role.name != "admin":
        query = query.filter(AuditLog.user_id == current_user.id)
    
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
    
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "ip_address": l.ip_address,
            "details": l.details,
            "created_at": l.created_at
        }
        for l in logs
    ]
