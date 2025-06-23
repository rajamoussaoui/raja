import os
from uuid import uuid4
from fastapi import UploadFile

UPLOAD_DIR = "static/profile_images"  # Make sure this matches above
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_profile_image(file: UploadFile) -> str:
    # Get file extension
    ext = file.filename.split(".")[-1]

    # Generate unique filename to avoid conflicts
    filename = f"{uuid4()}.{ext}"

    # Full path to save
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Write file to disk
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    return filename