from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
from jose import JWTError
import logging
from app.database.models import User 
from app.core.config import settings
from app.database.session import get_db
from app.schemas.auth import (
    Token,
    UserLogin,
    UserSignUp,
    PasswordResetRequest,
    PasswordReset
)
from app.services.auth import AuthService
from app.core.config import settings

router = APIRouter()

logger = logging.getLogger(__name__)

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    try:
        user = AuthService.authenticate_user(db, form_data.username, form_data.password)
        if not user:
            logger.warning(f"Failed login attempt for email: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        logger.info(f"Successful login for user: {user.email}")
        return AuthService.create_tokens(user)
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )

@router.post("/signup", response_model=Token)
def signup(
    user_data: UserSignUp,
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Signup attempt for email: {user_data.email}")
        user, tokens = AuthService.register_user(db, user_data)
        logger.info(f"User created successfully: {user.email}")
        return tokens
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during signup"
        )

@router.post("/refresh", response_model=Token)
def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    try:
        logger.debug("Refresh token request received")
        email = AuthService.verify_refresh_token(refresh_token)
        if not email:
            logger.warning("Invalid refresh token provided")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.warning(f"User not found for refresh token: {email}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        logger.info(f"Issuing new tokens for user: {user.email}")
        return AuthService.create_tokens(user)
    except JWTError:
        logger.warning("JWT error during token refresh")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

@router.post("/password-reset/request")
def request_password_reset(
    reset_request: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Password reset request for email: {reset_request.email}")
        base_url = settings.FRONTEND_URL
        AuthService.request_password_reset(db, reset_request.email, base_url)
        return {"message": "If the email exists, a password reset link has been sent"}
    except Exception as e:
        logger.error(f"Password reset request error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during password reset request"
        )

@router.post("/password-reset/confirm")
def confirm_password_reset(
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Password reset confirmation attempt with token: {reset_data.token[:8]}...")  # Log first 8 chars of token
        logger.debug(f"Full reset data: {reset_data.dict()}")  # Debug log of entire payload
        
        user = AuthService.reset_password(db, reset_data)
        
        logger.info(f"Password successfully reset for user: {user.email}")
        logger.debug(f"User details after reset: {user.email}, ID: {user.id}")
        
        return {"message": "Password has been reset successfully"}
    except HTTPException as he:
        logger.warning(f"Password reset failed: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during password reset: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during password reset"
        )


