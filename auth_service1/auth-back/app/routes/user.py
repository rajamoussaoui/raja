from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.user import UserOut
from app.crud.user import get_user_by_email, update_user_profile, update_user_password
from app.core.security import get_current_user, verify_password, get_password_hash
from app.database.models import User


router = APIRouter(prefix="/user", tags=["Users"])



@router.get("/by-email", response_model=UserOut)
def read_user_by_email(email: str = Query(...), db: Session = Depends(get_db)):
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/profile")
async def update_profile(
    email: str = Form(...),
    name: str = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # <- Add this line
):
    if current_user.email != email:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")

    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_data = {}
    if name:
        updated_data["name"] = name
    if image:
        # Optional: Save the image file or upload to cloud storage
        updated_data["image"] = image.filename  # Example only

    success = update_user_profile(db, user, updated_data)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to update profile")

    return {"success": True, "message": "Profile updated successfully"}

@router.post("/password")
async def change_password(
    email: str = Form(...),
    current_password: str = Form(...),
    new_password: str = Form(...),
    confirm_password: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # <- Add this line
):
    if current_user.email != email:
        raise HTTPException(status_code=403, detail="Not authorized to change this password")

    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if new_password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    hashed_new_password = get_password_hash(new_password)

    success = update_user_password(db, user, hashed_new_password)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to update password")

    return {"success": True, "message": "Password updated successfully"}