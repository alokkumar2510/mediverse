"""Common shared schemas — pagination, error envelope."""
from pydantic import BaseModel
from typing import Any


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: str | None = None


class ErrorResponse(BaseModel):
    success: bool = False
    errors: list[ErrorDetail]


class MessageResponse(BaseModel):
    message: str


class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size
