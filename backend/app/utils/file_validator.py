"""
File upload validation utilities.
Enforces MIME type whitelist and file size limit before processing.
"""
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

_IMAGE_MIMES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp",
}

_DOCUMENT_MIMES = _IMAGE_MIMES | {"application/pdf"}


def _check_size(file: UploadFile) -> None:
    content_length = file.headers.get("content-length")
    if content_length and int(content_length) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB} MB",
        )


async def validate_image_upload(file: UploadFile) -> None:
    """Validate image MIME type and size."""
    if file.content_type not in _IMAGE_MIMES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{file.content_type}'. Accepted: JPEG, PNG, WEBP, BMP",
        )
    _check_size(file)


async def validate_document_upload(file: UploadFile) -> None:
    """Validate image or PDF upload."""
    if file.content_type not in _DOCUMENT_MIMES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{file.content_type}'. Accepted: JPEG, PNG, WEBP, PDF",
        )
    _check_size(file)


async def validate_json_body_size(body_bytes: bytes) -> None:
    if len(body_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Request body too large",
        )
