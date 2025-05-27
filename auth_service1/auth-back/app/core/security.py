from datetime import datetime, timedelta
import logging
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
from app.core.exceptions import AuthError
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import User 

# Initialize OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Password hashing utilities
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Securely verify a password against its hashed version"""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except ValueError as e:
        logging.error(f"Invalid hash format: {str(e)}")
        return False
    except Exception as e:
        logging.error(f"Password verification failed: {str(e)}")
        return False

def get_password_hash(password: str) -> str:
    """Generate a secure password hash"""
    try:
        return bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt(rounds=12)  # Adjust rounds as needed (default is 12)
        ).decode('utf-8')
    except Exception as e:
        logging.error(f"Password hashing failed: {str(e)}")
        raise AuthError("Could not hash password")

# JWT token utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "iss": settings.JWT_ISSUER  # Add issuer claim if configured
    })
    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

def decode_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_aud": False}  # Disable audience verification if not used
        )
    except JWTError as e:
        raise AuthError(f"Invalid token: {str(e)}")

# Password reset token utilities
def generate_password_reset_token(email: str) -> str:
    """Generate a time-limited password reset token"""
    expires_delta = timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)
    return create_access_token(
        data={
            "sub": email,
            "purpose": "password_reset",
            "scope": "reset_password"  # Add specific scope
        },
        expires_delta=expires_delta
    )

def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify password reset token with additional claims validation"""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={
                "require": ["exp", "sub", "purpose"],
                "verify_sub": True
            }
        )
        
        if payload.get("purpose") != "password_reset":
            logging.warning("Invalid token purpose")
            return None
            
        return payload.get("sub")
        
    except jwt.ExpiredSignatureError:
        logging.warning("Password reset token expired")
        return None
    except jwt.JWTClaimsError as e:
        logging.warning(f"Invalid token claims: {str(e)}")
        return None
    except Exception as e:
        logging.error(f"Token verification failed: {str(e)}")
        return None

# Authentication dependencies
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_admin(token: str = Depends(oauth2_scheme)) -> dict:
    """Dependency to verify admin privileges"""
    user = get_current_user(token)
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return user