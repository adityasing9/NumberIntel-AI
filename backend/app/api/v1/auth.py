from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.models import User, Role, UserSettings
from app.schemas.schemas import UserLogin, UserRegister, Token, UserResponse
from app.api.v1.deps import get_current_user, log_audit_action

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, request: Request, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Get role
    role = db.query(Role).filter(Role.name == user_in.role_name).first()
    if not role:
        role = db.query(Role).filter(Role.name == "investigator").first()
        if not role:
            role = Role(name="investigator", description="Default OSINT investigator")
            db.add(role)
            db.flush()

    new_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name or user_in.email.split("@")[0],
        role_id=role.id,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # Create default settings
    settings = UserSettings(user_id=new_user.id, default_country="IN")
    db.add(settings)
    db.commit()
    db.refresh(new_user)

    log_audit_action(
        db, new_user.id, "USER_REGISTER", "users", new_user.id,
        request.client.host if request.client else None,
        request.headers.get("User-Agent"),
        {"email": new_user.email}
    )

    access_token = create_access_token(subject=new_user.id)
    return Token(
        access_token=access_token,
        user_id=new_user.id,
        email=new_user.email,
        role=role.name,
        full_name=new_user.full_name
    )


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email, User.deleted_at.is_(None)).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive account")

    log_audit_action(
        db, user.id, "USER_LOGIN", "users", user.id,
        request.client.host if request.client else None,
        request.headers.get("User-Agent"),
        {"email": user.email}
    )

    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        user_id=user.id,
        email=user.email,
        role=user.role.name,
        full_name=user.full_name
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.name,
        is_active=current_user.is_active,
        api_quota=current_user.api_quota,
        quota_used=current_user.quota_used,
        created_at=current_user.created_at
    )


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), request: Request = None, db: Session = Depends(get_db)):
    log_audit_action(
        db, current_user.id, "USER_LOGOUT", "users", current_user.id,
        request.client.host if request and request.client else None,
        request.headers.get("User-Agent") if request else None
    )
    return {"message": "Successfully logged out"}
