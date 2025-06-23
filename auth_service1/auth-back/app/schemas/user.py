from pydantic import BaseModel
from datetime import datetime
from app.database.models import Role
from typing import Optional

class UserBase(BaseModel):
    id: int
    email: str
    name: str | None = None
    image: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    email: str
    name: str
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    image: Optional[str] = None
    
class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str