from pydantic import BaseModel
from datetime import datetime
from app.database.models import Role

class UserBase(BaseModel):
    email: str
    name: str | None = None

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