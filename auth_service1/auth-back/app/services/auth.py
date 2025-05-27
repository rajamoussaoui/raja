from datetime import datetime, timedelta
import logging
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from jose import JWTError, jwt
import re
from sqlalchemy.exc import SQLAlchemyError

from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    generate_password_reset_token,
    verify_password_reset_token,
)
from app.core.config import settings
from app.database.models import User, PasswordResetToken
from app.schemas.auth import Token, UserSignUp, PasswordReset
from app.services.email import send_password_reset_email

logger = logging.getLogger(__name__)

class AuthService:
    @staticmethod
    def validate_email_format(email: str) -> bool:
        """Validate email format using regex"""
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        return re.match(pattern, email) is not None

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                logger.debug(f"Authentication failed - user not found: {email}")
                return None
                
            if not verify_password(password, user.hashed_password):
                logger.debug(f"Authentication failed - invalid password for: {email}")
                return None
                
            logger.debug(f"User authenticated successfully: {email}")
            return user
            
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def create_tokens(user: User) -> Token:
        """Create access and refresh tokens"""
        try:
            access_token = create_access_token(
                data={"sub": user.email, "role": user.role},
                expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            )
            
            refresh_token = create_access_token(
                data={"sub": user.email},
                expires_delta=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
            )
            
            logger.debug(f"Tokens created for user: {user.email}")
            return Token(
                access_token=access_token,
                token_type="bearer",
                refresh_token=refresh_token
            )
        except Exception as e:
            logger.error(f"Token creation error: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def register_user(db: Session, user_data: UserSignUp) -> User:
        """Register new user"""
        try:
            if db.query(User).filter(User.email == user_data.email).first():
                logger.warning(f"Registration attempt with existing email: {user_data.email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            user = User(
                email=user_data.email,
                hashed_password=get_password_hash(user_data.password),
                name=user_data.name,
                is_active=True,
                role="user"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            logger.info(f"New user registered: {user.email}")
            return user
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error during registration: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database operation failed"
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Registration error: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error during registration"
            )

    @staticmethod
    def verify_refresh_token(token: str) -> Optional[str]:
        """Verify refresh token validity"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload.get("sub")
        except JWTError as e:
            logger.warning(f"Invalid refresh token: {str(e)}")
            return None

    @staticmethod
    def request_password_reset(db: Session, email: str, base_url: str) -> None:
        """Handle password reset request"""
        try:
            if not AuthService.validate_email_format(email):
                logger.warning(f"Invalid email format: {email}")
                return

            user = db.query(User).filter(User.email == email).first()
            if not user:
                logger.debug(f"Password reset request for non-existent email: {email}")
                return

            # Invalidate any existing tokens
            db.query(PasswordResetToken).filter(
                PasswordResetToken.email == email,
                PasswordResetToken.used_at.is_(None)
            ).update({"used_at": datetime.utcnow()})
            
            # Create new token
            token = generate_password_reset_token(email)
            reset_token = PasswordResetToken(
                email=email,
                token=token,
                expires_at=datetime.utcnow() + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)
            )
            db.add(reset_token)
            db.commit()
            
            reset_url = f"{base_url.rstrip('/')}/reset-password?token={token}"
            logger.debug(f"Generated reset URL for {email}: {reset_url}")
            
            send_password_reset_email(email, reset_url)
            logger.info(f"Password reset email sent to: {email}")
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error during password reset: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database operation failed"
            )
        except Exception as e:
            logger.error(f"Password reset error: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process password reset request"
            )

    @staticmethod
    def reset_password(db: Session, reset_data: PasswordReset) -> User:
        """Reset user password using valid token"""
        try:
            logger.info(f"Starting password reset process for token: {reset_data.token[:8]}...")
            
            # Verify token structure
            email = verify_password_reset_token(reset_data.token)
            if not email:
                logger.warning("Invalid password reset token format")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid token format"
                )

            logger.debug(f"Token validated for email: {email}")

            # Check token validity with 5 minute grace period
            token_record = db.query(PasswordResetToken).filter(
                PasswordResetToken.token == reset_data.token,
                PasswordResetToken.email == email,
                PasswordResetToken.used_at.is_(None),
                PasswordResetToken.expires_at > datetime.utcnow() - timedelta(minutes=5)
            ).first()

            if not token_record:
                logger.warning("No valid token record found - checking why...")
                existing = db.query(PasswordResetToken).filter(
                    PasswordResetToken.token == reset_data.token
                ).first()
                
                if existing:
                    if existing.used_at:
                        logger.warning(f"Token already used at {existing.used_at}")
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Token already used"
                        )
                    elif existing.expires_at <= datetime.utcnow():
                        logger.warning(f"Token expired at {existing.expires_at}")
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Token expired"
                        )
                
                logger.warning("Token not found in database")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid token"
                )

            logger.debug(f"Valid token record found, expires at: {token_record.expires_at}")

            # Update password
            user = db.query(User).filter(User.email == email).first()
            if not user:
                logger.error(f"User not found for email: {email}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )

            logger.info(f"Resetting password for user: {user.email}")
            user.hashed_password = get_password_hash(reset_data.new_password)
            token_record.used_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"Password successfully reset for user: {user.email}")
            return user
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error during password reset: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database operation failed"
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Password reset error: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error during password reset"
            )