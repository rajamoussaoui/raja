from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.database.models import User
from app.schemas.user import UserOut
from app.core.security import get_current_admin
from app.services.user import UserService

router = APIRouter()

@router.get("/users", response_model=List[UserOut])
def list_users(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return UserService.list_users(db)

@router.put("/users/{user_id}/activate")
def activate_user():
    pass

@router.put("/users/{user_id}/deactivate")
def deactivate_user():
    pass

@router.put("/users/{user_id}/promote")
def promote_to_admin():
    pass