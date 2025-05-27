from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.database.session import get_db
from app.database.models import User
from app.schemas.user import UserOut
from app.core.security import get_current_user, verify_password, get_password_hash
from app.services.user import UserService

router = APIRouter()

@router.get("/me", response_model=UserOut)
def read_current_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return current_user

@router.put("/me")
async def update_current_user(
    name: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        update_data = {}
        
        if name is not None and name != current_user.name:
            update_data["name"] = name
            
        if image is not None:
            # Validate image size (2MB max)
            contents = await image.read()
            if len(contents) > 2 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="Image size must be less than 2MB")
            
            # Here you would typically upload the image to storage (S3, local storage, etc.)
            # and save the URL/path to the database
            # For now, we'll just pretend we stored it and got a URL
            image_url = f"path/to/storage/{image.filename}"
            update_data["image"] = image_url
            
        if not update_data:
            return {"success": False, "error": "No changes detected"}
            
        updated_user = UserService.update_user(db, current_user.id, update_data)
        return {"success": True, "user": updated_user}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/me/password")
def update_password(
    current_password: str = Form(...),
    new_password: str = Form(...),
    confirm_password: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Verify current password
        if not verify_password(current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
            
        # Check if new passwords match
        if new_password != confirm_password:
            raise HTTPException(status_code=400, detail="New passwords do not match")
            
        # Update password
        hashed_password = get_password_hash(new_password)
        UserService.update_user(db, current_user.id, {"hashed_password": hashed_password})
        
        return {"success": True}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))