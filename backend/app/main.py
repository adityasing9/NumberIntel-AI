from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.v1 import auth, investigations, bulk, numbers, reports, providers, analytics, spam, audit, truecaller
from app.models.models import Role, User, SourceProvider, UserSettings
from app.core.security import get_password_hash

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Bulk Phone Number Intelligence & Digital Footprint Discovery Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Startup Seeder
@app.on_event("startup")
def startup_seed_database():
    db = SessionLocal()
    try:
        # 1. Seed Roles
        roles_to_seed = [
            ("admin", "System Administrator with full access"),
            ("investigator", "Senior OSINT Investigator with bulk lookup rights"),
            ("analyst", "Threat Analyst with reporting & review rights"),
            ("viewer", "Read-only auditor")
        ]
        for r_name, r_desc in roles_to_seed:
            existing = db.query(Role).filter(Role.name == r_name).first()
            if not existing:
                db.add(Role(name=r_name, description=r_desc))
        db.commit()

        # 2. Seed Default Admin User
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        admin_user = db.query(User).filter(User.email == "admin@numberintel.ai").first()
        if not admin_user and admin_role:
            new_admin = User(
                email="admin@numberintel.ai",
                password_hash=get_password_hash("Admin@NumberIntel2026!"),
                full_name="Lead Intelligence Architect",
                role_id=admin_role.id,
                is_active=True,
                api_quota=50000
            )
            db.add(new_admin)
            db.flush()
            db.add(UserSettings(user_id=new_admin.id, default_country="IN"))
            db.commit()

        # 3. Seed Default Source Providers
        default_providers = [
            ("libphonenumber_engine", "telecom", "https://github.com/google/libphonenumber", 600, 100000),
            ("numverify", "telecom", "http://apilayer.net/api/validate", 60, 10000),
            ("google_cse", "osint_search", "https://www.googleapis.com/customsearch/v1", 100, 10000),
            ("whatsapp_discovery", "social_api", "https://api.whatsapp.com", 120, 20000),
            ("telegram_discovery", "social_api", "https://core.telegram.org/api", 120, 20000),
            ("signal_discovery", "social_api", "https://signal.org", 120, 20000),
            ("stopforumspam", "spam_db", "https://api.stopforumspam.org", 60, 10000),
            ("openrouter_ai", "ai_llm", "https://openrouter.ai/api/v1", 30, 5000),
        ]
        for name, p_type, base_url, rate_limit, quota in default_providers:
            existing_p = db.query(SourceProvider).filter(SourceProvider.name == name).first()
            if not existing_p:
                db.add(SourceProvider(
                    name=name,
                    provider_type=p_type,
                    base_url=base_url,
                    rate_limit_per_minute=rate_limit,
                    daily_quota=quota,
                    is_active=True
                ))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Startup seeding warning: {e}")
    finally:
        db.close()


# Mount Routes
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(investigations.router, prefix=f"{settings.API_V1_STR}/investigations", tags=["Investigations"])
app.include_router(bulk.router, prefix=f"{settings.API_V1_STR}/bulk", tags=["Bulk Processing"])
app.include_router(numbers.router, prefix=f"{settings.API_V1_STR}/numbers", tags=["Phone Intelligence"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports & Export"])
app.include_router(providers.router, prefix=f"{settings.API_V1_STR}/providers", tags=["Source Providers"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])
app.include_router(spam.router, prefix=f"{settings.API_V1_STR}/spam", tags=["Spam Intelligence"])
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit", tags=["Security & Audit"])
app.include_router(truecaller.router, prefix=f"{settings.API_V1_STR}/truecaller", tags=["Truecaller Gateway"])


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to NumberIntel AI API Gateway",
        "docs": "/docs",
        "version": settings.VERSION
    }
