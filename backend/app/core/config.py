import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from cryptography.fernet import Fernet


class Settings(BaseSettings):
    PROJECT_NAME: str = "NumberIntel AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "numberintel-super-secure-jwt-secret-key-32-bytes-minimum-replace-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Credential Encryption (Fernet key for API keys & raw responses)
    # Default generated key if none provided
    CREDENTIAL_ENCRYPTION_KEY: str = "z0v2e_uJvD7EaYgDk2C9L8tqO4fR3sW1xA5bN6mP7iE="
    
    # Database
    # Default to SQLite for zero-friction local run if MySQL is not configured
    DATABASE_URL: str = "sqlite:///./numberintel.db"
    # For MySQL production: "mysql+pymysql://user:password@localhost:3306/numberintel?charset=utf8mb4"
    
    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    
    # OpenRouter AI
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "anthropic/claude-3.5-sonnet"
    OPENROUTER_FALLBACK_MODEL: str = "openai/gpt-4o"
    
    # OSINT & Search Engine APIs
    GOOGLE_CSE_API_KEY: str = ""
    GOOGLE_CSE_CX: str = ""
    BING_SEARCH_API_KEY: str = ""
    NUMVERIFY_API_KEY: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    
    # Compliance & Defaults
    DEFAULT_COUNTRY: str = "IN"
    MAX_BULK_BATCH_SIZE: int = 10000
    DATA_RETENTION_DAYS: int = 90
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )


settings = Settings()
