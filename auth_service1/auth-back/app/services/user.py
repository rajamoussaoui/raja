from sqlalchemy.orm import Session
from typing import List
from app.database.models import User
from app.schemas.user import UserOut

class UserService:
    @staticmethod
    def list_users(db: Session) -> List[User]:
        return db.query(User).all()