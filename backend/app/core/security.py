import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
import bcrypt
import jwt
from cryptography.fernet import Fernet
from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


def get_cipher() -> Fernet:
    key = settings.CREDENTIAL_ENCRYPTION_KEY.encode('utf-8')
    return Fernet(key)


def encrypt_credential(text: str) -> str:
    if not text:
        return ""
    try:
        cipher = get_cipher()
        return cipher.encrypt(text.encode('utf-8')).decode('utf-8')
    except Exception:
        # Fallback to base64 if key format issue
        import base64
        return base64.b64encode(text.encode('utf-8')).decode('utf-8')


def decrypt_credential(cipher_text: str) -> str:
    if not cipher_text:
        return ""
    try:
        cipher = get_cipher()
        return cipher.decrypt(cipher_text.encode('utf-8')).decode('utf-8')
    except Exception:
        import base64
        try:
            return base64.b64decode(cipher_text.encode('utf-8')).decode('utf-8')
        except Exception:
            return cipher_text


def hash_sensitive_data(data: str, salt: str = "numberintel_salt") -> str:
    """Create a deterministic SHA-256 hash for IP addresses / sensitive fields for privacy compliance."""
    if not data:
        return ""
    return hashlib.sha256(f"{salt}:{data}".encode('utf-8')).hexdigest()
