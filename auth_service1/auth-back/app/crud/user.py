# app/crud.py
from sqlalchemy.orm import Session
from app.database.models import User 
from app.schemas.user import UserUpdate

 # adjust if your User model is elsewhere

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def update_user_profile(db: Session, user: User, update_data: dict) -> bool:
    for key, value in update_data.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return True

def update_user_password(db: Session, user: User, hashed_password: str) -> bool:
    user.hashed_password = hashed_password
    db.commit()
    db.refresh(user)
    return True